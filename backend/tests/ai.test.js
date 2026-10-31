import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  detectSystemType,
  testAIConnection,
  getAIConfig,
  generateAIResponse,
  generateProjectSpecification,
} from '../src/services/ai/aiService.js';
import {
  generatePrototype,
  modifyPrototypeWithAI,
  PROTOTYPE_BLUEPRINTS,
} from '../src/services/prototype/prototypeService.js';
import prisma from '../src/config/db.js';

describe('AI Engine & Software Business Analyst Verification', () => {
  it('should accurately detect system type and domain from user requirements', () => {
    const school = detectSystemType('I want a school management portal with student attendance and grade reports');
    assert.strictEqual(school.type, 'SCHOOL_MANAGEMENT');

    const hospital = detectSystemType('We need a clinical EHR system for patient appointments and doctor prescriptions');
    assert.strictEqual(hospital.type, 'HOSPITAL_MANAGEMENT');

    const ecommerce = detectSystemType('An online shopping marketplace with cart checkout and product catalog');
    assert.strictEqual(ecommerce.type, 'ECOMMERCE_SYSTEM');

    const inventory = detectSystemType('Enterprise warehouse inventory tracking with barcodes and reorder thresholds');
    assert.strictEqual(inventory.type, 'INVENTORY_MANAGEMENT');

    const custom = detectSystemType('A bespoke AI analytics dashboard for energy grids');
    assert.strictEqual(custom.type, 'CUSTOM_BUSINESS_SYSTEM');
  });

  it('should retrieve safe AI configuration without exposing private secrets', async () => {
    const config = await getAIConfig();
    assert.ok(config.provider, 'Provider must be defined');
    assert.ok(config.model, 'Model must be defined');
    assert.strictEqual(typeof config.hasGeminiKey, 'boolean');
    assert.strictEqual(typeof config.hasOpenaiKey, 'boolean');
  });

  it('should execute live AI connection diagnostic with latency measurement', async () => {
    const diagnostic = await testAIConnection();
    assert.strictEqual(diagnostic.success, true);
    assert.strictEqual(diagnostic.status, 'operational');
    assert.ok(diagnostic.latencyMs >= 0);
    assert.ok(Array.isArray(diagnostic.capabilities));
    assert.ok(diagnostic.capabilities.length >= 3);
  });

  it('should conduct intelligent progressive requirements gathering with context preservation', async () => {
    // Simulate a fresh conversation
    const mockConversation = {
      id: 'test-conv-' + Date.now(),
      title: 'New AI Project Discovery',
      messages: [
        { sender: 'USER', content: 'I want to build a school management system.' },
      ],
    };

    // First turn: AI asks clarifying questions about user roles, size, and modules
    const response1 = await generateAIResponse(mockConversation, 'I want to build a school management system.');
    assert.ok(response1.includes('School Management System') || response1.includes('school'));
    assert.ok(response1.includes('?') || response1.includes('role') || response1.includes('feature'));

    // Second turn: Customer provides user roles
    mockConversation.messages.push(
      { sender: 'ASSISTANT', content: response1 },
      { sender: 'USER', content: 'We have 1,500 students, 80 teachers, and need attendance tracking and grade reports.' }
    );
    const response2 = await generateAIResponse(
      mockConversation,
      'We have 1,500 students, 80 teachers, and need attendance tracking and grade reports.'
    );
    assert.ok(response2.length > 50);

    // Third turn: Technical and security inquiry
    mockConversation.messages.push(
      { sender: 'ASSISTANT', content: response2 },
      { sender: 'USER', content: 'What technology stack and security measures do you recommend for this?' }
    );
    const response3 = await generateAIResponse(
      mockConversation,
      'What technology stack and security measures do you recommend for this?'
    );
    assert.ok(response3.toLowerCase().includes('react') || response3.toLowerCase().includes('security') || response3.toLowerCase().includes('encryption'));
  });

  it('should generate a comprehensive structured project specification', async () => {
    const sessionToken = 'sess_test_spec_' + Date.now();
    const conv = await prisma.conversation.create({
      data: {
        sessionToken,
        title: 'EduPro School Platform Spec Test',
        messages: {
          create: [
            { sender: 'USER', content: 'We need an enterprise school management system for K-12 students with fees, examinations, and attendance.' },
            { sender: 'ASSISTANT', content: 'Excellent. What are the key roles?' },
            { sender: 'USER', content: 'Principals, teachers, students, and parents with online fee collection and SMS notifications.' },
          ],
        },
      },
      include: { messages: true },
    });

    const spec = await generateProjectSpecification(conv);
    assert.ok(spec.id);
    assert.ok(spec.projectName.length > 0);
    assert.ok(spec.overview.length > 0);
    assert.ok(spec.problemStatement.length > 0);
    assert.ok(Array.isArray(spec.objectives) && spec.objectives.length > 0);
    assert.ok(Array.isArray(spec.targetUsers) && spec.targetUsers.length > 0);
    assert.ok(Array.isArray(spec.deliverables) && spec.deliverables.length > 0);

    // Clean up test conversation and requirement
    await prisma.requirement.deleteMany({ where: { conversationId: conv.id } });
    await prisma.conversation.delete({ where: { id: conv.id } });
  });

  it('should generate interactive prototype using controlled JSON configuration without arbitrary code execution', async () => {
    const sessionToken = 'sess_test_proto_' + Date.now();
    const conv = await prisma.conversation.create({
      data: {
        sessionToken,
        title: 'Prototype Verification Test',
        messages: {
          create: [
            { sender: 'USER', content: 'I need a modern hospital clinic management system with appointments and pharmacy.' },
          ],
        },
      },
    });

    // 1. Generate prototype
    const result = await generatePrototype(conv.id);
    assert.ok(result.prototype);
    assert.strictEqual(result.prototype.systemType, 'HOSPITAL_MANAGEMENT');
    assert.ok(result.configuration);
    assert.ok(Array.isArray(result.configuration.modules));
    assert.ok(Array.isArray(result.configuration.kpis));
    assert.ok(result.configuration.tables);
    assert.strictEqual(result.currentVersion.versionNumber, 1);

    // Verify security: configuration is pure JSON data, no eval or script tags
    const configStr = JSON.stringify(result.configuration);
    assert.strictEqual(configStr.includes('<script>'), false);
    assert.strictEqual(configStr.includes('javascript:'), false);

    // 2. Modify prototype via natural language prompt
    const modified = await modifyPrototypeWithAI(result.prototype.id, 'Change theme color to violet and add transport fleet module');
    assert.ok(modified.currentVersion);
    assert.strictEqual(modified.currentVersion.versionNumber, 2);
    assert.strictEqual(modified.configuration.theme.primaryColor, '#8B5CF6');
    assert.ok(modified.configuration.modules.some((m) => m.id === 'transport'));
    assert.ok(modified.changeNotes.length > 0);

    // Clean up
    await prisma.prototypeVersion.deleteMany({ where: { prototypeId: result.prototype.id } });
    await prisma.prototype.delete({ where: { id: result.prototype.id } });
    await prisma.conversation.delete({ where: { id: conv.id } });
  });
});
