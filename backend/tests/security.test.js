import { describe, it } from 'node:test';
import assert from 'node:assert';
import prisma from '../src/config/db.js';

const BASE_URL = 'http://localhost:5050/api';

describe('Customer Data Isolation & Security Authorization Audit', () => {
  let sessionTokenA = '';
  let conversationIdA = '';
  let sessionTokenB = '';
  let conversationIdB = '';

  it('Setup: Should create distinct sessions for Customer A and Customer B', async () => {
    sessionTokenA = `sess_customer_a_${Date.now()}`;
    sessionTokenB = `sess_customer_b_${Date.now()}`;

    // Customer A
    const resA = await fetch(`${BASE_URL}/ai/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken: sessionTokenA }),
    });
    const dataA = await resA.json();
    assert.strictEqual(dataA.success, true);
    conversationIdA = dataA.conversationId;

    // Customer B
    const resB = await fetch(`${BASE_URL}/ai/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken: sessionTokenB }),
    });
    const dataB = await resB.json();
    assert.strictEqual(dataB.success, true);
    conversationIdB = dataB.conversationId;

    assert.notStrictEqual(conversationIdA, conversationIdB);
  });

  it('Security: Customer B must be BLOCKED from reading Customer A conversation', async () => {
    // Customer B provides their own session token while requesting Customer A's conversation ID
    const res = await fetch(`${BASE_URL}/ai/conversations/${conversationIdA}?sessionToken=${sessionTokenB}`);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('mismatch'));
  });

  it('Security: Customer B must be BLOCKED from injecting messages into Customer A conversation', async () => {
    const res = await fetch(`${BASE_URL}/ai/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: conversationIdA,
        sessionToken: sessionTokenB,
        message: 'Malicious injection attempt from Customer B',
      }),
    });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('mismatch'));
  });

  it('Security: Unauthenticated visitors must be BLOCKED from accessing private inquiries list', async () => {
    const res = await fetch(`${BASE_URL}/inquiries`);
    assert.strictEqual(res.status, 401);
  });

  it('Security: Unauthenticated visitors must be BLOCKED from updating inquiry status', async () => {
    const res = await fetch(`${BASE_URL}/inquiries/fake-id/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    assert.strictEqual(res.status, 401);
  });

  it('Security: Unauthenticated visitors must be BLOCKED from executing admin actions', async () => {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'test_key', value: 'injected' }),
    });
    assert.strictEqual(res.status, 401);
  });

  it('Cleanup: Should safely purge test conversation sessions', async () => {
    await prisma.message.deleteMany({ where: { conversationId: { in: [conversationIdA, conversationIdB] } } });
    await prisma.conversation.deleteMany({ where: { id: { in: [conversationIdA, conversationIdB] } } });
  });
});
