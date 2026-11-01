import nodemailer from 'nodemailer';
import prisma from '../../config/db.js';

/**
 * Retrieve current SMTP configuration safely
 * Checks PostgreSQL admin_settings first, then falls back to process.env
 */
export const getSMTPConfig = async () => {
  try {
    const [
      hostSetting,
      portSetting,
      userSetting,
      passSetting,
      fromSetting,
      secureSetting,
      adminEmailSetting,
      lastStatusSetting,
      lastConnectedSetting,
      lastErrorSetting,
      lastDeliverySetting,
      companyContactSetting,
      resendTestRecipientSetting,
    ] = await Promise.all([
      prisma.adminSetting.findUnique({ where: { key: 'smtp_host' } }),
      prisma.adminSetting.findUnique({ where: { key: 'smtp_port' } }),
      prisma.adminSetting.findUnique({ where: { key: 'smtp_user' } }),
      prisma.adminSetting.findUnique({ where: { key: 'smtp_pass' } }),
      prisma.adminSetting.findUnique({ where: { key: 'smtp_from' } }),
      prisma.adminSetting.findUnique({ where: { key: 'smtp_secure' } }),
      prisma.adminSetting.findUnique({ where: { key: 'admin_email' } }),
      prisma.adminSetting.findUnique({ where: { key: 'smtp_last_status' } }),
      prisma.adminSetting.findUnique({ where: { key: 'smtp_last_connected_at' } }),
      prisma.adminSetting.findUnique({ where: { key: 'smtp_last_error' } }),
      prisma.adminSetting.findUnique({ where: { key: 'smtp_last_delivery_status' } }),
      prisma.adminSetting.findUnique({ where: { key: 'contact_email' } }),
      prisma.adminSetting.findUnique({ where: { key: 'resend_test_recipient' } }),
    ]);

    const host = hostSetting !== null ? hostSetting.value : (process.env.SMTP_HOST || '');
    const rawPort = portSetting !== null ? portSetting.value : process.env.SMTP_PORT;
    const user = userSetting !== null ? userSetting.value : (process.env.SMTP_USER || '');
    const pass = passSetting !== null ? passSetting.value : (process.env.SMTP_PASS || process.env.RESEND_API_KEY || '');
    let from = fromSetting !== null ? fromSetting.value : (process.env.SMTP_FROM || 'Special Tech <onboarding@resend.dev>');
    const adminEmail = adminEmailSetting?.value || companyContactSetting?.value || process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@specialtech.com';
    const resendTestRecipient = resendTestRecipientSetting?.value || process.env.RESEND_TEST_RECIPIENT || 'naniabdi2504@gmail.com';

    // If using Resend and the sender is set to unverified specialtech.com, fallback to verified onboarding@resend.dev
    if (host && host.includes('resend.com') && from.includes('@specialtech.com')) {
      from = process.env.SMTP_FROM || 'Special Tech <onboarding@resend.dev>';
    }

    let port = Number(rawPort);
    if (!port || isNaN(port)) {
      port = 587;
    }

    let secure;
    if (secureSetting?.value !== undefined) {
      secure = secureSetting.value === 'true';
    } else if (process.env.SMTP_SECURE !== undefined) {
      secure = process.env.SMTP_SECURE === 'true';
    } else {
      secure = port === 465;
    }

    const hasPass = !!(pass && pass.trim());
    const isConfigured = !!(host && host.trim() && user && user.trim() && hasPass);

    return {
      host: host.trim(),
      port,
      secure,
      user: user.trim(),
      from: from.trim(),
      adminEmail: adminEmail.trim(),
      resendTestRecipient: resendTestRecipient.trim(),
      hasPass,
      isConfigured,
      rawPass: pass.trim(),
      lastStatus: lastStatusSetting?.value || (isConfigured ? 'untested' : 'not_configured'),
      lastConnectedAt: lastConnectedSetting?.value || null,
      lastError: lastErrorSetting?.value || null,
      lastDeliveryStatus: lastDeliverySetting?.value || null,
    };
  } catch (err) {
    console.error('[Email Config Error]:', err.message);
    const host = process.env.SMTP_HOST || '';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || process.env.RESEND_API_KEY || '';
    const hasPass = !!(pass && pass.trim());
    return {
      host,
      port,
      secure: port === 465,
      user,
      from: process.env.SMTP_FROM || 'Special Tech <contact@specialtech.com>',
      adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@specialtech.com',
      resendTestRecipient: process.env.RESEND_TEST_RECIPIENT || 'naniabdi2504@gmail.com',
      hasPass,
      isConfigured: !!(host && user && hasPass),
      rawPass: pass.trim(),
      lastStatus: 'not_configured',
      lastConnectedAt: null,
      lastError: null,
      lastDeliveryStatus: null,
    };
  }
};

/**
 * Privacy-conscious email masking helper (e.g. n***4@gmail.com)
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return 'N/A';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  const maskedLocal =
    local.length <= 2 ? local[0] + '***' : local[0] + '***' + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
};

/**
 * Persist email operational diagnostic in database
 */
