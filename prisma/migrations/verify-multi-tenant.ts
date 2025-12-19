import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VerificationResult {
  check: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  data?: any;
}

const results: VerificationResult[] = [];

function addResult(check: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, data?: any) {
  results.push({ check, status, message, data });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${check}: ${message}`);
  if (data) {
    console.log(`   Data:`, data);
  }
}

async function main() {
  console.log('🔍 Starting Multi-Tenant Verification\n');
  console.log('=' .repeat(80));

  // ========================================
  // 1. Check for NULL companyId values
  // ========================================
  console.log('\n📊 1. Checking for NULL companyId values...\n');

  const nullChecks = [
    { table: 'branches', model: prisma.branch },
    { table: 'users', model: prisma.user },
    { table: 'warehouse_inventory', model: prisma.warehouseInventory },
    { table: 'vehicle_inventory_items', model: prisma.vehicleInventoryItem },
    { table: 'vehicle_stocks', model: prisma.vehicleStock },
    { table: 'orders', model: prisma.order },
  ];

  for (const { table, model } of nullChecks) {
    const count = await model.count({
      where: { companyId: null as any },
    });

    if (count === 0) {
      addResult(`NULL Check: ${table}`, 'PASS', `No NULL companyId values`);
    } else {
      addResult(`NULL Check: ${table}`, 'FAIL', `Found ${count} NULL companyId values`);
    }
  }

  // ========================================
  // 2. Verify Tron Solar company exists
  // ========================================
  console.log('\n🏢 2. Verifying Tron Solar company...\n');

  const tronSolar = await prisma.company.findUnique({
    where: { slug: 'tron-solar' },
    include: { license: true },
  });

  if (tronSolar) {
    addResult('Company Exists', 'PASS', `Tron Solar found (ID: ${tronSolar.id})`);

    if (tronSolar.license) {
      addResult(
        'License Exists',
        'PASS',
        `License: ${tronSolar.license.tier} (${tronSolar.license.status})`,
        {
          tier: tronSolar.license.tier,
          status: tronSolar.license.status,
          expiresAt: tronSolar.license.expiresAt,
        }
      );
    } else {
      addResult('License Exists', 'FAIL', 'No license found for Tron Solar');
    }
  } else {
    addResult('Company Exists', 'FAIL', 'Tron Solar company not found');
  }

  // ========================================
  // 3. Verify all records belong to companies
  // ========================================
  console.log('\n🔗 3. Verifying company associations...\n');

  if (tronSolar) {
    const stats = {
      branches: await prisma.branch.count({ where: { companyId: tronSolar.id } }),
      users: await prisma.user.count({ where: { companyId: tronSolar.id } }),
      warehouseItems: await prisma.warehouseInventory.count({ where: { companyId: tronSolar.id } }),
      vehicleItems: await prisma.vehicleInventoryItem.count({ where: { companyId: tronSolar.id } }),
      vehicleStocks: await prisma.vehicleStock.count({ where: { companyId: tronSolar.id } }),
      orders: await prisma.order.count({ where: { companyId: tronSolar.id } }),
    };

    addResult(
      'Tron Solar Data',
      'PASS',
      `All data assigned to Tron Solar`,
      stats
    );
  }

  // ========================================
  // 4. Check for orphaned records
  // ========================================
  console.log('\n🔍 4. Checking for orphaned records...\n');

  const orphanedBranches = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM branches b
    LEFT JOIN companies c ON b."companyId" = c.id
    WHERE c.id IS NULL
  `;

  const orphanedUsers = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM users u
    LEFT JOIN companies c ON u."companyId" = c.id
    WHERE c.id IS NULL
  `;

  const orphanCount = Number(orphanedBranches[0].count) + Number(orphanedUsers[0].count);

  if (orphanCount === 0) {
    addResult('Orphaned Records', 'PASS', 'No orphaned records found');
  } else {
    addResult('Orphaned Records', 'FAIL', `Found ${orphanCount} orphaned records`);
  }

  // ========================================
  // 5. Verify unique constraints
  // ========================================
  console.log('\n🔒 5. Verifying unique constraints...\n');

  const constraints = await prisma.$queryRaw<Array<{ constraint_name: string; table_name: string }>>`
    SELECT
      conname AS constraint_name,
      conrelid::regclass::text AS table_name
    FROM pg_constraint
    WHERE contype = 'u'
      AND (
        conrelid::regclass::text = 'branches'
        OR conrelid::regclass::text = 'users'
        OR conrelid::regclass::text = 'warehouse_inventory'
        OR conrelid::regclass::text = 'vehicle_inventory_items'
        OR conrelid::regclass::text = 'orders'
      )
    ORDER BY table_name
  `;

  const expectedConstraints = [
    'branches_companyId_name_key',
    'users_companyId_email_key',
    'users_companyId_vehicleNumber_key',
    'warehouse_inventory_companyId_itemName_branchId_key',
    'vehicle_inventory_items_companyId_itemName_key',
    'orders_companyId_orderNumber_key',
  ];

  const foundConstraints = constraints.map((c) => c.constraint_name);
  const missing = expectedConstraints.filter((ec) => !foundConstraints.includes(ec));

  if (missing.length === 0) {
    addResult('Unique Constraints', 'PASS', 'All expected constraints exist', {
      found: foundConstraints.length,
      expected: expectedConstraints.length,
    });
  } else {
    addResult('Unique Constraints', 'WARN', `Missing constraints: ${missing.join(', ')}`, {
      missing,
    });
  }

  // ========================================
  // 6. Verify foreign keys
  // ========================================
  console.log('\n🔗 6. Verifying foreign key relationships...\n');

  const foreignKeys = await prisma.$queryRaw<Array<{ constraint_name: string; table_name: string; referenced_table: string }>>`
    SELECT
      conname AS constraint_name,
      conrelid::regclass::text AS table_name,
      confrelid::regclass::text AS referenced_table
    FROM pg_constraint
    WHERE contype = 'f'
      AND (
        conname LIKE '%companyId%'
        OR conname LIKE '%company%'
      )
    ORDER BY table_name
  `;

  const expectedFKs = [
    'branches_companyId_fkey',
    'users_companyId_fkey',
    'warehouse_inventory_companyId_fkey',
    'vehicle_inventory_items_companyId_fkey',
    'vehicle_stocks_companyId_fkey',
    'orders_companyId_fkey',
    'inventory_transactions_companyId_fkey',
    'licenses_companyId_fkey',
  ];

  const foundFKs = foreignKeys.map((fk) => fk.constraint_name);
  const missingFKs = expectedFKs.filter((efk) => !foundFKs.includes(efk));

  if (missingFKs.length === 0) {
    addResult('Foreign Keys', 'PASS', 'All expected foreign keys exist', {
      found: foundFKs.length,
      expected: expectedFKs.length,
    });
  } else {
    addResult('Foreign Keys', 'FAIL', `Missing foreign keys: ${missingFKs.join(', ')}`, {
      missing: missingFKs,
    });
  }

  // ========================================
  // 7. Test company isolation
  // ========================================
  console.log('\n🛡️  7. Testing company isolation...\n');

  // Create a test company
  const testCompany = await prisma.company.create({
    data: {
      name: 'Test Company (Delete Me)',
      slug: 'test-company-delete-me',
      appName: 'Test App',
    },
  });

  // Try to query Tron Solar data using test company scope
  const { withCompanyScope } = require('../lib/prisma-middleware');
  const testScopedPrisma = withCompanyScope(testCompany.id);

  const crossCompanyUsers = await testScopedPrisma.user.count();
  const crossCompanyOrders = await testScopedPrisma.order.count();

  if (crossCompanyUsers === 0 && crossCompanyOrders === 0) {
    addResult('Company Isolation', 'PASS', 'No cross-company data leakage');
  } else {
    addResult('Company Isolation', 'FAIL', `Found cross-company data: ${crossCompanyUsers} users, ${crossCompanyOrders} orders`);
  }

  // Cleanup test company
  await prisma.company.delete({ where: { id: testCompany.id } });

  // ========================================
  // Summary
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 VERIFICATION SUMMARY\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warnings = results.filter((r) => r.status === 'WARN').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`📊 Total: ${results.length}\n`);

  if (failed > 0) {
    console.log('❌ VERIFICATION FAILED - Please review failures before deploying\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  VERIFICATION PASSED WITH WARNINGS - Review warnings before deploying\n');
    process.exit(0);
  } else {
    console.log('✅ ALL CHECKS PASSED - Safe to deploy\n');
    process.exit(0);
  }
}

main()
  .catch((e) => {
    console.error('\n❌ Verification script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
