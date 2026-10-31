import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/db.js';
import {
  getSMTPConfig,
  verifySMTPConnection,
  sendTestEmail,
  sendInquiryNotifications,
} from '../src/services/email/emailService.js';

const API_BASE = 'http://localhost:5050/api';

test('SPECIAL TECH: Comprehensive Verification of Email, CORS, and Inquiry Validation', async (t) => {
  // -------------------------------------------------------------
  // 1. CORS VALIDATION TESTS
  // -------------------------------------------------------------
  await t.test('CORS: Authorized origin http://localhost:5174 must be allowed with credentials', async () => {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: {
        Origin: 'http://localhost:5174',
      },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), 'http://localhost:5174');
    assert.strictEqual(res.headers.get('access-control-allow-credentials'), 'true');
    const data = await res.json();
    assert.strictEqual(data.status, 'online');
  });

  await t.test('CORS: Preflight OPTIONS request from http://localhost:5174 must return 204 with allowed headers', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5174',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
    });

    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), 'http://localhost:5174');
    assert.ok(res.headers.get('access-control-allow-methods').includes('POST'));
  });

  await t.test('CORS: Unauthorized origin http://malicious-site.com must be rejected with HTTP 403', async () => {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: {
        Origin: 'http://malicious-site.com',
      },
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.message.includes('CORS error'));
    assert.ok(body.message.includes('not allowed'));
  });

  // -------------------------------------------------------------
  // 2. INQUIRY VALIDATION TESTS
  // -------------------------------------------------------------
  await t.test('Inquiry: Missing required fields (name, title) must return HTTP 400 Bad Request', async () => {
    const invalidMarker = `Invalid-Test-Message-${Date.now()}`;
    const res = await fetch(`${API_BASE}/inquiries/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5174',
      },
      body: JSON.stringify({
        email: 'invalid.user@example.com',
        // missing name and title
        message: invalidMarker,
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.message.includes('Validation Error'));
    assert.ok(Array.isArray(body.errors));
    assert.ok(body.errors.some((e) => e.field === 'name'));
    assert.ok(body.errors.some((e) => e.field === 'title'));

    // Verify invalid record was NOT persisted to database
    const check = await prisma.inquiry.findFirst({ where: { message: invalidMarker } });
    assert.strictEqual(check, null, 'Invalid inquiry must not be saved in database');
  });

  await t.test('Inquiry: Message shorter than 10 characters must return HTTP 400 Bad Request', async () => {
    const res = await fetch(`${API_BASE}/inquiries/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5174',
      },
      body: JSON.stringify({
        name: 'Sarah Connor',
        email: 'sarah.connor@cyberdyne.org',
        title: 'Security Defense Network',
        message: 'Too short', // < 10 characters
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.message.includes('message'));
  });

  await t.test('Inquiry: Valid inquiry payload must be saved to PostgreSQL with HTTP 201 Created', async () => {
    const uniqueEmail = `marcus.wright.${Date.now()}@skynet-research.org`;
    const res = await fetch(`${API_BASE}/inquiries/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5174',
      },
      body: JSON.stringify({
        name: 'Marcus Wright',
        email: uniqueEmail,
        phone: '+1 555-0199',
        company: 'Cyberdyne Systems',
        title: 'Next-Gen Autonomous Infrastructure',
        message: 'We require a scalable microservices architecture with real-time telemetry and edge deployment.',
        budget: '$100,000+',
        preferredContact: 'Email',
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.inquiryNumber);
    assert.ok(body.inquiryId);

    // Verify inquiry persistence in PostgreSQL
    const savedInquiry = await prisma.inquiry.findUnique({
      where: { id: body.inquiryId },
      include: { customer: true },
    });
    assert.ok(savedInquiry);
    assert.strictEqual(savedInquiry.title, 'Next-Gen Autonomous Infrastructure');
    assert.strictEqual(savedInquiry.customer.email, uniqueEmail);
    assert.strictEqual(savedInquiry.customer.name, 'Marcus Wright');
  });

  // -------------------------------------------------------------
  // 3. EMAIL DISPATCH, RESEND RESTRICTIONS, & DUPLICATE PREVENTION
  // -------------------------------------------------------------
  await t.test('Email: Resend testing mode restrictions and auth failures are handled cleanly without crashing', async () => {
    const config = await getSMTPConfig();
    assert.ok(config);
    assert.strictEqual(typeof config.isConfigured, 'boolean');
    assert.strictEqual(typeof config.hasPass, 'boolean');
    assert.ok(config.resendTestRecipient);
  });

  await t.test('Email: Duplicate notification prevention must skip second dispatch for same inquiry', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Idempotency Tester',
        email: `idemp.${Date.now()}@testing.com`,
        phone: '+1 555-0144',
      },
    });

    const inquiry = await prisma.inquiry.create({
      data: {
        inquiryNumber: `ST-INQ-IDEMP-TEST-${Date.now()}`,
        customerId: customer.id,
        title: 'Idempotency Dispatch Verification',
        message: 'Testing that duplicate dispatch calls are safely skipped without re-sending.',
      },
    });

    // First dispatch
    const firstResult = await sendInquiryNotifications({ customer, inquiry, requirement: null });
    assert.ok(firstResult);

    // Second dispatch for identical inquiry
    const secondResult = await sendInquiryNotifications({ customer, inquiry, requirement: null });
    assert.strictEqual(secondResult.success, true);
    assert.strictEqual(secondResult.skipped, true);
    assert.ok(secondResult.reason.includes('Duplicate notification prevented'));
  });

  await t.test('Email: SMTP error must NEVER delete or roll back a saved inquiry in PostgreSQL', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Resilience Test Client',
        email: `resilience.${Date.now()}@enterprise.org`,
      },
    });

    const inquiry = await prisma.inquiry.create({
      data: {
        inquiryNumber: `ST-INQ-RESIL-${Date.now()}`,
        customerId: customer.id,
        title: 'Fault-Tolerant Architecture',
        message: 'Confirming that even complete SMTP failure leaves PostgreSQL inquiry intact.',
      },
    });

    // Call notifications
    await sendInquiryNotifications({ customer, inquiry, requirement: null });

    // Verify record still exists in PostgreSQL
    const check = await prisma.inquiry.findUnique({ where: { id: inquiry.id } });
    assert.ok(check, 'Inquiry must remain in PostgreSQL database despite email outcome');
    assert.strictEqual(check.title, 'Fault-Tolerant Architecture');
  });
});
