import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import prisma from '../src/config/db.js';

const BASE_URL = 'http://localhost:5050/api';

describe('Customer Project Email Notification System Verification', () => {
  let adminToken = '';
  let adminUser = null;
  let verifiedCustomer = null;
  let externalCustomer = null;
  let verifiedProject = null;
  let externalProject = null;

  let originalProvider = 'resend';

  before(async () => {
    // 0. Ensure Resend provider is active for Resend testing mode test suite
    const currentProviderSetting = await prisma.adminSetting.findUnique({ where: { key: 'smtp_provider' } });
    originalProvider = currentProviderSetting?.value || 'resend';
    await prisma.adminSetting.upsert({
      where: { key: 'smtp_provider' },
      update: { value: 'resend' },
      create: { key: 'smtp_provider', value: 'resend' },
    });

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
    adminUser = loginData.user;

    // 2. Setup verified customer using the verified Resend recipient
    // (In Resend testing mode, this is the only recipient accepted by the provider)
    const verifiedEmail = 'naniabdi2504@gmail.com';
    verifiedCustomer = await prisma.customer.findUnique({
      where: { email: verifiedEmail },
    });
    if (!verifiedCustomer) {
      verifiedCustomer = await prisma.customer.create({
        data: {
          email: verifiedEmail,
          name: 'Nani Abdi',
          company: 'Verified Tech Partner',
          phone: '+1-555-0303',
        },
      });
    }

    // 3. Setup external unverified customer to test provider rejection handling
    const externalEmail = `external.client.${Date.now()}@unverified-external-domain.org`;
    externalCustomer = await prisma.customer.create({
      data: {
        email: externalEmail,
        name: 'Sarah Jenkins',
        company: 'External Enterprise Corp',
        phone: '+1-555-0404',
      },
    });

    // 4. Create projects linked to these customers
    verifiedProject = await prisma.project.create({
      data: {
        title: `Enterprise AI Suite Test - ${Date.now()}`,
        slug: `enterprise-ai-test-${Date.now()}`,
        shortDesc: 'Automated test project for verified customer email notifications',
        description: 'Comprehensive system architecture and design specifications.',
        category: 'Web Development',
        status: 'Pending',
        progress: 10,
        customerId: verifiedCustomer.id,
        isPublished: true,
      },
      include: { customer: true },
    });

    externalProject = await prisma.project.create({
      data: {
        title: `Cloud Modernization Test - ${Date.now()}`,
        slug: `cloud-mod-test-${Date.now()}`,
        shortDesc: 'Automated test project for unverified external domain error capture',
        description: 'Cloud infrastructure modernization specifications.',
        category: 'Cloud Solutions',
        status: 'Pending',
        progress: 15,
        customerId: externalCustomer.id,
        isPublished: true,
      },
      include: { customer: true },
    });
  });

  after(async () => {
    // Restore original provider setting
    await prisma.adminSetting.upsert({
      where: { key: 'smtp_provider' },
      update: { value: originalProvider },
      create: { key: 'smtp_provider', value: originalProvider },
    });

    // Cleanup created test projects and associated notification/history records
    if (verifiedProject?.id) {
      await prisma.notification.deleteMany({ where: { projectId: verifiedProject.id } });
      await prisma.projectStatusHistory.deleteMany({ where: { projectId: verifiedProject.id } });
      await prisma.project.delete({ where: { id: verifiedProject.id } }).catch(() => {});
    }
    if (externalProject?.id) {
      await prisma.notification.deleteMany({ where: { projectId: externalProject.id } });
      await prisma.projectStatusHistory.deleteMany({ where: { projectId: externalProject.id } });
      await prisma.project.delete({ where: { id: externalProject.id } }).catch(() => {});
    }
    if (externalCustomer?.id) {
      await prisma.customer.delete({ where: { id: externalCustomer.id } }).catch(() => {});
    }
  });

  it('1. Retrieves the actual registered customer email from PostgreSQL (never admin or hardcoded)', async () => {
    // Query project from PostgreSQL via Prisma to verify customer relationship
    const projectInDb = await prisma.project.findUnique({
      where: { id: verifiedProject.id },
      include: { customer: true },
    });

    assert.ok(projectInDb, 'Project must exist in DB');
    assert.ok(projectInDb.customer, 'Project must have a linked customer in DB');
    assert.strictEqual(
      projectInDb.customer.email,
      verifiedCustomer.email,
      'Project customer email must match the customer registered email'
    );
    assert.notStrictEqual(
      projectInDb.customer.email,
      adminUser.email,
      'Recipient must never be the admin email'
    );
  });

  it('2. Dispatches email to verified customer upon status change and provider accepts message', async () => {
    const updateRes = await fetch(`${BASE_URL}/projects/${verifiedProject.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'Approved',
        progress: 25,
        message: 'Your project scope and deliverables have been officially approved by the engineering board.',
      }),
    });

    assert.strictEqual(updateRes.status, 200, 'Status update must succeed');
    const data = await updateRes.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.statusChanged, true);

    // Verify email delivery report
    assert.ok(data.delivery, 'Delivery report must be returned');
    assert.strictEqual(data.delivery.email?.success, true, 'Email delivery to verified customer must succeed');
    assert.strictEqual(data.delivery.email?.status, 'Sent', 'Delivery status must be Sent');
    assert.ok(data.delivery.email?.messageId, 'Provider messageId must be returned');
    assert.strictEqual(
      data.delivery.email?.recipient,
      verifiedCustomer.email,
      'Email recipient must match the customer email'
    );
    assert.ok(
      data.delivery.email?.maskedRecipient,
      'Masked recipient must be generated for privacy-conscious display'
    );
  });

  it('3. Records email delivery attempt with full telemetry in database (Notification table)', async () => {
    const emailNotif = await prisma.notification.findFirst({
      where: {
        projectId: verifiedProject.id,
        channel: 'EMAIL',
        deliveryStatus: 'SENT',
      },
      orderBy: { createdAt: 'desc' },
    });

    assert.ok(emailNotif, 'A Notification record with channel EMAIL and status SENT must exist in DB');
    assert.strictEqual(emailNotif.customerId, verifiedCustomer.id, 'Must track customer ID');
    assert.strictEqual(emailNotif.projectId, verifiedProject.id, 'Must track project ID');
    assert.strictEqual(emailNotif.deliveryStatus, 'SENT', 'Must mark as SENT when accepted');

    const details = emailNotif.deliveryDetails;
    assert.ok(details, 'Delivery details must be stored');
    assert.strictEqual(details.recipientEmail, verifiedCustomer.email, 'Must store recipient email');
    assert.strictEqual(details.newStatus, 'Approved', 'Must store new status');
    assert.ok(details.providerMessageId, 'Must store provider message ID');
    assert.strictEqual(details.errorMessage, null, 'Error message must be null on success');
    assert.ok(details.attemptAt, 'Attempt timestamp must be recorded');
  });

  it('4. Correctly handles provider rejection for unverified external domain and marks status as FAILED', async () => {
    // Allow brief interval for previous provider socket to close cleanly
    await new Promise((r) => setTimeout(r, 1500));
    // When sending to an external customer address in Resend testing mode,
    // Resend responds with 550 test mode error.
    // The system MUST NOT claim the email was sent, but mark it as FAILED and record the error.
    const updateRes = await fetch(`${BASE_URL}/projects/${externalProject.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'In Progress',
        progress: 30,
        message: 'Sprint 1 kickoff for external client architecture.',
      }),
    });

    assert.strictEqual(updateRes.status, 200, 'Status update must succeed');
    const data = await updateRes.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.statusChanged, true);

    // Email delivery must accurately reflect failure
    assert.strictEqual(
      data.delivery.email?.success,
      false,
      'Email to unverified external domain must NOT be marked as successful'
    );
    assert.strictEqual(data.delivery.email?.status, 'Failed');
    assert.ok(
      data.delivery.email?.error?.includes('Testing Mode') || data.delivery.email?.error?.includes('550'),
      'Must clearly state Resend Testing Mode / 550 error'
    );

    // Check DB tracking for the failed notification attempt
    const failedNotif = await prisma.notification.findFirst({
      where: {
        projectId: externalProject.id,
        channel: 'EMAIL',
        deliveryStatus: 'FAILED',
      },
      orderBy: { createdAt: 'desc' },
    });

    assert.ok(failedNotif, 'A Notification record with channel EMAIL and status FAILED must exist in DB');
    assert.strictEqual(failedNotif.customerId, externalCustomer.id);
    assert.strictEqual(failedNotif.projectId, externalProject.id);
    assert.strictEqual(failedNotif.deliveryStatus, 'FAILED');
    assert.ok(failedNotif.deliveryDetails?.errorMessage, 'Must record error message in deliveryDetails');
    assert.ok(failedNotif.deliveryDetails?.attemptAt, 'Must record attempt timestamp');
  });

  it('5. Prevents duplicate notifications when project status does not change', async () => {
    // Submit same status 'Approved' for verifiedProject
    const duplicateRes = await fetch(`${BASE_URL}/projects/${verifiedProject.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'Approved', // Same status
        progress: 25,
      }),
    });

    assert.strictEqual(duplicateRes.status, 200);
    const data = await duplicateRes.json();
    assert.strictEqual(data.statusChanged, false, 'statusChanged must be false');
    assert.strictEqual(data.delivery.skipped, true, 'Delivery must be skipped');
  });

  it('6. Retry Email action prevents accidental duplicate sends when email was already delivered', async () => {
    // verifiedProject status is 'Approved' and already had a successful email delivery
    const retryRes = await fetch(`${BASE_URL}/projects/${verifiedProject.id}/retry-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        force: false,
      }),
    });

    // Should return 409 Conflict preventing accidental duplicates
    assert.strictEqual(retryRes.status, 409, 'Duplicate send must be blocked with 409 Conflict');
    const data = await retryRes.json();
    assert.strictEqual(data.alreadyDelivered, true);
    assert.ok(data.message.includes('already accepted by email provider'));
  });

  it('7. Retry Email action successfully dispatches email for new status or unconfirmed notification', async () => {
    // Update status to 'Under Review' first
    const updateRes = await fetch(`${BASE_URL}/projects/${verifiedProject.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'Under Review',
        progress: 60,
      }),
    });
    assert.strictEqual(updateRes.status, 200);

    // Call retry-email with force: true to verify retry endpoint works
    const retryRes = await fetch(`${BASE_URL}/projects/${verifiedProject.id}/retry-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        force: true,
        message: 'Milestone review packet re-dispatched to client.',
      }),
    });

    assert.strictEqual(retryRes.status, 200, 'Retry email must succeed');
    const retryData = await retryRes.json();
    assert.strictEqual(retryData.success, true);
    assert.strictEqual(retryData.delivery.status, 'Sent');
    assert.ok(retryData.delivery.messageId);

    // Verify retry record in DB
    const retryNotif = await prisma.notification.findFirst({
      where: {
        projectId: verifiedProject.id,
        channel: 'EMAIL',
        deliveryDetails: {
          path: ['isRetry'],
          equals: true,
        },
      },
    });

    assert.ok(retryNotif, 'A retry notification record must exist in DB');
    assert.strictEqual(retryNotif.deliveryStatus, 'SENT');
  });

  it('8. Validates customer email format and prevents delivery when customer has no email', async () => {
    // Create a customer without email
    const noEmailCustomer = await prisma.customer.create({
      data: {
        email: `invalid-email-${Date.now()}@`,
        name: 'No Email User',
      },
    });

    const noEmailProject = await prisma.project.create({
      data: {
        title: 'Project Without Valid Email',
        slug: `no-email-${Date.now()}`,
        description: 'Test project without valid customer email.',
        shortDesc: 'Test short description',
        category: 'Web Development',
        status: 'Pending',
        customerId: noEmailCustomer.id,
      },
    });

    const updateRes = await fetch(`${BASE_URL}/projects/${noEmailProject.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'Approved',
      }),
    });

    assert.strictEqual(updateRes.status, 200);
    const data = await updateRes.json();
    assert.strictEqual(data.delivery.email?.success, false);
    assert.strictEqual(data.delivery.email?.status, 'Failed');

    // Clean up
    await prisma.notification.deleteMany({ where: { projectId: noEmailProject.id } });
    await prisma.project.delete({ where: { id: noEmailProject.id } });
    await prisma.customer.delete({ where: { id: noEmailCustomer.id } });
  });
});
