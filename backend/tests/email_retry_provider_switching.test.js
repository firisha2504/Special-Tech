import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import prisma from '../src/config/db.js';
import { getSMTPConfig, retryNotificationEmail } from '../src/services/email/emailService.js';

const BASE_URL = 'http://localhost:5050/api';

describe('Special Tech: Email Retry After SMTP Provider Switching Test Suite', () => {
  let adminToken = '';
  let originalProvider = 'resend';
  let originalSmtpPass = '';
  let originalResendPass = '';
  let originalGmailPass = '';

  const testInquiryNumber = 'ST-INQ-2026-0045';
  const testCustomerEmail = 'firaabdi2504@gmail.com';
  const testNotifId = '3ab22602-2f28-4c08-87e1-2982bfb0372a';

  before(async () => {
    // 1. Authenticate as Administrator
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
    const validAppPass = (p3?.value && p3.value !== 'invalid_pass_xyz') ? p3.value : (process.env.GMAIL_APP_PASSWORD || '');
    originalGmailPass = validAppPass;

    // Reset ST-INQ-2026-0045 notification to failed Resend state for test idempotency
    const errText = "Resend Testing Mode (550): Account is currently in testing mode and can only deliver to the verified account email (naniabdi2504@gmail.com). To send to external customer domains, verify your domain at https://resend.com/domains.";
    await prisma.notification.update({
      where: { id: testNotifId },
      data: {
        deliveryStatus: "FAILED",
        message: `Status update email delivery failed for ${testCustomerEmail}: ${errText}`,
        deliveryDetails: {
          provider: "Resend SMTP",
          originalProvider: "Resend SMTP",
          attemptAt: "2026-11-01T16:25:47.408Z",
          inquiryId: "46d5d583-eb15-4b78-8cc0-24bdf7a6a4df",
          newStatus: "UNDER_REVIEW",
          previousStatus: "COMPLETED",
          customerId: "7d760a9a-fba8-419e-ab22-c54b80693fc3",
          errorMessage: errText,
          errorType: "RESEND_TESTING_MODE",
          inquiryNumber: testInquiryNumber,
          deliveryStatus: "FAILED",
          recipientEmail: testCustomerEmail,
          maskedRecipientEmail: "f***4@gmail.com",
          providerAccountOwner: "naniabdi2504@gmail.com",
          notificationType: "inquiry_status_change",
          providerMessageId: null,
          attempts: [
            {
              attemptNumber: 1,
              attemptAt: "2026-11-01T16:25:47.408Z",
              provider: "Resend SMTP",
              deliveryStatus: "FAILED",
              errorMessage: errText,
              errorType: "RESEND_TESTING_MODE",
              recipientEmail: testCustomerEmail,
              providerMessageId: null,
            },
          ],
        },
      },
    });

    await prisma.inquiry.update({
      where: { id: "46d5d583-eb15-4b78-8cc0-24bdf7a6a4df" },
      data: { status: "UNDER_REVIEW" },
    });
  });

  after(async () => {
    // Restore original settings
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
      prisma.adminSetting.upsert({
        where: { key: 'smtp_gmail_pass' },
        update: { value: originalGmailPass },
        create: { key: 'smtp_gmail_pass', value: originalGmailPass },
      }),
    ]);
  });

  it('1. Failed Resend notification exists for ST-INQ-2026-0045 with accurate customer recipient', async () => {
    const notif = await prisma.notification.findUnique({
      where: { id: testNotifId },
      include: { customer: true },
    });

    assert.ok(notif, 'Notification record must exist');
    assert.strictEqual(notif.deliveryStatus, 'FAILED', 'Initial state must be FAILED');
    assert.strictEqual(notif.channel, 'EMAIL', 'Notification channel must be EMAIL');

    const details = notif.deliveryDetails || {};
    assert.strictEqual(details.recipientEmail, testCustomerEmail, 'Customer email must be firaabdi2504@gmail.com');
    assert.strictEqual(details.inquiryNumber, testInquiryNumber, 'Inquiry number must be ST-INQ-2026-0045');
    assert.ok(
      details.errorMessage && details.errorMessage.includes('Resend Testing Mode'),
      'Error message must clearly identify Resend Testing Mode (550)'
    );

    // Verify customer vs account owner separation
    assert.notStrictEqual(
      details.recipientEmail,
      details.providerAccountOwner || 'naniabdi2504@gmail.com',
      'Customer recipient must never be equal to provider account owner'
    );
  });

  it('2. Switching active SMTP provider to Gmail saves and activates Gmail SMTP configuration', async () => {
    const saveRes = await fetch(`${BASE_URL}/admin/email/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        provider: 'gmail',
        gmailUser: 'nanishaabdi2504@gmail.com',
        gmailPass: originalGmailPass || process.env.GMAIL_APP_PASSWORD || '',
        gmailFromName: 'Special Tech SMTP',
        gmailFromEmail: 'nanishaabdi2504@gmail.com',
      }),
    });

    assert.strictEqual(saveRes.status, 200, 'Saving Gmail settings must succeed');
    const saveData = await saveRes.json();
    assert.strictEqual(saveData.success, true);
    assert.strictEqual(saveData.data.provider, 'gmail');
    assert.strictEqual(saveData.data.providerName, 'Gmail SMTP');

    // Verify getSMTPConfig returns Gmail as active
    const activeCfg = await getSMTPConfig();
    assert.strictEqual(activeCfg.provider, 'gmail');
    assert.strictEqual(activeCfg.providerName, 'Gmail SMTP');
    assert.strictEqual(activeCfg.isConfigured, true);
  });

  it('3. Retrying failed notification via POST /api/admin/email/retry-notification/:id dispatches via active Gmail provider', async () => {
    const inqBefore = await prisma.inquiry.findUnique({
      where: { inquiryNumber: testInquiryNumber },
    });
    assert.strictEqual(inqBefore.status, 'UNDER_REVIEW', 'Inquiry must be UNDER_REVIEW before retry');

    const retryRes = await fetch(`${BASE_URL}/admin/email/retry-notification/${testNotifId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const retryData = await retryRes.json();
    assert.strictEqual(retryRes.status, 200, `Retry must succeed with 200: ${JSON.stringify(retryData)}`);
    assert.strictEqual(retryData.success, true);
    assert.strictEqual(retryData.delivery.provider, 'Gmail SMTP', 'Must use active Gmail SMTP provider');
    assert.strictEqual(retryData.delivery.recipient, testCustomerEmail, 'Must send to actual customer email');
    assert.ok(retryData.delivery.messageId, 'Must return provider message ID from Gmail');

    // Verify Inquiry status remains UNDER_REVIEW
    const inqAfter = await prisma.inquiry.findUnique({
      where: { inquiryNumber: testInquiryNumber },
    });
    assert.strictEqual(inqAfter.status, 'UNDER_REVIEW', 'Inquiry status must remain Under Review after retry');

    // Verify Notification record updated in database
    const updatedNotif = await prisma.notification.findUnique({
      where: { id: testNotifId },
    });
    assert.strictEqual(updatedNotif.deliveryStatus, 'SENT', 'Notification deliveryStatus must be updated to SENT');
    assert.strictEqual(updatedNotif.deliveryDetails.provider, 'Gmail SMTP', 'Delivery details must record Gmail SMTP');
    assert.strictEqual(updatedNotif.deliveryDetails.originalProvider, 'Resend SMTP', 'Original provider must record Resend SMTP');
    assert.ok(updatedNotif.deliveryDetails.providerMessageId, 'Must record actual provider message ID');
    assert.strictEqual(updatedNotif.deliveryDetails.recipientEmail, testCustomerEmail);
  });

  it('4. Audit history preserves previous Resend failure alongside successful Gmail retry attempt', async () => {
    const notif = await prisma.notification.findUnique({
      where: { id: testNotifId },
    });

    const details = notif.deliveryDetails || {};
    assert.ok(Array.isArray(details.attempts), 'deliveryDetails.attempts must be an array');
    assert.ok(details.attempts.length >= 2, 'Must record at least two attempts in audit history');

    // Attempt 1: Resend failure
    const attempt1 = details.attempts[0];
    assert.strictEqual(attempt1.provider, 'Resend SMTP', 'Attempt 1 provider must be Resend SMTP');
    assert.strictEqual(attempt1.deliveryStatus, 'FAILED', 'Attempt 1 status must be FAILED');
    assert.ok(attempt1.errorMessage && attempt1.errorMessage.includes('Resend Testing Mode'), 'Attempt 1 error preserved');

    // Attempt 2: Gmail success
    const attempt2 = details.attempts[details.attempts.length - 1];
    assert.strictEqual(attempt2.provider, 'Gmail SMTP', 'Attempt 2 provider must be Gmail SMTP');
    assert.strictEqual(attempt2.deliveryStatus, 'SENT', 'Attempt 2 status must be SENT');
    assert.ok(attempt2.providerMessageId, 'Attempt 2 must include Gmail messageId');
  });

  it('5. Duplicate retry prevention returns 409 Conflict and blocks duplicate email dispatches', async () => {
    // Retry via notification endpoint
    const retryRes1 = await fetch(`${BASE_URL}/admin/email/retry-notification/${testNotifId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.strictEqual(retryRes1.status, 409, 'Must return 409 Conflict for already sent notification');
    const data1 = await retryRes1.json();
    assert.strictEqual(data1.alreadyDelivered, true);
    assert.ok(data1.message.includes('Duplicate dispatch is prevented'));

    // Retry via inquiry endpoint
    const inq = await prisma.inquiry.findUnique({
      where: { inquiryNumber: testInquiryNumber },
    });

    const retryRes2 = await fetch(`${BASE_URL}/inquiries/${inq.id}/retry-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.strictEqual(retryRes2.status, 409, 'Must return 409 Conflict via inquiry retry route as well');
    const data2 = await retryRes2.json();
    assert.strictEqual(data2.alreadyDelivered, true);
  });

  it('6. Does not silently fall back to Resend if active provider fails authentication', async () => {
    // Temporarily set active provider to an unconfigured or invalid state
    const failConfig = {
      provider: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: 'nanishaabdi2504@gmail.com',
      pass: 'invalid_app_password_999',
    };

    const notif = await prisma.notification.create({
      data: {
        customerId: (await prisma.customer.findUnique({ where: { email: testCustomerEmail } })).id,
        title: 'Temporary Test Auth Failure Notification',
        message: 'Testing auth failure behavior',
        type: 'inquiry_status_change',
        channel: 'EMAIL',
        deliveryStatus: 'FAILED',
        deliveryDetails: {
          recipientEmail: testCustomerEmail,
          inquiryNumber: testInquiryNumber,
          provider: 'Resend SMTP',
          errorMessage: 'Original Resend failure',
        },
      },
    });

    try {
      // Save broken password for Gmail
      await prisma.adminSetting.upsert({
        where: { key: 'smtp_gmail_pass' },
        update: { value: 'invalid_pass_xyz' },
        create: { key: 'smtp_gmail_pass', value: 'invalid_pass_xyz' },
      });

      const retryRes = await fetch(`${BASE_URL}/admin/email/retry-notification/${notif.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assert.strictEqual(retryRes.status, 400, 'Must return 400 Bad Request on provider failure');
      const retryData = await retryRes.json();
      assert.strictEqual(retryData.success, false);
      assert.ok(
        retryData.message.includes('Authentication failed') || retryData.message.includes('535') || retryData.message.includes('Gmail'),
        'Must report the actual Gmail authentication error without silently switching to Resend'
      );
    } finally {
      // Always restore valid Gmail password immediately
      await prisma.adminSetting.upsert({
        where: { key: 'smtp_gmail_pass' },
        update: { value: originalGmailPass },
        create: { key: 'smtp_gmail_pass', value: originalGmailPass },
      });
      // Clean up temporary test notification
      await prisma.notification.delete({ where: { id: notif.id } }).catch(() => {});
    }
  });

  it('7. GET /api/inquiries/:id includes latestEmailNotification with customer recipient and provider details', async () => {
    const inq = await prisma.inquiry.findUnique({
      where: { inquiryNumber: testInquiryNumber },
    });

    const res = await fetch(`${BASE_URL}/inquiries/${inq.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.latestEmailNotification, 'Must include latestEmailNotification object');
    assert.strictEqual(data.data.latestEmailNotification.deliveryStatus, 'SENT');
    assert.strictEqual(data.data.latestEmailNotification.deliveryDetails.provider, 'Gmail SMTP');
    assert.strictEqual(data.data.latestEmailNotification.deliveryDetails.recipientEmail, testCustomerEmail);
  });
});
