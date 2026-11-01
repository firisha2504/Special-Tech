import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import prisma from '../src/config/db.js';

const BASE_URL = 'http://localhost:5050/api';

describe('Admin Email & Resend SMTP Service Dashboard Enhancement Verification', () => {
  let adminToken = '';
  let previousProvider = 'gmail';

  before(async () => {
    const cur = await prisma.adminSetting.findUnique({ where: { key: 'smtp_provider' } });
    previousProvider = cur?.value || 'gmail';
    await prisma.adminSetting.upsert({
      where: { key: 'smtp_provider' },
      update: { value: 'resend' },
      create: { key: 'smtp_provider', value: 'resend' },
    });

    // Authenticate as Admin
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
  });

  after(async () => {
    await prisma.adminSetting.upsert({
      where: { key: 'smtp_provider' },
      update: { value: previousProvider },
      create: { key: 'smtp_provider', value: previousProvider },
    });
  });

  it('1. Returns consistent 4-stage operational statuses with protocol and latency from GET /admin/email/status', async () => {
    const res = await fetch(`${BASE_URL}/admin/email/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    const data = body.data;

    // Requirement 1 & 2: Consistent host and port configuration
    assert.strictEqual(data.host, 'smtp.resend.com');
    assert.strictEqual(data.port, 465);
    assert.strictEqual(data.secure, true);
    assert.ok(data.protocol.includes('SSL'), 'Protocol must be SSL for port 465');

    // Requirement 3: Separate distinct operational statuses
    assert.ok(['CONFIGURED', 'NOT_CONFIGURED'].includes(data.credentialsStatus), 'Stage 1: Credentials status');
    assert.ok(['VERIFIED', 'FAILED', 'UNTESTED', 'AUTH_FAILED', 'UNREACHABLE'].includes(data.authStatus), 'Stage 2: Auth handshake status');
    assert.ok(['ACCEPTED', 'REJECTED', 'NOT_SENT', 'UNTESTED'].includes(data.testEmailStatus), 'Stage 3: Test email status');
    assert.ok(['DELIVERED', 'ACCEPTED_IN_TRANSIT', 'FAILED', 'UNCONFIRMED', 'NOT_SENT'].includes(data.deliveryStatus), 'Stage 4: Delivery status');

    // Requirement 6 & 7: Resend testing-mode awareness
    assert.strictEqual(data.isResendTestingMode, true);
    assert.strictEqual(data.resendPermittedRecipient, 'naniabdi2504@gmail.com');

    // Requirement 9: Never expose raw passwords or api keys
    assert.strictEqual(data.rawPass, undefined, 'Must NEVER return rawPass');
    assert.ok(data.user.includes('***') || data.user.length < 10, 'Username should be safe');
  });

  it('2. Performs live SMTP socket authentication handshake via POST /admin/email/test-connection', async () => {
    let res = null;
    let data = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 1500));
      res = await fetch(`${BASE_URL}/admin/email/test-connection`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      data = await res.json();
      if (res.status === 200 && data.success) break;
    }
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.status, 'connected');
    assert.strictEqual(data.authStatus, 'VERIFIED');
    assert.strictEqual(data.port, 465);
    assert.strictEqual(data.secure, true);
    assert.ok(typeof data.latencyMs === 'number' && data.latencyMs > 0, 'Latency in ms must be recorded');
    assert.ok(data.verifiedAt, 'Timestamp must be recorded');
  });

  it('3. Outbound email delivery logs are retrieved via GET /admin/email/logs', async () => {
    const res = await fetch(`${BASE_URL}/admin/email/logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data), 'Logs must be returned as an array');
    assert.strictEqual(typeof data.count, 'number');

    // Each log record must belong to channel EMAIL
    for (const log of data.data) {
      assert.strictEqual(log.channel, 'EMAIL');
      assert.ok(log.id);
      assert.ok(log.deliveryStatus);
    }
  });

  it('4. Prevents duplicate send if notification is already SENT or DELIVERED via POST /admin/email/retry-notification/:id', async () => {
    // Find an existing SENT notification or create one for test
    let testSentNotif = await prisma.notification.findFirst({
      where: { channel: 'EMAIL', deliveryStatus: 'SENT' },
    });

    if (!testSentNotif) {
      testSentNotif = await prisma.notification.create({
        data: {
          title: 'Test Email Already Delivered',
          message: 'Already sent to recipient.',
          type: 'test_email',
          channel: 'EMAIL',
          deliveryStatus: 'SENT',
          deliveryDetails: {
            recipientEmail: 'naniabdi2504@gmail.com',
            providerMessageId: '<test-delivered-123@resend.dev>',
            deliveryStatus: 'SENT',
          },
        },
      });
    }

    const retryRes = await fetch(`${BASE_URL}/admin/email/retry-notification/${testSentNotif.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(retryRes.status, 409, 'Must return 409 Conflict for already sent email');
    const retryData = await retryRes.json();
    assert.strictEqual(retryData.alreadyDelivered, true);
    assert.ok(retryData.message.includes('already accepted or delivered'));
  });

  it('5. Retries a failed notification and records updated telemetry in PostgreSQL', async () => {
    // Create a mock failed notification for the verified recipient
    const failedNotif = await prisma.notification.create({
      data: {
        title: 'Mock Failed Email',
        message: 'Initial attempt failed due to network glitch.',
        type: 'test_email',
        channel: 'EMAIL',
        deliveryStatus: 'FAILED',
        deliveryDetails: {
          recipientEmail: 'naniabdi2504@gmail.com',
          errorMessage: 'Temporary connection drop',
          deliveryStatus: 'FAILED',
        },
      },
    });

    const retryRes = await fetch(`${BASE_URL}/admin/email/retry-notification/${failedNotif.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(retryRes.status, 200, 'Retry must succeed for valid recipient');
    const retryData = await retryRes.json();
    assert.strictEqual(retryData.success, true);
    assert.ok(retryData.delivery?.messageId, 'Provider message ID must be returned');

    // Verify DB updated
    const updated = await prisma.notification.findUnique({
      where: { id: failedNotif.id },
    });
    assert.strictEqual(updated.deliveryStatus, 'SENT');
    assert.ok(updated.deliveryDetails?.providerMessageId);
    assert.ok(updated.deliveryDetails?.retriedAt);

    // Clean up test record
    await prisma.notification.delete({ where: { id: failedNotif.id } });
  });
});
