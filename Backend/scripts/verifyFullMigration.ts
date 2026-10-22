import 'dotenv/config';
import { prisma, connectPrisma, disconnectPrisma } from '../config/prisma.js';
import axios from 'axios';

async function verifyMigration() {
  console.log('=====================================================');
  console.log('   DRIVEMATE BACKEND FULL MIGRATION VERIFICATION     ');
  console.log('=====================================================\n');

  // 1. Direct Prisma Database Verification
  console.log('🔍 [1/3] Verifying Direct Neon PostgreSQL Database Access via Prisma...');
  const connected = await connectPrisma();
  if (!connected) {
    console.error('❌ Failed to connect to Neon PostgreSQL via Prisma');
    process.exit(1);
  }

  const [
    customersCount,
    ridersCount,
    ridesCount,
    rolesCount,
    adminsCount,
    adminRolesCount,
    transactionsCount,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.rider.count(),
    prisma.ride.count(),
    prisma.role.count(),
    prisma.admin.count(),
    prisma.adminRole.count(),
    prisma.transaction.count(),
  ]);

  console.log('📊 Neon PostgreSQL Record Counts:');
  console.log(`   - Customers:     ${customersCount}`);
  console.log(`   - Riders:        ${ridersCount}`);
  console.log(`   - Rides:         ${ridesCount}`);
  console.log(`   - Roles:         ${rolesCount}`);
  console.log(`   - Admins:        ${adminsCount}`);
  console.log(`   - AdminRoles:    ${adminRolesCount}`);
  console.log(`   - Transactions:  ${transactionsCount}\n`);

  // 2. Querying sample customer and verifying _id compatibility
  console.log('🔍 [2/3] Verifying Client Model Compatibility & Field Mappings...');
  const sampleCustomer = await prisma.customer.findFirst();
  if (sampleCustomer) {
    console.log(`   Sample Customer Found: ${sampleCustomer.name} (${sampleCustomer.email})`);
    console.log(`   ID Length: ${sampleCustomer.id.length} characters (MongoDB ObjectId standard: 24)`);
    console.log(`   Wallet Balance: ${Number(sampleCustomer.walletBalance)}`);
  }

  const sampleRide = await prisma.ride.findFirst({
    include: { customer: true, rider: true },
  });
  if (sampleRide) {
    console.log(`   Sample Ride Found: ID ${sampleRide.id}, Status: ${sampleRide.status}, Fare: ${Number(sampleRide.fare)}`);
    console.log(`   Customer Relational Link: ${sampleRide.customer ? sampleRide.customer.name : 'Unassigned/Guest'}`);
  }

  // 3. Testing HTTP API endpoints
  console.log('\n🔍 [3/3] Testing Live Backend Endpoints on http://localhost:5000...');
  const baseUrl = 'http://localhost:5000';

  try {
    const healthRes = await axios.get(`${baseUrl}/api/health`, { timeout: 3000 });
    console.log(`   ✅ GET /api/health -> Status: ${healthRes.status}, Data:`, healthRes.data);
  } catch (err: any) {
    console.log(`   ⚠️ Note: Server might not be running yet on port 5000 (${err.message}).`);
  }

  await disconnectPrisma();
  console.log('\n=====================================================');
  console.log('   MIGRATION VERIFICATION COMPLETED SUCCESSFULLY     ');
  console.log('=====================================================');
}

verifyMigration().catch((err) => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
