import prisma from '../config/db.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalInquiries,
      newInquiries,
      underReviewInquiries,
      totalProjects,
      publishedProjects,
      totalCustomers,
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

export const getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.adminSetting.findMany({
      orderBy: { key: 'asc' },
    });
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

export const updateSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const setting = await prisma.adminSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'SETTING_UPDATED',
        entityType: 'SETTING',
        entityId: setting.id,
        details: { key, value: key.includes('key') ? '***REDACTED***' : value },
      },
    });

    res.json({ success: true, message: `Setting ${key} updated successfully`, data: setting });
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
