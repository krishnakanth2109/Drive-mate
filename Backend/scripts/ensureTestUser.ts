import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { getFirebaseAuth } from '../config/firebaseAdmin.js';

async function main() {
  console.log('🌱 Seeding / verifying test commuter credentials...');

  const testEmail = 'testuser@drivemate.com';
  const testPassword = 'Password@123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(testPassword, salt);

  // 1. Ensure test user in PostgreSQL Prisma database
  let customer = await prisma.customer.findUnique({
    where: { email: testEmail },
  });

  if (customer) {
    customer = await prisma.customer.update({
      where: { email: testEmail },
      data: {
        name: 'Alex Carter (Test Commuter)',
        firstName: 'Alex',
        lastName: 'Carter',
        password: hashedPassword,
        phone: '+91 98845 22109',
        role: 'customer',
        profession: 'Lead Cloud Architect',
        company: 'Tech Mahindra / Whitefield',
        industry: 'Cloud & Software Architecture',
        city: 'Bangalore',
        purpose: 'Daily Tech Park Commute & Carpool',
        walletBalance: 500.0,
        isEmailVerified: true,
      },
    });
    console.log('✅ Updated test commuter in Postgres database:', customer.email);
  } else {
    customer = await prisma.customer.create({
      data: {
        id: crypto.randomBytes(12).toString('hex'),
        name: 'Alex Carter (Test Commuter)',
        firstName: 'Alex',
        lastName: 'Carter',
        email: testEmail,
        phone: '+91 98845 22109',
        password: hashedPassword,
        role: 'customer',
        profession: 'Lead Cloud Architect',
        company: 'Tech Mahindra / Whitefield',
        industry: 'Cloud & Software Architecture',
        city: 'Bangalore',
        purpose: 'Daily Tech Park Commute & Carpool',
        walletBalance: 500.0,
        isEmailVerified: true,
      },
    });
    console.log('✅ Created test commuter in Postgres database:', customer.email);
  }

  // Also ensure demo@drivemate.in exists
  const demoEmail = 'demo@drivemate.in';
  let demoCustomer = await prisma.customer.findUnique({ where: { email: demoEmail } });
  if (!demoCustomer) {
    await prisma.customer.create({
      data: {
        id: crypto.randomBytes(12).toString('hex'),
        name: 'Pooja Hegde',
        firstName: 'Pooja',
        lastName: 'Hegde',
        email: demoEmail,
        phone: '+91 98845 22109',
        password: hashedPassword,
        role: 'customer',
        profession: 'Product Designer',
        company: 'Swiggy HQ',
        industry: 'Internet / Consumer Tech',
        city: 'Bangalore',
        purpose: 'Daily Commute & Sustainable Carpool',
        walletBalance: 500.0,
        isEmailVerified: true,
      },
    });
    console.log('✅ Created demo commuter in Postgres database:', demoEmail);
  }

  // 2. Ensure test user in Firebase Auth
  try {
    const auth = getFirebaseAuth();
    try {
      await auth.getUserByEmail(testEmail);
      console.log('✅ User already exists in Firebase Auth:', testEmail);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        const fbUser = await auth.createUser({
          email: testEmail,
          password: testPassword,
          displayName: 'Alex Carter (Test Commuter)',
          emailVerified: true,
        });
        console.log('✅ Created user in Firebase Auth:', testEmail, fbUser.uid);
      } else {
        console.warn('Firebase Auth notice:', err.message);
      }
    }
  } catch (fbErr: any) {
    console.warn('Firebase setup notice:', fbErr.message);
  }

  console.log('\n======================================================');
  console.log('🎉 TEST COMMUTER CREDENTIALS:');
  console.log('Email:    testuser@drivemate.com');
  console.log('Password: Password@123');
  console.log('Role:     Commuter / Customer');
  console.log('City:     Bangalore');
  console.log('Balance:  ₹500.00');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
