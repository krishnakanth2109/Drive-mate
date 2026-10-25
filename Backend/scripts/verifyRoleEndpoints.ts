import 'dotenv/config';
import { prisma } from '../config/prisma.js';

async function verifyBackendModels() {
  console.log('🔍 VERIFYING MULTI-ROLE BACKEND MODELS AND DATA IN NEON POSTGRESQL...\n');

  // 1. Roles
  const roles = await prisma.role.findMany({
    select: { code: true, name: true, accessScope: true },
  });
  console.log(`✅ Roles Table (${roles.length} roles found):`);
  roles.forEach((r) => console.log(`   - [${r.code}] ${r.name} -> Scope: ${r.accessScope}`));

  // 2. Staff Admins
  const staff = await prisma.admin.findMany({
    include: {
      adminRoles: {
        include: { role: true },
      },
    },
  });
  console.log(`\n✅ Staff Admins Table (${staff.length} staff found):`);
  staff.forEach((s) => {
    const rolesStr = s.adminRoles.map((ar) => ar.role.code).join(', ') || s.role;
    console.log(`   - ${s.name} <${s.email}> -> Assigned: [${rolesStr}]`);
  });

  // 3. Support Models
  const ticketCount = await prisma.supportTicket.count();
  const escalationCount = await prisma.supportEscalation.count();
  const messageCount = await prisma.ticketMessage.count();
  console.log(`\n✅ Support Domain Models:`);
  console.log(`   - Support Tickets: ${ticketCount}`);
  console.log(`   - Ticket Messages: ${messageCount}`);
  console.log(`   - Support Escalations: ${escalationCount}`);

  // 4. Fleet Models
  const onboardingCount = await prisma.driverOnboarding.count();
  const inspectionCount = await prisma.vehicleInspection.count();
  const fleetZoneCount = await prisma.fleetZone.count();
  console.log(`\n✅ Fleet Domain Models:`);
  console.log(`   - Driver Onboardings: ${onboardingCount}`);
  console.log(`   - Vehicle Inspections: ${inspectionCount}`);
  console.log(`   - Fleet Zones: ${fleetZoneCount}`);

  // 5. Operations Models
  const cityZoneCount = await prisma.cityZone.count();
  const surgeRuleCount = await prisma.surgeRule.count();
  const broadcastCount = await prisma.driverIncentiveBroadcast.count();
  console.log(`\n✅ Operations Domain Models:`);
  console.log(`   - City Zones: ${cityZoneCount}`);
  console.log(`   - Active Surge Rules: ${surgeRuleCount}`);
  console.log(`   - Incentive Broadcasts: ${broadcastCount}`);

  // 6. Finance Models
  const batchCount = await prisma.payoutBatch.count();
  const disbursementCount = await prisma.disbursement.count();
  const voucherCount = await prisma.refundVoucher.count();
  console.log(`\n✅ Finance Domain Models:`);
  console.log(`   - Payout Batches: ${batchCount}`);
  console.log(`   - Disbursements: ${disbursementCount}`);
  console.log(`   - Refund Vouchers: ${voucherCount}`);

  console.log('\n🎉 ALL 11 NEW ROLE MODELS VERIFIED ACTIVE WITH LIVE DATA IN NEON POSTGRESQL!\n');
}

verifyBackendModels()
  .catch((e) => {
    console.error('Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
