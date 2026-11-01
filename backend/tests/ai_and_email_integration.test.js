import { describe, it } from 'node:test';
import assert from 'node:assert';
import prisma from '../src/config/db.js';
import {
  getAIConfig,
  testAIConnection,
  generateAIResponse,
} from '../src/services/ai/aiService.js';
import {
  getSMTPConfig,
  verifySMTPConnection,
  sendTestEmail,
  sendInquiryNotifications,
} from '../src/services/email/emailService.js';

describe('External AI & SMTP Email Production Configuration Tests', () => {
  // -------------------------------------------------------------
  // 1. AI CONFIGURATION & SECRECY
  // -------------------------------------------------------------
  it('AI: should safely report configuration status without exposing raw keys', async () => {
    const config = await getAIConfig();
    assert.ok(config.provider);
    assert.strictEqual(typeof config.hasGeminiKey, 'boolean');
    assert.strictEqual(typeof config.hasOpenaiKey, 'boolean');
    assert.strictEqual(typeof config.hasExternalCredentials, 'boolean');
  });

  it('AI: missing API keys should produce clean misconfigured status without crashing', async () => {
    const savedGemini = process.env.GEMINI_API_KEY;
    const savedOpenai = process.env.OPENAI_API_KEY;
    try {
      process.env.GEMINI_API_KEY = '';
      process.env.OPENAI_API_KEY = '';

      // Test Gemini with missing key
      await prisma.adminSetting.upsert({
        where: { key: 'ai_provider' },
        update: { value: 'gemini' },
        create: { key: 'ai_provider', value: 'gemini' },
      });
      await prisma.adminSetting.deleteMany({ where: { key: 'gemini_api_key' } });

      const diag = await testAIConnection();
      assert.strictEqual(diag.success, false);
      assert.strictEqual(diag.provider, 'gemini');
      assert.strictEqual(diag.status, 'misconfigured');
      assert.ok(diag.error.includes('Gemini API Key is not configured'));

      // Test OpenAI with missing key
      await prisma.adminSetting.upsert({
        where: { key: 'ai_provider' },
        update: { value: 'openai' },
        create: { key: 'ai_provider', value: 'openai' },
      });
      await prisma.adminSetting.deleteMany({ where: { key: 'openai_api_key' } });

      const openAiDiag = await testAIConnection();
      assert.strictEqual(openAiDiag.success, false);
      assert.strictEqual(openAiDiag.provider, 'openai');
      assert.strictEqual(openAiDiag.status, 'misconfigured');
      assert.ok(openAiDiag.error.includes('OpenAI API Key is not configured'));
    } finally {
      process.env.GEMINI_API_KEY = savedGemini;
      process.env.OPENAI_API_KEY = savedOpenai;
      // Restore to built-in
      await prisma.adminSetting.upsert({
        where: { key: 'ai_provider' },
        update: { value: 'built-in' },
        create: { key: 'ai_provider', value: 'built-in' },
      });
    }
  });

  it('AI: invalid external API key should fail gracefully without crashing and log diagnostic', async () => {
    // Configure Gemini with invalid dummy key
    await prisma.adminSetting.upsert({
      where: { key: 'ai_provider' },
      update: { value: 'gemini' },
      create: { key: 'ai_provider', value: 'gemini' },
    });
    await prisma.adminSetting.upsert({
      where: { key: 'gemini_api_key' },
      update: { value: 'AIzaSyFakeKeyInvalidDummyForTesting123' },
      create: { key: 'gemini_api_key', value: 'AIzaSyFakeKeyInvalidDummyForTesting123' },
    });

    const diag = await testAIConnection();
    assert.strictEqual(diag.success, false);
    assert.strictEqual(diag.provider, 'gemini');
    // Error could be 'error' (HTTP 400 from Google) or 'unreachable' (network/timeout)
    assert.ok(['error', 'unreachable'].includes(diag.status));
    assert.ok(diag.error);

    // Verify fallback response works seamlessly
    const mockConv = {
      id: 'test-fallback-conv',
      messages: [{ sender: 'USER', content: 'I need a telemedicine platform.' }],
    };
    const reply = await generateAIResponse(mockConv, 'I need a telemedicine platform.');
    assert.ok(reply.includes('Fallback Mode') || reply.metadata?.isFallback === true);
    assert.strictEqual(reply.metadata?.provider, 'built-in');
    assert.strictEqual(reply.metadata?.configuredProvider, 'gemini');

    // Clean up dummy key & restore provider
    await prisma.adminSetting.deleteMany({ where: { key: 'gemini_api_key' } });
    await prisma.adminSetting.upsert({
      where: { key: 'ai_provider' },
      update: { value: 'built-in' },
      create: { key: 'ai_provider', value: 'built-in' },
    });
  });

  it('AI: Built-in Analyst must be operational and distinct from external LLMs', async () => {
    const diag = await testAIConnection();
    assert.strictEqual(diag.success, true);
    assert.strictEqual(diag.provider, 'built-in');
    assert.strictEqual(diag.status, 'operational');
    assert.ok(diag.latencyMs >= 0);
  });

  // -------------------------------------------------------------
  // 2. SMTP EMAIL CONFIGURATION & HEALTH
  // -------------------------------------------------------------
  it('Email: should retrieve safe SMTP configuration without exposing password', async () => {
    const config = await getSMTPConfig();
    assert.ok(config);
    assert.strictEqual(typeof config.isConfigured, 'boolean');
    assert.strictEqual(typeof config.hasPass, 'boolean');
    assert.ok(config.from.includes('@'));
    assert.ok(config.adminEmail.includes('@'));
  });

  it('Email: verifySMTPConnection should handle unconfigured SMTP gracefully', async () => {
    const savedHost = process.env.SMTP_HOST;
    const savedPass = process.env.SMTP_PASS;
    try {
      process.env.SMTP_HOST = '';
      process.env.SMTP_PASS = '';
      // Clear any DB SMTP credentials temporarily
      await prisma.adminSetting.deleteMany({
        where: { key: { in: ['smtp_host', 'smtp_user', 'smtp_pass'] } },
      });

      const result = await verifySMTPConnection();
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, 'not_configured');
      assert.ok(result.message.includes('not configured'));
    } finally {
      process.env.SMTP_HOST = savedHost;
      process.env.SMTP_PASS = savedPass;
    }
  });

  it('Email: verifySMTPConnection with invalid credentials should fail with clean error without crash', async () => {
    // Configure invalid Resend credentials
    await prisma.adminSetting.upsert({
      where: { key: 'smtp_host' },
      update: { value: 'smtp.resend.com' },
      create: { key: 'smtp_host', value: 'smtp.resend.com' },
    });
    await prisma.adminSetting.upsert({
      where: { key: 'smtp_port' },
      update: { value: '465' },
      create: { key: 'smtp_port', value: '465' },
    });
    await prisma.adminSetting.upsert({
      where: { key: 'smtp_user' },
      update: { value: 'resend' },
      create: { key: 'smtp_user', value: 'resend' },
    });
    await prisma.adminSetting.upsert({
      where: { key: 'smtp_pass' },
      update: { value: 're_InvalidApiKeyDummyTest12345' },
      create: { key: 'smtp_pass', value: 're_InvalidApiKeyDummyTest12345' },
    });

    const result = await verifySMTPConnection();
    assert.strictEqual(result.success, false);
    assert.ok(result.status === 'auth_failed' || result.status === 'error' || result.status === 'unreachable');
    assert.ok(result.error);
    // Never expose password in returned object
    assert.strictEqual(result.rawPass, undefined);

    // Verify error was persisted in database
    const errSetting = await prisma.adminSetting.findUnique({ where: { key: 'smtp_last_error' } });
    assert.ok(errSetting && errSetting.value.length > 0);

    // Clean up test credentials
    await prisma.adminSetting.deleteMany({
      where: { key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass'] } },
    });
  });

  it('Email: sendTestEmail with invalid or missing credentials should report failure cleanly', async () => {
    const result = await sendTestEmail({ toEmail: 'test.admin@specialtech.com' });
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  });

  // -------------------------------------------------------------
  // 3. CUSTOMER INQUIRY NOTIFICATIONS & IDEMPOTENCY
  // -------------------------------------------------------------
  it('Email: SMTP failure must NEVER delete or roll back a saved customer inquiry in PostgreSQL', async () => {
    // 1. Create a customer and inquiry in database
    const customer = await prisma.customer.create({
      data: {
        name: 'Jane Doe Enterprise',
        email: 'jane.enterprise@testcorp.com',
        phone: '+1 555-0199',
        company: 'TestCorp Global',
      },
    });

    const inquiry = await prisma.inquiry.create({
      data: {
        inquiryNumber: `ST-INQ-TEST-${Date.now()}`,
        customerId: customer.id,
        title: 'Global Supply Chain Optimization',
        message: 'Need cloud architecture for regional distribution tracking.',
        budget: '$50,000+',
      },
    });

    // 2. Dispatch notifications with SMTP unconfigured / failing
    const notifyResult = await sendInquiryNotifications({
      customer,
      inquiry,
      requirement: { projectName: 'Global Supply Chain Optimization' },
    });

    // Even if simulated or failed, verify the inquiry REMAINS 100% PERSISTED in database
    const dbInquiry = await prisma.inquiry.findUnique({
      where: { id: inquiry.id },
    });
    assert.ok(dbInquiry);
    assert.strictEqual(dbInquiry.id, inquiry.id);
    assert.strictEqual(dbInquiry.title, 'Global Supply Chain Optimization');

    // Clean up test records
    await prisma.inquiry.delete({ where: { id: inquiry.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
  });

  it('Email: should prevent duplicate notification dispatch for the same inquiry', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Idempotency Test User',
        email: 'idempotency@testcorp.com',
      },
    });

    const inquiry = await prisma.inquiry.create({
      data: {
        inquiryNumber: `ST-INQ-IDEMP-${Date.now()}`,
        customerId: customer.id,
        title: 'Idempotent Notification Test',
        message: 'Verifying duplicate prevention.',
      },
    });

    // Manually create activity log simulating that confirmation was already sent
    await prisma.activityLog.create({
      data: {
        action: 'EMAIL_CONFIRMATION_SENT',
        entityType: 'INQUIRY',
        entityId: inquiry.id,
        details: { to: customer.email, inquiryNumber: inquiry.inquiryNumber },
      },
    });

    // Attempt second notification dispatch
    const secondDispatch = await sendInquiryNotifications({
      customer,
      inquiry,
      requirement: { projectName: inquiry.title },
    });

    assert.strictEqual(secondDispatch.success, true);
    assert.strictEqual(secondDispatch.skipped, true);
    assert.strictEqual(secondDispatch.reason, 'Duplicate notification prevented');

    // Clean up
    await prisma.activityLog.deleteMany({ where: { entityId: inquiry.id } });
    await prisma.inquiry.delete({ where: { id: inquiry.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
  });
});
