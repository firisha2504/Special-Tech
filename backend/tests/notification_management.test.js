import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/db.js';
import { createNotification } from '../src/services/notification/notificationService.js';

const BASE_URL = 'http://localhost:5050/api';

describe('Notification Management System & RBAC Authorization Audit', () => {
  let superAdminToken = '';
  let superAdminId = '';
  let regularAdminToken = '';
  let regularAdminId = '';
  const regularAdminEmail = `test.admin.notif.${Date.now()}@specialtech.com`;

  let testNotificationId1 = '';
  let testNotificationId2 = '';
  let testNotificationId3 = '';
  let userBNotificationId = '';

  before(async () => {
    // 1. Authenticate Super Admin
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@specialtech.com',
        password: 'Admin@123456',
      }),
    });
    assert.strictEqual(loginRes.status, 200, 'Super admin login must succeed');
    const loginData = await loginRes.json();
    superAdminToken = loginData.token;
    superAdminId = loginData.user.id;

    // 2. Create a secondary regular Admin User to test data isolation
    const hash = await bcrypt.hash('TestAdmin@123456', 10);
    const regularUser = await prisma.user.create({
      data: {
        email: regularAdminEmail,
        passwordHash: hash,
        name: 'Secondary Admin Auditor',
        role: 'ADMIN',
        isSuperAdmin: false,
        isActive: true,
      },
    });
    regularAdminId = regularUser.id;

    // Authenticate secondary admin
    const adminBLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regularAdminEmail,
        password: 'TestAdmin@123456',
      }),
    });
    assert.strictEqual(adminBLoginRes.status, 200);
    const adminBData = await adminBLoginRes.json();
    regularAdminToken = adminBData.token;
  });

  after(async () => {
    // Clean up test data
    if (regularAdminId) {
      await prisma.notification.deleteMany({
        where: { userId: regularAdminId },
      });
      await prisma.user.deleteMany({
        where: { id: regularAdminId },
      });
    }
    if (testNotificationId1 || testNotificationId2 || testNotificationId3) {
      await prisma.notification.deleteMany({
        where: {
          id: {
            in: [testNotificationId1, testNotificationId2, testNotificationId3].filter(Boolean),
          },
        },
      });
    }
  });

  it('1. Setup Test Notifications: Seed notifications scoped to Super Admin and Regular Admin', async () => {
    // Create notifications for Super Admin
    const notif1 = await prisma.notification.create({
      data: {
        userId: superAdminId,
        title: 'System Deployment Notification #1',
        message: 'Telemetry ingestion node 01 upgraded successfully.',
        type: 'system',
        isRead: false,
        link: '/admin?tab=overview',
      },
    });
    testNotificationId1 = notif1.id;

    const notif2 = await prisma.notification.create({
      data: {
        userId: superAdminId,
        title: 'Project Proposal Review #2',
        message: 'New enterprise cloud migration scope available.',
        type: 'inquiry',
        isRead: false,
        link: '/admin?tab=inquiries',
      },
    });
    testNotificationId2 = notif2.id;

    const notif3 = await prisma.notification.create({
      data: {
        userId: superAdminId,
        title: 'Security Notice #3',
        message: 'Firewall rules updated.',
        type: 'security',
        isRead: true,
        link: '/admin?tab=settings',
      },
    });
    testNotificationId3 = notif3.id;

    // Create private notification for Regular Admin (User B)
    const notifB = await prisma.notification.create({
      data: {
        userId: regularAdminId,
        title: 'Confidential Task for Admin B',
        message: 'Only visible to Secondary Admin Auditor.',
        type: 'info',
        isRead: false,
      },
    });
    userBNotificationId = notifB.id;

    assert.ok(testNotificationId1 && testNotificationId2 && testNotificationId3 && userBNotificationId);
  });

  it('2. GET /api/admin/notifications - should return notifications with unreadCount and totalCount', async () => {
    const res = await fetch(`${BASE_URL}/admin/notifications`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(typeof data.unreadCount === 'number');
    assert.ok(typeof data.totalCount === 'number');
    assert.ok(data.unreadCount >= 2, 'Must have at least 2 unread seeded notifications');

    // Super Admin should see their notification
    const found = data.data.find((n) => n.id === testNotificationId1);
    assert.ok(found, 'Super admin should receive their seeded notification');
  });

  it('3. Filters Verification: all, unread, and read query filters work correctly', async () => {
    // Unread filter
    const unreadRes = await fetch(`${BASE_URL}/admin/notifications?filter=unread`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(unreadRes.status, 200);
    const unreadData = await unreadRes.json();
    assert.ok(unreadData.data.every((n) => n.isRead === false), 'All returned notifications must have isRead=false');
    assert.ok(unreadData.data.some((n) => n.id === testNotificationId1));

    // Read filter
    const readRes = await fetch(`${BASE_URL}/admin/notifications?filter=read`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(readRes.status, 200);
    const readData = await readRes.json();
    assert.ok(readData.data.every((n) => n.isRead === true), 'All returned notifications must have isRead=true');
    assert.ok(readData.data.some((n) => n.id === testNotificationId3));
  });

  it('4. Individual Mark as Read: PATCH /api/admin/notifications/:id/read updates status and unreadCount', async () => {
    const res = await fetch(`${BASE_URL}/admin/notifications/${testNotificationId1}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, 'Notification marked as read');
    assert.strictEqual(data.data.isRead, true);

    // Verify in database directly
    const dbNotif = await prisma.notification.findUnique({
      where: { id: testNotificationId1 },
    });
    assert.strictEqual(dbNotif.isRead, true, 'isRead must be persistently saved in PostgreSQL');
  });

  it('5. Persistence: Read status survives re-fetching / simulated page refresh', async () => {
    const res = await fetch(`${BASE_URL}/admin/notifications?filter=unread`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const stillUnread = data.data.find((n) => n.id === testNotificationId1);
    assert.strictEqual(stillUnread, undefined, 'Marked notification must no longer appear in unread list');
  });

  it('6. Mark All as Read: PATCH /api/admin/notifications/read-all updates all user notifications', async () => {
    const res = await fetch(`${BASE_URL}/admin/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.unreadCount, 0, 'Unread count must be 0 after marking all as read');

    // Verify notification 2 is now marked read
    const dbNotif2 = await prisma.notification.findUnique({
      where: { id: testNotificationId2 },
    });
    assert.strictEqual(dbNotif2.isRead, true);
  });

  it('7. Deletion: DELETE /api/admin/notifications/:id removes notification from list', async () => {
    const res = await fetch(`${BASE_URL}/admin/notifications/${testNotificationId1}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);

    // Verify deleted from PostgreSQL
    const deletedDb = await prisma.notification.findUnique({
      where: { id: testNotificationId1 },
    });
    assert.strictEqual(deletedDb, null, 'Notification must be deleted from database');
    testNotificationId1 = '';
  });

  it('8. Data Isolation: Regular Admin CANNOT read or see another user private notification', async () => {
    const res = await fetch(`${BASE_URL}/admin/notifications`, {
      headers: { Authorization: `Bearer ${regularAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    // Regular admin should see their own notification
    assert.ok(data.data.some((n) => n.id === userBNotificationId));
    // Regular admin must NOT see Super Admin's private notifications
    assert.ok(!data.data.some((n) => n.id === testNotificationId2));
  });

  it('9. Security Authorization: Regular Admin CANNOT modify or delete another user notification', async () => {
    // Attempt to mark Super Admin's notification as read
    const patchRes = await fetch(`${BASE_URL}/admin/notifications/${testNotificationId2}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${regularAdminToken}` },
    });
    assert.strictEqual(patchRes.status, 403, 'Regular admin must be rejected with HTTP 403 Forbidden');
    const patchData = await patchRes.json();
    assert.strictEqual(patchData.success, false);

    // Attempt to delete Super Admin's notification
    const deleteRes = await fetch(`${BASE_URL}/admin/notifications/${testNotificationId2}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${regularAdminToken}` },
    });
    assert.strictEqual(deleteRes.status, 403, 'Regular admin must be rejected with HTTP 403 Forbidden');
  });

  it('10. Deduplication: createNotification prevents inserting duplicate notifications within threshold', async () => {
    const notifA = await createNotification({
      title: 'Duplicate Prevention Test',
      message: 'Checking that rapid duplicate dispatches are suppressed.',
      type: 'info',
      link: '/admin?test=dedup',
      userId: superAdminId,
    });
    assert.ok(notifA);

    const notifB = await createNotification({
      title: 'Duplicate Prevention Test',
      message: 'Checking that rapid duplicate dispatches are suppressed.',
      type: 'info',
      link: '/admin?test=dedup',
      userId: superAdminId,
    });
    assert.ok(notifB);

    // The second call must return the existing record and not create a duplicate
    assert.strictEqual(notifA.id, notifB.id, 'Duplicate notification must be suppressed');

    // Clean up
    await prisma.notification.deleteMany({
      where: { id: notifA.id },
    });
  });

  it('11. Integration: Customer inquiry submission automatically dispatches persistent notification', async () => {
    const countBefore = await prisma.notification.count({
      where: { type: 'inquiry' },
    });

    const res = await fetch(`${BASE_URL}/inquiries/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alexander Hamilton',
        email: `hamilton.${Date.now()}@treasury.gov`,
        company: 'Bank of New York',
        title: 'Core Ledger Notification Integration Test',
        message: 'Detailed specifications for real-time ledger sync and automated notification pipeline.',
        budget: '$50,000+',
      }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);

    const countAfter = await prisma.notification.count({
      where: { type: 'inquiry' },
    });
    assert.ok(countAfter > countBefore, 'Inquiry submission must create an in-app notification in PostgreSQL');

    // Clean up created inquiry, notifications, & customer
    if (data.inquiryId) {
      await prisma.notification.deleteMany({
        where: { link: { contains: data.inquiryId } },
      });
      const inq = await prisma.inquiry.findUnique({ where: { id: data.inquiryId } });
      await prisma.inquiry.deleteMany({
        where: { id: data.inquiryId },
      });
      if (inq && inq.customerId) {
        await prisma.customer.deleteMany({ where: { id: inq.customerId } });
      }
    }
  });
});
