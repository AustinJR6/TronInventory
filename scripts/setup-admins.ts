import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdmins() {
  try {
    // Find or create Tron company
    let tronCompany = await prisma.company.findFirst({
      where: { name: { contains: 'Tron', mode: 'insensitive' } }
    });

    if (!tronCompany) {
      tronCompany = await prisma.company.create({
        data: {
          name: 'Tron Electric',
          slug: 'tron-electric',
        }
      });
      console.log('Created Tron Electric company:', tronCompany.id);
    } else {
      console.log('Found Tron company:', tronCompany.id, tronCompany.name);
    }

    // Find or create Test company
    let testCompany = await prisma.company.findFirst({
      where: {
        OR: [
          { name: { contains: 'Test', mode: 'insensitive' } },
          { name: { contains: 'Tenant 2', mode: 'insensitive' } }
        ]
      }
    });

    if (!testCompany) {
      testCompany = await prisma.company.create({
        data: {
          name: 'Test Company 2',
          slug: 'test-company-2',
        }
      });
      console.log('Created Test Company 2:', testCompany.id);
    } else {
      console.log('Found Test company:', testCompany.id, testCompany.name);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Solar2025!', 10);

    // Create/update Tron admin
    const tronAdmin = await prisma.user.upsert({
      where: { email: 'raustinj39@gmail.com' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        companyId: tronCompany.id,
        name: 'Tron Admin',
      },
      create: {
        email: 'raustinj39@gmail.com',
        password: hashedPassword,
        name: 'Tron Admin',
        role: 'ADMIN',
        companyId: tronCompany.id,
      }
    });
    console.log('Setup Tron admin:', tronAdmin.email);

    // Create/update Test company admin
    const testAdmin = await prisma.user.upsert({
      where: { email: 'tennant2@outlook.com' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        companyId: testCompany.id,
        name: 'Test Admin',
      },
      create: {
        email: 'tennant2@outlook.com',
        password: hashedPassword,
        name: 'Test Admin',
        role: 'ADMIN',
        companyId: testCompany.id,
      }
    });
    console.log('Setup Test admin:', testAdmin.email);

    // Create/update licenses
    const tronLicense = await prisma.license.upsert({
      where: { companyId: tronCompany.id },
      update: {
        tier: 'OPS_SCAN_PO',
        status: 'ACTIVE',
        expiresAt: new Date('2026-12-31'),
      },
      create: {
        companyId: tronCompany.id,
        tier: 'OPS_SCAN_PO',
        status: 'ACTIVE',
        expiresAt: new Date('2026-12-31'),
      }
    });
    console.log('Tron license:', tronLicense.tier, tronLicense.status);

    const testLicense = await prisma.license.upsert({
      where: { companyId: testCompany.id },
      update: {
        tier: 'OPS_SCAN_PO',
        status: 'ACTIVE',
        expiresAt: new Date('2026-12-31'),
      },
      create: {
        companyId: testCompany.id,
        tier: 'OPS_SCAN_PO',
        status: 'ACTIVE',
        expiresAt: new Date('2026-12-31'),
      }
    });
    console.log('Test company license:', testLicense.tier, testLicense.status);

    console.log('\n✅ Setup complete!');
    console.log('\nTron Electric (' + tronCompany.id + ')');
    console.log('  Admin:', tronAdmin.email);
    console.log('  Password: Solar2025!');
    console.log('  License:', tronLicense.tier, '-', tronLicense.status);
    console.log('\n' + testCompany.name + ' (' + testCompany.id + ')');
    console.log('  Admin:', testAdmin.email);
    console.log('  Password: Solar2025!');
    console.log('  License:', testLicense.tier, '-', testLicense.status);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmins();