const recordSMTPDiagnostic = async (status, errorMessage = null) => {
  try {
    const updates = [
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_status' },
        update: { value: status },
        create: { key: 'smtp_last_status', value: status },
      }),
    ];
    if (status === 'connected') {
      updates.push(
        prisma.adminSetting.upsert({
          where: { key: 'smtp_last_connected_at' },
          update: { value: new Date().toISOString() },
          create: { key: 'smtp_last_connected_at', value: new Date().toISOString() },
        }),
        prisma.adminSetting.upsert({
          where: { key: 'smtp_last_error' },
          update: { value: '' },
          create: { key: 'smtp_last_error', value: '' },
        })
      );
    } else if (errorMessage) {
      updates.push(
        prisma.adminSetting.upsert({
          where: { key: 'smtp_last_error' },
          update: { value: errorMessage },
          create: { key: 'smtp_last_error', value: errorMessage },
        })
      );
    }
    await Promise.all(updates);
  } catch (err) {
    console.error('Failed to record SMTP diagnostic:', err.message);
  }
};

/**
 * Create a Nodemailer transporter instance safely
 * Uses STARTTLS on port 587 (secure: false, requireTLS: true)
 */
export const createSMTPTransporter = async () => {
  const config = await getSMTPConfig();
  if (!config.isConfigured) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: config.port === 587,
    auth: {
      user: config.user,
      pass: config.rawPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
  });
};

/**
 * Verify live SMTP server connection
 */
export const verifySMTPConnection = async () => {
  const config = await getSMTPConfig();
  const startTime = Date.now();

  if (!config.isConfigured) {
    await recordSMTPDiagnostic('not_configured', 'SMTP host, user, or password is not configured.');
    return {
      success: false,
      status: 'not_configured',
      host: config.host || '(None)',
      port: config.port,
      from: config.from,
      message: 'SMTP is not configured. Configure SMTP_HOST, SMTP_USER, and SMTP_PASS in .env or Admin Settings.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: config.port === 587,
      auth: {
        user: config.user,
        pass: config.rawPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
    });

    await transporter.verify();
    const latencyMs = Date.now() - startTime;
    await recordSMTPDiagnostic('connected', null);

    return {
      success: true,
      status: 'connected',
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      from: config.from,
      latencyMs,
      message: `SMTP connection to ${config.host}:${config.port} (${config.secure ? 'SSL' : 'STARTTLS'}) verified successfully.`,
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const rawMsg = err.message || 'SMTP handshake failed';

    let status = 'error';
    let cleanMessage = rawMsg;

    // Distinguish 535 authentication failures
    if (err.responseCode === 535 || /535|invalid login|authentication credentials invalid/i.test(rawMsg)) {
      status = 'auth_failed';
      cleanMessage = 'SMTP Authentication Failure (535): Invalid credentials. Please verify that SMTP_USER is "resend" (for Resend) and SMTP_PASS is an active Resend API key (re_...).';
    } else if (err.responseCode === 550 || /550.*only send testing emails/i.test(rawMsg)) {
      status = 'resend_testing_restriction';
      cleanMessage = 'Resend Testing Restriction (550): Resend account is in testing mode. Emails can only be delivered to your verified account address.';
    } else if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(rawMsg)) {
      status = 'unreachable';
      cleanMessage = `SMTP Server Unreachable: Connection timed out attempting to reach ${config.host}:${config.port}.`;
    }

    await recordSMTPDiagnostic(status, cleanMessage);

    return {
      success: false,
      status,
      host: config.host,
      port: config.port,
      from: config.from,
      latencyMs,
      error: cleanMessage,
      message: cleanMessage,
    };
  }
};

/**
 * Send an administrator test verification email
 */
