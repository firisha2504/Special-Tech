import { describe, it } from 'node:test';
import assert from 'node:assert';
import prisma from '../src/config/db.js';

const BASE_URL = 'http://localhost:5050/api';

describe('Special Tech Core End-to-End API Integration Audit', () => {
  let adminToken = '';
  let testConversationId = '';
  let testRequirementId = '';
  let testPrototypeId = '';
  let testPrototypeVersionId = '';
  let testInquiryId = '';

  it('1. GET /api/health - should report online status and PostgreSQL connection', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'online');
    assert.ok(data.database.includes('PostgreSQL'));
  });

  it('2. GET /api/ai/status - should report active AI provider without secrets', async () => {
    const res = await fetch(`${BASE_URL}/ai/status`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.provider);
    assert.ok(data.model);
    assert.strictEqual(data.status, 'operational');
    assert.strictEqual(data.apiKey, undefined, 'API key must never be exposed publicly');
  });

  it('3. GET /api/services - should return published services from PostgreSQL', async () => {
    const res = await fetch(`${BASE_URL}/services`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.length >= 8);
    const webApp = data.data.find((s) => s.slug === 'web-applications');
    assert.ok(webApp, 'Web Applications service must be present');
  });

  it('4. POST /api/inquiries/submit (Contact Form Workflow) - should validate and record customer contact inquiries', async () => {
    const res = await fetch(`${BASE_URL}/inquiries/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Connor',
        email: 'sarah.connor@cyberdyne.org',
        phone: '+1 555-0199',
        company: 'Cyberdyne Systems',
        title: 'Direct Contact Form Submission',
        message: '[Category: Web Applications & Portals] We require a resilient data pipeline and real-time dashboard for robotics telemetry.',
        budget: '$25,000 - $50,000',
        preferredContact: 'Email',
      }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.inquiryId);
    assert.ok(data.inquiryNumber);

    // Clean up
    await prisma.inquiry.delete({ where: { id: data.inquiryId } });
    await prisma.customer.deleteMany({ where: { email: 'sarah.connor@cyberdyne.org' } });
  });

  it('5. POST /api/ai/conversations - should initialize a fresh AI discovery session', async () => {
    const sessionToken = 'sess_audit_' + Date.now();
    const res = await fetch(`${BASE_URL}/ai/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.conversationId);
    testConversationId = data.conversationId;
  });

  it('6. POST /api/ai/messages - should process customer requirements and return analyst guidance', async () => {
    assert.ok(testConversationId);
    const res = await fetch(`${BASE_URL}/ai/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: testConversationId,
        message: 'I want to build an enterprise school management system for 2,000 students with fee tracking and exams.',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.aiMessage);
    assert.ok(data.aiMessage.content.length > 30);
  });

  it('7. POST /api/ai/requirements/generate - should synthesize requirements into a specification', async () => {
    assert.ok(testConversationId);
    const res = await fetch(`${BASE_URL}/ai/requirements/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: testConversationId }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.id);
    assert.ok(data.data.projectName);
    assert.ok(data.data.overview);
    testRequirementId = data.data.id;
  });

  it('8. POST /api/prototypes/generate - should generate interactive clickable prototype', async () => {
    assert.ok(testConversationId);
    const res = await fetch(`${BASE_URL}/prototypes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: testConversationId }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.prototype);
    assert.ok(data.data.currentVersion);
    testPrototypeId = data.data.prototype.id;
    testPrototypeVersionId = data.data.currentVersion.id;
  });

  it('9. POST /api/prototypes/modify - should revise prototype version via natural language instructions', async () => {
    assert.ok(testPrototypeId);
    const res = await fetch(`${BASE_URL}/prototypes/modify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prototypeId: testPrototypeId,
        prompt: 'Change theme color to cyan and add messaging chat module',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.currentVersion.versionNumber, 2);
    testPrototypeVersionId = data.data.currentVersion.id;
  });

  it('10. POST /api/inquiries/submit - should submit customer project proposal with specification & prototype', async () => {
    const res = await fetch(`${BASE_URL}/inquiries/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Marcus Vance',
        email: 'marcus.vance@vancetech.com',
        phone: '+1 202-555-0144',
        company: 'Vance Academic Network',
        title: 'EduCloud Pro - School Management Platform',
        message: 'Ready to proceed with development of our multi-campus school management platform following the AI specification and prototype.',
        budget: '$30,000 - $50,000',
        requirementId: testRequirementId,
        prototypeVersionId: testPrototypeVersionId,
      }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.inquiryNumber);
    assert.ok(data.inquiryId);
    testInquiryId = data.inquiryId;
  });

  it('11. GET /api/inquiries/:id/pdf - should render dynamic PDF specification document', async () => {
    assert.ok(testInquiryId);
    const res = await fetch(`${BASE_URL}/inquiries/${testInquiryId}/pdf`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'application/pdf');
    const buffer = await res.arrayBuffer();
    assert.ok(buffer.byteLength > 1000, 'PDF buffer must contain binary document content');
  });

  it('12. Login admin and perform protected operations (Stats, Settings, AI Test, Audit Logs)', async () => {
    // Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@specialtech.com',
        password: 'Admin@123456',
      }),
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    adminToken = loginData.token;

    // Get Admin Dashboard Stats
    const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(statsRes.status, 200);
    const statsData = await statsRes.json();
    assert.ok(statsData.data.kpis.totalInquiries >= 1);

    // Test AI provider connection via admin endpoint
    const aiTestRes = await fetch(`${BASE_URL}/admin/ai/test`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(aiTestRes.status, 200);
    const aiTestData = await aiTestRes.json();
    assert.strictEqual(aiTestData.status, 'operational');

    // Get Admin Conversations audit list
    const convRes = await fetch(`${BASE_URL}/admin/conversations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(convRes.status, 200);
    const convData = await convRes.json();
    assert.ok(Array.isArray(convData.data));
    assert.ok(convData.count >= 1);

    // Get Inquiry details with full conversation & prototype version
    const inqDetailRes = await fetch(`${BASE_URL}/inquiries/${testInquiryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(inqDetailRes.status, 200);
    const inqDetail = await inqDetailRes.json();
    assert.ok(inqDetail.data.requirement);
    assert.ok(inqDetail.data.prototypeVersion);

    // Clean up test records
    await prisma.inquiry.delete({ where: { id: testInquiryId } });
    await prisma.prototypeVersion.deleteMany({ where: { prototypeId: testPrototypeId } });
    await prisma.prototype.delete({ where: { id: testPrototypeId } });
    await prisma.requirement.delete({ where: { id: testRequirementId } });
    await prisma.message.deleteMany({ where: { conversationId: testConversationId } });
    await prisma.conversation.delete({ where: { id: testConversationId } });
    await prisma.customer.deleteMany({ where: { email: 'marcus.vance@vancetech.com' } });
  });
});
