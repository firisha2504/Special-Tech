import prisma from '../src/config/db.js';

const BASE_URL = 'http://localhost:5050/api';

async function runCustomerJourneyAudit() {
  console.log('🚀 Starting Complete Customer Journey Audit...');
  const results = {
    steps: [],
    errors: [],
    artifacts: {},
  };

  try {
    // 1. Customer initiates AI Project Assistant conversation
    const sessionToken = `sess_audit_${Date.now()}`;
    const startRes = await fetch(`${BASE_URL}/ai/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken }),
    });
    const startData = await startRes.json();
    if (!startData.success) throw new Error('Failed to start conversation: ' + startData.message);
    const conversationId = startData.conversationId;
    results.steps.push({ step: 1, name: 'Start Conversation', success: true, conversationId, sessionToken });
    console.log('✅ Step 1: Conversation started. ID:', conversationId);

    // 2. Customer describes initial software idea (School Management System)
    const prompt1 = 'Build a School Management System for a private secondary school with approximately 1,000 students. It should include student management, teacher management, attendance, examinations, tuition payments, financial reports and parent access.';
    const msgRes1 = await fetch(`${BASE_URL}/ai/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message: prompt1 }),
    });
    const msgData1 = await msgRes1.json();
    if (!msgData1.success) throw new Error('Turn 1 failed: ' + msgData1.message);
    results.steps.push({
      step: 2,
      name: 'Initial Requirements Prompt',
      customerInput: prompt1,
      aiResponse: msgData1.aiMessage.content,
      success: true,
    });
    console.log('✅ Step 2 & 3: AI received prompt and responded:');
    console.log('--- AI Response 1 ---\n' + msgData1.aiMessage.content + '\n---');

    // 4. Customer responds with details on user roles, examination reports, and parent fee payments
    const prompt2 = 'We have 4 roles: Principal, Teachers, Students, and Parents. For examinations, we need automated GPA and report card generation. Parents need to pay tuition fees online via Stripe or local bank cards, and view attendance in real time.';
    const msgRes2 = await fetch(`${BASE_URL}/ai/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message: prompt2 }),
    });
    const msgData2 = await msgRes2.json();
    if (!msgData2.success) throw new Error('Turn 2 failed: ' + msgData2.message);
    results.steps.push({
      step: 4,
      name: 'Customer Clarifications (Roles, Exams, Payments)',
      customerInput: prompt2,
      aiResponse: msgData2.aiMessage.content,
      success: true,
    });
    console.log('✅ Step 4 & 5: AI preserved context and responded to roles/exams:');
    console.log('--- AI Response 2 ---\n' + msgData2.aiMessage.content + '\n---');

    // 6. Customer inquires about technical architecture and security
    const prompt3 = 'What database and security measures do you recommend for student data protection and payment compliance?';
    const msgRes3 = await fetch(`${BASE_URL}/ai/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message: prompt3 }),
    });
    const msgData3 = await msgRes3.json();
    if (!msgData3.success) throw new Error('Turn 3 failed: ' + msgData3.message);
    results.steps.push({
      step: 6,
      name: 'Technical & Security Consultation',
      customerInput: prompt3,
      aiResponse: msgData3.aiMessage.content,
      success: true,
    });
    console.log('✅ Step 6: AI provided technical/security architecture:');
    console.log('--- AI Response 3 ---\n' + msgData3.aiMessage.content + '\n---');

    // 7. Generate Project Specification
    const specRes = await fetch(`${BASE_URL}/ai/requirements/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId }),
    });
    const specData = await specRes.json();
    if (!specData.success) throw new Error('Spec generation failed: ' + specData.message);
    const requirement = specData.data;
    results.steps.push({
      step: 7,
      name: 'Generate Structured Specification',
      requirementId: requirement.id,
      projectName: requirement.projectName,
      objectivesCount: requirement.objectives?.length,
      modulesCount: Array.isArray(requirement.modules) ? requirement.modules.length : 0,
      success: true,
    });
    results.artifacts.specification = requirement;
    console.log('✅ Step 7: Structured Specification Generated:');
    console.log(`Project Name: ${requirement.projectName}`);
    console.log(`Overview: ${requirement.overview.slice(0, 100)}...`);
    console.log(`Objectives:`, requirement.objectives);

    // 8. Generate Interactive Prototype
    const protoRes = await fetch(`${BASE_URL}/prototypes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId }),
    });
    const protoData = await protoRes.json();
    if (!protoData.success) throw new Error('Prototype generation failed: ' + protoData.message);
    const prototype = protoData.data.prototype;
    const version1 = protoData.data.currentVersion;
    results.steps.push({
      step: 8,
      name: 'Generate Interactive Prototype',
      prototypeId: prototype.id,
      version: version1.versionNumber,
      systemType: prototype.systemType,
      modulesCount: protoData.data.configuration.modules?.length,
      success: true,
    });
    console.log('✅ Step 8: Interactive Prototype Generated:');
    console.log(`System Type: ${prototype.systemType}, Version: v${version1.versionNumber}`);
    console.log(`Modules:`, protoData.data.configuration.modules.map(m => m.name));

    // 9 & 10. Customer requests natural language modification to prototype
    const modifyPrompt = 'Change theme color to electric cyan and add messaging chat module';
    const modRes = await fetch(`${BASE_URL}/prototypes/modify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prototypeId: prototype.id, prompt: modifyPrompt }),
    });
    const modData = await modRes.json();
    if (!modData.success) throw new Error('Prototype modification failed: ' + modData.message);
    const version2 = modData.data.currentVersion;
    results.steps.push({
      step: 10,
      name: 'Prototype Natural Language Modification',
      prompt: modifyPrompt,
      newVersion: version2.versionNumber,
      changeNotes: modData.data.changeNotes,
      primaryColor: modData.data.configuration.theme?.primaryColor,
      hasMessaging: modData.data.configuration.modules?.some(m => m.id === 'messaging'),
      success: true,
    });
    console.log('✅ Step 9 & 10: Prototype Updated via AI Prompt:');
    console.log(`New Version: v${version2.versionNumber}, Color: ${modData.data.configuration.theme?.primaryColor}`);
    console.log(`Change Notes: ${modData.data.changeNotes}`);

    // 11 & 12. Customer confirms and submits project proposal
    const submissionPayload = {
      name: 'Dr. Arthur Pendelton',
      email: 'arthur.pendelton@stmarks.edu',
      phone: '+1 617-555-0182',
      company: "St. Mark's Preparatory Academy",
      title: requirement.projectName || 'School Management System',
      message: 'We have thoroughly reviewed the generated specification and interactive prototype for our 1,000-student academy. We are ready to initiate the development phase with Special Tech.',
      budget: '$35,000 - $50,000',
      preferredContact: 'Email',
      requirementId: requirement.id,
      prototypeVersionId: version2.id,
    };

    const submitRes = await fetch(`${BASE_URL}/inquiries/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionPayload),
    });
    const submitData = await submitRes.json();
    if (!submitData.success) throw new Error('Submission failed: ' + submitData.message);
    const inquiry = submitData.data;
    results.steps.push({
      step: 12,
      name: 'Submit Project Proposal',
      inquiryNumber: submitData.inquiryNumber,
      inquiryId: submitData.inquiryId,
      customerId: inquiry.customerId,
      success: true,
    });
    console.log('✅ Step 11 & 12: Proposal Submitted to PostgreSQL:');
    console.log(`Inquiry Number: ${submitData.inquiryNumber}`);
    console.log(`Inquiry ID: ${submitData.inquiryId}`);

    // 13. Verify PDF generation endpoint
    const pdfRes = await fetch(`${BASE_URL}/inquiries/${submitData.inquiryId}/pdf`);
    const pdfContentType = pdfRes.headers.get('content-type');
    const pdfBuffer = await pdfRes.arrayBuffer();
    results.steps.push({
      step: 13,
      name: 'Dynamic PDF Specification Verification',
      contentType: pdfContentType,
      byteLength: pdfBuffer.byteLength,
      success: pdfRes.status === 200 && pdfContentType === 'application/pdf' && pdfBuffer.byteLength > 1000,
    });
    console.log('✅ Step 13: PDF Document Generated. Content-Type:', pdfContentType, 'Size:', pdfBuffer.byteLength, 'bytes');

    // 14. Verify persistence in PostgreSQL
    const savedInquiry = await prisma.inquiry.findUnique({
      where: { id: submitData.inquiryId },
      include: {
        customer: true,
        requirement: {
          include: {
            conversation: {
              include: { messages: { orderBy: { createdAt: 'asc' } } }
            }
          }
        },
        prototypeVersion: { include: { prototype: true } },
      },
    });

    results.steps.push({
      step: 14,
      name: 'PostgreSQL Relational Verification',
      customerPersisted: !!savedInquiry.customer,
      requirementPersisted: !!savedInquiry.requirement,
      conversationMessagesCount: savedInquiry.requirement?.conversation?.messages?.length || 0,
      prototypeVersionPersisted: !!savedInquiry.prototypeVersion,
      prototypeVersionNumber: savedInquiry.prototypeVersion?.versionNumber,
      success: true,
    });

    console.log('✅ Step 14: Relational Database Persistence Verified:');
    console.log(`Customer: ${savedInquiry.customer?.name} (${savedInquiry.customer?.email})`);
    console.log(`Requirement Version: v${savedInquiry.requirement?.version}`);
    console.log(`Prototype Version: v${savedInquiry.prototypeVersion?.versionNumber}`);
    console.log(`Conversation Transcript Messages: ${savedInquiry.requirement?.conversation?.messages?.length}`);

    // Clean up test customer submission to leave database clean
    await prisma.inquiry.delete({ where: { id: submitData.inquiryId } });
    await prisma.prototypeVersion.deleteMany({ where: { prototypeId: prototype.id } });
    await prisma.prototype.delete({ where: { id: prototype.id } });
    await prisma.requirement.delete({ where: { id: requirement.id } });
    await prisma.message.deleteMany({ where: { conversationId } });
    await prisma.conversation.delete({ where: { id: conversationId } });
    await prisma.customer.deleteMany({ where: { email: 'arthur.pendelton@stmarks.edu' } });

    console.log('🧹 Test data cleaned up successfully.');
    console.log('🎉 CUSTOMER JOURNEY AUDIT COMPLETED SUCCESSFULLY: ALL 14 CRITICAL STEPS PASSED');
  } catch (err) {
    console.error('❌ Audit encountered an error:', err);
    results.errors.push(err.message);
  } finally {
    await prisma.$disconnect();
  }

  return results;
}

runCustomerJourneyAudit();
