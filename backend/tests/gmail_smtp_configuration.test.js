import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import prisma from '../src/config/db.js';
import {
  saveEmailSettings,
  verifySMTPConnection,
  getSMTPConfig,
} from '../src/services/email/emailService.js';

const BASE_URL = 'http://localhost:5050/api';

describe('Special Tech: Gmail SMTP Configuration & Multi-Provider Architecture Test Suite', () => {
  let adminToken = '';
  let originalProvider = 'resend';
  let originalSmtpPass = '';
  let originalResendPass = '';
  let originalGmailPass = '';

  before(async () => {
    // 1. Authenticate as Admin
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@specialtech.com',
        password: 'Admin@123456',
      }),
    });
    assert.strictEqual(loginRes.status, 200, 'Admin login must succeed');
    const loginData = await loginRes.json();
    adminToken = loginData.token;

    // Cache original database settings
    const cfg = await getSMTPConfig();
    originalProvider = cfg.provider || 'resend';
    const [p1, p2, p3] = await Promise.all([
      prisma.adminSetting.findUnique({ where: { key: 'smtp_pass' } }),
      prisma.adminSetting.findUnique({ where: { key: 'smtp_resend_pass' } }),
      prisma.adminSetting.findUnique({ where: { key: 'smtp_gmail_pass' } }),
    ]);
    originalSmtpPass = p1?.value || process.env.SMTP_PASS || '';
    originalResendPass = p2?.value || process.env.SMTP_PASS || '';
    originalGmailPass = p3?.value || '';
  });

  after(async () => {
    await Promise.all([
      prisma.adminSetting.upsert({
        where: { key: 'smtp_provider' },
        update: { value: originalProvider },
        create: { key: 'smtp_provider', value: originalProvider },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_pass' },
        update: { value: originalSmtpPass },
        create: { key: 'smtp_pass', value: originalSmtpPass },
      }),
      prisma.adminSetting.upsert({
        where: { key: 'smtp_resend_pass' },
        update: { value: originalResendPass },
        create: { key: 'smtp_resend_pass', value: originalResendPass },
      }),
      originalGmailPass ? prisma.adminSetting.upsert({
        where: { key: 'smtp_gmail_pass' },
        update: { value: originalGmailPass },
        create: { key: 'smtp_gmail_pass', value: originalGmailPass },
      }) : Promise.resolve(),
    ]);
  });

  it('1. Enforces RBAC permissions on POST /admin/email/settings', async () => {
    // Unauthenticated request must return 401
    const unauthRes = await fetch(`${BASE_URL}/admin/email/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'gmail' }),
    });
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must be rejected');

    // Customer token or regular user must return 403
    const customerLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@specialtech.com',
        password: 'Customer@123456',
      }),
    }).catch(() => null);

    if (customerLogin && customerLogin.status === 200) {
      const custData = await customerLogin.json();
      const custRes = await fetch(`${BASE_URL}/admin/email/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custData.token}`,
        },
        body: JSON.stringify({ provider: 'gmail' }),
      });
      assert.strictEqual(custRes.status, 403, 'Non-admin user must receive 403 Forbidden');
    }
  });

  it('2. Validates required Gmail fields (Username must be a valid email, App Password required)', async () => {
    // Missing @ in username
    const res1 = await fetch(`${BASE_URL}/admin/email/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        provider: 'gmail',
        gmailUser: 'invalidgmailaddress',
        gmailPass: 'abcd efgh ijkl mnop',
      }),
    });
    assert.strictEqual(res1.status, 400);
    const body1 = await res1.json();
    assert.strictEqual(body1.success, false);
    assert.ok(body1.message.includes('valid Gmail address'));

    // Missing App Password on empty DB
    const res2 = await fetch(`${BASE_URL}/admin/email/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        provider: 'gmail',
        gmailUser: 'specialtech.test@gmail.com',
        gmailPass: '',
      }),
    });
    // If no prior password in DB, must fail
    const currentCfg = await getSMTPConfig();
    if (!currentCfg.gmailConfig?.hasPass) {
      assert.strictEqual(res2.status, 400);
      const body2 = await res2.json();
      assert.ok(body2.message.includes('Google App Password is required'));
    }
  });

  it('3. Successfully saves Gmail SMTP settings and automatically strips spaces from Google App Password', async () => {
    const rawAppPassWithSpaces = 'abcd efgh ijkl mnop';
    const res = await fetch(`${BASE_URL}/admin/email/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        provider: 'gmail',
        gmailUser: 'specialtech.corp@gmail.com',
        gmailPass: rawAppPassWithSpaces,
        gmailFromName: 'Special Tech Global',
        gmailFromEmail: 'specialtech.corp@gmail.com',
        adminEmail: 'ops@specialtech.com',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.provider, 'gmail');
    assert.strictEqual(body.data.providerName, 'Gmail SMTP');
    assert.strictEqual(body.data.host, 'smtp.gmail.com');
    assert.strictEqual(body.data.port, 465);
    assert.strictEqual(body.data.secure, true);
    assert.strictEqual(body.data.from, 'Special Tech Global <specialtech.corp@gmail.com>');

    // Verify stored password in database has spaces stripped
    const savedSetting = await prisma.adminSetting.findUnique({
      where: { key: 'smtp_gmail_pass' },
    });
    assert.ok(savedSetting, 'smtp_gmail_pass must be stored in database');
    assert.strictEqual(savedSetting.value, 'abcdefghijklmnop', 'Spaces must be stripped from Google App Password');

    // Active key must mirror for backwards compatibility
    const activePass = await prisma.adminSetting.findUnique({
      where: { key: 'smtp_pass' },
    });
    assert.strictEqual(activePass.value, 'abcdefghijklmnop', 'Active smtp_pass must mirror sanitized password');
  });

  it('4. Preserves saved password when password field is left empty during editing', async () => {
    // Update sender display name and leave gmailPass empty
    const res = await fetch(`${BASE_URL}/admin/email/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        provider: 'gmail',
        gmailUser: 'specialtech.corp@gmail.com',
        gmailPass: '', // Empty!
        gmailFromName: 'Special Tech Enterprise',
        gmailFromEmail: 'specialtech.corp@gmail.com',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    // Verify previously saved password was preserved
    const savedSetting = await prisma.adminSetting.findUnique({
      where: { key: 'smtp_gmail_pass' },
    });
    assert.strictEqual(savedSetting.value, 'abcdefghijklmnop', 'Existing password must be preserved when empty input sent');
  });

  it('5. Secure Credential Handling: Never exposes raw password in GET /admin/email/status', async () => {
    const res = await fetch(`${BASE_URL}/admin/email/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    const data = body.data;

    // Active provider should be Gmail
    assert.strictEqual(data.activeProvider, 'gmail');
    assert.strictEqual(data.providerName, 'Gmail SMTP');
    assert.strictEqual(data.host, 'smtp.gmail.com');
    assert.strictEqual(data.port, 465);
    assert.strictEqual(data.secure, true);
    assert.strictEqual(data.credentialsConfigured, true);

    // RAW PASSWORDS MUST NEVER BE RETURNED
    assert.strictEqual(data.rawPass, undefined, 'rawPass must be undefined');
    assert.strictEqual(data.pass, undefined, 'pass must be undefined');
    assert.strictEqual(data.gmailConfig.rawPass, undefined, 'gmailConfig.rawPass must be undefined');
    assert.strictEqual(data.resendConfig.rawPass, undefined, 'resendConfig.rawPass must be undefined');

    // Masked flag hasPass must be true
    assert.strictEqual(data.hasPass, true);
    assert.strictEqual(data.gmailConfig.hasPass, true);
    assert.strictEqual(data.gmailConfig.credentialsStatus, 'CONFIGURED');
  });

  it('6. Test SMTP Connection: Returns exact required failure message on invalid Gmail credentials', async () => {
    const res = await fetch(`${BASE_URL}/admin/email/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        user: 'specialtech.corp@gmail.com',
        pass: 'invalidpassword123',
      }),
    });

    // Invalid credentials should fail authentication
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.authStatus, 'AUTH_FAILED');
    assert.strictEqual(
      body.message,
      'Authentication failed. Check your Gmail address and Google App Password.',
      'Must return exact requirement message for Gmail authentication failure'
    );
  });

  it('7. Test SMTP Connection: Returns exact required failure message on unreachable connection', async () => {
    const res = await fetch(`${BASE_URL}/admin/email/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        provider: 'gmail',
        host: 'invalid-unreachable-host.specialtech.fake',
        port: 465,
        secure: true,
        user: 'specialtech.corp@gmail.com',
        pass: 'abcdefghijklmnop',
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.authStatus, 'UNREACHABLE');
    assert.strictEqual(
      body.message,
      'Unable to connect to Gmail SMTP. Check your internet connection and SMTP settings.',
      'Must return exact requirement message for connection failure'
    );
  });

  it('8. Test Email dispatch uses configured subject and body, and records dynamic provider name in logs', async () => {
    // Send test email endpoint
    const res = await fetch(`${BASE_URL}/admin/email/send-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        toEmail: 'client.test@example.com',
      }),
    });

    // Since our test App Password is dummy ('abcdefghijklmnop'), the SMTP send will reject with auth failure
    // It should handle failure cleanly and record the audit log without crashing
    const body = await res.json();
    assert.strictEqual(res.status, 200, 'send-test endpoint returns 200 with test outcome report');
    assert.strictEqual(typeof body.success, 'boolean');

    // Verify outbound notification log recorded dynamic provider
    const latestNotification = await prisma.notification.findFirst({
      where: { channel: 'EMAIL' },
      orderBy: { createdAt: 'desc' },
    });

    assert.ok(latestNotification, 'Outbound notification record must exist');
    assert.strictEqual(latestNotification.title, 'Special Tech SMTP Configuration Test');
    assert.ok(
      latestNotification.deliveryDetails?.provider === 'Gmail SMTP' ||
      latestNotification.deliveryDetails?.provider === 'Resend SMTP',
      'Dynamic provider name must be recorded'
    );
  });

  it('9. Preserves existing Resend integration and allows seamless switching between providers', async () => {
    // Switch back to Resend
    const res = await fetch(`${BASE_URL}/admin/email/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        provider: 'resend',
        resendHost: 'smtp.resend.com',
        resendPort: '465',
        resendUser: 'resend',
        resendPass: originalResendPass || process.env.SMTP_PASS || '',
        resendFrom: 'Special Tech <onboarding@resend.dev>',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.provider, 'resend');
    assert.strictEqual(body.data.providerName, 'Resend SMTP');

    // Confirm that Gmail credentials are STILL intact in the database
    const savedGmailUser = await prisma.adminSetting.findUnique({
      where: { key: 'smtp_gmail_user' },
    });
    assert.strictEqual(savedGmailUser.value, 'specialtech.corp@gmail.com', 'Gmail user must be preserved when switching to Resend');

    const savedGmailPass = await prisma.adminSetting.findUnique({
      where: { key: 'smtp_gmail_pass' },
    });
    assert.strictEqual(savedGmailPass.value, 'abcdefghijklmnop', 'Gmail password must be preserved when switching to Resend');
  });
});
