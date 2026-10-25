import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';

async function main() {
  console.log('🚀 Seeding Multi-Role Data and Specialized Entities into Neon PostgreSQL...');

  const defaultPassword = await bcrypt.hash('admin123', 10);

  // 1. Roles Definition
  const rolesData = [
    {
      code: 'ADMIN',
      name: 'Super Administrator',
      description: 'Complete system oversight, security policy configuration, and staff management',
      isSystem: true,
      permissions: ['*'],
      accessScope: 'All Resources',
    },
    {
      code: 'SUPPORT_AGENT',
      name: 'Customer Support Agent',
      description: 'L1/L2 rider and driver inquiries, dispute handling, and chat support',
      isSystem: true,
      permissions: ['tickets:read', 'tickets:write', 'messages:write', 'escalations:create'],
      accessScope: 'Support Tickets & Live Messages',
    },
    {
      code: 'HEAD_OF_SUPPORT',
      name: 'Head of Support',
      description: 'Escalation queue review, refund approvals, driver penalties, and agent QA metrics',
      isSystem: true,
      permissions: ['tickets:*', 'escalations:*', 'refunds:approve', 'support_metrics:view'],
      accessScope: 'Department-wide Support Cases',
    },
    {
      code: 'FLEET_COACH',
      name: 'Fleet Coach',
      description: 'Driver document verification, driver training modules, and vehicle safety inspections',
      isSystem: true,
      permissions: ['onboarding:read', 'onboarding:write', 'inspections:create'],
      accessScope: 'Driver Onboarding & Fleet Compliance',
    },
    {
      code: 'HEAD_OF_FLEET',
      name: 'Head of Fleet Operations',
      description: 'Fleet quality standards, vehicle inspection audits, and regional fleet distribution',
      isSystem: true,
      permissions: ['onboarding:*', 'inspections:*', 'fleet_zones:manage', 'fleet_metrics:view'],
      accessScope: 'Regional Fleet Operations',
    },
    {
      code: 'MANAGER',
      name: 'Operations Manager',
      description: 'Live dispatch monitoring, dynamic surge multipliers, and driver incentive broadcasts',
      isSystem: true,
      permissions: ['city_zones:manage', 'surge:update', 'broadcasts:create', 'rides:monitor'],
      accessScope: 'City Dispatch & Market Dynamic Rules',
    },
    {
      code: 'FINANCE_ADMIN',
      name: 'Finance Administrator',
      description: 'Weekly payout batch authorization, customer refund policy, and ledger oversight',
      isSystem: true,
      permissions: ['payouts:authorize', 'refunds:issue', 'ledger:view', 'finance_metrics:view'],
      accessScope: 'Platform Financial Ledgers & Authorizations',
    },
    {
      code: 'FINANCER',
      name: 'Financer / Disbursements Officer',
      description: 'Bank disbursements queue, IMPS/NEFT gateway settlements, and failed payout retries',
      isSystem: true,
      permissions: ['disbursements:read', 'disbursements:execute'],
      accessScope: 'Disbursements Queue & Banking Settlements',
    },
  ];

  const roleMap: Record<string, string> = {};

  for (const roleDef of rolesData) {
    const existing = await prisma.role.findUnique({ where: { code: roleDef.code } });
    if (existing) {
      roleMap[roleDef.code] = existing.id;
      console.log(`  ✓ Role exists: ${roleDef.name} (${roleDef.code})`);
    } else {
      const id = crypto.randomBytes(12).toString('hex');
      const created = await prisma.role.create({
        data: {
          id,
          code: roleDef.code,
          name: roleDef.name,
          description: roleDef.description,
          isSystem: roleDef.isSystem,
          permissions: roleDef.permissions,
          accessScope: roleDef.accessScope,
        },
      });
      roleMap[roleDef.code] = created.id;
      console.log(`  + Role created: ${roleDef.name} (${roleDef.code})`);
    }
  }

  // 2. Demo Staff Accounts for Each Role
  const staffAccounts = [
    { email: 'admin@drivemate.com', name: 'Victoria Stone', roleCode: 'ADMIN' },
    { email: 'support@drivemate.com', name: 'Kavita Menon', roleCode: 'SUPPORT_AGENT' },
    { email: 'head.support@drivemate.com', name: 'Devendra Rao', roleCode: 'HEAD_OF_SUPPORT' },
    { email: 'fleet.coach@drivemate.com', name: 'Sanjay Rawat', roleCode: 'FLEET_COACH' },
    { email: 'head.fleet@drivemate.com', name: 'Anita Deshmukh', roleCode: 'HEAD_OF_FLEET' },
    { email: 'ops.manager@drivemate.com', name: 'Arjun Verma', roleCode: 'MANAGER' },
    { email: 'finance.admin@drivemate.com', name: 'Pooja Hegde', roleCode: 'FINANCE_ADMIN' },
    { email: 'financer@drivemate.com', name: 'Rohan Joshi', roleCode: 'FINANCER' },
  ];

  const adminMap: Record<string, string> = {};

  for (const staff of staffAccounts) {
    let admin = await prisma.admin.findUnique({ where: { email: staff.email.toLowerCase() } });
    if (!admin) {
      const id = crypto.randomBytes(12).toString('hex');
      admin = await prisma.admin.create({
        data: {
          id,
          name: staff.name,
          email: staff.email.toLowerCase(),
          password: defaultPassword,
          role: staff.roleCode.toLowerCase(),
          isActive: true,
        },
      });
      console.log(`  + Staff created: ${staff.name} <${staff.email}>`);
    } else {
      console.log(`  ✓ Staff exists: ${staff.name} <${staff.email}>`);
    }
    adminMap[staff.roleCode] = admin.id;

    // Link role in admin_roles
    const roleId = roleMap[staff.roleCode];
    if (roleId) {
      await prisma.adminRole.upsert({
        where: {
          adminId_roleId: {
            adminId: admin.id,
            roleId,
          },
        },
        create: {
          adminId: admin.id,
          roleId,
        },
        update: {},
      });
    }
  }

  // 3. Ensure a Rider exists for Driver relations
  let sampleRider = await prisma.rider.findFirst();
  if (!sampleRider) {
    const riderId = crypto.randomBytes(12).toString('hex');
    sampleRider = await prisma.rider.create({
      data: {
        id: riderId,
        name: 'Ramesh Patel',
        email: 'ramesh.driver@drivemate.com',
        phone: '+919876543210',
        password: defaultPassword,
        role: 'rider',
        isAvailable: true,
        vehicleType: 'sedan',
        walletBalance: 4250.0,
        rating: 4.92,
        vehicle: {
          make: 'Maruti Suzuki',
          model: 'Dzire',
          plateNumber: 'KA-05-MN-2024',
          color: 'Pearl White',
        },
      },
    });
    console.log('  + Seeded sample driver: Ramesh Patel');
  }

  // 4. Ensure a Customer exists for User relations
  let sampleCustomer = await prisma.customer.findFirst();
  if (!sampleCustomer) {
    const customerId = crypto.randomBytes(12).toString('hex');
    sampleCustomer = await prisma.customer.create({
      data: {
        id: customerId,
        name: 'Neha Sharma',
        email: 'neha.sharma@example.com',
        phone: '+919845012345',
        role: 'customer',
        walletBalance: 850.0,
      },
    });
    console.log('  + Seeded sample customer: Neha Sharma');
  }

  // 5. Seed Support Tickets & Messages
  const existingTickets = await prisma.supportTicket.count();
  if (existingTickets === 0) {
    console.log('  -> Seeding Support Tickets & Escalation trail...');
    const t1Id = crypto.randomBytes(12).toString('hex');
    await prisma.supportTicket.create({
      data: {
        id: t1Id,
        ticketNumber: 'TK-849102',
        userId: sampleCustomer.id,
        userType: 'Customer',
        userName: sampleCustomer.name,
        userPhone: sampleCustomer.phone,
        category: 'Billing Dispute',
        subject: 'Double charged for Koramangala ride during heavy rain',
        details: 'The ride receipt shows ₹420 deducted twice from my UPI account for booking #RD-7890.',
        priority: 'urgent',
        status: 'escalated',
        assignedAgentId: adminMap['SUPPORT_AGENT'],
        messages: {
          create: [
            {
              id: crypto.randomBytes(12).toString('hex'),
              senderId: sampleCustomer.id,
              senderName: sampleCustomer.name,
              senderType: 'Customer',
              message: 'Hello, I was charged twice for booking #RD-7890. Please check my account.',
            },
            {
              id: crypto.randomBytes(12).toString('hex'),
              senderId: adminMap['SUPPORT_AGENT'],
              senderName: 'Kavita Menon',
              senderType: 'Agent',
              message: 'Hi Neha, I have verified the bank ledger. I am escalating this to our Lead for an instant refund approval.',
            },
          ],
        },
        escalation: {
          create: {
            id: crypto.randomBytes(12).toString('hex'),
            escalatedById: adminMap['SUPPORT_AGENT'],
            requestedAction: 'Approve ₹420 wallet credit refund voucher for duplicate charge',
            supervisorNotes: 'Bank transaction ID confirmed duplicate webhook event.',
            status: 'pending_review',
            approvedRefund: 420.0,
          },
        },
      },
    });

    const t2Id = crypto.randomBytes(12).toString('hex');
    await prisma.supportTicket.create({
      data: {
        id: t2Id,
        ticketNumber: 'TK-920411',
        userId: sampleCustomer.id,
        userType: 'Customer',
        userName: 'Aakash Verma',
        userPhone: '+919988776655',
        category: 'Lost Item',
        subject: 'Left Apple AirPods in rear seat',
        details: 'Driver took me from Indiranagar 100ft Road to Airport T1. Black charging case left in pocket.',
        priority: 'high',
        status: 'in_progress',
        assignedAgentId: adminMap['SUPPORT_AGENT'],
        messages: {
          create: [
            {
              id: crypto.randomBytes(12).toString('hex'),
              senderId: 'cust-2',
              senderName: 'Aakash Verma',
              senderType: 'Customer',
              message: 'I left my AirPods in the cab 30 mins ago. Has the driver reported anything?',
            },
            {
              id: crypto.randomBytes(12).toString('hex'),
              senderId: adminMap['SUPPORT_AGENT'],
              senderName: 'Kavita Menon',
              senderType: 'Agent',
              message: 'Calling the driver Ramesh right away to verify the backseat. Please stay online.',
            },
          ],
        },
      },
    });
    console.log('  ✓ Seeded 2 Support Tickets with escalation record');
  }

  // 6. Seed Driver Onboarding & Vehicle Inspection
  const existingOnboardings = await prisma.driverOnboarding.count();
  if (existingOnboardings === 0) {
    console.log('  -> Seeding Driver Onboarding and Vehicle Inspections...');
    const obId = crypto.randomBytes(12).toString('hex');
    await prisma.driverOnboarding.create({
      data: {
        id: obId,
        driverId: sampleRider.id,
        coachId: adminMap['FLEET_COACH'],
        dlStatus: 'Approved',
        rcStatus: 'Approved',
        aadharStatus: 'Approved',
        policeVerificationStatus: 'In Review',
        trainingStatus: 'Module 3/4',
        trainingScore: 88,
        overallStatus: 'in_progress',
        coachNotes: 'Driver exhibits excellent knowledge of navigation; completed safety modules 1-3.',
        inspections: {
          create: {
            id: crypto.randomBytes(12).toString('hex'),
            riderId: sampleRider.id,
            inspectorId: adminMap['FLEET_COACH'],
            vehiclePlate: 'KA-05-MN-2024',
            vehicleModel: 'Maruti Suzuki Dzire',
            vehicleType: 'sedan',
            odometerReading: 48200,
            brakesCondition: 'Pass',
            tiresCondition: 'Pass',
            lightsCondition: 'Pass',
            insuranceValid: true,
            pollutionValid: true,
            inspectionPass: true,
            notes: 'All 42 physical checks verified. Clean interior, working AC, valid commercial badge.',
          },
        },
      },
    });
    console.log('  ✓ Seeded Driver Onboarding & Vehicle Inspection');
  }

  // 7. Seed Fleet Zones
  const existingFleetZones = await prisma.fleetZone.count();
  if (existingFleetZones === 0) {
    console.log('  -> Seeding Fleet Zones...');
    const fleetZones = [
      { name: 'Koramangala & HSR Cluster', city: 'Bangalore', targetDrivers: 150, activeDrivers: 138, complianceRate: 98.6 },
      { name: 'Indiranagar & CBD', city: 'Bangalore', targetDrivers: 120, activeDrivers: 114, complianceRate: 99.1 },
      { name: 'Whitefield Tech Corridor', city: 'Bangalore', targetDrivers: 200, activeDrivers: 182, complianceRate: 97.4 },
      { name: 'Electronic City Phase 1 & 2', city: 'Bangalore', targetDrivers: 140, activeDrivers: 125, complianceRate: 98.0 },
      { name: 'Airport Transit Corridor', city: 'Bangalore', targetDrivers: 90, activeDrivers: 88, complianceRate: 99.5 },
    ];
    for (const fz of fleetZones) {
      await prisma.fleetZone.create({
        data: {
          id: crypto.randomBytes(12).toString('hex'),
          ...fz,
        },
      });
    }
    console.log('  ✓ Seeded 5 Fleet Zones');
  }

  // 8. Seed City Zones & Operations Surge Rules
  const existingCityZones = await prisma.cityZone.count();
  if (existingCityZones === 0) {
    console.log('  -> Seeding City Zones & Surge Rules...');
    const cityZones = [
      { name: 'Koramangala', demandLevel: 'High', activeDrivers: 42, pendingRiders: 18, surgeMultiplier: 1.4, status: 'surge_active' },
      { name: 'Indiranagar', demandLevel: 'Moderate', activeDrivers: 38, pendingRiders: 6, surgeMultiplier: 1.0, status: 'normal' },
      { name: 'Whitefield', demandLevel: 'Extreme', activeDrivers: 24, pendingRiders: 35, surgeMultiplier: 1.8, status: 'surge_active' },
      { name: 'HSR Layout', demandLevel: 'Moderate', activeDrivers: 32, pendingRiders: 9, surgeMultiplier: 1.1, status: 'normal' },
      { name: 'MG Road & Brigade', demandLevel: 'High', activeDrivers: 29, pendingRiders: 14, surgeMultiplier: 1.3, status: 'surge_active' },
      { name: 'Electronic City', demandLevel: 'Low', activeDrivers: 45, pendingRiders: 4, surgeMultiplier: 1.0, status: 'normal' },
    ];

    for (const cz of cityZones) {
      const czId = crypto.randomBytes(12).toString('hex');
      const zone = await prisma.cityZone.create({
        data: {
          id: czId,
          name: cz.name,
          city: 'Bangalore',
          demandLevel: cz.demandLevel,
          activeDrivers: cz.activeDrivers,
          pendingRiders: cz.pendingRiders,
          surgeMultiplier: cz.surgeMultiplier,
          status: cz.status,
        },
      });

      if (cz.surgeMultiplier > 1.0) {
        await prisma.surgeRule.create({
          data: {
            id: crypto.randomBytes(12).toString('hex'),
            zoneId: zone.id,
            managerId: adminMap['MANAGER'],
            multiplier: cz.surgeMultiplier,
            reason: `Evening peak rain surge in ${cz.name}`,
            isActive: true,
          },
        });
      }
    }

    // Seed an incentive broadcast
    await prisma.driverIncentiveBroadcast.create({
      data: {
        id: crypto.randomBytes(12).toString('hex'),
        managerId: adminMap['MANAGER'],
        title: 'Rain Surge Bonus: +₹150 Per Completed Ride',
        bonusAmount: 150.0,
        targetZone: 'Whitefield Tech Corridor',
        message: 'High demand alert in Whitefield. Complete any 3 consecutive trips between 5 PM and 9 PM to unlock ₹450 flat bonus.',
        status: 'active',
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
    });
    console.log('  ✓ Seeded 6 City Zones, active surge rules & driver incentive broadcast');
  }

  // 9. Seed Finance Payout Batches & Disbursements
  const existingBatches = await prisma.payoutBatch.count();
  if (existingBatches === 0) {
    console.log('  -> Seeding Finance Payout Batches & Disbursements...');
    const bId = crypto.randomBytes(12).toString('hex');
    const batch = await prisma.payoutBatch.create({
      data: {
        id: bId,
        batchReference: 'BATCH-2026-W42',
        disbursementDate: new Date(),
        totalAmount: 148500.0,
        driverCount: 38,
        gatewayFee: 450.0,
        status: 'approved',
        authorizedById: adminMap['FINANCE_ADMIN'],
        authorizedAt: new Date(),
      },
    });

    await prisma.disbursement.create({
      data: {
        id: crypto.randomBytes(12).toString('hex'),
        payoutRef: 'PAY-89201',
        batchId: batch.id,
        riderId: sampleRider.id,
        driverName: sampleRider.name,
        driverPhone: sampleRider.phone,
        amount: 4250.0,
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0001234',
        accountNumber: '50100234567890',
        method: 'IMPS',
        status: 'approved',
      },
    });

    await prisma.refundVoucher.create({
      data: {
        id: crypto.randomBytes(12).toString('hex'),
        customerId: sampleCustomer.id,
        amount: 250.0,
        reason: 'Driver cancellation courtesy credit voucher',
        status: 'issued',
        authorizedById: adminMap['FINANCE_ADMIN'],
      },
    });
    console.log('  ✓ Seeded Payout Batch, Driver Disbursement & Refund Voucher');
  }

  console.log('\n🎉 ALL ROLE MODELS AND ENTITIES SUCCESSFULLY SEEDED INTO NEON POSTGRESQL!\n');
}

main()
  .catch((err) => {
    console.error('❌ Error during role seeding:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
