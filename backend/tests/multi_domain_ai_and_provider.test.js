import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  detectSystemType,
  generateAIResponse,
  generateProjectSpecification,
  getAIConfig,
  testAIConnection,
} from '../src/services/ai/aiService.js';
import {
  generatePrototype,
  modifyPrototypeWithAI,
  PROTOTYPE_BLUEPRINTS,
} from '../src/services/prototype/prototypeService.js';
import prisma from '../src/config/db.js';

describe('Comprehensive Multi-Domain AI Analyst & Provider Transparency Tests', () => {
  const domainsToTest = [
    {
      category: 'School Management System',
      initialPrompt: 'I need an enterprise school management system for secondary schools with attendance and grading.',
      expectedType: 'SCHOOL_MANAGEMENT',
      expectedKeywordsInFollowUp: ['school', 'institution', 'students'],
      expectedModule: 'Attendance',
    },
    {
      category: 'Hospital Management System',
      initialPrompt: 'We need a clinic management EHR system with doctor consultations and pharmacy dispensary.',
      expectedType: 'HOSPITAL_MANAGEMENT',
      expectedKeywordsInFollowUp: ['clinic', 'hospital', 'patient'],
      expectedModule: 'Pharmacy',
    },
    {
      category: 'E-learning Platform',
      initialPrompt: 'We want to launch an online e-learning course platform with video lessons, quizzes, and certificates.',
      expectedType: 'ELEARNING_PLATFORM',
      expectedKeywordsInFollowUp: ['course', 'lecture', 'learners'],
      expectedModule: 'Course Catalog',
    },
    {
      category: 'Inventory Management System',
      initialPrompt: 'I need a warehouse inventory tracking system with barcode scanning and low-stock reorder alerts.',
      expectedType: 'INVENTORY_MANAGEMENT',
      expectedKeywordsInFollowUp: ['warehouse', 'stock', 'inventory'],
      expectedModule: 'Stock Items',
    },
    {
      category: 'Hotel Management System',
      initialPrompt: 'We manage a luxury boutique hotel and need a room booking calendar and guest reservation suite.',
      expectedType: 'HOTEL_MANAGEMENT',
      expectedKeywordsInFollowUp: ['hotel', 'room', 'booking'],
      expectedModule: 'Room Inventory',
    },
    {
      category: 'Employee Management System',
      initialPrompt: 'Our company needs an HR employee management system with monthly payroll and leave request approvals.',
      expectedType: 'EMPLOYEE_MANAGEMENT',
      expectedKeywordsInFollowUp: ['hr', 'employee', 'payroll'],
      expectedModule: 'Staff Directory',
    },
    {
      category: 'Football Tournament Management System',
      initialPrompt: 'We want a football tournament championship platform with match fixtures, live scores, and league standings.',
      expectedType: 'FOOTBALL_TOURNAMENT',
      expectedKeywordsInFollowUp: ['football', 'tournament', 'match'],
      expectedModule: 'Teams & Squads',
    },
    {
      category: 'E-commerce Platform',
      initialPrompt: 'I need an online e-commerce shopping website with product catalog, cart checkout, and Stripe payments.',
      expectedType: 'ECOMMERCE_SYSTEM',
      expectedKeywordsInFollowUp: ['marketplace', 'store', 'e-commerce'],
      expectedModule: 'Product Inventory',
    },
    {
      category: 'Unfamiliar / Custom Business System',
      initialPrompt: 'I have a novel idea for a community seed exchange and neighborhood urban farming sharing platform.',
      expectedType: 'CUSTOM_BUSINESS_SYSTEM',
      expectedKeywordsInFollowUp: ['target users', 'bottleneck', 'project'],
      expectedModule: 'Operations Dashboard',
    },
  ];

  for (const domain of domainsToTest) {
    it(`Domain Test [${domain.category}]: should understand, question, specify, and prototype`, async () => {
      // 1. Detect System Type
      const detected = detectSystemType(domain.initialPrompt);
      assert.strictEqual(detected.type, domain.expectedType);

      // 2. Initialize Conversation in DB
      const sessionToken = `sess_test_${domain.expectedType.toLowerCase()}_${Date.now()}`;
      const conv = await prisma.conversation.create({
        data: {
          sessionToken,
          title: `Test Discovery: ${domain.category}`,
          messages: {
            create: [
              { sender: 'USER', content: domain.initialPrompt },
            ],
          },
        },
        include: { messages: true },
      });

      // 3. AI First-Turn Question
      const turn1Reply = await generateAIResponse(conv, domain.initialPrompt);
      assert.ok(turn1Reply.length > 30, 'Turn 1 reply must be informative');
      const hasDomainRelevance = domain.expectedKeywordsInFollowUp.some(kw =>
        turn1Reply.toLowerCase().includes(kw.toLowerCase())
      );
      assert.ok(hasDomainRelevance, `Turn 1 reply should mention domain keywords for ${domain.category}`);

      // 4. Generate Structured Project Specification
      const spec = await generateProjectSpecification(conv);
      assert.ok(spec.id);
      assert.ok(spec.projectName.length > 0);
      assert.ok(spec.overview.length > 20);
      assert.ok(Array.isArray(spec.objectives) && spec.objectives.length >= 3);
      assert.ok(Array.isArray(spec.targetUsers) && spec.targetUsers.length >= 3);
      assert.ok(Array.isArray(spec.modules) && spec.modules.length >= 4);
      assert.ok(Array.isArray(spec.userRoles) && spec.userRoles.length >= 3);
      assert.ok(Array.isArray(spec.recommendedTech) && spec.recommendedTech.length >= 3);

      // 5. Generate Interactive Prototype
      const protoResult = await generatePrototype(conv.id);
      assert.ok(protoResult.prototype);
      assert.strictEqual(protoResult.prototype.systemType, domain.expectedType);
      assert.ok(Array.isArray(protoResult.configuration.modules));
      assert.ok(protoResult.configuration.modules.length >= 4);
      assert.ok(Array.isArray(protoResult.configuration.kpis) && protoResult.configuration.kpis.length >= 3);

      // 6. Modify Prototype via AI Prompt
      const modifyResult = await modifyPrototypeWithAI(
        protoResult.prototype.id,
        'Change primary color to #10B981 and add an Analytics & Export Module.'
      );
      assert.strictEqual(modifyResult.currentVersion.versionNumber, 2);
      assert.strictEqual(modifyResult.configuration.theme.primaryColor, '#10B981');

      // 7. Cleanup
      await prisma.prototypeVersion.deleteMany({ where: { prototypeId: protoResult.prototype.id } });
      await prisma.prototype.delete({ where: { id: protoResult.prototype.id } });
      await prisma.requirement.deleteMany({ where: { conversationId: conv.id } });
      await prisma.message.deleteMany({ where: { conversationId: conv.id } });
      await prisma.conversation.delete({ where: { id: conv.id } });
    });
  }

  it('AI Transparency: Gemini mode without key should activate transparent fallback and not crash', async () => {
    // Configure gemini provider without key in settings
    await prisma.adminSetting.upsert({
      where: { key: 'ai_provider' },
      update: { value: 'gemini' },
      create: { key: 'ai_provider', value: 'gemini' },
    });

    const mockConv = {
      id: 'test-gemini-fallback',
      messages: [{ sender: 'USER', content: 'I need an online booking system for personal trainers.' }],
    };

    const reply = await generateAIResponse(mockConv, 'I need an online booking system for personal trainers.');
    assert.ok(reply.includes('Fallback Mode') || reply.metadata?.isFallback === true);
    assert.strictEqual(reply.metadata?.provider, 'built-in');
    assert.strictEqual(reply.metadata?.configuredProvider, 'gemini');
    assert.strictEqual(reply.metadata?.isFallback, true);

    // Restore to built-in
    await prisma.adminSetting.upsert({
      where: { key: 'ai_provider' },
      update: { value: 'built-in' },
      create: { key: 'ai_provider', value: 'built-in' },
    });
  });

  it('AI Diagnostics: testAIConnection should report accurate status without exposing keys', async () => {
    const diag = await testAIConnection();
    assert.strictEqual(diag.success, true);
    assert.strictEqual(diag.provider, 'built-in');
    assert.strictEqual(diag.status, 'operational');
    assert.ok(typeof diag.latencyMs === 'number');
    assert.strictEqual(diag.apiKey, undefined);
    assert.strictEqual(diag.geminiApiKey, undefined);

    const config = await getAIConfig();
    assert.strictEqual(config.provider, 'built-in');
    assert.strictEqual(typeof config.hasGeminiKey, 'boolean');
    assert.strictEqual(typeof config.hasOpenaiKey, 'boolean');
  });
});
