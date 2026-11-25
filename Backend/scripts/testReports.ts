import { prisma } from '../config/prisma.js';
import { getPreviousWeekPeriod, calculateWeeklySettlement, getSettlementBatchDetails } from '../services/settlementService.js';
import redisService from '../services/redisService.js';
import redisClient from '../config/redis.js';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  data?: any;
  error?: string;
  durationMs: number;
}

async function runReportTests() {
  console.log('======================================================');
  console.log('📊 DRIVEMATE COMPREHENSIVE REPORTS TEST SUITE');
  console.log('======================================================\n');

  const results: TestResult[] = [];

  // Helper
  async function test(name: string, fn: () => Promise<any>) {
    const start = Date.now();
    try {
      const data = await fn();
      const durationMs = Date.now() - start;
      results.push({ name, status: 'PASS', data, durationMs });
      console.log(`✅ [PASS] ${name} (${durationMs}ms)`);
      return data;
    } catch (err: any) {
      const durationMs = Date.now() - start;
      results.push({ name, status: 'FAIL', error: err.message || String(err), durationMs });
      console.error(`❌ [FAIL] ${name} (${durationMs}ms):`, err.message || err);
      return null;
    }
  }

  // 1. Admin System Stats Report
  await test('Admin Stats Report (Counts & Revenue)', async () => {
    const [totalUsers, totalRiders, totalRides, revenueResult] = await Promise.all([
      prisma.customer.count(),
      prisma.rider.count(),
      prisma.ride.count(),
      prisma.ride.aggregate({
        where: { status: 'completed' },
        _sum: { fare: true },
      }),
    ]);
    const totalRevenue = Number(revenueResult._sum.fare || 0);
    return { totalUsers, totalRiders, totalRides, totalRevenue };
  });

  // 2. Support Metrics & Tickets Report
  await test('Support Metrics Report', async () => {
    const [totalTickets, openTickets, urgentCount, escalatedCount, resolvedToday] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      prisma.supportTicket.count({ where: { priority: 'urgent', status: { not: 'closed' } } }),
      prisma.supportTicket.count({ where: { status: 'escalated' } }),
      prisma.supportTicket.count({
        where: {
          status: 'resolved',
          resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    const ticketsSample = await prisma.supportTicket.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        userName: true,
      },
    });

    return {
      metrics: { totalTickets, openTickets, urgentCount, escalatedCount, resolvedToday },
      sampleCount: ticketsSample.length,
      sample: ticketsSample,
    };
  });

  // 3. Finance & Payouts Report
  await test('Finance Metrics & Payout Batches Report', async () => {
    const [completedDisbursements, pendingBatches, activeVouchers, batchesSample] = await Promise.all([
      prisma.disbursement.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payoutBatch.aggregate({
        where: { status: 'pending_authorization' },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.refundVoucher.count(),
      prisma.payoutBatch.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalDisbursed = Number(completedDisbursements._sum.amount || 0);
    const pendingBatchAmount = Number(pendingBatches._sum.totalAmount || 0);

    return {
      metrics: {
        totalDisbursedAmount: totalDisbursed,
        completedDisbursementsCount: completedDisbursements._count || 0,
        pendingAuthorizationAmount: pendingBatchAmount,
        pendingBatchesCount: pendingBatches._count || 0,
        activeRefundVouchersCount: activeVouchers,
      },
      batchesSampleCount: batchesSample.length,
    };
  });

  // 4. Settlement Calculation Period & Structure
  await test('Settlement Period Calculator', async () => {
    const period = getPreviousWeekPeriod(new Date(), 'Asia/Kolkata');
    if (!period.batchReference.startsWith('SETTLE-')) {
      throw new Error(`Invalid batch reference: ${period.batchReference}`);
    }
    if (!(period.periodStart instanceof Date) || !(period.periodEnd instanceof Date)) {
      throw new Error('Invalid period start or end Date object');
    }
    return {
      batchReference: period.batchReference,
      year: period.year,
      weekNumber: period.weekNumber,
      start: period.periodStart.toISOString(),
      end: period.periodEnd.toISOString(),
      timezone: period.timezone,
    };
  });

  // 5. Settlement Batch Calculation & Reconciliation Dry-Run
  await test('Settlement Batch Calculation Dry-Run & Reconciliation', async () => {
    const calcResult = await calculateWeeklySettlement({ isDryRun: true });
    if (!calcResult || !calcResult.batch) {
      throw new Error('Settlement calculation returned null batch');
    }
    const { batch } = calcResult;
    const reconciliation = (calcResult as any).reconciliation;
    return {
      batchReference: batch.batchReference,
      status: batch.status,
      isDryRun: batch.isDryRun,
      totals: {
        grossFare: Number(batch.grossFare),
        platformFee: Number(batch.platformFee),
        netPayable: Number(batch.netPayable),
        beneficiaryCount: batch.beneficiaryCount,
        totalRides: batch.totalRides,
      },
      reconciliation,
    };
  });

  // 6. Settlement Report Export Structure Validation
  await test('Settlement Report Export Formatting Validation', async () => {
    const existingBatches = await prisma.settlementBatch.findMany({
      take: 1,
      orderBy: { createdAt: 'desc' },
    });

    let batchId: string;
    if (existingBatches.length > 0) {
      batchId = existingBatches[0].id;
    } else {
      // Create a test batch if none exists so export can be validated
      const calcResult = await calculateWeeklySettlement({ isDryRun: false, forceRecalculate: true });
      batchId = calcResult.batch.id;
    }

    const details = await getSettlementBatchDetails(batchId);
    const reportData = {
      batchReference: details.batch.batchReference,
      periodStart: details.batch.periodStart,
      periodEnd: details.batch.periodEnd,
      timezone: details.batch.periodTimezone,
      status: details.batch.status,
      isDryRun: details.batch.isDryRun,
      reconciliation: details.reconciliation,
      totals: {
        totalRides: details.batch.totalRides,
        grossFare: details.batch.grossFare,
        platformFee: details.batch.platformFee,
        netPayable: details.batch.netPayable,
        beneficiaryCount: details.batch.beneficiaryCount,
      },
      items: details.batch.items.map((i: any) => ({
        payoutRef: i.payoutRef,
        driverName: i.beneficiaryName,
        driverPhone: i.beneficiaryPhone,
        bankAccount: i.bankAccountNumber,
        ifsc: i.ifscCode,
        rides: i.rideCount,
        grossAmount: i.grossAmount,
        deductions: i.deductions,
        incentives: i.incentives,
        netAmount: i.netAmount,
        status: i.status,
      })),
    };

    if (!reportData.batchReference || !reportData.totals || !Array.isArray(reportData.items)) {
      throw new Error('Settlement report data missing required schema keys');
    }

    return {
      batchReference: reportData.batchReference,
      itemsCount: reportData.items.length,
      isReconciled: reportData.reconciliation.isReconciled,
      totals: reportData.totals,
    };
  });

  // 7. Operations & Fleet Monitoring Report
  await test('Operations & Fleet Status Report', async () => {
    const [cityZones, fleetZones, activeSurgeRules, vehicleInspections, onboardingProfiles] = await Promise.all([
      prisma.cityZone.count(),
      prisma.fleetZone.count(),
      prisma.surgeRule.count({ where: { isActive: true } }),
      prisma.vehicleInspection.count(),
      prisma.driverOnboarding.count(),
    ]);

    return {
      cityZones,
      fleetZones,
      activeSurgeRules,
      vehicleInspections,
      onboardingProfiles,
    };
  });

  // 8. Audit Logs Security Report
  await test('Audit Logs Security Trail Report', async () => {
    const auditLogsCount = await prisma.auditLog.count();
    const recentLogs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        targetAdmin: { select: { id: true, name: true, email: true } },
        role: { select: { id: true, name: true, code: true } },
      },
    });

    return {
      totalAuditLogs: auditLogsCount,
      recentLogsSampleCount: recentLogs.length,
      sample: recentLogs,
    };
  });

  // 9. Redis Dual-Engine & Cache Invalidation Report
  await test('Redis Dual-Engine, Rate Limiting & Geolocation Report', async () => {
    // A. Basic Set/Get & TTL
    const testKey = 'test:drivemate:report';
    await redisService.setEx(testKey, 10, { verified: true, engine: 'redis' });
    const cachedData = await redisService.get<{ verified: boolean; engine: string }>(testKey);
    if (!cachedData || !cachedData.verified) {
      throw new Error('Redis setEx/get test failed');
    }

    // B. Read-Through Cache (remember)
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount++;
      return { fetchCount, timestamp: Date.now() };
    };
    const remKey = 'test:remember:key';
    const r1 = await redisService.remember(remKey, 10, fetcher);
    const r2 = await redisService.remember(remKey, 10, fetcher);
    if (r1.fetchCount !== 1 || r2.fetchCount !== 1 || fetchCount !== 1) {
      throw new Error(`Redis remember() failed caching: fetchCount=${fetchCount}`);
    }

    // C. Sliding-Window Rate Limiter
    const rlKey = 'test_user_rate_limit';
    const limitResult1 = await redisService.rateLimit(rlKey, 3, 10);
    const limitResult2 = await redisService.rateLimit(rlKey, 3, 10);
    const limitResult3 = await redisService.rateLimit(rlKey, 3, 10);
    const limitResult4 = await redisService.rateLimit(rlKey, 3, 10);
    if (!limitResult1.allowed || !limitResult2.allowed || !limitResult3.allowed || limitResult4.allowed) {
      throw new Error('Redis sliding-window rate limiting failed quota barrier');
    }

    // D. Real-Time Fleet Driver Geolocation Tracking
    const driverId = 'rider_test_geo_001';
    await redisService.storeDriverLocation(driverId, 12.9716, 77.5946, 180);
    const driverLoc = await redisService.getDriverLocation(driverId);
    if (!driverLoc || driverLoc.lat !== 12.9716 || driverLoc.lng !== 77.5946) {
      throw new Error('Redis driver geolocation cache failed');
    }
    const allActiveDrivers = await redisService.getAllActiveDriverLocations();
    const foundDriver = allActiveDrivers.some(d => d.riderId === driverId);
    if (!foundDriver) {
      throw new Error('Redis getAllActiveDriverLocations failed to find tracked driver');
    }

    // E. Wildcard Pattern Invalidation
    await redisService.delPattern('test:*');
    await redisService.del(`ratelimit:${rlKey}`);
    await redisService.removeDriverLocation(driverId);

    const postCleanup = await redisService.get(testKey);
    if (postCleanup !== null) {
      throw new Error('Redis wildcard pattern eviction failed');
    }

    const redisHealth = redisService.getStatus();

    return {
      redisMode: redisHealth.mode,
      isRealRedis: redisHealth.isRealRedis,
      rateLimiterVerified: true,
      geolocationTrackingVerified: true,
      patternEvictionVerified: true,
      stats: redisHealth.stats,
    };
  });

  console.log('\n======================================================');
  console.log('📈 TEST EXECUTION SUMMARY:');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('======================================================\n');

  console.log('Detailed Report Data:');
  console.log(JSON.stringify(results, null, 2));

  process.exit(failed > 0 ? 1 : 0);
}

runReportTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
