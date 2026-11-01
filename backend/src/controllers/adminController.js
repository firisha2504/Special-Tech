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
  saveEmailSettings,
  retryNotificationEmail,
  maskEmail,
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
    const isPort465 = Number(config.port) === 465;

    // Stage 1: Credentials Configured
    const credentialsStatus = config.isConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED';

    // Stage 2: SMTP Authentication Verified (Socket & Handshake)
    let authStatus = config.lastAuthStatus || (config.lastConnectedAt ? 'VERIFIED' : 'UNTESTED');
    if (!config.isConfigured) authStatus = 'NOT_CONFIGURED';
    else if (config.lastStatus === 'auth_failed' || config.lastAuthStatus === 'AUTH_FAILED') authStatus = 'AUTH_FAILED';
    else if (config.lastStatus === 'unreachable' || config.lastAuthStatus === 'UNREACHABLE') authStatus = 'UNREACHABLE';
    else if (config.lastConnectedAt || config.lastStatus === 'connected' || config.lastAuthStatus === 'VERIFIED') authStatus = 'VERIFIED';

    // Stage 3: Test Email Accepted by Provider
    let testEmailStatus = config.testEmailStatus || (config.lastDeliveryStatus?.includes('Success') ? 'ACCEPTED' : 'NOT_SENT');
    if (config.lastErrorType === 'RESEND_TESTING_MODE' || config.testEmailStatus === 'REJECTED') {
      testEmailStatus = 'REJECTED';
    }

    // Stage 4: Test Email Delivered (Only confirmed by provider events)
    let deliveryStatus = config.testDeliveryStatus || (testEmailStatus === 'ACCEPTED' ? 'ACCEPTED_IN_TRANSIT' : 'NOT_SENT');
    if (testEmailStatus === 'REJECTED') deliveryStatus = 'FAILED';

    const isResend = Boolean(config.host?.includes('resend.com'));
    const isResendTestingMode = Boolean(
      isResend &&
      (config.from?.includes('onboarding@resend.dev') ||
       config.lastErrorType === 'RESEND_TESTING_MODE' ||
       config.lastError?.includes('550'))
    );

    res.json({
      success: true,
      data: {
        // Flat legacy fields for backward compatibility
        isConfigured: config.isConfigured,
        activeProvider: config.provider,
        provider: config.provider,
        providerName: config.providerName,
        host: config.host || '(Not configured)',
        port: config.port,
        secure: isPort465,
        user: config.user ? maskEmail(config.user) : '(Not configured)',
        from: config.from,
        fromName: config.fromName || 'Special Tech',
        fromEmail: config.fromEmail || config.user,
        adminEmail: config.adminEmail,
        hasPass: config.hasPass,
        lastStatus: config.lastStatus,
        lastConnectedAt: config.lastConnectedAt,
        lastError: config.lastError,
        lastDeliveryStatus: config.lastDeliveryStatus,

        // Stage 1: Credentials Configured
        credentialsConfigured: config.isConfigured,
        credentialsStatus,

        // Stage 2: SMTP Authentication Verified
        authStatus,
        authStatusLabel: authStatus === 'VERIFIED'
          ? 'SMTP Authentication Successful'
          : authStatus === 'AUTH_FAILED'
          ? 'Authentication Failed'
          : authStatus === 'UNREACHABLE'
          ? 'Connection Failed'
          : config.isConfigured
          ? 'Credentials Configured'
          : 'Not Configured',
        lastVerifiedAt: config.lastConnectedAt || config.lastAuthAt,
        latencyMs: config.lastAuthLatency || null,
        protocol: isPort465 ? 'SSL (Port 465, Direct Encryption)' : 'STARTTLS (Port 587, Opportunistic/Enforced TLS)',
        securityMode: isPort465 ? 'SSL/TLS (Port 465, Direct Encryption)' : 'STARTTLS (Port 587)',

        // Stage 3: Test Email Accepted
        testEmailStatus,
        testEmailAt: config.testEmailAt,
        testRecipient: config.testEmailRecipient,
        testMessageId: config.testEmailMessageId,

        // Stage 4: Test Email Delivered (Only confirmed by provider events)
        deliveryStatus,
        deliveryStatusLabel: deliveryStatus === 'CONFIRMED_DELIVERED'
          ? 'Email Delivery Confirmed'
          : deliveryStatus === 'ACCEPTED_IN_TRANSIT'
          ? 'Test Email Accepted'
          : deliveryStatus === 'FAILED'
          ? 'Delivery Failed'
          : 'Not Dispatched',
        deliveryConfirmedAt: config.testDeliveryAt,
        deliveryNote: deliveryStatus === 'CONFIRMED_DELIVERED'
          ? 'Provider confirmed delivery to recipient mailbox.'
          : deliveryStatus === 'ACCEPTED_IN_TRANSIT'
          ? 'Accepted by provider queue. In transit to destination mailbox.'
          : deliveryStatus === 'FAILED'
          ? 'Provider rejected delivery.'
          : 'No test email has been dispatched yet.',

        // Diagnostics, Errors & Domain Guidance
        lastErrorType: config.lastErrorType || null,
        isResendTestingMode,
        resendPermittedRecipient: config.resendTestRecipient || config.adminEmail,

        // Sub-configs for provider forms (passwords/secrets are NEVER returned)
        resendConfig: {
          host: config.resendConfig?.host || 'smtp.resend.com',
          port: config.resendConfig?.port || 465,
          secure: config.resendConfig?.secure ?? true,
          user: config.resendConfig?.user || 'resend',
          from: config.resendConfig?.from || 'Special Tech <onboarding@resend.dev>',
          hasPass: !!config.resendConfig?.hasPass,
          credentialsStatus: config.resendConfig?.hasPass ? 'CONFIGURED' : 'NOT_CONFIGURED',
        },
        gmailConfig: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          user: config.gmailConfig?.user || '',
          fromName: config.gmailConfig?.fromName || 'Special Tech',
          fromEmail: config.gmailConfig?.fromEmail || config.gmailConfig?.user || '',
          from: config.gmailConfig?.from || '',
          hasPass: !!config.gmailConfig?.hasPass,
          credentialsStatus: config.gmailConfig?.hasPass ? 'CONFIGURED' : 'NOT_CONFIGURED',
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const saveEmailSettingsEndpoint = async (req, res, next) => {
  try {
    const updated = await saveEmailSettings(req.body);
    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'EMAIL_SETTINGS_UPDATED',
        entityType: 'EMAIL_SERVICE',
        entityId: updated.provider,
        details: {
          provider: updated.providerName,
          host: updated.host,
          port: updated.port,
          user: updated.user ? maskEmail(updated.user) : null,
          from: updated.from,
        },
      },
    });

    res.json({
      success: true,
      message: `${updated.providerName} configuration saved successfully.`,
      data: {
        provider: updated.provider,
        providerName: updated.providerName,
        host: updated.host,
        port: updated.port,
        secure: updated.secure,
        from: updated.from,
        isConfigured: updated.isConfigured,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const categorizeNotification = (log, details, meta) => {
  const notifType = (log.type || details.notificationType || meta.notificationType || '').toLowerCase();
  const title = (log.title || '').toLowerCase();
  const sub = (details.subject || '').toLowerCase();
  const msg = (log.message || '').toLowerCase();

  // 1. Test Email
  if (
    notifType === 'test_email' ||
    title.includes('smtp configuration test') ||
    title.includes('smtp test email') ||
    sub.includes('smtp configuration test') ||
    title.includes('test email')
  ) {
    return {
      category: 'Test Email',
      isTest: true,
    };
  }

  // 2. Project Proposal
  if (
    notifType.includes('proposal') ||
    title.includes('proposal') ||
    sub.includes('proposal') ||
    msg.includes('proposal')
  ) {
    return {
      category: 'Project Proposal',
      isTest: false,
    };
  }

  // 3. Project Completion
  if (
    notifType.includes('completion') ||
    notifType.includes('completed') ||
    title.includes('completed') ||
    details.newStatus === 'Completed' ||
    meta.newStatus === 'Completed'
  ) {
    return {
      category: 'Project Completion',
      isTest: false,
    };
  }

  // 4. Project Status Update
  if (
    notifType === 'project_status_change' ||
    log.projectId ||
    details.projectId ||
    title.includes('project update') ||
    title.includes('project status') ||
    title.includes('milestone')
  ) {
    return {
      category: 'Project Status Update',
      isTest: false,
    };
  }

  // 5. Inquiry Status Update
  if (
    notifType === 'inquiry_status_change' ||
    title.includes('inquiry status') ||
    title.startsWith('email: inquiry') ||
    details.newStatus ||
    meta.newStatus
  ) {
    return {
      category: 'Inquiry Status Update',
      isTest: false,
    };
  }

  // 6. Inquiry Confirmation
  if (
    notifType === 'inquiry_confirmation' ||
    title.includes('inquiry confirmation') ||
    details.inquiryNumber ||
    meta.inquiryNumber ||
    title.includes('inquiry')
  ) {
    return {
      category: 'Inquiry Confirmation',
      isTest: false,
    };
  }

  // 7. Admin Notification
  if (
    notifType.includes('admin') ||
    title.includes('admin') ||
    details.recipientEmail?.includes('admin@') ||
    details.recipientEmail?.includes('specialtech.com')
  ) {
    return {
      category: 'Admin Notification',
      isTest: false,
    };
  }

  return {
    category: 'Customer Communication',
    isTest: false,
  };
};

const extractSmtpCode = (errorStr) => {
  if (!errorStr) return null;
  const match = errorStr.match(/\b(535|550|553|554|421|450|451|452|250)\b/);
  return match ? match[1] : null;
};

const getHumanExplanation = (errorStr, code, provider) => {
  if (!errorStr) return null;
  const err = errorStr.toLowerCase();
  if (code === '535' || err.includes('badcredentials') || err.includes('password not accepted') || err.includes('authentication failed')) {
    return 'Authentication failure (535): Google or the SMTP server rejected the username or application password. Check that the Gmail address is valid and generate a new 16-character Google App Password at myaccount.google.com/apppasswords.';
  }
  if (code === '550' || err.includes('testing mode') || err.includes('only send testing emails')) {
    return 'Testing Mode Restriction (550): The Resend account is currently in test mode and cannot deliver to unverified external customer domains. To send to customers, verify a custom domain at resend.com/domains or switch to Gmail SMTP (Recommended).';
  }
  if (err.includes('example.com') || err.includes('invalid `to` field')) {
    return 'Placeholder Recipient (example.com): The recipient address uses a documentation reserved domain (example.com) that cannot receive real emails. Please enter an active inbox.';
  }
  if (code === '553' || err.includes('invalid recipient') || err.includes('recipient address rejected')) {
    return 'Invalid Recipient (553): The recipient email address format was rejected by the receiving mail transfer agent.';
  }
  if (err.includes('timeout') || err.includes('etimedout') || err.includes('unreachable') || err.includes('econnrefused')) {
    return 'Server Unreachable / Timeout: The application could not establish an encrypted socket connection to the mail server on port 465. Verify internet connectivity and firewall ports.';
  }
  if (err.includes('rate limit') || code === '421' || err.includes('too many messages')) {
    return 'Rate Limit Exceeded (421): The mail server has temporarily restricted sending frequency. Please wait a few moments before retrying.';
  }
  return errorStr;
};

export const getEmailLogs = async (req, res, next) => {
  try {
    const { page, limit, search, category, status } = req.query || {};

    // 1. Fetch active SMTP config for Next Retry Provider
    const activeConfig = await getSMTPConfig().catch(() => ({ providerName: 'Gmail SMTP' }));
    const activeProviderName = activeConfig?.providerName || 'Gmail SMTP';

    // 2. Fetch raw email notifications with relations
    const logs = await prisma.notification.findMany({
      where: { channel: 'EMAIL' },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true, company: true } },
        project: {
          select: {
            id: true,
            title: true,
            customer: { select: { id: true, name: true, email: true, company: true } },
          },
        },
      },
    });

    // 3. Batch resolve related Inquiries for customer names and inquiry numbers
    const inquiryIds = logs
      .map((l) => l.deliveryDetails?.inquiryId || l.metadata?.inquiryId)
      .filter(Boolean);
    const inquiries = inquiryIds.length > 0
      ? await prisma.inquiry.findMany({
          where: { id: { in: inquiryIds } },
          include: { customer: { select: { id: true, name: true, email: true, company: true } } },
        })
      : [];
    const inquiryMap = new Map(inquiries.map((i) => [i.id, i]));

    // 4. Batch resolve customer by recipient email
    const recipientEmails = logs
      .map((l) => (l.deliveryDetails?.recipientEmail || '').toLowerCase())
      .filter((e) => e && e.includes('@'));
    const customersByEmail = recipientEmails.length > 0
      ? await prisma.customer.findMany({
          where: { email: { in: recipientEmails } },
          select: { id: true, name: true, email: true, company: true },
        })
      : [];
    const customerEmailMap = new Map(customersByEmail.map((c) => [c.email.toLowerCase(), c]));

    // 5. Enrich each log with customer name, category, human error, etc.
    const enrichedLogs = logs.map((log) => {
      const details = log.deliveryDetails || {};
      const meta = log.metadata || {};
      const inqId = details.inquiryId || meta.inquiryId;
      const inq = inqId ? inquiryMap.get(inqId) : null;
      const recipientEmail = (details.recipientEmail || log.customer?.email || '').trim();
      const custByEmail = recipientEmail ? customerEmailMap.get(recipientEmail.toLowerCase()) : null;
      const resolvedCustomer = log.customer || inq?.customer || log.project?.customer || custByEmail || null;

      const categoryObj = categorizeNotification(log, details, meta);
      const isTest = categoryObj.isTest;
      const customerName = isTest
        ? 'Test Recipient'
        : (resolvedCustomer?.name || (details.inquiryNumber ? `Client (#${details.inquiryNumber})` : (log.customer?.email ? log.customer.email.split('@')[0] : 'Customer Recipient')));

      const errorText = details.errorMessage || details.rawError || (log.deliveryStatus === 'FAILED' ? log.message : '');
      const smtpCode = extractSmtpCode(errorText);
      const humanExplanation = getHumanExplanation(errorText, smtpCode, details.provider);

      const isDeliveredOrSent = log.deliveryStatus === 'SENT' || log.deliveryStatus === 'DELIVERED';
      const isExampleDomain = recipientEmail.toLowerCase().endsWith('@example.com');
      const attempts = Array.isArray(details.attempts) ? details.attempts : [];
      const maxAttemptsReached = attempts.length >= 5;
      const canRetry = !isDeliveredOrSent && !isTest && !isExampleDomain && !maxAttemptsReached;

      return {
        ...log,
        customerName,
        resolvedCustomer,
        inquiry: inq ? { id: inq.id, inquiryNumber: inq.inquiryNumber } : null,
        projectName: log.project?.title || null,
        category: categoryObj.category,
        isTest,
        smtpCode,
        humanExplanation,
        canRetry,
        nextRetryProvider: `${activeProviderName} (Active)`,
      };
    });

    // 6. Compute Dashboard Summary KPI counts (Total, Sent, Delivered, Failed, Pending)
    // Note: Sent = accepted by SMTP provider; Delivered = confirmed by explicit delivery evidence; Pending = in queue
    const total = enrichedLogs.length;
    let sent = 0;
    let delivered = 0;
    let failed = 0;
    let pending = 0;
    let bounced = 0;

    for (const item of enrichedLogs) {
      if (item.deliveryStatus === 'DELIVERED') {
        delivered++;
      } else if (item.deliveryStatus === 'SENT' || item.deliveryDetails?.deliveryStatus === 'ACCEPTED_IN_TRANSIT') {
        sent++;
      } else if (item.deliveryStatus === 'FAILED') {
        failed++;
        if (item.smtpCode === '550' || item.smtpCode === '553' || (item.deliveryDetails?.errorMessage && /bounce|reject/i.test(item.deliveryDetails.errorMessage))) {
          bounced++;
        }
      } else {
        pending++;
      }
    }

    const summary = { total, sent, delivered, failed, pending, bounced };

    // 7. Filtering
    let filtered = enrichedLogs;

    // Filter by category
    if (category && category !== 'all') {
      if (category === 'test') {
        filtered = filtered.filter((l) => l.isTest);
      } else if (category === 'customer') {
        filtered = filtered.filter((l) => !l.isTest);
      } else {
        filtered = filtered.filter((l) => l.category.toLowerCase() === category.toLowerCase());
      }
    }

    // Filter by status
    if (status && status !== 'all') {
      const targetStatus = status.toLowerCase();
      if (targetStatus === 'sent') {
        filtered = filtered.filter((l) => l.deliveryStatus === 'SENT' || l.deliveryDetails?.deliveryStatus === 'ACCEPTED_IN_TRANSIT');
      } else if (targetStatus === 'delivered') {
        filtered = filtered.filter((l) => l.deliveryStatus === 'DELIVERED');
      } else if (targetStatus === 'failed') {
        filtered = filtered.filter((l) => l.deliveryStatus === 'FAILED');
      } else if (targetStatus === 'bounced') {
        filtered = filtered.filter((l) => l.deliveryStatus === 'FAILED' && (l.smtpCode === '550' || l.smtpCode === '553' || /bounce|reject/i.test(l.deliveryDetails?.errorMessage || '')));
      } else if (targetStatus === 'pending') {
        filtered = filtered.filter((l) => l.deliveryStatus === 'PENDING');
      }
    }

    // Search by customer name, recipient email, inquiry number, project name
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((l) => {
        const cName = (l.customerName || '').toLowerCase();
        const rEmail = (l.deliveryDetails?.recipientEmail || l.customer?.email || '').toLowerCase();
        const inqNum = (l.inquiry?.inquiryNumber || l.deliveryDetails?.inquiryNumber || l.metadata?.inquiryNumber || '').toLowerCase();
        const pName = (l.projectName || '').toLowerCase();
        const sub = (l.deliveryDetails?.subject || l.title || '').toLowerCase();
        return (
          cName.includes(q) ||
          rEmail.includes(q) ||
          inqNum.includes(q) ||
          pName.includes(q) ||
          sub.includes(q)
        );
      });
    }

    // 8. Pagination
    const totalFiltered = filtered.length;
    const requestedPage = Math.max(1, parseInt(page, 10) || 1);
    const requestedLimit = Math.max(1, parseInt(limit, 10) || 50);
    const totalPages = Math.ceil(totalFiltered / requestedLimit) || 1;

    let pagedData = filtered;
    if (page || limit) {
      const startIndex = (requestedPage - 1) * requestedLimit;
      pagedData = filtered.slice(startIndex, startIndex + requestedLimit);
    }

    res.json({
      success: true,
      count: totalFiltered,
      total: totalFiltered,
      page: requestedPage,
      limit: requestedLimit,
      totalPages,
      summary,
      data: pagedData,
    });
  } catch (err) {
    next(err);
  }
};

export const retryEmailNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await retryNotificationEmail(id);
    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const testSMTPConnectionEndpoint = async (req, res, next) => {
  try {
    const { provider, host, port, secure, user, pass, from } = req.body || {};
    let overrideConfig = null;

    if (provider || host || user || pass) {
      overrideConfig = {
        provider: provider || (host?.includes('gmail.com') ? 'gmail' : 'resend'),
        host,
        port: Number(port) || 465,
        secure: secure !== undefined ? Boolean(secure) : Number(port) === 465,
        user,
        pass,
        from,
      };
    }

    const result = await verifySMTPConnection(overrideConfig);
    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'SMTP_CONNECTION_TESTED',
        entityType: 'EMAIL_SERVICE',
        entityId: result.host || 'smtp',
        details: {
          provider: result.providerName || result.provider,
          host: result.host,
          port: result.port,
          status: result.status,
          latencyMs: result.latencyMs,
        },
      },
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const sendTestEmailEndpoint = async (req, res, next) => {
  try {
    const { toEmail } = req.body;
    const recipient = (toEmail || req.user?.email || '').trim();
    if (!recipient || !recipient.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'A valid recipient email address is required.',
      });
    }

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
    const userId = req.user?.id;
    const { filter = 'all', limit = 50, page = 1 } = req.query;

    const where = {
      OR: [{ userId }, { userId: null, customerId: null }],
    };

    if (filter === 'unread') {
      where.isRead = false;
    } else if (filter === 'read') {
      where.isRead = true;
    }

    const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const [notifications, unreadCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.notification.count({
        where: {
          OR: [{ userId }, { userId: null, customerId: null }],
          isRead: false,
        },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      success: true,
      unreadCount,
      totalCount,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Authorization: User can only modify their own notification (unless Super Admin)
    if (notification.userId && notification.userId !== userId && !req.user?.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to modify another user's notification",
      });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      unreadCount,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    await prisma.notification.updateMany({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Authorization: User can only delete their own notification (unless Super Admin)
    if (notification.userId && notification.userId !== userId && !req.user?.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to delete another user's notification",
      });
    }

    await prisma.notification.delete({
      where: { id },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully',
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

export const clearReadNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    const result = await prisma.notification.deleteMany({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: true,
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
    });

    res.json({
      success: true,
      message: 'Read notifications cleared successfully',
      deletedCount: result.count,
      unreadCount,
    });
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
