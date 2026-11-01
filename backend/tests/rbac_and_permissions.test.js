import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import prisma from '../src/config/db.js';

const BASE_URL = 'http://localhost:5050/api';

describe('Role-Based Access Control (RBAC) & Permission Management Audit', () => {
  let superAdminToken = '';
  let superAdminUser = null;

  let testAdminUser = null;
  let testAdminToken = '';

  let secondAdminUser = null;
  let secondAdminToken = '';

  before(async () => {
    // 1. Authenticate primary Super Admin
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
    superAdminToken = loginData.token;
    superAdminUser = loginData.user;
  });

  after(async () => {
    // Cleanup created test users
    if (testAdminUser?.id) {
      await prisma.user.delete({ where: { id: testAdminUser.id } }).catch(() => {});
    }
    if (secondAdminUser?.id) {
      await prisma.user.delete({ where: { id: secondAdminUser.id } }).catch(() => {});
    }
  });

  it('1. Super Admin should possess isSuperAdmin=true and access all permission definitions', async () => {
    assert.strictEqual(superAdminUser.isSuperAdmin, true);
    assert.ok(Array.isArray(superAdminUser.permissions));
    assert.strictEqual(superAdminUser.permissions.length, 14);

    const res = await fetch(`${BASE_URL}/admin/permissions`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.count, 14);
    assert.ok(data.grouped['System & Security']);
    assert.ok(data.grouped['Customer & Proposals']);
  });

  it('2. Super Admin can create a new Admin account with initial granular permissions', async () => {
    const adminEmail = `inquiry.officer.${Date.now()}@specialtech.com`;
    const res = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        name: 'Inquiry Review Officer',
        email: adminEmail,
        password: 'SecureAdminPassword2026!',
        role: 'ADMIN',
        isSuperAdmin: false,
        permissions: ['manage_inquiries', 'manage_customers'],
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.email, adminEmail);
    assert.strictEqual(data.data.isSuperAdmin, false);
    assert.deepStrictEqual(data.data.permissions.sort(), ['manage_customers', 'manage_inquiries'].sort());

    testAdminUser = data.data;

    // Login as this newly created Admin
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: 'SecureAdminPassword2026!',
      }),
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    testAdminToken = loginData.token;
    assert.strictEqual(loginData.user.isSuperAdmin, false);
    assert.deepStrictEqual(loginData.user.permissions.sort(), ['manage_customers', 'manage_inquiries'].sort());
  });

  it('3. Admin can access authorized endpoints matching granted permissions', async () => {
    // Has manage_inquiries: Can read inquiries
    const resInquiries = await fetch(`${BASE_URL}/inquiries`, {
      headers: { Authorization: `Bearer ${testAdminToken}` },
    });
    assert.strictEqual(resInquiries.status, 200);
    const dataInquiries = await resInquiries.json();
    assert.strictEqual(dataInquiries.success, true);

    // Has manage_customers: Can read customers
    const resCustomers = await fetch(`${BASE_URL}/admin/customers`, {
      headers: { Authorization: `Bearer ${testAdminToken}` },
    });
    assert.strictEqual(resCustomers.status, 200);
    const dataCustomers = await resCustomers.json();
    assert.strictEqual(dataCustomers.success, true);
  });

  it('4. Admin is BLOCKED with HTTP 403 when requesting unauthorized endpoints', async () => {
    // Does NOT have manage_services (products)
    const resProducts = await fetch(`${BASE_URL}/products/admin/detail/nonexistent`, {
      headers: { Authorization: `Bearer ${testAdminToken}` },
    });
    assert.strictEqual(resProducts.status, 403);
    const dataProducts = await resProducts.json();
    assert.strictEqual(dataProducts.success, false);
    assert.ok(dataProducts.message.includes('manage_services'));

    // Does NOT have manage_projects
    const resProjects = await fetch(`${BASE_URL}/admin/projects`, {
      headers: { Authorization: `Bearer ${testAdminToken}` },
    });
    assert.strictEqual(resProjects.status, 403);
    const dataProjects = await resProjects.json();
    assert.strictEqual(dataProjects.success, false);
    assert.ok(dataProjects.message.includes('manage_projects'));

    // Does NOT have manage_system_settings
    const resSettings = await fetch(`${BASE_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${testAdminToken}` },
    });
    assert.strictEqual(resSettings.status, 403);
    const dataSettings = await resSettings.json();
    assert.strictEqual(dataSettings.success, false);
    assert.ok(dataSettings.message.includes('manage_system_settings'));
  });

  it('5. Admin CANNOT access Super Admin endpoints to create or update users', async () => {
    // Try to create another user as regular Admin
    const resCreate = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testAdminToken}`,
      },
      body: JSON.stringify({
        name: 'Malicious Admin',
        email: `hacker.${Date.now()}@example.com`,
        password: 'Password123!',
      }),
    });
    assert.strictEqual(resCreate.status, 403);
    const dataCreate = await resCreate.json();
    assert.strictEqual(dataCreate.success, false);
    assert.ok(dataCreate.message.includes('Super Admin privileges required'));
  });

  it('6. Admin CANNOT modify their own permissions or other permissions', async () => {
    const resSelfMod = await fetch(`${BASE_URL}/admin/users/${testAdminUser.id}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testAdminToken}`,
      },
      body: JSON.stringify({
        permissions: ['manage_admins', 'manage_projects'],
      }),
    });
    assert.strictEqual(resSelfMod.status, 403);
    const dataSelfMod = await resSelfMod.json();
    assert.strictEqual(dataSelfMod.success, false);
  });

  it('7. Super Admin can dynamically update an Admin permissions and changes take immediate effect', async () => {
    // Add manage_projects to testAdminUser
    const updateRes = await fetch(`${BASE_URL}/admin/users/${testAdminUser.id}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        permissions: ['manage_inquiries', 'manage_projects'],
      }),
    });
    assert.strictEqual(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.strictEqual(updateData.success, true);
    assert.deepStrictEqual(updateData.data.permissions.sort(), ['manage_inquiries', 'manage_projects'].sort());

    // Test that testAdminToken now has access to manage_projects immediately!
    const resProjects = await fetch(`${BASE_URL}/admin/projects`, {
      headers: { Authorization: `Bearer ${testAdminToken}` },
    });
    assert.strictEqual(resProjects.status, 200);
    const dataProjects = await resProjects.json();
    assert.strictEqual(dataProjects.success, true);

    // And manage_customers was revoked, so it should now be 403!
    const resCustomers = await fetch(`${BASE_URL}/admin/customers`, {
      headers: { Authorization: `Bearer ${testAdminToken}` },
    });
    assert.strictEqual(resCustomers.status, 403);
  });

  it('8. Protection Rule: Cannot deactivate or delete the last active Super Admin', async () => {
    // Attempt to deactivate primary Super Admin
    const resDeactivate = await fetch(`${BASE_URL}/admin/users/${superAdminUser.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    assert.strictEqual(resDeactivate.status, 400);
    const dataDeactivate = await resDeactivate.json();
    assert.strictEqual(dataDeactivate.success, false);
    assert.ok(dataDeactivate.message.includes('last active Super Admin'));

    // Attempt to delete primary Super Admin
    const resDelete = await fetch(`${BASE_URL}/admin/users/${superAdminUser.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(resDelete.status, 400);
    const dataDelete = await resDelete.json();
    assert.strictEqual(dataDelete.success, false);
    assert.ok(dataDelete.message.includes('delete your own') || dataDelete.message.includes('last active Super Admin'));
  });

  it('9. Database Backup export requires manage_backups permission and returns full snapshot', async () => {
    // Admin without manage_backups is rejected
    const resDeny = await fetch(`${BASE_URL}/admin/backups/export`, {
      headers: { Authorization: `Bearer ${testAdminToken}` },
    });
    assert.strictEqual(resDeny.status, 403);

    // Super Admin has permission and receives full backup
    const resExport = await fetch(`${BASE_URL}/admin/backups/export`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(resExport.status, 200);
    const dataExport = await resExport.json();
    assert.strictEqual(dataExport.success, true);
    assert.ok(dataExport.backup.summary.users >= 1);
    assert.ok(dataExport.backup.data.users);
  });

  it('10. Administrative actions are recorded in immutable audit logs', async () => {
    const resLogs = await fetch(`${BASE_URL}/admin/activity-logs?limit=20`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(resLogs.status, 200);
    const dataLogs = await resLogs.json();
    assert.strictEqual(dataLogs.success, true);

    const actions = dataLogs.data.map((l) => l.action);
    assert.ok(actions.includes('ADMIN_CREATED') || actions.includes('PERMISSIONS_UPDATED'));
  });
});
