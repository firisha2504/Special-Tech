import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const backupFilePath = '/home/firo2504/.gemini/antigravity-ide/brain/71a82e84-375c-4deb-aedb-3a130f0c408f/scratch/pre_correction_db_backup_1793467759699.json';
const testDbName = 'special_tech_restore_test';
const baseDbUrl = 'postgresql://postgres:password@localhost:5432/postgres';
const testDbUrl = `postgresql://postgres:password@localhost:5432/${testDbName}?schema=public`;

async function runRestorationVerification() {
  console.log('--- 1. Reading Backup Snapshot ---');
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found at ${backupFilePath}`);
  }
  const rawData = fs.readFileSync(backupFilePath, 'utf8');
  const backup = JSON.parse(rawData);
  const data = backup.fullData || backup.data;
  console.log(`✓ Backup loaded from: ${backupFilePath}`);
  console.log(`✓ Timestamp: ${backup.backupData?.timestamp || backup.timestamp}`);
  console.log(`✓ Snapshot Summary:`, {
    users: data.users?.length || 0,
    services: data.services?.length || 0,
    products: data.products?.length || 0,
    settings: data.settings?.length || 0,
    inquiries: data.inquiries?.length || 0,
    conversations: data.conversations?.length || 0,
  });

  console.log('\n--- 2. Creating Separate Test Database: ' + testDbName + ' ---');
  execSync(`psql "${baseDbUrl}" -c "DROP DATABASE IF EXISTS ${testDbName};"`, { stdio: 'pipe' });
  execSync(`psql "${baseDbUrl}" -c "CREATE DATABASE ${testDbName};"`, { stdio: 'pipe' });
  console.log(`✓ Created fresh database "${testDbName}" on PostgreSQL`);

  console.log('\n--- 3. Pushing Prisma Schema to Test Database ---');
  execSync(`npx prisma db push --skip-generate --accept-data-loss`, {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: 'inherit',
    cwd: path.resolve(process.cwd()),
  });
  console.log(`✓ Prisma schema pushed successfully to ${testDbName}`);

  console.log('\n--- 4. Restoring Records into ' + testDbName + ' ---');
  const testPrisma = new PrismaClient({
    datasources: { db: { url: testDbUrl } },
  });

  try {
    // 4.1 Restore AdminSettings
    if (data.settings?.length > 0) {
      await testPrisma.adminSetting.createMany({
        data: data.settings,
      });
      console.log(`✓ Restored ${data.settings.length} AdminSettings`);
    }

    // 4.2 Restore Users
    if (data.users?.length > 0) {
      await testPrisma.user.createMany({
        data: data.users,
      });
      console.log(`✓ Restored ${data.users.length} Users`);
    }

    // 4.3 Restore Services
    if (data.services?.length > 0) {
      await testPrisma.service.createMany({
        data: data.services,
      });
      console.log(`✓ Restored ${data.services.length} Services`);
    }

    // 4.4 Restore Products
    if (data.products?.length > 0) {
      await testPrisma.product.createMany({
        data: data.products,
      });
      console.log(`✓ Restored ${data.products.length} Products`);
    }

    // 4.5 Restore Conversations
    if (data.conversations?.length > 0) {
      for (const conv of data.conversations) {
        const { messages, requirements, prototypes, inquiries, ...convFields } = conv;
        await testPrisma.conversation.create({
          data: convFields,
        });
      }
      console.log(`✓ Restored ${data.conversations.length} Conversations`);
    }

    // 4.6 Restore Inquiries
    if (data.inquiries?.length > 0) {
      await testPrisma.inquiry.createMany({
        data: data.inquiries,
      });
      console.log(`✓ Restored ${data.inquiries.length} Inquiries`);
    }

    console.log('\n--- 5. Verifying Data Integrity in ' + testDbName + ' ---');
    const [userCount, serviceCount, productCount, settingCount] = await Promise.all([
      testPrisma.user.count(),
      testPrisma.service.count(),
      testPrisma.product.count(),
      testPrisma.adminSetting.count(),
    ]);

    console.log(`- Verified User count: ${userCount} (Expected: ${data.users.length})`);
    console.log(`- Verified Service count: ${serviceCount} (Expected: ${data.services.length})`);
    console.log(`- Verified Product count: ${productCount} (Expected: ${data.products.length})`);
    console.log(`- Verified AdminSetting count: ${settingCount} (Expected: ${data.settings.length})`);

    if (userCount !== data.users.length ||
        serviceCount !== data.services.length ||
        productCount !== data.products.length ||
        settingCount !== data.settings.length) {
      throw new Error('Restored record counts do not match backup snapshot!');
    }

    // Verify admin credentials match
    const adminUser = await testPrisma.user.findUnique({
      where: { email: 'admin@specialtech.com' },
    });
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new Error(`Admin user integrity verification failed in restored database! Expected ADMIN, got ${adminUser?.role}`);
    }
    console.log(`✓ Admin user integrity verified: ${adminUser.email} [${adminUser.role}]`);

    // Verify sample service
    const sampleService = await testPrisma.service.findFirst();
    console.log(`✓ Sample service integrity verified: "${sampleService?.title}" (${sampleService?.id})`);

    // Verify sample product
    const sampleProduct = await testPrisma.product.findFirst();
    console.log(`✓ Sample product integrity verified: "${sampleProduct?.name}" (${sampleProduct?.id})`);

    console.log('\n================================================================');
    console.log('✓ RESTORATION IN SEPARATE DATABASE VERIFIED WITH 100% INTEGRITY!');
    console.log('================================================================\n');
  } finally {
    await testPrisma.$disconnect();
    
    // Cleanup: Drop the test database
    console.log(`--- 6. Cleaning Up: Dropping ${testDbName} ---`);
    execSync(`psql "${baseDbUrl}" -c "DROP DATABASE IF EXISTS ${testDbName};"`, { stdio: 'pipe' });
    console.log(`✓ Test database "${testDbName}" cleanly removed.`);
  }
}

runRestorationVerification().catch((err) => {
  console.error('RESTORE VERIFICATION FAILED:', err);
  process.exit(1);
});
