import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const BASE_URL = 'http://localhost:5050/api';

describe('Authentication & Authorization Security Audit', () => {
  let validToken = '';
  let adminUserId = '';

  it('should find the administrator account with a secure bcrypt password hash', async () => {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@specialtech.com' },
    });
    assert.ok(admin, 'Super administrator must exist in PostgreSQL');
    assert.strictEqual(admin.email, 'admin@specialtech.com');
    assert.strictEqual(admin.role, 'ADMIN');
    assert.strictEqual(admin.isActive, true);
    assert.ok(admin.passwordHash.startsWith('$2'), 'Password hash must be valid bcrypt');
    adminUserId = admin.id;
  });

  it('should reject login attempt with incorrect password', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@specialtech.com',
        password: 'DefinitivelyWrongPassword123!',
      }),
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.toLowerCase().includes('invalid'));
  });

  it('should reject login attempt with non-existent email', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent_hacker@example.com',
        password: 'SomePassword123!',
      }),
    });
    assert.strictEqual(res.status, 401);
  });

  it('should successfully authenticate administrator and return signed JWT with user profile', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@specialtech.com',
        password: 'Admin@123456',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.token, 'JWT token must be returned');
    assert.strictEqual(data.user.role, 'ADMIN');
    validToken = data.token;

    // Verify token structure
    const decoded = jwt.decode(data.token);
    assert.strictEqual(decoded.email, 'admin@specialtech.com');
    assert.strictEqual(decoded.role, 'ADMIN');
  });

  it('should reject unauthenticated request to protected admin endpoint', async () => {
    const res = await fetch(`${BASE_URL}/admin/stats`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  it('should reject request with forged or invalid JWT token', async () => {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: 'Bearer forged.token.signature' },
    });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  it('should grant access to protected admin endpoints with valid admin token', async () => {
    assert.ok(validToken, 'Must have a valid token from previous test');
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.kpis);
  });
});
