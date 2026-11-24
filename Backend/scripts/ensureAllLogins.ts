import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma, connectPrisma } from '../config/prisma.js';

async function ensureAllLogins() {
  console.log('🔍 Connecting to Neon PostgreSQL and verifying login credentials...');
  for (let i = 1; i <= 4; i++) {
    try {
      const ok = await connectPrisma();
      if (ok) break;
    } catch (e: any) {
      console.log(`Connection attempt ${i} waiting 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const defaultPassword = 'Password@123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);

  // 1. MASTER ADMIN (http://localhost:5173/master)
  const adminRole = await prisma.role.findFirst({ where: { code: 'ADMIN' } });
  let admin = await prisma.admin.findUnique({ where: { email: 'admin@drivemate.com' } });
  if (admin) {
    await prisma.admin.update({
      where: { email: 'admin@drivemate.com' },
      data: { password: adminPasswordHash, isActive: true },
    });
    console.log('✅ Master Admin updated: admin@drivemate.com (password: admin123)');
  } else {
    admin = await prisma.admin.create({
      data: {
        id: crypto.randomBytes(12).toString('hex'),
        name: 'Master Administrator',
        email: 'admin@drivemate.com',
        password: adminPasswordHash,
        isActive: true,
      },
    });
    console.log('✅ Master Admin created: admin@drivemate.com (password: admin123)');
  }
  if (adminRole && admin) {
    await prisma.adminRole.upsert({
      where: { adminId_roleId: { adminId: admin.id, roleId: adminRole.id } },
      create: { adminId: admin.id, roleId: adminRole.id },
      update: {},
    });
  }

  // 2. DRIVER / RIDER PARTNER (RiderApp)
  const driverAccounts = [
    {
      name: 'Rajesh Sharma (Driver Partner)',
      email: 'driver@drivemate.com',
      phone: '9876543210',
      vehicleType: 'car',
    },
    {
      name: 'Ramesh Patel (Driver Partner)',
      email: 'ramesh.patel@drivemate.in',
      phone: '9876543211',
      vehicleType: 'bike',
    },
  ];

  for (const drv of driverAccounts) {
    let rider = await prisma.rider.findFirst({
      where: {
        OR: [
          { email: drv.email },
          { phone: drv.phone },
        ],
      },
    });

    if (rider) {
      await prisma.rider.update({
        where: { id: rider.id },
        data: {
          password: hashedPassword,
          isAvailable: true,
          email: drv.email,
          phone: drv.phone,
        },
      });
      console.log(`✅ Driver/Rider updated: ${drv.email} / ${drv.phone} (password: ${defaultPassword})`);
    } else {
      rider = await prisma.rider.create({
        data: {
          id: crypto.randomBytes(12).toString('hex'),
          name: drv.name,
          email: drv.email,
          phone: drv.phone,
          password: hashedPassword,
          vehicleType: drv.vehicleType,
          isAvailable: true,
        },
      });
      console.log(`✅ Driver/Rider created: ${drv.email} / ${drv.phone} (password: ${defaultPassword})`);
    }
  }

  // 3. COMMUTER / CUSTOMER (CustomerApp & Web)
  const customerAccounts = [
    {
      name: 'Ananya Roy (Commuter)',
      email: 'customer@drivemate.com',
      phone: '9884522109',
    },
    {
      name: 'Pooja Hegde (Commuter)',
      email: 'customer@drivemate.in',
      phone: '9884522108',
    },
  ];

  for (const cust of customerAccounts) {
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: cust.email },
          { phone: cust.phone },
        ],
      },
    });

    if (customer) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          password: hashedPassword,
          email: cust.email,
          phone: cust.phone,
        },
      });
      console.log(`✅ Customer updated: ${cust.email} / ${cust.phone} (password: ${defaultPassword})`);
    } else {
      customer = await prisma.customer.create({
        data: {
          id: crypto.randomBytes(12).toString('hex'),
          name: cust.name,
          email: cust.email,
          phone: cust.phone,
          password: hashedPassword,
          role: 'customer',
          walletBalance: 500.0,
        },
      });
      console.log(`✅ Customer created: ${cust.email} / ${cust.phone} (password: ${defaultPassword})`);
    }
  }

  console.log('\n======================================================');
  console.log('✅ ALL LOGIN CREDENTIALS CONFIGURED & VERIFIED!');
  console.log('======================================================');

  await prisma.$disconnect();
}

ensureAllLogins().catch(e => {
  console.error('Login setup error:', e);
  process.exit(1);
});
