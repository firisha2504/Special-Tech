import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import prisma from '../src/config/db.js';

const BASE_URL = 'http://localhost:5050/api';

describe('Customer Project Status Notification System Verification', () => {
  let adminToken = '';
  let adminId = '';

  let customerA = null;
  let customerAToken = '';

  let customerB = null;
  let customerBToken = '';

  let testProject = null;

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
    adminId = loginData.user.id;

    // 2. Create Customer A for project ownership
    const uniqueEmailA = `customer.a.${Date.now()}@acme-enterprises.com`;
    customerA = await prisma.customer.create({
      data: {
        email: uniqueEmailA,
        name: 'Alice Henderson',
        company: 'Acme Enterprises',
        phone: '+1-555-0101',
      },
    });

    // Login as Customer A
    const custALoginRes = await fetch(`${BASE_URL}/customer/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmailA }),
    });
    assert.strictEqual(custALoginRes.status, 200, 'Customer A login must succeed');
    const custAData = await custALoginRes.json();
    customerAToken = custAData.data.token;

    // 3. Create Customer B for data isolation verification
    const uniqueEmailB = `customer.b.${Date.now()}@beta-corp.com`;
    customerB = await prisma.customer.create({
      data: {
        email: uniqueEmailB,
        name: 'Bob Martinez',
        company: 'Beta Corp',
        phone: '+1-555-0202',
      },
    });

    // Login as Customer B
    const custBLoginRes = await fetch(`${BASE_URL}/customer/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmailB }),
    });
    assert.strictEqual(custBLoginRes.status, 200, 'Customer B login must succeed');
    const custBData = await custBLoginRes.json();
    customerBToken = custBData.data.token;

    // 4. Create a test project assigned to Customer A
    const slug = `ai-supply-chain-${Date.now()}`;
    testProject = await prisma.project.create({
      data: {
        title: 'Autonomous Supply Chain Architecture',
        slug,
        category: 'AI & Automation',
        shortDesc: 'Automated logistics routing and inventory forecasting pipeline.',
        description: 'Complete end-to-end supply chain orchestration powered by predictive ML models.',
        status: 'Pending',
        progress: 10,
        customerId: customerA.id,
        isPublished: true,
      },
    });
  });

  after(async () => {
    // Cleanup created test records
    try {
      if (testProject) {
        await prisma.notification.deleteMany({ where: { projectId: testProject.id } });
        await prisma.projectStatusHistory.deleteMany({ where: { projectId: testProject.id } });
        await prisma.project.delete({ where: { id: testProject.id } });
      }
      if (customerA) {
        await prisma.notification.deleteMany({ where: { customerId: customerA.id } });
        await prisma.customer.delete({ where: { id: customerA.id } });
      }
      if (customerB) {
        await prisma.notification.deleteMany({ where: { customerId: customerB.id } });
        await prisma.customer.delete({ where: { id: customerB.id } });
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  it('Requirement 1 & 5: Admin changes project status to Completed and records previous/new statuses in history', async () => {
    const updateRes = await fetch(`${BASE_URL}/projects/${testProject.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'Completed',
        progress: 100,
        message: 'All final QA milestones, telemetry checks, and production handovers verified.',
      }),
    });

    assert.strictEqual(updateRes.status, 200, 'Project status update must return HTTP 200');
    const resData = await updateRes.json();
    assert.strictEqual(resData.success, true);
    assert.strictEqual(resData.data.status, 'Completed');
    assert.strictEqual(resData.data.progress, 100);

    // Verify ProjectStatusHistory in response
    assert.ok(resData.history, 'History entry should be returned');
    assert.strictEqual(resData.history.previousStatus, 'Pending');
    assert.strictEqual(resData.history.newStatus, 'Completed');
    assert.strictEqual(resData.history.projectId, testProject.id);
    assert.strictEqual(resData.history.customerId, customerA.id);
    assert.strictEqual(resData.history.changedById, adminId);
    assert.strictEqual(
      resData.history.message,
      'All final QA milestones, telemetry checks, and production handovers verified.'
    );

    // Verify ProjectStatusHistory in database
    const historyInDb = await prisma.projectStatusHistory.findMany({
      where: { projectId: testProject.id },
      orderBy: { createdAt: 'desc' },
    });
    assert.strictEqual(historyInDb.length, 1);
    assert.strictEqual(historyInDb[0].previousStatus, 'Pending');
    assert.strictEqual(historyInDb[0].newStatus, 'Completed');
  });

  it('Requirement 2: Customer receives an in-app notification for the status change', async () => {
    // Check in-app notification via Customer API endpoint
    const notifRes = await fetch(`${BASE_URL}/customer/notifications`, {
      headers: {
        Authorization: `Bearer ${customerAToken}`,
      },
    });

    assert.strictEqual(notifRes.status, 200, 'Customer notifications must return HTTP 200');
    const notifData = await notifRes.json();
    assert.strictEqual(notifData.success, true);
    assert.ok(Array.isArray(notifData.data), 'Notifications must be an array');

    const statusNotif = notifData.data.find(
      (n) => n.projectId === testProject.id && n.title.includes('Completed')
    );
    assert.ok(statusNotif, 'Customer must have received an in-app notification mentioning Completed status');
    assert.strictEqual(statusNotif.customerId, customerA.id);
    assert.strictEqual(statusNotif.isRead, false, 'New notification should be unread');
    assert.ok(
      statusNotif.message.includes('All final QA milestones'),
      'Notification must include admin update message'
    );
    assert.ok(
      statusNotif.link && (statusNotif.link.includes(testProject.id) || statusNotif.link.includes(testProject.slug)),
      'Notification must link to project details'
    );

    // Test marking in-app notification as read
    const markReadRes = await fetch(`${BASE_URL}/customer/notifications/${statusNotif.id}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${customerAToken}`,
      },
    });
    assert.strictEqual(markReadRes.status, 200);
    const markReadData = await markReadRes.json();
    assert.strictEqual(markReadData.data.isRead, true);
  });

  it('Requirement 3: Email notification delivery telemetry is captured and stored with notification', async () => {
    const notifInDb = await prisma.notification.findFirst({
      where: {
        projectId: testProject.id,
        customerId: customerA.id,
      },
    });

    assert.ok(notifInDb, 'Notification record must exist in DB');
    assert.ok(notifInDb.deliveryStatus, 'Notification must record delivery status');
    assert.ok(
      ['DELIVERED', 'SENT', 'FAILED'].includes(notifInDb.deliveryStatus),
      `deliveryStatus must be valid: got ${notifInDb.deliveryStatus}`
    );
    assert.ok(notifInDb.deliveryDetails, 'Delivery details telemetry must be stored');
  });

  it('Requirement 4: Customer can view their project and updated status via Customer Dashboard', async () => {
    const projectRes = await fetch(`${BASE_URL}/customer/projects`, {
      headers: {
        Authorization: `Bearer ${customerAToken}`,
      },
    });

    assert.strictEqual(projectRes.status, 200);
    const projectsData = await projectRes.json();
    assert.strictEqual(projectsData.success, true);

    const project = projectsData.data.find((p) => p.id === testProject.id);
    assert.ok(project, 'Customer A must see their project');
    assert.strictEqual(project.status, 'Completed');
    assert.strictEqual(project.progress, 100);
    assert.ok(project.statusHistory.length >= 1, 'Project must include status history for timeline');
  });

  it('Requirement 6: Duplicate notifications are prevented when status has not changed', async () => {
    const notifsBefore = await prisma.notification.count({
      where: { projectId: testProject.id, customerId: customerA.id },
    });

    // Attempt to update with the same status 'Completed'
    const duplicateRes = await fetch(`${BASE_URL}/projects/${testProject.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'Completed',
        message: 'Repeating the completed status call.',
      }),
    });

    assert.strictEqual(duplicateRes.status, 200);
    const duplicateData = await duplicateRes.json();
    assert.strictEqual(duplicateData.statusChanged, false, 'statusChanged flag must be false');
    assert.strictEqual(duplicateData.delivery.skipped, true, 'Notification delivery should be marked skipped');

    const notifsAfter = await prisma.notification.count({
      where: { projectId: testProject.id, customerId: customerA.id },
    });

    assert.strictEqual(
      notifsAfter,
      notifsBefore,
      'No new notification must be created when status has not changed'
    );
  });

  it('Requirement 7: Customer data isolation is strictly enforced (Customer B cannot access Customer A project)', async () => {
    // Customer B attempts to access Customer A's project by ID
    const forbiddenRes = await fetch(`${BASE_URL}/customer/projects/${testProject.id}`, {
      headers: {
        Authorization: `Bearer ${customerBToken}`,
      },
    });

    assert.strictEqual(
      forbiddenRes.status,
      403,
      'Customer B attempting to access Customer A project must be rejected with HTTP 403 Forbidden'
    );

    const forbiddenData = await forbiddenRes.json();
    assert.strictEqual(forbiddenData.success, false);
    assert.ok(
      forbiddenData.message.includes('not authorized'),
      'Must explain authorization violation'
    );

    // Customer B's projects list must NOT include Customer A's project
    const custBProjectsRes = await fetch(`${BASE_URL}/customer/projects`, {
      headers: {
        Authorization: `Bearer ${customerBToken}`,
      },
    });
    assert.strictEqual(custBProjectsRes.status, 200);
    const custBProjects = await custBProjectsRes.json();
    const hasProjectA = custBProjects.data.some((p) => p.id === testProject.id);
    assert.strictEqual(hasProjectA, false, 'Customer B projects list must NOT leak Customer A project');
  });

  it('Requirement 8: Existing project management functionality continues working', async () => {
    // 1. Public projects listing
    const publicRes = await fetch(`${BASE_URL}/projects`);
    assert.strictEqual(publicRes.status, 200);
    const publicData = await publicRes.json();
    assert.strictEqual(publicData.success, true);
    assert.ok(Array.isArray(publicData.data));

    // 2. Project details by slug
    const slugRes = await fetch(`${BASE_URL}/projects/${testProject.slug}`);
    assert.strictEqual(slugRes.status, 200);
    const slugData = await slugRes.json();
    assert.strictEqual(slugData.success, true);
    assert.strictEqual(slugData.data.title, testProject.title);

    // 3. Project history endpoint
    const historyRes = await fetch(`${BASE_URL}/projects/${testProject.id}/history`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert.strictEqual(historyRes.status, 200);
    const historyData = await historyRes.json();
    assert.strictEqual(historyData.success, true);
    assert.strictEqual(historyData.data.length, 1);
    assert.strictEqual(historyData.data[0].newStatus, 'Completed');
  });
});
