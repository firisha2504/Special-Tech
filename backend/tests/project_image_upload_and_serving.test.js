import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prisma from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const uploadDir = path.resolve(backendRoot, 'uploads');

const BACKEND_URL = 'http://localhost:5050';
const FRONTEND_URL = 'http://localhost:5174';

describe('Project Image Upload, Static Serving, and Management Test Suite', () => {
  let adminToken = '';
  let uploadedCoverUrl = '';
  let uploadedScreenshotUrl = '';
  let testProjectId = '';
  const testProjectSlug = `test-upload-portal-${Date.now()}`;

  before(async () => {
    // Authenticate Admin
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
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
    assert.ok(adminToken, 'Admin token must be acquired');
  });

  after(async () => {
    // Clean up test project if created
    if (testProjectId) {
      await prisma.project.deleteMany({
        where: { id: testProjectId },
      });
    }
    // Clean up uploaded test files
    if (uploadedCoverUrl) {
      const coverFile = path.resolve(backendRoot, uploadedCoverUrl.replace(/^\//, ''));
      if (fs.existsSync(coverFile)) {
        try { fs.unlinkSync(coverFile); } catch (e) {}
      }
    }
    if (uploadedScreenshotUrl) {
      const screenshotFile = path.resolve(backendRoot, uploadedScreenshotUrl.replace(/^\//, ''));
      if (fs.existsSync(screenshotFile)) {
        try { fs.unlinkSync(screenshotFile); } catch (e) {}
      }
    }
  });

  it('1. Upload Rejection: Should reject invalid file types with HTTP 400 and friendly message', async () => {
    const invalidFileContent = 'echo "Malicious script"';
    const blob = new Blob([invalidFileContent], { type: 'application/x-sh' });
    const formData = new FormData();
    formData.append('image', blob, 'exploit.sh');

    const res = await fetch(`${BACKEND_URL}/api/projects/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData,
    });

    assert.strictEqual(res.status, 400, 'Should reject invalid file type with 400 Bad Request');
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(
      data.message.toLowerCase().includes('only jpeg') || data.message.toLowerCase().includes('invalid file type'),
      `Error message should indicate invalid file type: ${data.message}`
    );
  });

  it('2. Image Upload: Should accept valid JPEG image and save to disk with relative URL', async () => {
    // Minimal 1x1 JPEG binary
    const jpegBytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
      0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
      0x00, 0xbf, 0x00, 0xff, 0xd9,
    ]);

    const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('image', blob, 'test-cover.jpeg');

    const res = await fetch(`${BACKEND_URL}/api/projects/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData,
    });

    assert.strictEqual(res.status, 200, 'Upload request should succeed with 200');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.url.startsWith('/uploads/'), 'URL must be a relative /uploads/ path');
    assert.ok(data.data.url.endsWith('.jpeg'), 'Filename must preserve extension');
    uploadedCoverUrl = data.data.url;

    // Verify physical presence on disk in backend uploads directory
    const filename = data.data.filename;
    const physicalPath = path.join(uploadDir, filename);
    assert.ok(fs.existsSync(physicalPath), `File must physically exist at ${physicalPath}`);
    assert.strictEqual(fs.statSync(physicalPath).size, jpegBytes.length);
  });

  it('3. Image Upload: Should accept PNG screenshot and store independently', async () => {
    // Minimal 1x1 PNG binary
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const blob = new Blob([pngBytes], { type: 'image/png' });
    const formData = new FormData();
    formData.append('image', blob, 'test-screenshot.png');

    const res = await fetch(`${BACKEND_URL}/api/projects/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData,
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    uploadedScreenshotUrl = data.data.url;
    assert.ok(uploadedScreenshotUrl.endsWith('.png'));

    const filename = data.data.filename;
    const physicalPath = path.join(uploadDir, filename);
    assert.ok(fs.existsSync(physicalPath));
  });

  it('4. Static File Serving (Backend Port 5050): Uploaded images must be served with correct Content-Type', async () => {
    assert.ok(uploadedCoverUrl, 'Uploaded cover image path must exist');
    const res = await fetch(`${BACKEND_URL}${uploadedCoverUrl}`);
    assert.strictEqual(res.status, 200, 'Backend must serve uploaded file with 200 OK');
    assert.strictEqual(res.headers.get('content-type'), 'image/jpeg');
    const buffer = await res.arrayBuffer();
    assert.ok(buffer.byteLength > 0, 'Buffer must contain image data');
  });

  it('5. Static File Serving (Vite Proxy Port 5174): Frontend proxy must forward /uploads to backend seamlessly', async () => {
    assert.ok(uploadedCoverUrl, 'Uploaded cover image path must exist');
    const res = await fetch(`${FRONTEND_URL}${uploadedCoverUrl}`);
    assert.strictEqual(res.status, 200, 'Frontend proxy must serve uploaded image with 200 OK');
    assert.strictEqual(res.headers.get('content-type'), 'image/jpeg');
    // Must NOT be text/html (which was the bug causing broken images)
    assert.notStrictEqual(res.headers.get('content-type'), 'text/html');
  });

  it('6. Existing Image: image-1793512717259-441463983.jpeg must serve properly via both 5050 and 5174', async () => {
    const existingPath = '/uploads/image-1793512717259-441463983.jpeg';

    // Via Backend 5050
    const backendRes = await fetch(`${BACKEND_URL}${existingPath}`);
    assert.strictEqual(backendRes.status, 200);
    assert.strictEqual(backendRes.headers.get('content-type'), 'image/jpeg');

    // Via Frontend 5174
    const frontendRes = await fetch(`${FRONTEND_URL}${existingPath}`);
    assert.strictEqual(frontendRes.status, 200);
    assert.strictEqual(frontendRes.headers.get('content-type'), 'image/jpeg');
    assert.notStrictEqual(frontendRes.headers.get('content-type'), 'text/html');
  });

  it('7. Database Persistence: Create Project with cover image and screenshots', async () => {
    const projectPayload = {
      title: 'Automated Image Pipeline Portal',
      slug: testProjectSlug,
      category: 'Web Applications',
      shortDesc: 'End-to-end verification of image upload and asset pipelines',
      description: 'Comprehensive test case verifying that local computer image uploads retain relative paths in PostgreSQL and render seamlessly.',
      coverImage: uploadedCoverUrl,
      screenshots: [uploadedScreenshotUrl],
      technologies: ['React', 'Express', 'Multer', 'PostgreSQL', 'Prisma'],
      features: ['Independent Screenshot Upload', 'Real-time Preview', 'MIME Validation'],
      status: 'Published',
      isPublished: true,
      isFeatured: false,
    };

    const res = await fetch(`${BACKEND_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(projectPayload),
    });

    assert.strictEqual(res.status, 201, 'Project creation should return 201 Created');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.coverImage, uploadedCoverUrl);
    assert.deepStrictEqual(data.data.screenshots, [uploadedScreenshotUrl]);
    testProjectId = data.data.id;

    // Verify stored directly in PostgreSQL via Prisma
    const dbRecord = await prisma.project.findUnique({
      where: { id: testProjectId },
    });
    assert.ok(dbRecord);
    assert.strictEqual(dbRecord.coverImage, uploadedCoverUrl);
    assert.deepStrictEqual(dbRecord.screenshots, [uploadedScreenshotUrl]);
  });

  it('8. Project Retrieval: Public endpoint returns valid relative paths that resolve correctly', async () => {
    const res = await fetch(`${BACKEND_URL}/api/projects/${testProjectSlug}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.coverImage, uploadedCoverUrl);
    assert.strictEqual(data.data.screenshots[0], uploadedScreenshotUrl);
  });

  it('9. Project Update: Replace cover image and add screenshot without altering unrelated data', async () => {
    // Update project with additional screenshot
    const updateRes = await fetch(`${BACKEND_URL}/api/projects/${testProjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        screenshots: [uploadedScreenshotUrl, uploadedCoverUrl],
      }),
    });

    assert.strictEqual(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.strictEqual(updateData.success, true);
    assert.strictEqual(updateData.data.screenshots.length, 2);

    // Verify in database
    const dbRecord = await prisma.project.findUnique({
      where: { id: testProjectId },
    });
    assert.strictEqual(dbRecord.screenshots.length, 2);
    assert.strictEqual(dbRecord.coverImage, uploadedCoverUrl);
  });
});
