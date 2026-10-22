import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { prisma } from '../config/prisma.js';

dotenv.config();

interface MigrationStats {
  collection: string;
  mongoCount: number;
  postgresCount: number;
  migrated: number;
  failed: number;
}

export async function runDataMigration(): Promise<MigrationStats[]> {
  console.log('====================================================');
  console.log('🚀 Starting DriveMate MongoDB -> Neon PostgreSQL Migration');
  console.log('====================================================\n');

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing from environment variables.');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB.');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Could not access MongoDB native database.');
  }

  const results: MigrationStats[] = [];

  // ----------------------------------------------------
  // 1. Roles
  // ----------------------------------------------------
  console.log('\n[1/7] Migrating Roles...');
  const roleDocs = await db.collection('roles').find().toArray();
  let rolesMigrated = 0;
  let rolesFailed = 0;

  for (const doc of roleDocs) {
    try {
      const id = doc._id.toString();
      await prisma.role.upsert({
        where: { id },
        update: {
          name: doc.name || 'Role',
          code: doc.code || id,
          description: doc.description || '',
          status: doc.status || 'Active',
          isSystem: Boolean(doc.isSystem),
          permissions: Array.isArray(doc.permissions) ? doc.permissions : [],
          dataAccess: doc.dataAccess || null,
          accessScope: doc.accessScope || 'All Resources',
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        },
        create: {
          id,
          name: doc.name || 'Role',
          code: doc.code || id,
          description: doc.description || '',
          status: doc.status || 'Active',
          isSystem: Boolean(doc.isSystem),
          permissions: Array.isArray(doc.permissions) ? doc.permissions : [],
          dataAccess: doc.dataAccess || null,
          accessScope: doc.accessScope || 'All Resources',
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        },
      });
      rolesMigrated++;
    } catch (err: any) {
      console.error(`  ❌ Failed role ${doc._id}:`, err?.message);
      rolesFailed++;
    }
  }
  const totalRolesPg = await prisma.role.count();
  results.push({
    collection: 'roles',
    mongoCount: roleDocs.length,
    postgresCount: totalRolesPg,
    migrated: rolesMigrated,
    failed: rolesFailed,
  });
  console.log(`  ✓ Roles: ${rolesMigrated} migrated, ${rolesFailed} failed.`);

  // ----------------------------------------------------
  // 2. Admins & AdminRoles
  // ----------------------------------------------------
  console.log('\n[2/7] Migrating Admins...');
  const adminDocs = await db.collection('admins').find().toArray();
  let adminsMigrated = 0;
  let adminsFailed = 0;

  for (const doc of adminDocs) {
    try {
      const id = doc._id.toString();
      await prisma.admin.upsert({
        where: { id },
        update: {
          name: doc.name || 'Admin',
          email: doc.email,
          password: doc.password || 'admin123',
          isActive: doc.isActive !== false,
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        },
        create: {
          id,
          name: doc.name || 'Admin',
          email: doc.email,
          password: doc.password || 'admin123',
          isActive: doc.isActive !== false,
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        },
      });

      // Link roles
      if (Array.isArray(doc.roles)) {
        for (const roleId of doc.roles) {
          const roleIdStr = roleId.toString();
          const roleExists = await prisma.role.findUnique({ where: { id: roleIdStr } });
          if (roleExists) {
            await prisma.adminRole.upsert({
              where: {
                adminId_roleId: {
                  adminId: id,
                  roleId: roleIdStr,
                },
              },
              update: {},
              create: {
                adminId: id,
                roleId: roleIdStr,
              },
            });
          }
        }
      }

      adminsMigrated++;
    } catch (err: any) {
      console.error(`  ❌ Failed admin ${doc._id}:`, err?.message);
      adminsFailed++;
    }
  }
  const totalAdminsPg = await prisma.admin.count();
  results.push({
    collection: 'admins',
    mongoCount: adminDocs.length,
    postgresCount: totalAdminsPg,
    migrated: adminsMigrated,
    failed: adminsFailed,
  });
  console.log(`  ✓ Admins: ${adminsMigrated} migrated, ${adminsFailed} failed.`);

  // ----------------------------------------------------
  // 3. Customers
  // ----------------------------------------------------
  console.log('\n[3/7] Migrating Customers...');
  const customerDocs = await db.collection('customers').find().toArray();
  let customersMigrated = 0;
  let customersFailed = 0;

  for (const doc of customerDocs) {
    try {
      const id = doc._id.toString();
      await prisma.customer.upsert({
        where: { id },
        update: {
          name: doc.name || 'Customer',
          email: doc.email,
          phone: doc.phone || '0000000000',
          password: doc.password || null,
          role: doc.role || 'customer',
          walletBalance: doc.walletBalance != null ? Number(doc.walletBalance) : 0,
          coinBalance: doc.coinBalance != null ? Number(doc.coinBalance) : 0,
          powerPassActive: Boolean(doc.powerPass?.isActive),
          powerPassPlan: doc.powerPass?.planName || null,
          powerPassValidUntil: doc.powerPass?.validUntil ? new Date(doc.powerPass.validUntil) : null,
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        },
        create: {
          id,
          name: doc.name || 'Customer',
          email: doc.email,
          phone: doc.phone || '0000000000',
          password: doc.password || null,
          role: doc.role || 'customer',
          walletBalance: doc.walletBalance != null ? Number(doc.walletBalance) : 0,
          coinBalance: doc.coinBalance != null ? Number(doc.coinBalance) : 0,
          powerPassActive: Boolean(doc.powerPass?.isActive),
          powerPassPlan: doc.powerPass?.planName || null,
          powerPassValidUntil: doc.powerPass?.validUntil ? new Date(doc.powerPass.validUntil) : null,
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        },
      });
      customersMigrated++;
    } catch (err: any) {
      console.error(`  ❌ Failed customer ${doc._id}:`, err?.message);
      customersFailed++;
    }
  }
  const totalCustomersPg = await prisma.customer.count();
  results.push({
    collection: 'customers',
    mongoCount: customerDocs.length,
    postgresCount: totalCustomersPg,
    migrated: customersMigrated,
    failed: customersFailed,
  });
  console.log(`  ✓ Customers: ${customersMigrated} migrated, ${customersFailed} failed.`);

  // ----------------------------------------------------
  // 4. Riders
  // ----------------------------------------------------
  console.log('\n[4/7] Migrating Riders...');
  const riderDocs = await db.collection('riders').find().toArray();
  let ridersMigrated = 0;
  let ridersFailed = 0;

  for (const doc of riderDocs) {
    try {
      const id = doc._id.toString();
      const coords = doc.currentLocation?.coordinates;
      const currentLng = Array.isArray(coords) && coords[0] != null ? Number(coords[0]) : null;
      const currentLat = Array.isArray(coords) && coords[1] != null ? Number(coords[1]) : null;

      await prisma.rider.upsert({
        where: { id },
        update: {
          name: doc.name || 'Rider',
          email: doc.email,
          phone: doc.phone || '0000000000',
          password: doc.password || 'password123',
          role: doc.role || 'rider',
          isAvailable: Boolean(doc.isAvailable),
          vehicleType: doc.vehicleType || 'bike',
          currentLng,
          currentLat,
          heading: doc.currentLocation?.heading ? Number(doc.currentLocation.heading) : 0,
          vehicle: doc.vehicle || null,
          walletBalance: doc.walletBalance != null ? Number(doc.walletBalance) : 3450,
          rating: doc.rating != null ? Number(doc.rating) : 4.9,
          totalRides: doc.totalRides != null ? Number(doc.totalRides) : 24,
          totalEarnings: doc.totalEarnings != null ? Number(doc.totalEarnings) : 3450,
          loyaltyPoints: doc.loyaltyPoints != null ? Number(doc.loyaltyPoints) : 350,
          referralCode: doc.referralCode || 'ALEX2025',
          documents: doc.documents || null,
          preferences: doc.preferences || null,
          resetOtp: doc.resetOtp || null,
          resetOtpExpires: doc.resetOtpExpires ? new Date(doc.resetOtpExpires) : null,
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        },
        create: {
          id,
          name: doc.name || 'Rider',
          email: doc.email,
          phone: doc.phone || '0000000000',
          password: doc.password || 'password123',
          role: doc.role || 'rider',
          isAvailable: Boolean(doc.isAvailable),
          vehicleType: doc.vehicleType || 'bike',
          currentLng,
          currentLat,
          heading: doc.currentLocation?.heading ? Number(doc.currentLocation.heading) : 0,
          vehicle: doc.vehicle || null,
          walletBalance: doc.walletBalance != null ? Number(doc.walletBalance) : 3450,
          rating: doc.rating != null ? Number(doc.rating) : 4.9,
          totalRides: doc.totalRides != null ? Number(doc.totalRides) : 24,
          totalEarnings: doc.totalEarnings != null ? Number(doc.totalEarnings) : 3450,
          loyaltyPoints: doc.loyaltyPoints != null ? Number(doc.loyaltyPoints) : 350,
          referralCode: doc.referralCode || 'ALEX2025',
          documents: doc.documents || null,
          preferences: doc.preferences || null,
          resetOtp: doc.resetOtp || null,
          resetOtpExpires: doc.resetOtpExpires ? new Date(doc.resetOtpExpires) : null,
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        },
      });
      ridersMigrated++;
    } catch (err: any) {
      console.error(`  ❌ Failed rider ${doc._id}:`, err?.message);
      ridersFailed++;
    }
  }
  const totalRidersPg = await prisma.rider.count();
  results.push({
    collection: 'riders',
    mongoCount: riderDocs.length,
    postgresCount: totalRidersPg,
    migrated: ridersMigrated,
    failed: ridersFailed,
  });
  console.log(`  ✓ Riders: ${ridersMigrated} migrated, ${ridersFailed} failed.`);

  // ----------------------------------------------------
  // 5. Rides
  // ----------------------------------------------------
  console.log('\n[5/7] Migrating Rides...');
  const rideDocs = await db.collection('rides').find().toArray();
  let ridesMigrated = 0;
  let ridesFailed = 0;

  for (const doc of rideDocs) {
    try {
      const id = doc._id.toString();
      const rawCustomerId = doc.customer?.toString() || null;
      const rawRiderId = doc.rider?.toString() || null;

      // Ensure foreign key targets exist in Postgres
      let customerId: string | null = null;
      if (rawCustomerId) {
        const customerExists = await prisma.customer.findUnique({ where: { id: rawCustomerId } });
        if (customerExists) customerId = rawCustomerId;
      }

      let riderId: string | null = null;
      if (rawRiderId) {
        const riderExists = await prisma.rider.findUnique({ where: { id: rawRiderId } });
        if (riderExists) riderId = rawRiderId;
      }

      await prisma.ride.upsert({
        where: { id },
        update: {
          customerId,
          riderId,
          pickupAddress: doc.pickup?.address || 'Pickup Location',
          pickupLat: doc.pickup?.lat != null ? Number(doc.pickup.lat) : null,
          pickupLng: doc.pickup?.lng != null ? Number(doc.pickup.lng) : null,
          dropAddress: doc.drop?.address || 'Drop Location',
          dropLat: doc.drop?.lat != null ? Number(doc.drop.lat) : null,
          dropLng: doc.drop?.lng != null ? Number(doc.drop.lng) : null,
          status: doc.status || 'pending',
          vehicleType: doc.vehicleType || 'bike',
          fare: doc.fare != null ? Number(doc.fare) : 50,
          distance: doc.distance != null ? Number(doc.distance) : null,
          duration: doc.duration != null ? Number(doc.duration) : null,
          polyline: doc.polyline || null,
          otp: doc.otp || null,
          arrivedAt: doc.arrivedAt ? new Date(doc.arrivedAt) : null,
          waitCharges: doc.waitCharges != null ? Number(doc.waitCharges) : 0,
          cancellationReason: doc.cancellationReason || null,
          cancelledBy: doc.cancelledBy || null,
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        },
        create: {
          id,
          customerId,
          riderId,
          pickupAddress: doc.pickup?.address || 'Pickup Location',
          pickupLat: doc.pickup?.lat != null ? Number(doc.pickup.lat) : null,
          pickupLng: doc.pickup?.lng != null ? Number(doc.pickup.lng) : null,
          dropAddress: doc.drop?.address || 'Drop Location',
          dropLat: doc.drop?.lat != null ? Number(doc.drop.lat) : null,
          dropLng: doc.drop?.lng != null ? Number(doc.drop.lng) : null,
          status: doc.status || 'pending',
          vehicleType: doc.vehicleType || 'bike',
          fare: doc.fare != null ? Number(doc.fare) : 50,
          distance: doc.distance != null ? Number(doc.distance) : null,
          duration: doc.duration != null ? Number(doc.duration) : null,
          polyline: doc.polyline || null,
          otp: doc.otp || null,
          arrivedAt: doc.arrivedAt ? new Date(doc.arrivedAt) : null,
          waitCharges: doc.waitCharges != null ? Number(doc.waitCharges) : 0,
          cancellationReason: doc.cancellationReason || null,
          cancelledBy: doc.cancelledBy || null,
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        },
      });
      ridesMigrated++;
    } catch (err: any) {
      console.error(`  ❌ Failed ride ${doc._id}:`, err?.message);
      ridesFailed++;
    }
  }
  const totalRidesPg = await prisma.ride.count();
  results.push({
    collection: 'rides',
    mongoCount: rideDocs.length,
    postgresCount: totalRidesPg,
    migrated: ridesMigrated,
    failed: ridesFailed,
  });
  console.log(`  ✓ Rides: ${ridesMigrated} migrated, ${ridesFailed} failed.`);

  // ----------------------------------------------------
  // 6. Transactions
  // ----------------------------------------------------
  console.log('\n[6/7] Migrating Transactions...');
  const txDocs = await db.collection('transactions').find().toArray();
  let txsMigrated = 0;
  let txsFailed = 0;

  for (const doc of txDocs) {
    try {
      const id = doc._id.toString();
      const rawUserId = doc.user?.toString();
      
      // Check customer exist
      let userId = rawUserId;
      if (rawUserId) {
        const customerExists = await prisma.customer.findUnique({ where: { id: rawUserId } });
        if (!customerExists) {
          // Check rider
          const riderExists = await prisma.rider.findUnique({ where: { id: rawUserId } });
          if (!riderExists) {
            userId = null;
          }
        }
      }

      if (userId) {
        await prisma.transaction.upsert({
          where: { id },
          update: {
            userId,
            userModel: doc.userModel || 'Customer',
            type: doc.type || 'credit',
            amount: doc.amount != null ? Number(doc.amount) : 0,
            currency: doc.currency || 'INR',
            description: doc.description || 'Transaction',
            referenceId: doc.referenceId || null,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
          },
          create: {
            id,
            userId,
            userModel: doc.userModel || 'Customer',
            type: doc.type || 'credit',
            amount: doc.amount != null ? Number(doc.amount) : 0,
            currency: doc.currency || 'INR',
            description: doc.description || 'Transaction',
            referenceId: doc.referenceId || null,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
          },
        });
        txsMigrated++;
      } else {
        console.warn(`  ⚠️ Skipped transaction ${id}: user not found`);
        txsFailed++;
      }
    } catch (err: any) {
      console.error(`  ❌ Failed transaction ${doc._id}:`, err?.message);
      txsFailed++;
    }
  }
  const totalTxsPg = await prisma.transaction.count();
  results.push({
    collection: 'transactions',
    mongoCount: txDocs.length,
    postgresCount: totalTxsPg,
    migrated: txsMigrated,
    failed: txsFailed,
  });
  console.log(`  ✓ Transactions: ${txsMigrated} migrated, ${txsFailed} failed.`);

  // ----------------------------------------------------
  // 7. PaymentMethods, Claims, Notifications, Rewards, AuditLogs
  // ----------------------------------------------------
  console.log('\n[7/7] Checking remaining collections (claims, notifications, rewards, etc.)...');
  const otherCollections = ['claims', 'notifications', 'paymentmethods', 'rewards', 'auditlogs'];
  for (const collName of otherCollections) {
    const count = await db.collection(collName).countDocuments();
    results.push({
      collection: collName,
      mongoCount: count,
      postgresCount: 0,
      migrated: 0,
      failed: 0,
    });
    console.log(`  - ${collName}: ${count} documents in MongoDB.`);
  }

  await mongoose.disconnect();
  console.log('\n====================================================');
  console.log('🏁 Data Migration Complete');
  console.log('====================================================\n');

  console.table(results);
  return results;
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('migrateMongoToPostgres.ts') || process.argv[1]?.endsWith('migrateMongoToPostgres.js')) {
  runDataMigration()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Fatal Migration Error:', err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
