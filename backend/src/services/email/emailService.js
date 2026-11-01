import nodemailer from 'nodemailer';
import prisma from '../../config/db.js';

/**
 * Helper to determine user-friendly provider display name
 */
export const getProviderName = (config) => {
  if (config?.provider === 'gmail' || config?.host?.toLowerCase().includes('gmail.com')) {
    return 'Gmail SMTP';
  }
  return 'Resend SMTP';
};

/**
 * Retrieve current SMTP configuration safely
 * Checks PostgreSQL admin_settings first, then falls back to process.env
 * Fully supports multi-provider setup (Resend SMTP and Gmail SMTP)
 */
export const getSMTPConfig = async () => {
  try {
    const settings = await prisma.adminSetting.findMany({
      where: {
        OR: [
          { key: { startsWith: 'smtp' } },
          { key: 'admin_email' },
          { key: 'contact_email' },
          { key: 'resend_test_recipient' },
        ],
      },
    });

    const getVal = (k) => settings.find((s) => s.key === k)?.value;

    // 1. Determine active provider ('gmail' | 'resend')
    let provider = getVal('smtp_provider') || process.env.SMTP_PROVIDER;
    if (!provider) {
      const activeHost = getVal('smtp_host') || process.env.SMTP_HOST || '';
      provider = activeHost.toLowerCase().includes('gmail.com') ? 'gmail' : 'resend';
    }
    provider = provider.toLowerCase() === 'gmail' ? 'gmail' : 'resend';

    // 2. Resolve Gmail settings
    const gmailHost = getVal('smtp_gmail_host') || (getVal('smtp_host')?.includes('gmail.com') ? getVal('smtp_host') : '') || 'smtp.gmail.com';
    const gmailPort = Number(getVal('smtp_gmail_port') || (getVal('smtp_host')?.includes('gmail.com') ? getVal('smtp_port') : '')) || 465;
    const gmailSecure = getVal('smtp_gmail_secure') !== 'false';
    const gmailUser = getVal('smtp_gmail_user') || (getVal('smtp_host')?.includes('gmail.com') ? getVal('smtp_user') : '') || process.env.GMAIL_USER || '';
    const rawGmailPass = getVal('smtp_gmail_pass') || (getVal('smtp_host')?.includes('gmail.com') ? getVal('smtp_pass') : '') || process.env.GMAIL_APP_PASSWORD || '';
    const gmailPass = rawGmailPass ? rawGmailPass.replace(/\s+/g, '') : '';
    const gmailFromName = getVal('smtp_gmail_from_name') || 'Special Tech';
    const gmailFromEmail = getVal('smtp_gmail_from_email') || (getVal('smtp_host')?.includes('gmail.com') ? getVal('smtp_user') : '') || gmailUser || '';
    const gmailFrom = getVal('smtp_gmail_from') || (gmailFromEmail ? `${gmailFromName} <${gmailFromEmail}>` : 'Special Tech');

    // 3. Resolve Resend settings
    let resendHost;
    if (process.env.SMTP_HOST === '') {
      resendHost = '';
    } else if (getVal('smtp_host') !== undefined && !getVal('smtp_host')?.includes('gmail.com')) {
      resendHost = getVal('smtp_host');
    } else {
      resendHost = getVal('smtp_resend_host') || process.env.SMTP_HOST || 'smtp.resend.com';
    }

    const rawResendPort = getVal('smtp_resend_port') || (!getVal('smtp_host')?.includes('gmail.com') ? getVal('smtp_port') : '') || process.env.SMTP_PORT || '465';
    let resendPort = Number(rawResendPort);
    if (!resendPort || isNaN(resendPort)) resendPort = 465;
    const resendSecure = resendPort === 465;

    const resendUser = (!getVal('smtp_host')?.includes('gmail.com') && getVal('smtp_user') !== undefined)
      ? getVal('smtp_user')
      : (getVal('smtp_resend_user') || process.env.SMTP_USER || 'resend');

    let resendPass;
    if (process.env.SMTP_PASS === '') {
      resendPass = '';
    } else if (getVal('smtp_pass') !== undefined && !getVal('smtp_host')?.includes('gmail.com')) {
      resendPass = getVal('smtp_pass');
    } else {
      resendPass = getVal('smtp_resend_pass') || process.env.SMTP_PASS || process.env.RESEND_API_KEY || '';
    }

    let resendFrom = getVal('smtp_resend_from') || (!getVal('smtp_host')?.includes('gmail.com') ? getVal('smtp_from') : '') || process.env.SMTP_FROM || 'Special Tech <onboarding@resend.dev>';
    if (resendHost && resendHost.includes('resend.com') && resendFrom.includes('@specialtech.com')) {
      resendFrom = 'Special Tech <onboarding@resend.dev>';
    }

    // 4. Resolve Active Configuration
    let host, port, secure, user, pass, from, fromName, fromEmail, providerName;
    if (provider === 'gmail') {
      providerName = 'Gmail SMTP';
      host = gmailHost;
      port = gmailPort;
      secure = gmailSecure;
      user = gmailUser;
      pass = gmailPass;
      fromName = gmailFromName;
      fromEmail = gmailFromEmail;
      from = gmailFrom;
    } else {
      providerName = 'Resend SMTP';
      host = resendHost;
      port = resendPort;
      secure = resendSecure;
      user = resendUser;
      pass = resendPass;
      from = resendFrom;
      fromName = 'Special Tech';
      const fromMatch = resendFrom.match(/<([^>]+)>/);
      fromEmail = fromMatch ? fromMatch[1] : resendFrom;
    }

    const adminEmail = getVal('admin_email') || getVal('contact_email') || process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@specialtech.com';
    const resendTestRecipient = getVal('resend_test_recipient') || process.env.RESEND_TEST_RECIPIENT || 'naniabdi2504@gmail.com';

    const hasPass = !!(pass && pass.trim());
    const isConfigured = !!(host && host.trim() && user && user.trim() && hasPass);

    return {
      provider,
      providerName,
      host: host.trim(),
      port,
      secure,
      user: user.trim(),
      from: from.trim(),
      fromName,
      fromEmail: fromEmail ? fromEmail.trim() : '',
      adminEmail: adminEmail.trim(),
      resendTestRecipient: resendTestRecipient.trim(),
      hasPass,
      isConfigured,
      rawPass: pass.trim(),
      lastStatus: getVal('smtp_last_status') || (isConfigured ? 'untested' : 'not_configured'),
      lastConnectedAt: getVal('smtp_last_connected_at') || getVal('smtp_last_auth_at') || null,
      lastError: getVal('smtp_last_error') || getVal('smtp_last_auth_error') || null,
      lastDeliveryStatus: getVal('smtp_last_delivery_status') || null,
      lastAuthStatus: getVal('smtp_last_auth_status') || null,
      lastAuthAt: getVal('smtp_last_auth_at') || null,
      lastAuthLatency: getVal('smtp_last_auth_latency') ? Number(getVal('smtp_last_auth_latency')) : null,
      testEmailStatus: getVal('smtp_test_email_status') || null,
      testEmailAt: getVal('smtp_test_email_at') || null,
      testEmailRecipient: getVal('smtp_test_email_recipient') || null,
      testEmailMessageId: getVal('smtp_test_email_message_id') || null,
      testDeliveryStatus: getVal('smtp_test_delivery_status') || null,
      testDeliveryAt: getVal('smtp_test_delivery_at') || null,
      lastErrorType: getVal('smtp_last_error_type') || null,
      // Preserved sub-configs for provider tabs
      resendConfig: {
        provider: 'resend',
        host: resendHost.trim(),
        port: resendPort,
        secure: resendSecure,
        user: resendUser.trim(),
        from: resendFrom.trim(),
        hasPass: !!(resendPass && resendPass.trim()),
        rawPass: (resendPass || '').trim(),
        isConfigured: !!(resendHost && resendUser && resendPass && resendPass.trim()),
      },
      gmailConfig: {
        provider: 'gmail',
        host: gmailHost.trim(),
        port: gmailPort,
        secure: gmailSecure,
        user: gmailUser.trim(),
        fromName: gmailFromName,
        fromEmail: gmailFromEmail.trim(),
        from: gmailFrom.trim(),
        hasPass: !!(gmailPass && gmailPass.trim()),
        rawPass: (gmailPass || '').trim(),
        isConfigured: !!(gmailUser && gmailUser.trim() && gmailPass && gmailPass.trim()),
      },
    };
  } catch (err) {
    console.error('[Email Config Error]:', err.message);
    const host = process.env.SMTP_HOST || 'smtp.resend.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const user = process.env.SMTP_USER || 'resend';
    const pass = process.env.SMTP_PASS || process.env.RESEND_API_KEY || '';
    const hasPass = !!(pass && pass.trim());
    return {
      provider: 'resend',
      providerName: 'Resend SMTP',
      host,
      port,
      secure: port === 465,
      user,
      from: process.env.SMTP_FROM || 'Special Tech <onboarding@resend.dev>',
      fromName: 'Special Tech',
      fromEmail: 'onboarding@resend.dev',
      adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@specialtech.com',
      resendTestRecipient: process.env.RESEND_TEST_RECIPIENT || 'naniabdi2504@gmail.com',
      hasPass,
      isConfigured: !!(host && user && hasPass),
      rawPass: pass.trim(),
      lastStatus: 'not_configured',
      lastConnectedAt: null,
      lastError: null,
      lastDeliveryStatus: null,
      lastAuthStatus: 'NOT_CONFIGURED',
      lastAuthAt: null,
      lastAuthLatency: null,
      testEmailStatus: null,
      testEmailAt: null,
      testEmailRecipient: null,
      testEmailMessageId: null,
      testDeliveryStatus: null,
      testDeliveryAt: null,
      lastErrorType: null,
      resendConfig: {
        provider: 'resend',
        host,
        port,
        secure: port === 465,
        user,
        from: process.env.SMTP_FROM || 'Special Tech <onboarding@resend.dev>',
        hasPass,
        isConfigured: hasPass,
      },
      gmailConfig: {
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        user: '',
        fromName: 'Special Tech',
        fromEmail: '',
        from: 'Special Tech',
        hasPass: false,
        isConfigured: false,
      },
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
const recordSMTPDiagnostic = async (status, errorMessage = null, extraUpdates = []) => {
  try {
    const updates = [
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_status' },
        update: { value: status },
        create: { key: 'smtp_last_status', value: status },
      }),
      ...extraUpdates,
    ];
    if (status === 'connected') {
      const nowIso = new Date().toISOString();
      updates.push(
        prisma.adminSetting.upsert({
          where: { key: 'smtp_last_connected_at' },
          update: { value: nowIso },
          create: { key: 'smtp_last_connected_at', value: nowIso },
        }),
        prisma.adminSetting.upsert({
          where: { key: 'smtp_last_error' },
          update: { value: '' },
          create: { key: 'smtp_last_error', value: '' },
        }),
        prisma.adminSetting.upsert({
          where: { key: 'smtp_last_error_type' },
          update: { value: '' },
          create: { key: 'smtp_last_error_type', value: '' },
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
 * Or direct SSL on port 465 (secure: true)
 * Strips whitespace from Google App Passwords automatically
 */
export const createSMTPTransporter = async (overrideConfig = null) => {
  const config = overrideConfig || (await getSMTPConfig());
  const pass = (config.rawPass || config.pass || '').trim();
  if (!config.isConfigured && !pass) {
    return null;
  }

  const port = Number(config.port) || 465;
  const isPort465 = port === 465;

  // Sanitize Google App Passwords (strip internal spaces e.g. "abcd efgh ijkl mnop")
  const isGmail = config.provider === 'gmail' || config.host?.toLowerCase().includes('gmail.com');
  const sanitizedPass = isGmail ? pass.replace(/\s+/g, '') : pass;

  return nodemailer.createTransport({
    host: config.host,
    port,
    secure: isPort465,
    requireTLS: !isPort465 && port === 587,
    auth: {
      user: config.user,
      pass: sanitizedPass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
  });
};

/**
 * Verify live SMTP server connection (Stage 2: SMTP Authentication Verified)
 * Supports live verification of current active settings or candidate settings (overrideConfig)
 */
export const verifySMTPConnection = async (overrideConfig = null) => {
  const baseConfig = await getSMTPConfig();
  let config = baseConfig;

  if (overrideConfig) {
    const overrideProvider = overrideConfig.provider || (overrideConfig.host?.includes('gmail.com') ? 'gmail' : baseConfig.provider);
    let testPass = (overrideConfig.pass || overrideConfig.rawPass || '').trim();
    if (!testPass || testPass.includes('•••')) {
      testPass = overrideProvider === 'gmail'
        ? (baseConfig.gmailConfig?.hasPass ? baseConfig.gmailConfig.rawPass || baseConfig.rawPass : '')
        : (baseConfig.resendConfig?.hasPass ? baseConfig.resendConfig.rawPass || baseConfig.rawPass : '');
    }

    const testPort = Number(overrideConfig.port) || 465;
    const testSecure = overrideConfig.secure !== undefined ? Boolean(overrideConfig.secure) : testPort === 465;

    config = {
      ...baseConfig,
      ...overrideConfig,
      provider: overrideProvider,
      providerName: overrideProvider === 'gmail' ? 'Gmail SMTP' : 'Resend SMTP',
      host: (overrideConfig.host || (overrideProvider === 'gmail' ? 'smtp.gmail.com' : 'smtp.resend.com')).trim(),
      port: testPort,
      secure: testSecure,
      user: (overrideConfig.user || '').trim(),
      pass: testPass,
      rawPass: testPass,
      isConfigured: !!(overrideConfig.user && testPass),
    };
  }

  const provider = config.provider === 'gmail' || config.host?.toLowerCase().includes('gmail.com') ? 'gmail' : 'resend';
  const providerName = provider === 'gmail' ? 'Gmail SMTP' : 'Resend SMTP';
  const startTime = Date.now();
  const pass = (config.rawPass || config.pass || '').trim();

  if (!config.host || !config.user || !pass) {
    const errorMsg = provider === 'gmail'
      ? 'Gmail SMTP is not configured. Please enter your Gmail address and Google App Password.'
      : 'Resend SMTP is not configured. Please enter your SMTP User and Resend API Key.';

    await recordSMTPDiagnostic('not_configured', errorMsg, [
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_auth_status' },
        update: { value: 'NOT_CONFIGURED' },
        create: { key: 'smtp_last_auth_status', value: 'NOT_CONFIGURED' },
      }),
    ]);
    return {
      success: false,
      status: 'not_configured',
      authStatus: 'NOT_CONFIGURED',
      provider,
      providerName,
      host: config.host || '(None)',
      port: config.port,
      from: config.from,
      message: errorMsg,
      error: errorMsg,
    };
  }

  try {
    const transporter = await createSMTPTransporter(config);
    if (!transporter) {
      throw new Error(`Could not initialize SMTP transporter for ${providerName}`);
    }

    await transporter.verify();
    const latencyMs = Date.now() - startTime;
    const nowIso = new Date().toISOString();

    const successMsg = provider === 'gmail'
      ? 'SMTP authentication successful. Gmail SMTP is ready for email testing.'
      : 'SMTP authentication successful. Resend SMTP is ready for email testing.';

    await recordSMTPDiagnostic('connected', null, [
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_auth_status' },
        update: { value: 'VERIFIED' },
        create: { key: 'smtp_last_auth_status', value: 'VERIFIED' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_auth_at' },
        update: { value: nowIso },
        create: { key: 'smtp_last_auth_at', value: nowIso },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_auth_latency' },
        update: { value: String(latencyMs) },
        create: { key: 'smtp_last_auth_latency', value: String(latencyMs) },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_auth_error' },
        update: { value: '' },
        create: { key: 'smtp_last_auth_error', value: '' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_error' },
        update: { value: '' },
        create: { key: 'smtp_last_error', value: '' },
      }),
    ]);

    return {
      success: true,
      status: 'connected',
      authStatus: 'VERIFIED',
      provider,
      providerName,
      host: config.host,
      port: config.port,
      secure: config.secure,
      protocol: config.port === 465 ? 'SSL (Port 465)' : 'STARTTLS (Port 587)',
      user: config.user,
      from: config.from,
      latencyMs,
      verifiedAt: nowIso,
      message: successMsg,
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const rawMsg = err.message || 'SMTP handshake failed';
    const nowIso = new Date().toISOString();

    let status = 'error';
    let authStatus = 'FAILED';
    let errorType = 'GENERAL';
    let cleanMessage = rawMsg;

    // Distinguish 535 authentication failures vs 550 testing restrictions vs connection timeouts
    if (err.responseCode === 535 || /535|invalid login|authentication credentials invalid|username and password not accepted/i.test(rawMsg)) {
      status = 'auth_failed';
      authStatus = 'AUTH_FAILED';
      errorType = 'AUTH_FAILED';
      cleanMessage = provider === 'gmail'
        ? 'Authentication failed. Check your Gmail address and Google App Password.'
        : 'Authentication failed. Check your Resend API Key.';
    } else if (err.responseCode === 550 || /550.*only send testing emails/i.test(rawMsg)) {
      status = 'resend_testing_restriction';
      authStatus = 'RESTRICTED';
      errorType = 'RESEND_TESTING_MODE';
      cleanMessage = 'Resend Testing Restriction (550): Resend account is in testing mode. Emails can only be delivered to your verified account address.';
    } else if (/timeout|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|EHOSTUNREACH/i.test(rawMsg)) {
      status = 'unreachable';
      authStatus = 'UNREACHABLE';
      errorType = 'UNREACHABLE';
      cleanMessage = provider === 'gmail'
        ? 'Unable to connect to Gmail SMTP. Check your internet connection and SMTP settings.'
        : 'Unable to connect to Resend SMTP. Check your internet connection and SMTP settings.';
    }

    await recordSMTPDiagnostic(status, cleanMessage, [
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_auth_status' },
        update: { value: authStatus },
        create: { key: 'smtp_last_auth_status', value: authStatus },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_auth_at' },
        update: { value: nowIso },
        create: { key: 'smtp_last_auth_at', value: nowIso },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_auth_latency' },
        update: { value: String(latencyMs) },
        create: { key: 'smtp_last_auth_latency', value: String(latencyMs) },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_auth_error' },
        update: { value: cleanMessage },
        create: { key: 'smtp_last_auth_error', value: cleanMessage },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_error_type' },
        update: { value: errorType },
        create: { key: 'smtp_last_error_type', value: errorType },
      }),
    ]);

    return {
      success: false,
      status,
      authStatus,
      errorType,
      provider,
      providerName,
      host: config.host,
      port: config.port,
      from: config.from,
      latencyMs,
      error: cleanMessage,
      message: cleanMessage,
      rawError: rawMsg,
    };
  }
};

/**
 * Save SMTP provider settings securely
 * Preserves previously saved passwords when password input is empty
 */
export const saveEmailSettings = async ({
  provider,
  // Gmail fields
  gmailUser,
  gmailPass,
  gmailFromName,
  gmailFromEmail,
  // Resend fields
  resendHost,
  resendPort,
  resendUser,
  resendPass,
  resendFrom,
  // Common
  adminEmail,
}) => {
  const currentConfig = await getSMTPConfig();
  const selectedProvider = (provider || 'resend').toLowerCase() === 'gmail' ? 'gmail' : 'resend';
  const updates = [];

  // Update active provider
  updates.push(
    prisma.adminSetting.upsert({
      where: { key: 'smtp_provider' },
      update: { value: selectedProvider },
      create: { key: 'smtp_provider', value: selectedProvider },
    })
  );

  if (adminEmail && adminEmail.trim()) {
    updates.push(
      prisma.adminSetting.upsert({
        where: { key: 'admin_email' },
        update: { value: adminEmail.trim() },
        create: { key: 'admin_email', value: adminEmail.trim() },
      })
    );
  }

  if (selectedProvider === 'gmail') {
    if (!gmailUser || !gmailUser.includes('@')) {
      throw new Error('A valid Gmail address is required for SMTP Username.');
    }
    const cleanGmailUser = gmailUser.trim();
    const cleanFromName = (gmailFromName || 'Special Tech').trim();
    const cleanFromEmail = (gmailFromEmail || cleanGmailUser).trim();
    const cleanFrom = `${cleanFromName} <${cleanFromEmail}>`;

    updates.push(
      prisma.adminSetting.upsert({
        where: { key: 'smtp_gmail_host' },
        update: { value: 'smtp.gmail.com' },
        create: { key: 'smtp_gmail_host', value: 'smtp.gmail.com' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_gmail_port' },
        update: { value: '465' },
        create: { key: 'smtp_gmail_port', value: '465' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_gmail_secure' },
        update: { value: 'true' },
        create: { key: 'smtp_gmail_secure', value: 'true' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_gmail_user' },
        update: { value: cleanGmailUser },
        create: { key: 'smtp_gmail_user', value: cleanGmailUser },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_gmail_from_name' },
        update: { value: cleanFromName },
        create: { key: 'smtp_gmail_from_name', value: cleanFromName },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_gmail_from_email' },
        update: { value: cleanFromEmail },
        create: { key: 'smtp_gmail_from_email', value: cleanFromEmail },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_gmail_from' },
        update: { value: cleanFrom },
        create: { key: 'smtp_gmail_from', value: cleanFrom },
      })
    );

    // Password resolution: if new password provided, strip spaces and save; if empty, preserve existing
    let finalPass = currentConfig.gmailConfig?.hasPass ? currentConfig.gmailConfig.rawPass : '';
    if (gmailPass && gmailPass.trim() && gmailPass !== '••••••••••••••••') {
      finalPass = gmailPass.trim().replace(/\s+/g, '');
      updates.push(
        prisma.adminSetting.upsert({
          where: { key: 'smtp_gmail_pass' },
          update: { value: finalPass },
          create: { key: 'smtp_gmail_pass', value: finalPass },
        })
      );
    }

    if (!finalPass) {
      throw new Error('Google App Password is required. Please generate an App Password in your Google Account.');
    }

    // Mirror to active SMTP keys for seamless backward-compatibility across all services
    updates.push(
      prisma.adminSetting.upsert({
        where: { key: 'smtp_host' },
        update: { value: 'smtp.gmail.com' },
        create: { key: 'smtp_host', value: 'smtp.gmail.com' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_port' },
        update: { value: '465' },
        create: { key: 'smtp_port', value: '465' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_secure' },
        update: { value: 'true' },
        create: { key: 'smtp_secure', value: 'true' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_user' },
        update: { value: cleanGmailUser },
        create: { key: 'smtp_user', value: cleanGmailUser },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_from' },
        update: { value: cleanFrom },
        create: { key: 'smtp_from', value: cleanFrom },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_pass' },
        update: { value: finalPass },
        create: { key: 'smtp_pass', value: finalPass },
      })
    );
  } else {
    // Resend provider
    const host = (resendHost || 'smtp.resend.com').trim();
    const port = Number(resendPort) || 465;
    const isPort465 = port === 465;
    const user = (resendUser || 'resend').trim();
    const from = (resendFrom || 'Special Tech <onboarding@resend.dev>').trim();

    updates.push(
      prisma.adminSetting.upsert({
        where: { key: 'smtp_resend_host' },
        update: { value: host },
        create: { key: 'smtp_resend_host', value: host },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_resend_port' },
        update: { value: String(port) },
        create: { key: 'smtp_resend_port', value: String(port) },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_resend_secure' },
        update: { value: isPort465 ? 'true' : 'false' },
        create: { key: 'smtp_resend_secure', value: isPort465 ? 'true' : 'false' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_resend_user' },
        update: { value: user },
        create: { key: 'smtp_resend_user', value: user },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_resend_from' },
        update: { value: from },
        create: { key: 'smtp_resend_from', value: from },
      })
    );

    let finalPass = currentConfig.resendConfig?.hasPass ? currentConfig.resendConfig.rawPass : '';
    if (resendPass && resendPass.trim() && resendPass !== '••••••••••••••••') {
      finalPass = resendPass.trim();
      updates.push(
        prisma.adminSetting.upsert({
          where: { key: 'smtp_resend_pass' },
          update: { value: finalPass },
          create: { key: 'smtp_resend_pass', value: finalPass },
        })
      );
    }

    if (!finalPass) {
      throw new Error('Resend API Key is required.');
    }

    // Mirror to active SMTP keys
    updates.push(
      prisma.adminSetting.upsert({
        where: { key: 'smtp_host' },
        update: { value: host },
        create: { key: 'smtp_host', value: host },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_port' },
        update: { value: String(port) },
        create: { key: 'smtp_port', value: String(port) },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_secure' },
        update: { value: isPort465 ? 'true' : 'false' },
        create: { key: 'smtp_secure', value: isPort465 ? 'true' : 'false' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_user' },
        update: { value: user },
        create: { key: 'smtp_user', value: user },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_from' },
        update: { value: from },
        create: { key: 'smtp_from', value: from },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_pass' },
        update: { value: finalPass },
        create: { key: 'smtp_pass', value: finalPass },
      })
    );
  }

  await Promise.all(updates);
  return await getSMTPConfig();
};

/**
 * Send an administrator test verification email (Stage 3 & 4)
 * Subject: Special Tech SMTP Configuration Test
 * Message: "This is a test email from Special Tech. Your email configuration has been tested successfully."
 */
export const sendTestEmail = async ({ toEmail }) => {
  const config = await getSMTPConfig();
  const providerName = getProviderName(config);
  const targetRecipient = toEmail?.trim() || config.resendTestRecipient || config.adminEmail;
  const testSubject = 'Special Tech SMTP Configuration Test';
  const testMessageText = 'This is a test email from Special Tech. Your email configuration has been tested successfully.';

  if (!targetRecipient || !targetRecipient.includes('@')) {
    return {
      success: false,
      error: 'Please provide a valid recipient email address for the test.',
    };
  }

  const transporter = await createSMTPTransporter(config);
  if (!transporter) {
    return {
      success: false,
      error: `SMTP credentials are not configured for ${providerName}. Please configure your credentials first.`,
    };
  }

  try {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';

    const info = await transporter.sendMail({
      from: config.from,
      to: targetRecipient,
      subject: testSubject,
      text: testMessageText,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="border-bottom: 2px solid #087BFF; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #087BFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">SPECIAL TECH</h1>
            <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">AI-Powered Software Architecture & Engineering</p>
          </div>
          <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">${testSubject}</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">${testMessageText}</p>
          <div style="background: #f8fafc; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; font-size: 13px;">
            <p style="margin: 0 0 8px 0;"><strong>Active Provider:</strong> ${providerName}</p>
            <p style="margin: 0 0 8px 0;"><strong>SMTP Server:</strong> ${config.host}:${config.port} (${config.secure ? 'SSL' : 'STARTTLS'})</p>
            <p style="margin: 0 0 8px 0;"><strong>Sender:</strong> ${config.from}</p>
            <p style="margin: 0 0 8px 0;"><strong>Recipient:</strong> ${targetRecipient}</p>
            <p style="margin: 0;"><strong>Timestamp:</strong> ${timestamp}</p>
          </div>
          <p style="font-size: 13px; color: #475569;">Inquiry proposals submitted through the Special Tech website will now trigger automated customer confirmations and administrator notifications.</p>
          <br/>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; color: #94a3b8; font-size: 11px;">
            Special Tech Admin Service • Sent automatically from SMTP test suite via ${providerName}
          </div>
        </div>
      `,
    });

    const nowIso = new Date().toISOString();
    const statusMsg = `Success: Test email accepted by ${providerName} for ${targetRecipient} (Message ID: ${info.messageId || 'OK'}) at ${nowIso}`;

    await Promise.all([
      prisma.adminSetting.upsert({
        where: { key: 'smtp_test_email_status' },
        update: { value: 'ACCEPTED' },
        create: { key: 'smtp_test_email_status', value: 'ACCEPTED' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_test_delivery_status' },
        update: { value: 'ACCEPTED_IN_TRANSIT' },
        create: { key: 'smtp_test_delivery_status', value: 'ACCEPTED_IN_TRANSIT' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_test_email_at' },
        update: { value: nowIso },
        create: { key: 'smtp_test_email_at', value: nowIso },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_test_email_recipient' },
        update: { value: targetRecipient },
        create: { key: 'smtp_test_email_recipient', value: targetRecipient },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_test_email_message_id' },
        update: { value: info.messageId || '' },
        create: { key: 'smtp_test_email_message_id', value: info.messageId || '' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_delivery_status' },
        update: { value: statusMsg },
        create: { key: 'smtp_last_delivery_status', value: statusMsg },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_error' },
        update: { value: '' },
        create: { key: 'smtp_last_error', value: '' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_error_type' },
        update: { value: '' },
        create: { key: 'smtp_last_error_type', value: '' },
      }),
    ]);

    // Record test email attempt in Notification table for Outbound Email Telemetry & Audit logs
    await prisma.notification.create({
      data: {
        title: testSubject,
        message: `Verification test email accepted by provider (${providerName}) for ${targetRecipient}.`,
        type: 'test_email',
        channel: 'EMAIL',
        deliveryStatus: 'SENT',
        deliveryDetails: {
          recipientEmail: targetRecipient,
          maskedRecipientEmail: maskEmail(targetRecipient),
          senderEmail: config.from,
          subject: testSubject,
          provider: providerName,
          providerMessageId: info.messageId,
          deliveryStatus: 'ACCEPTED_IN_TRANSIT',
          attemptAt: nowIso,
          protocol: config.port === 465 ? 'SSL' : 'STARTTLS',
          host: config.host,
        },
        link: '/admin?tab=settings',
        isRead: true,
      },
    });

    return {
      success: true,
      status: 'accepted',
      provider: config.provider,
      providerName,
      messageId: info.messageId,
      recipient: targetRecipient,
      maskedRecipient: maskEmail(targetRecipient),
      deliveryStatus: 'ACCEPTED_IN_TRANSIT',
      message: `Test email successfully accepted by ${providerName} for delivery to ${targetRecipient}.`,
    };
  } catch (err) {
    const rawMsg = err.message || '';
    const nowIso = new Date().toISOString();
    let status = 'error';
    let errorType = 'GENERAL';
    let cleanError = rawMsg;

    if (err.responseCode === 550 || /550.*only send testing emails/i.test(rawMsg)) {
      status = 'resend_testing_restriction';
      errorType = 'RESEND_TESTING_MODE';
      const match = rawMsg.match(/own email address \(([^)]+)\)/i);
      const permitted = match ? match[1] : (config.resendTestRecipient || 'naniabdi2504@gmail.com');
      cleanError = `Resend Testing Mode (550): You can only send testing emails to your own email address (${permitted}). Verify your domain in Resend to send to arbitrary recipients.`;
    } else if (err.responseCode === 535 || /535|invalid login|authentication credentials invalid|username and password not accepted/i.test(rawMsg)) {
      status = 'auth_failed';
      errorType = 'AUTH_FAILED';
      cleanError = config.provider === 'gmail'
        ? 'Authentication failed. Check your Gmail address and Google App Password.'
        : 'Authentication failed. Check your Resend API Key.';
    } else if (/timeout|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|EHOSTUNREACH/i.test(rawMsg)) {
      status = 'unreachable';
      errorType = 'UNREACHABLE';
      cleanError = `SMTP Server Unreachable: Connection timed out attempting to reach ${config.host}:${config.port}.`;
    }

    await Promise.all([
      prisma.adminSetting.upsert({
        where: { key: 'smtp_test_email_status' },
        update: { value: 'REJECTED' },
        create: { key: 'smtp_test_email_status', value: 'REJECTED' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_test_delivery_status' },
        update: { value: 'FAILED' },
        create: { key: 'smtp_test_delivery_status', value: 'FAILED' },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_error' },
        update: { value: cleanError },
        create: { key: 'smtp_last_error', value: cleanError },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_last_error_type' },
        update: { value: errorType },
        create: { key: 'smtp_last_error_type', value: errorType },
      }),
    ]);

    // Record failed test attempt in Notification table as FAILED with full error telemetry
    await prisma.notification.create({
      data: {
        title: testSubject,
        message: `Verification test email to ${targetRecipient} failed: ${cleanError}`,
        type: 'test_email',
        channel: 'EMAIL',
        deliveryStatus: 'FAILED',
        deliveryDetails: {
          recipientEmail: targetRecipient,
          maskedRecipientEmail: maskEmail(targetRecipient),
          senderEmail: config.from,
          subject: 'Special Tech SMTP Configuration Test',
          provider: providerName,
          providerMessageId: null,
          deliveryStatus: 'FAILED',
          errorMessage: cleanError,
          errorType,
          attemptAt: nowIso,
          rawError: rawMsg,
        },
        link: '/admin?tab=settings',
        isRead: true,
      },
    });

    return {
      success: false,
      status,
      errorType,
      provider: config.provider,
      providerName,
      error: cleanError,
      message: cleanError,
      rawError: rawMsg,
    };
  }
};

/**
 * Safely retry a failed email notification without duplicating successful deliveries
 * Defaults to the currently active and configured SMTP provider (e.g. Gmail SMTP if active)
 * Preserves audit history of prior attempts and records actual provider used
 */
export const retryNotificationEmail = async (notificationIdOrInquiryId) => {
  const targetId = notificationIdOrInquiryId;
  let notif = await prisma.notification.findUnique({
    where: { id: targetId },
    include: { customer: true, project: true },
  });

  // Fallback: If not found by notification ID, check if targetId is an inquiry ID or inquiryNumber
  if (!notif) {
    const inq = await prisma.inquiry.findFirst({
      where: {
        OR: [
          { id: targetId },
          { inquiryNumber: targetId },
        ],
      },
      include: { customer: true },
    });
    if (inq) {
      notif = await prisma.notification.findFirst({
        where: {
          customerId: inq.customerId,
          channel: 'EMAIL',
          OR: [
            { deliveryDetails: { path: ['inquiryId'], equals: inq.id } },
            { metadata: { path: ['inquiryId'], equals: inq.id } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: { customer: true, project: true },
      });
    }
  }

  if (!notif) {
    return { success: false, statusCode: 404, message: 'Email notification record not found.' };
  }

  if (notif.channel !== 'EMAIL') {
    return { success: false, statusCode: 400, message: 'Notification is not an email dispatch record.' };
  }

  // Idempotency check: prevent duplicate send if already SENT or DELIVERED
  if (notif.deliveryStatus === 'SENT' || notif.deliveryStatus === 'DELIVERED') {
    return {
      success: false,
      statusCode: 409,
      alreadyDelivered: true,
      message: `Email was already accepted or delivered to provider (${notif.deliveryDetails?.providerMessageId || 'Confirmed'}). Duplicate dispatch is prevented.`,
      notification: notif,
    };
  }

  const details = notif.deliveryDetails || {};
  const recipientEmail = details.recipientEmail || notif.customer?.email;

  if (!recipientEmail || !recipientEmail.includes('@')) {
    return {
      success: false,
      statusCode: 400,
      message: 'Cannot retry: recipient has no valid registered email address.',
    };
  }

  // Resolve currently active and configured SMTP provider
  const activeConfig = await getSMTPConfig();
  const activeProviderName = activeConfig.providerName; // 'Gmail SMTP' or 'Resend SMTP'

  if (!activeConfig.isConfigured) {
    return {
      success: false,
      statusCode: 400,
      message: `Active provider (${activeProviderName}) is not configured. Please check your credentials in Email Settings.`,
      error: `Active provider (${activeProviderName}) is not configured.`,
      provider: activeProviderName,
    };
  }

  // Determine what email template to resend
  let sendResult = null;
  const inquiryId = details.inquiryId || notif.metadata?.inquiryId;
  const projectId = notif.projectId || details.projectId;

  if (inquiryId) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { customer: true },
    });
    if (inquiry && inquiry.customer) {
      // NOTE: Status of inquiry is preserved and NOT changed during retry!
      sendResult = await sendInquiryStatusEmail({
        customer: inquiry.customer,
        inquiry,
        previousStatus: details.previousStatus || 'NEW',
        newStatus: details.newStatus || inquiry.status,
        notes: notif.metadata?.notes || details.notes || inquiry.internalNotes || '',
      });
    }
  } else if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { customer: true },
    });
    if (project && project.customer) {
      sendResult = await sendProjectStatusEmail({
        project,
        customer: project.customer,
        previousStatus: details.previousStatus || 'PENDING',
        newStatus: details.newStatus || project.status,
        message: details.message || '',
      });
    }
  } else {
    // Test email or generic notification retry
    sendResult = await sendTestEmail({ toEmail: recipientEmail });
  }

  if (!sendResult) {
    return {
      success: false,
      statusCode: 400,
      message: 'Unable to resolve original notification payload for dispatch retry.',
    };
  }

  const nowIso = new Date().toISOString();
  const originalProvider = details.originalProvider || details.provider || 'Resend SMTP';
  const usedProvider = sendResult.provider || activeProviderName;

  // Preserve previous attempts in audit history
  const existingAttempts = Array.isArray(details.attempts) ? [...details.attempts] : [];
  if (existingAttempts.length === 0 && (details.attemptAt || details.errorMessage || details.provider)) {
    existingAttempts.push({
      attemptNumber: 1,
      attemptAt: details.attemptAt || notif.createdAt.toISOString(),
      provider: originalProvider,
      deliveryStatus: details.deliveryStatus || notif.deliveryStatus || 'FAILED',
      errorMessage: details.errorMessage || null,
      errorType: details.errorType || null,
      providerMessageId: details.providerMessageId || null,
      recipientEmail,
    });
  }

  const nextAttemptNumber = existingAttempts.length + 1;
  const newAttemptRecord = {
    attemptNumber: nextAttemptNumber,
    attemptAt: nowIso,
    provider: usedProvider,
    deliveryStatus: sendResult.success ? 'SENT' : 'FAILED',
    errorMessage: sendResult.success ? null : (sendResult.error || 'Dispatch failed'),
    errorType: sendResult.errorType || (sendResult.success ? null : 'PROVIDER_ERROR'),
    providerMessageId: sendResult.messageId || null,
    providerResponse: sendResult.providerResponse || null,
    recipientEmail,
  };

  const updatedAttempts = [...existingAttempts, newAttemptRecord];

  const updatedDeliveryDetails = {
    ...details,
    originalProvider,
    provider: usedProvider,
    previousProvider: details.provider || originalProvider,
    deliveryStatus: sendResult.success ? 'SENT' : 'FAILED',
    providerMessageId: sendResult.messageId || details.providerMessageId || null,
    providerResponse: sendResult.providerResponse || null,
    errorMessage: sendResult.success ? null : sendResult.error,
    errorType: sendResult.errorType || null,
    recipientEmail,
    maskedRecipientEmail: sendResult.maskedRecipient || maskEmail(recipientEmail),
    providerAccountOwner: activeConfig.adminEmail || 'naniabdi2504@gmail.com',
    attemptAt: nowIso,
    retriedAt: nowIso,
    isRetry: true,
    retryCount: nextAttemptNumber - 1,
    attempts: updatedAttempts,
  };

  const updated = await prisma.notification.update({
    where: { id: notif.id },
    data: {
      deliveryStatus: sendResult.success ? 'SENT' : 'FAILED',
      message: sendResult.success
        ? `Email successfully redelivered via ${usedProvider} to ${recipientEmail}.`
        : `Email retry via ${usedProvider} failed for ${recipientEmail}: ${sendResult.error}`,
      deliveryDetails: updatedDeliveryDetails,
    },
  });

  // Synchronize linked in-app notification if one exists
  try {
    const linkedInAppNotif = await prisma.notification.findFirst({
      where: {
        customerId: notif.customerId,
        channel: 'IN_APP',
        deliveryDetails: {
          path: ['email', 'notificationId'],
          equals: notif.id,
        },
      },
    });
    if (linkedInAppNotif) {
      const inAppDetails = linkedInAppNotif.deliveryDetails || {};
      await prisma.notification.update({
        where: { id: linkedInAppNotif.id },
        data: {
          deliveryDetails: {
            ...inAppDetails,
            email: {
              ...inAppDetails.email,
              status: sendResult.success ? 'SENT' : 'FAILED',
              provider: usedProvider,
              error: sendResult.success ? null : sendResult.error,
              messageId: sendResult.messageId || null,
              retriedAt: nowIso,
            },
          },
        },
      });
    }
  } catch (syncErr) {
    console.warn('[Email Warning] Could not sync linked in-app notification:', syncErr.message);
  }

  // Record audit activity log
  try {
    await prisma.activityLog.create({
      data: {
        action: 'EMAIL_NOTIFICATION_RETRIED',
        entityType: inquiryId ? 'INQUIRY' : (projectId ? 'PROJECT' : 'NOTIFICATION'),
        entityId: inquiryId || projectId || notif.id,
        details: {
          notificationId: notif.id,
          originalProvider,
          usedProvider,
          success: sendResult.success,
          recipient: recipientEmail,
          messageId: sendResult.messageId || null,
          error: sendResult.error || null,
          attemptNumber: nextAttemptNumber,
        },
      },
    });
  } catch (logErr) {
    console.warn('[Email Warning] Could not record activity log for retry:', logErr.message);
  }

  if (sendResult.success) {
    return {
      success: true,
      statusCode: 200,
      message: `Email successfully retried and accepted by ${usedProvider} for ${recipientEmail}!`,
      delivery: {
        ...sendResult,
        provider: usedProvider,
        originalProvider,
        attempts: updatedAttempts,
      },
      notification: updated,
    };
  } else {
    return {
      success: false,
      statusCode: 400,
      message: sendResult.error || `Email retry failed via ${usedProvider}.`,
      delivery: {
        ...sendResult,
        provider: usedProvider,
        originalProvider,
        attempts: updatedAttempts,
      },
      notification: updated,
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

    const providerName = getProviderName(config);
    const accountOwner = config.resendAccountOwner || config.adminEmail || 'naniabdi2504@gmail.com';

    if (!config.isConfigured) {
      const notConfiguredMsg = `${providerName} is not configured in Admin Settings. Please configure credentials before sending.`;
      console.warn(`[Email Warning] ${notConfiguredMsg} Inquiry status email cannot be sent to ${customer.email}.`);
      return {
        success: false,
        status: 'Failed',
        provider: providerName,
        error: notConfiguredMsg,
        errorType: 'NOT_CONFIGURED',
        recipient: customer.email.trim(),
        maskedRecipient: maskEmail(customer.email.trim()),
        providerAccountOwner: accountOwner,
      };
    }

    const transporter = await createSMTPTransporter();
    if (!transporter) {
      return {
        success: false,
        status: 'Failed',
        provider: providerName,
        error: `Could not initialize SMTP transporter for ${providerName} with current configuration`,
        errorType: 'TRANSPORTER_INITIALIZATION_FAILED',
        recipient: customer.email.trim(),
        maskedRecipient: maskEmail(customer.email.trim()),
        providerAccountOwner: accountOwner,
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
        provider: providerName,
        messageId: info.messageId,
        providerResponse: info.response || '250 OK',
        recipient: recipientEmail,
        maskedRecipient: maskEmail(recipientEmail),
        providerAccountOwner: accountOwner,
      };
    } catch (sendErr) {
      const errMsg = sendErr.message || '';
      let cleanError = errMsg;
      let errorType = 'PROVIDER_ERROR';

      if (providerName === 'Resend SMTP' && (sendErr.responseCode === 550 || /550|only send testing emails|testing email address|resend\.dev/i.test(errMsg))) {
        cleanError = `Resend Testing Mode (550): Account is currently in testing mode and can only deliver to the verified account owner (${accountOwner}). To deliver to external customer domains, verify your domain at https://resend.com/domains.`;
        errorType = 'RESEND_TESTING_MODE';
        console.warn(`[Email Notice] Customer email for inquiry "${inquiry.inquiryNumber}" rejected: ${cleanError}`);
      } else if (sendErr.responseCode === 535 || /535|authentication credentials invalid/i.test(errMsg)) {
        cleanError = providerName === 'Gmail SMTP'
          ? 'Gmail SMTP Authentication failed (535): Invalid credentials. Check your Gmail address and Google App Password.'
          : 'Resend SMTP Authentication Failure (535): Invalid Resend credentials. Please verify your SMTP_PASS / API Key.';
        errorType = 'AUTH_FAILED';
      } else if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(errMsg)) {
        cleanError = `SMTP Server Unreachable: Connection timed out attempting to reach ${config.host}:${config.port}.`;
        errorType = 'SERVER_UNREACHABLE';
      }

      console.warn(`[Email Warning] Inquiry status email failed for ${customer.email}:`, cleanError);
      return {
        success: false,
        status: 'Failed',
        provider: providerName,
        error: cleanError,
        rawError: errMsg,
        errorType,
        recipient: customer.email.trim(),
        maskedRecipient: maskEmail(customer.email.trim()),
        providerAccountOwner: accountOwner,
      };
    }
  } catch (err) {
    console.error('[Email Service Error in sendInquiryStatusEmail]:', err.message);
    return {
      success: false,
      status: 'Failed',
      provider: 'SMTP',
      error: err.message,
      errorType: 'SYSTEM_ERROR',
      recipient: customer?.email || null,
      maskedRecipient: maskEmail(customer?.email || ''),
      providerAccountOwner: 'naniabdi2504@gmail.com',
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

    const providerName = getProviderName(config);

    if (!customer?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      return {
        success: false,
        status: 'Failed',
        provider: providerName,
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
        provider: providerName,
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
        provider: providerName,
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
        provider: providerName,
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
        cleanError = providerName === 'Gmail SMTP'
          ? 'Authentication failed. Check your Gmail address and Google App Password.'
          : 'SMTP Authentication Failure (535): Invalid Resend credentials. Please verify your SMTP_PASS / API Key.';
      } else if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(errMsg)) {
        cleanError = `SMTP Server Unreachable: Connection timed out attempting to reach ${config.host}:${config.port}.`;
      }

      console.warn(`[Email Warning] Project status email failed for ${customer.email}:`, cleanError);
      return {
        success: false,
        status: 'Failed',
        provider: providerName,
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
      provider: 'SMTP',
      error: err.message,
      recipient: customer?.email || null,
      maskedRecipient: maskEmail(customer?.email || ''),
    };
  }
};

