import prisma from '../config/db.js';
import { testAIConnection, getAIConfig } from '../services/ai/aiService.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalInquiries,
      newInquiries,
      underReviewInquiries,
      totalProjects,
      publishedProjects,
      totalCustomers,
      totalProducts,
      activeProducts,
      draftProducts,
      totalDemoRequests,
      newDemoRequests,
      recentInquiries,
      recentActivities,
      allInquiries,
    ] = await Promise.all([
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { status: 'NEW' } }),
      prisma.inquiry.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.project.count(),
      prisma.project.count({ where: { isPublished: true } }),
      prisma.customer.count(),
      prisma.product.count(),
      prisma.product.count({ where: { isPublished: true } }),
      prisma.product.count({ where: { status: 'Draft' } }),
      prisma.productDemoRequest.count(),
      prisma.productDemoRequest.count({ where: { status: 'NEW' } }),
      prisma.inquiry.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, assignedTo: true },
      }),
      prisma.activityLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      }),
      prisma.inquiry.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          totalInquiries,
          newInquiries,
          pendingInquiries: underReviewInquiries,
          totalProjects,
          activeProjects: publishedProjects,
          totalCustomers,
          totalProducts,
          activeProducts,
          draftProducts,
          totalDemoRequests,
          newDemoRequests,
        },
        statusDistribution: allInquiries.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
        recentInquiries,
        recentActivities,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        inquiries: {
          select: { id: true, inquiryNumber: true, title: true, status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    next(err);
  }
};

export const getTeamMembers = async (req, res, next) => {
  try {
    const team = await prisma.teamMember.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, count: team.length, data: team });
  } catch (err) {
    next(err);
  }
};

import {
  getSMTPConfig,
  verifySMTPConnection,
  sendTestEmail,
} from '../services/email/emailService.js';

export const getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.adminSetting.findMany({
      orderBy: { key: 'asc' },
    });
    // Never expose raw secrets/passwords/API keys to frontend
    const sanitized = settings.map((s) => {
      const isSecret = /key|pass|secret|token/i.test(s.key);
      return {
        ...s,
        value: isSecret ? (s.value && s.value.trim() ? '••••••••••••••••' : '') : s.value,
        isConfigured: isSecret ? !!(s.value && s.value.trim()) : undefined,
      };
    });
    res.json({ success: true, data: sanitized });
  } catch (err) {
    next(err);
  }
};

export const updateSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const isSecret = /key|pass|secret|token/i.test(key);

    // If it's a secret and incoming value is mask bullets or empty, do not overwrite existing
    if (isSecret && (value === '••••••••••••••••' || !value)) {
      const existing = await prisma.adminSetting.findUnique({ where: { key } });
      if (existing) {
        return res.json({
          success: true,
          message: `Setting ${key} preserved`,
          data: { ...existing, value: '••••••••••••••••' },
        });
      }
    }

    const setting = await prisma.adminSetting.upsert({
      where: { key },
      update: { value: value || '' },
      create: { key, value: value || '' },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'SETTING_UPDATED',
        entityType: 'SETTING',
        entityId: setting.id,
        details: { key, value: isSecret ? '***REDACTED***' : value },
      },
    });

    res.json({
      success: true,
      message: `Setting ${key} updated successfully`,
      data: {
        ...setting,
        value: isSecret ? '••••••••••••••••' : setting.value,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getEmailStatus = async (req, res, next) => {
  try {
    const config = await getSMTPConfig();
    res.json({
      success: true,
      data: {
        isConfigured: config.isConfigured,
        host: config.host || '(Not configured)',
        port: config.port,
        secure: config.secure,
        user: config.user ? (config.user.length > 4 ? config.user.slice(0, 3) + '***' : '***') : '(Not configured)',
        from: config.from,
        adminEmail: config.adminEmail,
        hasPass: config.hasPass,
        lastStatus: config.lastStatus,
        lastConnectedAt: config.lastConnectedAt,
        lastError: config.lastError,
        lastDeliveryStatus: config.lastDeliveryStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const testSMTPConnectionEndpoint = async (req, res, next) => {
  try {
    const result = await verifySMTPConnection();
    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'SMTP_CONNECTION_TESTED',
        entityType: 'EMAIL_SERVICE',
        entityId: result.host || 'smtp',
        details: {
          host: result.host,
          port: result.port,
          status: result.status,
          latencyMs: result.latencyMs,
        },
      },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const sendTestEmailEndpoint = async (req, res, next) => {
  try {
    const { toEmail } = req.body;
    const recipient = toEmail || req.user?.email;
    const result = await sendTestEmail({ toEmail: recipient });
    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'TEST_EMAIL_SENT',
        entityType: 'EMAIL_SERVICE',
        entityId: recipient,
        details: {
          recipient,
          success: result.success,
          messageId: result.messageId || null,
          error: result.error || null,
        },
      },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const unreadCount = await prisma.notification.count({ where: { isRead: false } });
    res.json({ success: true, unreadCount, data: notifications });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

export const testAIProviderConnection = async (req, res, next) => {
  try {
    const result = await testAIConnection();
    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'AI_CONNECTION_TESTED',
        entityType: 'AI_SERVICE',
        entityId: result.provider,
        details: {
          provider: result.provider,
          status: result.status,
          latencyMs: result.latencyMs,
        },
      },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAdminConversations = async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        customer: { select: { id: true, name: true, email: true, company: true } },
        _count: { select: { messages: true, requirements: true, prototypes: true } },
        requirements: { select: { id: true, projectName: true, version: true, status: true }, take: 1, orderBy: { version: 'desc' } },
        prototypes: { select: { id: true, title: true, systemType: true }, take: 1 },
      },
    });
    res.json({ success: true, count: conversations.length, data: conversations });
  } catch (err) {
    next(err);
  }
};

export const getAdminConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: 'asc' } },
        requirements: { orderBy: { version: 'desc' } },
        prototypes: {
          include: {
            versions: { orderBy: { versionNumber: 'desc' } },
          },
        },
      },
    });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation session not found' });
    }
    res.json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
};

export const exportDatabaseSnapshot = async (req, res, next) => {
  try {
    const [users, customers, inquiries, projects, products, settings, teamMembers] = await Promise.all([
      prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, isSuperAdmin: true, isActive: true, createdAt: true } }),
      prisma.customer.findMany(),
      prisma.inquiry.findMany(),
      prisma.project.findMany(),
      prisma.product.findMany(),
      prisma.adminSetting.findMany(),
      prisma.teamMember.findMany(),
    ]);

    const backupSnapshot = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      initiatedBy: req.user?.email,
      summary: {
        users: users.length,
        customers: customers.length,
        inquiries: inquiries.length,
        projects: projects.length,
        products: products.length,
        settings: settings.length,
        teamMembers: teamMembers.length,
      },
      data: {
        users,
        customers,
        inquiries,
        projects,
        products,
        settings,
        teamMembers,
      },
    };

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'DATABASE_BACKUP_EXPORTED',
        entityType: 'DATABASE',
        entityId: `backup-${Date.now()}`,
        details: backupSnapshot.summary,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
      },
    });

    res.json({ success: true, backup: backupSnapshot });
  } catch (err) {
    next(err);
  }
};