export const sendTestEmail = async ({ toEmail }) => {
  const config = await getSMTPConfig();
  // In testing mode or default, use provided email or the configured permitted test recipient
  const targetRecipient = toEmail || config.resendTestRecipient || config.adminEmail;

  if (!targetRecipient || !targetRecipient.includes('@')) {
    return {
      success: false,
      error: 'Please provide a valid recipient email address for the test.',
    };
  }

  const transporter = await createSMTPTransporter();
  if (!transporter) {
    return {
      success: false,
      error: 'SMTP credentials are not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS.',
    };
  }

  try {
    const timestamp = new Date().toLocaleString();
    const info = await transporter.sendMail({
      from: config.from,
      to: targetRecipient,
      subject: `Special Tech SMTP Verification Test — ${timestamp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="border-bottom: 2px solid #087BFF; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #087BFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">SPECIAL TECH</h1>
            <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">AI-Powered Software Architecture & Engineering</p>
          </div>
          <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">SMTP Integration Test Successful</h2>
          <p>This automated verification confirms that your <strong>Special Tech</strong> mail dispatch system is connected and operational.</p>
          <div style="background: #f8fafc; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; font-size: 13px;">
            <p style="margin: 0 0 8px 0;"><strong>SMTP Server:</strong> ${config.host}:${config.port} (${config.secure ? 'SSL' : 'STARTTLS'})</p>
            <p style="margin: 0 0 8px 0;"><strong>Sender:</strong> ${config.from}</p>
            <p style="margin: 0 0 8px 0;"><strong>Recipient:</strong> ${targetRecipient}</p>
            <p style="margin: 0;"><strong>Timestamp:</strong> ${timestamp}</p>
          </div>
          <p style="font-size: 13px; color: #475569;">Inquiry proposals submitted through the Special Tech website will now trigger automated customer confirmations and administrator notifications.</p>
          <br/>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; color: #94a3b8; font-size: 11px;">
            Special Tech Admin Service • Sent automatically from production test suite
          </div>
        </div>
      `,
    });

    const statusMsg = `Success: Test email sent to ${targetRecipient} (Message ID: ${info.messageId || 'OK'}) at ${new Date().toISOString()}`;
    await prisma.adminSetting.upsert({
      where: { key: 'smtp_last_delivery_status' },
      update: { value: statusMsg },
      create: { key: 'smtp_last_delivery_status', value: statusMsg },
    });

    return {
      success: true,
      messageId: info.messageId,
      recipient: targetRecipient,
      message: `Test email successfully dispatched to ${targetRecipient}.`,
    };
  } catch (err) {
    const rawMsg = err.message || '';
    let status = 'error';
    let cleanError = rawMsg;

    if (err.responseCode === 550 || /550.*only send testing emails/i.test(rawMsg)) {
      status = 'resend_testing_restriction';
      const match = rawMsg.match(/own email address \(([^)]+)\)/i);
      const permitted = match ? match[1] : (config.resendTestRecipient || 'your registered Resend address');
      cleanError = `Resend Testing Mode (550): You can only send testing emails to your own email address (${permitted}). Verify your domain in Resend to send to arbitrary recipients.`;
    } else if (err.responseCode === 535 || /535|invalid login|authentication credentials invalid/i.test(rawMsg)) {
      status = 'auth_failed';
      cleanError = 'SMTP Authentication Failure (535): Invalid credentials. Check SMTP_USER and SMTP_PASS.';
    }

    await prisma.adminSetting.upsert({
      where: { key: 'smtp_last_error' },
      update: { value: cleanError },
      create: { key: 'smtp_last_error', value: cleanError },
    });

    return {
      success: false,
      status,
      error: cleanError,
      message: cleanError,
    };
  }
};

/**
 * Send customer confirmation and administrator notification for an inquiry
 * Handles duplicate prevention, template styling, and fail-safe logging
 */
