import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdmin() {
  console.log('Updating admin user...');

  // Hash the new password
  const hashedPassword = await bcrypt.hash('Solar2025!', 10);

  // Update or create the admin user
  const admin = await prisma.user.upsert({
    where: { email: 'raustinj39@gmail.com' },
    update: {
      password: hashedPassword,
      active: true,
    },
    create: {
      email: 'raustinj39@gmail.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
      active: true,
    },
  });

  console.log('✅ Admin user updated successfully!');
  console.log('Email:', admin.email);
  console.log('Password: Solar2025!');
  console.log('Role:', admin.role);

  // Also check if old admin exists and deactivate it
  const oldAdmin = await prisma.user.findUnique({
    where: { email: 'admin@tronsolar.com' },
  });

  if (oldAdmin) {
    await prisma.user.update({
      where: { email: 'admin@tronsolar.com' },
      data: { active: false },
    });
    console.log('✅ Deactivated old admin account');
  }
}

updateAdmin()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
