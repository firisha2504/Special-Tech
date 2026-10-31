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
    const from = fromSetting !== null ? fromSetting.value : (process.env.SMTP_FROM || 'Special Tech <contact@specialtech.com>');
    const adminEmail = adminEmailSetting?.value || companyContactSetting?.value || process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@specialtech.com';
    const resendTestRecipient = resendTestRecipientSetting?.value || process.env.RESEND_TEST_RECIPIENT || 'naniabdi2504@gmail.com';

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