export const sendInquiryNotifications = async (payload = {}) => {
  const config = await getSMTPConfig();

  // Normalize parameters to support both { customer, inquiry, requirement } and flat payload
  const targetNumber = payload.inquiryReference || payload.inquiryNumber || payload.inquiry?.inquiryNumber || 'ST-INQ-GENERAL';

  const inquiry = payload.inquiry || {
    id: payload.inquiryId || null,
    inquiryNumber: targetNumber,
    title: payload.title || payload.projectName || 'Custom Software Project',
    budget: payload.budget,
    preferredContact: payload.preferredContact,
    message: payload.message || payload.description || '',
    requirementId: payload.requirementId,
    prototypeVersionId: payload.prototypeVersionId,
  };

  const customer = payload.customer || {
    name: payload.customerName || payload.name || 'Valued Client',
    email: payload.customerEmail || payload.email || '',
    company: payload.customerCompany || payload.company || '',
    phone: payload.customerPhone || payload.phone || '',
  };

  const requirement = payload.requirement || null;

  // 1. Duplicate Dispatch Prevention
  // Resolve target entity ID for idempotency check across both UUID and inquiryNumber
  let targetEntityId = inquiry.id;
  if (targetNumber) {
    try {
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { inquiryNumber: targetNumber },
        select: { id: true },
      });
      if (existingInquiry) {
        targetEntityId = existingInquiry.id;
      }
    } catch {
      // Ignore lookup failure
    }
  }

  const lookupConditions = [];
  if (targetEntityId) lookupConditions.push({ entityId: targetEntityId });
  if (inquiry.id && inquiry.id !== targetEntityId) lookupConditions.push({ entityId: inquiry.id });
  if (targetNumber) {
    lookupConditions.push({ entityId: targetNumber });
    lookupConditions.push({
      details: {
        path: ['inquiryNumber'],
        equals: targetNumber,
      },
    });
  }

  const alreadySent = lookupConditions.length > 0 ? await prisma.activityLog.findFirst({
    where: {
      action: { in: ['EMAIL_CONFIRMATION_SENT', 'EMAIL_DISPATCH_RECORD'] },
      OR: lookupConditions,
    },
  }) : null;

  if (alreadySent) {
    console.log(`[Email Notice] Confirmation already recorded for inquiry #${inquiry.inquiryNumber}. Skipping duplicate.`);
    return { success: true, skipped: true, reason: 'Duplicate notification prevented' };
  }

  // 2. Check if SMTP is configured
  if (!config.isConfigured) {
    console.log(`[Email Notice] SMTP not configured. Notification simulated for inquiry #${inquiry.inquiryNumber} to customer (${customer.email}) and admin (${config.adminEmail}).`);
    return {
      success: false,
      simulated: true,
      reason: 'SMTP not configured',
    };
  }

  try {
    const transporter = await createSMTPTransporter();
    if (!transporter) {
      return { success: false, simulated: true, reason: 'Transporter creation failed' };
    }

    const projectTitle = inquiry.title || requirement?.projectName || 'Custom Software Project';
    const clientName = customer.name || 'Valued Client';
    const clientCompany = customer.company ? ` (${customer.company})` : '';

    // Customer HTML Email Template
    const customerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1e293b; background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="border-bottom: 2px solid #087BFF; padding-bottom: 18px; margin-bottom: 24px;">
          <div style="font-size: 24px; font-weight: 800; color: #087BFF; letter-spacing: -0.5px;">SPECIAL TECH</div>
          <div style="color: #64748b; font-size: 13px; margin-top: 4px;">Intelligent Software Architecture & Engineering</div>
        </div>

        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Project Proposal Received</h2>
        <p style="font-size: 14px; line-height: 1.6;">Dear <strong>${clientName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6;">Thank you for submitting your software project proposal to <strong>Special Tech</strong>. Our Solutions Architecture team has received your project specification and interactive prototype.</p>

        <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #087BFF; margin: 24px 0; border-radius: 6px; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Inquiry Reference:</strong></td>
              <td style="padding: 6px 0; color: #087BFF; font-family: monospace; font-weight: bold; font-size: 14px;">#${inquiry.inquiryNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Project Title:</strong></td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${projectTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Target Budget:</strong></td>
              <td style="padding: 6px 0; color: #059669; font-weight: bold;">${inquiry.budget || 'To be finalized'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Preferred Contact:</strong></td>
              <td style="padding: 6px 0; color: #0f172a;">${inquiry.preferredContact || 'Email'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Status:</strong></td>
              <td style="padding: 6px 0; color: #2563eb; font-weight: 600;">Under Architectural Review</td>
            </tr>
          </table>
        </div>

        <h3 style="color: #0f172a; font-size: 15px; margin-bottom: 12px;">What Happens Next?</h3>
        <ol style="padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.7; margin-top: 0;">
          <li><strong>Architectural Review (2–4 hours)</strong>: A Lead Architect evaluates your requirements and interactive prototype structure.</li>
          <li><strong>Technical Discovery Call (Within 24 hours)</strong>: We will reach out via ${inquiry.preferredContact || 'Email'} with scope refinement and architectural recommendations.</li>
          <li><strong>Sprint Kickoff</strong>: Upon agreement, we finalize the sprint roadmap, deliverables, and private staging preview.</li>
        </ol>

        <p style="font-size: 13px; color: #475569; margin-top: 24px;">If you need to provide additional requirements or documents, simply reply directly to this email referencing <strong>#${inquiry.inquiryNumber}</strong>.</p>

        <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 20px; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between;">
          <div>
            <strong>SPECIAL TECH</strong> • Silicon Horizon Tech Park, Suite 800<br/>
            Email: contact@specialtech.com | Phone: +1 (555) 382-7000
          </div>
        </div>
      </div>
    `;

    // Admin Notification HTML Template
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1e293b; background: #ffffff; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="background: #0f172a; padding: 14px 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #38bdf8; margin: 0; font-size: 16px;">NEW CUSTOMER PROPOSAL SUBMITTED</h2>
        </div>
        <p style="font-size: 14px;">A new customer proposal was received and recorded in PostgreSQL.</p>
        <div style="background: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; margin: 16px 0;">
          <p style="margin: 0 0 6px 0;"><strong>Inquiry Number:</strong> <span style="font-family: monospace; color: #0284c7;">#${inquiry.inquiryNumber}</span></p>
          <p style="margin: 0 0 6px 0;"><strong>Customer:</strong> ${clientName}${clientCompany}</p>
          <p style="margin: 0 0 6px 0;"><strong>Email:</strong> <a href="mailto:${customer.email}">${customer.email}</a></p>
          <p style="margin: 0 0 6px 0;"><strong>Phone:</strong> ${customer.phone || 'N/A'}</p>
          <p style="margin: 0 0 6px 0;"><strong>Project Title:</strong> ${projectTitle}</p>
          <p style="margin: 0 0 6px 0;"><strong>Budget:</strong> ${inquiry.budget || 'Unspecified'}</p>
          <p style="margin: 0 0 6px 0;"><strong>Requirement ID:</strong> ${inquiry.requirementId || 'N/A'}</p>
          <p style="margin: 0;"><strong>Prototype Version ID:</strong> ${inquiry.prototypeVersionId || 'N/A'}</p>
        </div>
        <div style="font-size: 13px; color: #475569; margin: 16px 0;">
          <strong>Customer Message:</strong>
          <p style="background: #fff; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; margin: 8px 0 0 0; white-space: pre-line;">${inquiry.message}</p>
        </div>
        <div style="margin-top: 24px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/admin" style="background: #087BFF; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Open Proposal in Admin Dashboard &rarr;
          </a>
        </div>
      </div>
    `;

    // Admin recipient: in test mode or if configured, route to resendTestRecipient or adminEmail
    const adminRecipient = config.resendTestRecipient || config.adminEmail;

    // 3. Dispatch emails concurrently
    const [customerResult, adminResult] = await Promise.allSettled([
      transporter.sendMail({
        from: config.from,
        to: customer.email,
        subject: `Project Proposal Received — #${inquiry.inquiryNumber}: ${projectTitle} | Special Tech`,
        html: customerHtml,
      }),
      transporter.sendMail({
        from: config.from,
        to: adminRecipient,
        subject: `[New Inquiry] #${inquiry.inquiryNumber}: ${projectTitle} from ${clientName}`,
        html: adminHtml,
      }),
    ]);

    // 4. Log and record activity with Resend test mode recognition
    let customerStatus = 'failed';
    let isCustomerTestBlocked = false;
    let customerError = null;

    const logEntityId = targetEntityId || inquiry.id || inquiry.inquiryNumber;

    if (customerResult.status === 'fulfilled') {
      customerStatus = 'sent';
      await prisma.activityLog.create({
        data: {
          action: 'EMAIL_CONFIRMATION_SENT',
          entityType: 'INQUIRY',
          entityId: logEntityId,
          details: {
            to: customer.email,
            inquiryNumber: inquiry.inquiryNumber,
            messageId: customerResult.value?.messageId,
          },
        },
      });
      console.log(`[Email Notice] Customer confirmation sent for #${inquiry.inquiryNumber} to ${customer.email}`);
    } else {
      customerError = customerResult.reason?.message || '';
      if (customerResult.reason?.responseCode === 550 || /550|only send testing emails|use our testing email address|invalid `to` field/i.test(customerError)) {
        customerStatus = 'blocked_resend_testing_mode';
        isCustomerTestBlocked = true;
        console.warn(`[Email Notice] Customer email for #${inquiry.inquiryNumber} held: Resend account is in testing mode (cannot send to unverified address ${customer.email}).`);
      } else if (customerResult.reason?.responseCode === 535 || /535/i.test(customerError)) {
        customerStatus = 'auth_failed';
        console.warn(`[Email Warning] SMTP authentication failed for inquiry #${inquiry.inquiryNumber}.`);
      } else {
        console.warn(`[Email Warning] Failed to send customer confirmation for #${inquiry.inquiryNumber}:`, customerError);
      }
    }

    let adminStatus = 'failed';
    if (adminResult.status === 'fulfilled') {
      adminStatus = 'sent';
      console.log(`[Email Notice] Admin notification sent for #${inquiry.inquiryNumber} to ${adminRecipient}`);
    } else {
      console.warn(`[Email Warning] Failed to send admin notification for #${inquiry.inquiryNumber}:`, adminResult.reason?.message);
    }

    // Always record an EMAIL_DISPATCH_RECORD so this inquiry is NEVER retried repeatedly
    await prisma.activityLog.create({
      data: {
        action: 'EMAIL_DISPATCH_RECORD',
        entityType: 'INQUIRY',
        entityId: logEntityId,
        details: {
          inquiryNumber: inquiry.inquiryNumber,
          customerEmail: customer.email,
          customerStatus,
          adminStatus,
          isCustomerTestBlocked,
          customerError: customerStatus === 'sent' ? null : customerError?.slice(0, 200),
          adminError: adminStatus === 'sent' ? null : adminResult.reason?.message?.slice(0, 200),
        },
      },
    });

    const deliveryStatus = isCustomerTestBlocked
      ? `Resend Testing Mode: Inquiry #${inquiry.inquiryNumber} saved. Customer email held (unverified domain). Admin notification: ${adminStatus}.`
      : (customerStatus === 'sent'
        ? `Dispatched: Customer (${customer.email}) and Admin for #${inquiry.inquiryNumber}`
        : `Customer delivery: ${customerStatus} (${customerError?.slice(0, 100)})`);

    await prisma.adminSetting.upsert({
      where: { key: 'smtp_last_delivery_status' },
      update: { value: deliveryStatus },
      create: { key: 'smtp_last_delivery_status', value: deliveryStatus },
    });

    return {
      success: customerStatus === 'sent' || isCustomerTestBlocked,
      customerSent: customerStatus === 'sent',
      adminSent: adminStatus === 'sent',
      isCustomerTestBlocked,
      customerStatus,
      customerMessageId: customerResult.value?.messageId,
      adminMessageId: adminResult.value?.messageId,
    };
  } catch (error) {
    // Fail-safe: SMTP error must NEVER throw or rollback the saved inquiry!
    console.warn('[Email Error] Failed during notification dispatch:', error.message);
    await prisma.adminSetting.upsert({
      where: { key: 'smtp_last_error' },
      update: { value: error.message },
      create: { key: 'smtp_last_error', value: error.message },
    });
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send customer notification email when their project inquiry status changes in the CRM
 */
export const sendInquiryStatusEmail = async ({
  customer,
  inquiry,
  previousStatus,
  newStatus,
  notes = '',
}) => {
  try {
    if (!customer?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      return {
        success: false,
        status: 'Failed',
        provider: 'Resend SMTP',
        error: 'Inquiry owner has no registered or valid customer email address.',
        recipient: customer?.email || null,
        maskedRecipient: maskEmail(customer?.email || ''),
      };
    }

    const config = await getSMTPConfig();
    const clientName = customer.name || 'Valued Client';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const inquiryUrl = `${frontendUrl}/admin?tab=inquiries&id=${inquiry.id}`;

    // Status colors and labels
    const statusColorMap = {
      NEW: '#3b82f6',
      UNDER_REVIEW: '#a855f7',
      ESTIMATED: '#06b6d4',
      IN_PROGRESS: '#38bdf8',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
    };

    const statusLabelMap = {
      NEW: 'New Inquiry',
      UNDER_REVIEW: 'Under Review',
      ESTIMATED: 'Estimated / Proposed',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };

    const displayStatus = statusLabelMap[newStatus] || newStatus;
    const displayPrevStatus = statusLabelMap[previousStatus] || previousStatus || 'New Inquiry';
    const statusColor = statusColorMap[newStatus] || '#38bdf8';

    const updateDate = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC';

    const statusHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020D20; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #0B192C; border-radius: 16px; overflow: hidden; border: 1px solid #1E293B; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #020D20 0%, #1e3a8a 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #1E293B; }
          .logo { font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #38bdf8; text-transform: uppercase; margin-bottom: 6px; }
          .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; background: ${statusColor}; margin-top: 10px; }
          .content { padding: 32px 24px; }
          .greeting { font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
          .card { background: #030F26; border: 1px solid #1E293B; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
          .label { color: #94a3b8; }
          .val { font-weight: 600; color: #f8fafc; text-align: right; }
          .message-box { background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8; padding: 14px 18px; border-radius: 0 8px 8px 0; font-size: 13px; color: #e2e8f0; line-height: 1.5; margin: 18px 0; }
          .cta-btn { display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background: linear-gradient(90deg, #2563eb, #06b6d4); color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px 24px; font-size: 11px; color: #64748b; border-top: 1px solid #1E293B; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SPECIAL TECH</div>
            <div style="font-size: 12px; color: #94a3b8;">Client Project Inquiry Milestone Notification</div>
            <div class="badge">${displayStatus}</div>
          </div>
          <div class="content">
            <div class="greeting">Dear ${clientName},</div>
            <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
              We are pleased to inform you that your project inquiry <strong>#${inquiry.inquiryNumber}</strong> (<em>${inquiry.title}</em>) has been updated to <strong>${displayStatus}</strong>.
            </p>

            <div class="card">
              <div class="row">
                <span class="label">Inquiry Reference:</span>
                <span class="val" style="color: #38bdf8; font-family: monospace;">#${inquiry.inquiryNumber}</span>
              </div>
              <div class="row">
                <span class="label">Project Title:</span>
                <span class="val">${inquiry.title}</span>
              </div>
              <div class="row">
                <span class="label">Previous Status:</span>
                <span class="val" style="color: #94a3b8;">${displayPrevStatus}</span>
              </div>
              <div class="row">
                <span class="label">New Status:</span>
                <span class="val" style="color: ${statusColor}; font-weight: bold;">${displayStatus}</span>
              </div>
              ${inquiry.budget ? `
              <div class="row">
                <span class="label">Estimated Budget:</span>
                <span class="val" style="color: #10b981;">${inquiry.budget}</span>
              </div>
              ` : ''}
              <div class="row">
                <span class="label">Date & Time:</span>
                <span class="val" style="color: #94a3b8;">${updateDate}</span>
              </div>
            </div>

            ${notes ? `
              <div class="message-box">
                <div style="font-size: 11px; font-weight: bold; color: #38bdf8; text-transform: uppercase; margin-bottom: 4px;">Update Notes from Engineering & Account Team:</div>
                ${notes}
              </div>
            ` : ''}

            ${newStatus === 'COMPLETED' ? `
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 14px; text-align: center; color: #10b981; font-weight: 600; font-size: 13px; margin: 16px 0;">
                🎉 Congratulations! Your inquiry deliverables and specifications have been successfully finalized.
              </div>
            ` : ''}

            <a href="${inquiryUrl}" class="cta-btn">View Inquiry & Proposal Status &rarr;</a>
          </div>
          <div class="footer">
            Special Tech • Enterprise AI & Full-Stack Solutions<br>
            If you have questions regarding this milestone, please reply directly or contact support@specialtech.com.
          </div>
        </div>
      </body>
      </html>
    `;

    if (!config.isConfigured) {
      console.warn(`[Email Warning] SMTP not configured. Inquiry status email cannot be sent to ${customer.email}.`);
      return {
        success: false,
        status: 'Failed',
        provider: 'Resend SMTP',
        error: 'SMTP host, user, or password is not configured in .env or Admin Settings.',
        recipient: customer.email.trim(),
        maskedRecipient: maskEmail(customer.email.trim()),
      };
    }

    const transporter = await createSMTPTransporter();
    if (!transporter) {
      return {
        success: false,
        status: 'Failed',
        provider: 'Resend SMTP',
        error: 'Could not initialize SMTP transporter with current configuration',
        recipient: customer.email.trim(),
        maskedRecipient: maskEmail(customer.email.trim()),
      };
    }

    try {
      const recipientEmail = customer.email.trim();
      const info = await transporter.sendMail({
        from: config.from,
        to: recipientEmail,
        subject: `[Special Tech] Project Inquiry Update: #${inquiry.inquiryNumber} is now ${displayStatus}`,
        html: statusHtml,
      });

      console.log(`[Email Notice] Inquiry status email accepted by provider for ${recipientEmail} (${info.messageId})`);
      return {
        success: true,
        status: 'Sent',
        provider: 'Resend SMTP',
        messageId: info.messageId,
        recipient: recipientEmail,
        maskedRecipient: maskEmail(recipientEmail),
      };
    } catch (sendErr) {
      const errMsg = sendErr.message || '';
      let cleanError = errMsg;

      if (sendErr.responseCode === 550 || /550|only send testing emails|testing email address/i.test(errMsg)) {
        cleanError = `Resend Testing Mode (550): Account is currently in testing mode and can only deliver to the verified account email (${config.adminEmail || 'naniabdi2504@gmail.com'}). To send to external customer domains, verify your domain at https://resend.com/domains.`;
        console.warn(`[Email Notice] Customer email for inquiry "${inquiry.inquiryNumber}" rejected: ${cleanError}`);
      } else if (sendErr.responseCode === 535 || /535|authentication credentials invalid/i.test(errMsg)) {
        cleanError = 'SMTP Authentication Failure (535): Invalid Resend credentials. Please verify your SMTP_PASS / API Key.';
      } else if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(errMsg)) {
        cleanError = `SMTP Server Unreachable: Connection timed out attempting to reach ${config.host}:${config.port}.`;
      }

      console.warn(`[Email Warning] Inquiry status email failed for ${customer.email}:`, cleanError);
      return {
        success: false,
        status: 'Failed',
        provider: 'Resend SMTP',
        error: cleanError,
        rawError: errMsg,
        recipient: customer.email.trim(),
        maskedRecipient: maskEmail(customer.email.trim()),
      };
    }
  } catch (err) {
    console.error('[Email Service Error in sendInquiryStatusEmail]:', err.message);
    return {
      success: false,
      status: 'Failed',
      provider: 'Resend SMTP',
      error: err.message,
      recipient: customer?.email || null,
      maskedRecipient: maskEmail(customer?.email || ''),
    };
  }
};

/**
 * Send customer notification email when their project status changes
 */
export const sendProjectStatusEmail = async ({
  customer,
  project,
  previousStatus,
  newStatus,
  message,
  progress = 0,
}) => {
  try {
    if (!customer?.email) {
      return {
        success: false,
        status: 'skipped',
        error: 'Customer has no valid email address',
      };
    }

    const config = await getSMTPConfig();
    const clientName = customer.name || 'Valued Client';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const projectUrl = `${frontendUrl}/my-projects?id=${project.id}`;

    // Status colors
    const statusColorMap = {
      Approved: '#38bdf8',
      'In Progress': '#06b6d4',
      'Under Review': '#a855f7',
      'Revision Required': '#f97316',
      Completed: '#10b981',
      Cancelled: '#ef4444',
      Pending: '#f59e0b',
    };
    const statusColor = statusColorMap[newStatus] || '#3b82f6';

    const updateDate = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC';

    const statusHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020D20; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #0B192C; border-radius: 16px; overflow: hidden; border: 1px solid #1E293B; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #020D20 0%, #1e3a8a 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #1E293B; }
          .logo { font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #38bdf8; text-transform: uppercase; margin-bottom: 6px; }
          .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; background: ${statusColor}; margin-top: 10px; }
          .content { padding: 32px 24px; }
          .greeting { font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
          .card { background: #030F26; border: 1px solid #1E293B; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
          .label { color: #94a3b8; }
          .val { font-weight: 600; color: #f8fafc; text-align: right; }
          .progress-track { background: #1E293B; height: 8px; border-radius: 4px; overflow: hidden; margin: 12px 0 6px 0; }
          .progress-bar { background: linear-gradient(90deg, #3b82f6, #06b6d4); height: 100%; border-radius: 4px; width: ${Math.min(100, Math.max(0, progress))}%; }
          .message-box { background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8; padding: 14px 18px; border-radius: 0 8px 8px 0; font-size: 13px; color: #e2e8f0; line-height: 1.5; margin: 18px 0; }
          .cta-btn { display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background: linear-gradient(90deg, #2563eb, #06b6d4); color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px 24px; font-size: 11px; color: #64748b; border-top: 1px solid #1E293B; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SPECIAL TECH</div>
            <div style="font-size: 12px; color: #94a3b8;">Client Project Milestone Notification</div>
            <div class="badge">${newStatus}</div>
          </div>
          <div class="content">
            <div class="greeting">Dear ${clientName},</div>
            <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
              We are pleased to inform you that the status of your project <strong>${project.title}</strong> has been updated to <strong>${newStatus}</strong>.
            </p>

            <div class="card">
              <div class="row">
                <span class="label">Project Title:</span>
                <span class="val">${project.title}</span>
              </div>
              <div class="row">
                <span class="label">Previous Status:</span>
                <span class="val" style="color: #94a3b8;">${previousStatus || 'Initiated'}</span>
              </div>
              <div class="row">
                <span class="label">New Status:</span>
                <span class="val" style="color: ${statusColor}; font-weight: bold;">${newStatus}</span>
              </div>
              <div class="row">
                <span class="label">Project Progress:</span>
                <span class="val">${progress}%</span>
              </div>
              <div class="row">
                <span class="label">Date & Time:</span>
                <span class="val" style="color: #94a3b8;">${updateDate}</span>
              </div>
              <div class="progress-track">
                <div class="progress-bar"></div>
              </div>
            </div>

            ${
              message
                ? `
              <div class="message-box">
                <div style="font-size: 11px; font-weight: bold; color: #38bdf8; text-transform: uppercase; margin-bottom: 4px;">Update Message from Engineering Team:</div>
                ${message}
              </div>
            `
                : ''
            }

            ${
              newStatus === 'Completed'
                ? `
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 14px; text-align: center; color: #10b981; font-weight: 600; font-size: 13px; margin: 16px 0;">
                🎉 Congratulations! Your project deliverables have been finalized and completed.
              </div>
            `
                : ''
            }

            <a href="${projectUrl}" class="cta-btn">View Live Project in Customer Portal &rarr;</a>
          </div>
          <div class="footer">
            Special Tech • Enterprise AI & Full-Stack Solutions<br>
            If you have questions regarding this milestone, please reply directly or contact support@specialtech.com.
          </div>
        </div>
      </body>
      </html>
    `;

    if (!customer?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      return {
        success: false,
        status: 'Failed',
        provider: 'Resend SMTP',
        error: 'Project owner has no registered or valid customer email address.',
        recipient: customer?.email || null,
        maskedRecipient: maskEmail(customer?.email || ''),
      };
    }

    if (!config.isConfigured) {
      console.warn(`[Email Warning] SMTP not configured. Project status email cannot be sent for project "${project.title}" to ${customer.email}.`);
      return {
        success: false,
        status: 'Failed',
        provider: 'Resend SMTP',
        error: 'SMTP host, user, or password is not configured in .env or Admin Settings.',
        recipient: customer.email.trim(),
        maskedRecipient: maskEmail(customer.email.trim()),
      };
    }

    const transporter = await createSMTPTransporter();
    if (!transporter) {
      console.warn(`[Email Warning] Could not initialize SMTP transporter for project status email.`);
      return {
        success: false,
        status: 'Failed',
        provider: 'Resend SMTP',
        error: 'Could not initialize SMTP transporter with current configuration',
        recipient: customer.email.trim(),
        maskedRecipient: maskEmail(customer.email.trim()),
      };
    }

    try {
      const recipientEmail = customer.email.trim();
      const info = await transporter.sendMail({
        from: config.from,
        to: recipientEmail,
        subject: `[Special Tech] Project Update: ${project.title} is now ${newStatus}`,
        html: statusHtml,
      });

      console.log(`[Email Notice] Project status email accepted by provider for ${recipientEmail} (${info.messageId})`);
      return {
        success: true,
        status: 'Sent',
        provider: 'Resend SMTP',
        messageId: info.messageId,
        recipient: recipientEmail,
        maskedRecipient: maskEmail(recipientEmail),
      };
    } catch (sendErr) {
      const errMsg = sendErr.message || '';
      let cleanError = errMsg;

      if (sendErr.responseCode === 550 || /550|only send testing emails|testing email address/i.test(errMsg)) {
        cleanError = `Resend Testing Mode (550): Account is currently in testing mode and can only deliver to the verified account email (${config.adminEmail || 'naniabdi2504@gmail.com'}). To send to external customer domains, verify your domain at https://resend.com/domains.`;
        console.warn(`[Email Notice] Customer email for project "${project.title}" rejected: ${cleanError}`);
      } else if (sendErr.responseCode === 535 || /535|authentication credentials invalid/i.test(errMsg)) {
        cleanError = 'SMTP Authentication Failure (535): Invalid Resend credentials. Please verify your SMTP_PASS / API Key.';
      } else if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(errMsg)) {
        cleanError = `SMTP Server Unreachable: Connection timed out attempting to reach ${config.host}:${config.port}.`;
      }

      console.warn(`[Email Warning] Project status email failed for ${customer.email}:`, cleanError);
      return {
        success: false,
        status: 'Failed',
        provider: 'Resend SMTP',
        error: cleanError,
        rawError: errMsg,
        recipient: customer.email.trim(),
        maskedRecipient: maskEmail(customer.email.trim()),
      };
    }
  } catch (err) {
    console.error('[Email Service Error in sendProjectStatusEmail]:', err.message);
    return {
      success: false,
      status: 'Failed',
      provider: 'Resend SMTP',
      error: err.message,
      recipient: customer?.email || null,
      maskedRecipient: maskEmail(customer?.email || ''),
    };
  }
};

