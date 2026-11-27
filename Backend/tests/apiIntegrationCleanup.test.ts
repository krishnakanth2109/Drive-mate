import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import authMiddleware from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import riderRoutes from '../routes/riderRoutes.js';
import rideRoutes from '../routes/rideRoutes.js';
import supportRoutes from '../routes/supportRoutes.js';
import fleetRoutes from '../routes/fleetRoutes.js';
import financeRoutes from '../routes/financeRoutes.js';
import operationsRoutes from '../routes/operationsRoutes.js';

function createToken(userId: string, role: 'rider' | 'customer' = 'rider') {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  return jwt.sign({ user: { id: userId, role } }, secret, { expiresIn: '1h' });
}

async function fetchJson(url: string, init?: RequestInit): Promise<{ status: number; body: any }> {
  const res = await fetch(url, init);
  const body: any = await res.json();
  return { status: res.status, body };
}

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use('/api/rider', riderRoutes);
  app.use('/api/ride', rideRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/fleet', fleetRoutes);
  app.use('/api/finance', financeRoutes);
  app.use('/api/operations', operationsRoutes);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address() as any;
  const baseUrl = `http://127.0.0.1:${addr.port}`;
  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test('API Integration Cleanup & Zero-Fallback Regression Suite', async (t) => {
  const original: Array<{ target: any; key: string; fn: any }> = [];
  const stub = (target: any, key: string, impl: any) => {
    original.push({ target, key, fn: target[key] });
    target[key] = impl;
  };

  t.after(() => {
    for (const entry of original.reverse()) {
      entry.target[entry.key] = entry.fn;
    }
  });

  // In-memory store representing an empty newly registered rider & customer
  const storedPaymentMethods: any[] = [];
  const riderRecord = {
    id: 'rider_clean_1',
    name: 'Test Driver',
    email: 'driver@test.com',
    phone: '+919900112233',
    role: 'rider',
    vehicleType: 'bike',
    rating: 4.5,
    totalRides: 0,
    totalEarnings: 0,
    walletBalance: 0,
    loyaltyPoints: 0,
    referralCode: 'DRVTEST1',
    vehicle: null,
    documents: null,
    preferences: null,
  };

  stub(prisma.rider, 'findUnique', async ({ where }: any) => {
    if (where.id === riderRecord.id) return riderRecord;
    return null;
  });
  stub(prisma.rider, 'aggregate', async () => ({ _avg: { rating: null } }));
  stub(prisma.rider, 'count', async () => 0);
  stub(prisma.rider, 'update', async ({ where, data }: any) => ({
    ...riderRecord,
    id: where.id,
    ...data,
  }));

  stub(prisma.wallet, 'findUnique', async () => ({
    id: 'w_rider_1',
    userId: riderRecord.id,
    userType: 'rider',
    currency: 'INR',
    balance: 0,
    lockedBalance: 0,
    status: 'ACTIVE',
    updatedAt: new Date(),
  }));
  stub(prisma.wallet, 'create', async ({ data }: any) => data);
  stub(prisma.walletTransaction, 'count', async () => 0);
  stub(prisma.walletTransaction, 'findMany', async () => []);

  stub(prisma.paymentMethod, 'findMany', async ({ where }: any) =>
    storedPaymentMethods.filter((m) => m.userId === where.userId)
  );
  stub(prisma.paymentMethod, 'count', async ({ where }: any) =>
    storedPaymentMethods.filter((m) => m.userId === where.userId).length
  );
  stub(prisma.paymentMethod, 'create', async ({ data }: any) => {
    storedPaymentMethods.push(data);
    return data;
  });

  stub(prisma.driverOnboarding, 'findUnique', async () => null);
  stub(prisma.driverOnboarding, 'count', async () => 0);
  stub(prisma.vehicleInspection, 'count', async () => 0);
  stub(prisma.reward, 'findMany', async () => []);
  stub(prisma.driverIncentiveBroadcast, 'findMany', async () => []);
  stub(prisma.notification, 'findMany', async () => []);
  stub(prisma.notification, 'create', async ({ data }: any) => data);
  stub(prisma.claim, 'count', async () => 0);

  const rides: any[] = [];
  stub(prisma.ride, 'findMany', async ({ where }: any) => {
    return rides.filter((r) => {
      if (where?.riderId && r.riderId !== where.riderId) return false;
      if (where?.customerId && r.customerId !== where.customerId) return false;
      if (where?.status && typeof where.status === 'string' && r.status !== where.status) return false;
      return true;
    });
  });
  stub(prisma.ride, 'findFirst', async ({ where }: any) => {
    return (
      rides.find((r) => {
        if (where?.riderId && r.riderId !== where.riderId) return false;
        if (where?.customerId && r.customerId !== where.customerId) return false;
        return true;
      }) || null
    );
  });
  stub(prisma.ride, 'findUnique', async ({ where }: any) => {
    return rides.find((r) => r.id === where.id) || null;
  });
  stub(prisma.ride, 'count', async ({ where }: any) => {
    return rides.filter((r) => {
      if (where?.riderId && r.riderId !== where.riderId) return false;
      if (where?.customerId && r.customerId !== where.customerId) return false;
      if (where?.status && typeof where.status === 'string' && r.status !== where.status) return false;
      return true;
    }).length;
  });
  stub(prisma.ride, 'aggregate', async () => ({ _avg: { duration: null } }));

  stub(prisma.disbursement, 'aggregate', async () => ({ _sum: { amount: null }, _count: 0 }));
  stub(prisma.disbursement, 'count', async () => 0);
  stub(prisma.payoutBatch, 'aggregate', async () => ({ _sum: { totalAmount: null }, _count: 0 }));
  stub(prisma.refundVoucher, 'count', async () => 0);
  stub(prisma.cityZone, 'count', async () => 0);
  stub(prisma.supportTicket, 'count', async () => 0);
  stub(prisma.supportTicket, 'findMany', async () => []);

  await withServer(async (baseUrl) => {
    const riderToken = createToken(riderRecord.id, 'rider');
    const missingRiderToken = createToken('unknown_rider_999', 'rider');
    const customerToken = createToken('cust_clean_1', 'customer');

    await t.test('rejects unknown driver token instead of returning dummy Ramesh Patel', async () => {
      const res = await fetch(`${baseUrl}/api/rider/profile`, {
        headers: { 'x-auth-token': missingRiderToken },
      });
      assert.equal(res.status, 404);
    });

    await t.test('GET /api/rider/profile, /earnings, /vehicle, /documents return real empty/zero data without fallbacks', async () => {
      const [profRes, earnRes, vehRes, docRes] = await Promise.all([
        fetchJson(`${baseUrl}/api/rider/profile`, { headers: { 'x-auth-token': riderToken } }).then((r) => r.body),
        fetchJson(`${baseUrl}/api/rider/earnings`, { headers: { 'x-auth-token': riderToken } }).then((r) => r.body),
        fetchJson(`${baseUrl}/api/rider/vehicle`, { headers: { 'x-auth-token': riderToken } }).then((r) => r.body),
        fetchJson(`${baseUrl}/api/rider/documents`, { headers: { 'x-auth-token': riderToken } }).then((r) => r.body),
      ]);

      assert.equal(profRes.data.todayEarnings, 0);
      assert.equal(profRes.data.totalRides, 0);
      assert.equal(earnRes.data.totalBalance, 0);
      assert.equal(earnRes.data.weeklyTrips, 0);
      assert.equal(earnRes.data.onlineHours, '0h 0m');
      assert.equal(vehRes.data.plate, '');
      assert.equal(vehRes.data.model, '');
      assert.deepEqual(docRes.data, []);
    });

    await t.test('GET /api/rider/wallet & POST /api/rider/wallet/link-account persist real payment methods', async () => {
      const { body: initialWallet } = await fetchJson(`${baseUrl}/api/rider/wallet`, {
        headers: { 'x-auth-token': riderToken },
      });
      assert.deepEqual(initialWallet.data.linkedAccounts, []);

      const createAcc = await fetchJson(`${baseUrl}/api/rider/wallet/link-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': riderToken },
        body: JSON.stringify({ provider: 'ICICI Bank', type: 'Bank Account', accountNumber: '9876543210' }),
      });
      assert.equal(createAcc.status, 201);

      const { body: updatedWallet } = await fetchJson(`${baseUrl}/api/rider/wallet`, {
        headers: { 'x-auth-token': riderToken },
      });
      assert.equal(updatedWallet.data.linkedAccounts.length, 1);
      assert.equal(updatedWallet.data.linkedAccounts[0].provider, 'ICICI Bank');
      assert.equal(updatedWallet.data.linkedAccounts[0].last4, '3210');
    });

    await t.test('GET /api/rider/performance computes metrics strictly from DB rides', async () => {
      rides.push({
        id: 'ride_perf_1',
        riderId: riderRecord.id,
        customerId: 'cust_clean_1',
        status: 'completed',
        fare: 220,
        duration: 20,
        createdAt: new Date(),
        completedAt: new Date(),
        pickupPlaceName: 'Origin',
        pickupAddress: 'Origin Addr',
        pickupLat: 17.4,
        pickupLng: 78.4,
        dropPlaceName: 'Dest',
        dropAddress: 'Dest Addr',
        dropLat: 17.45,
        dropLng: 78.45,
        rider: riderRecord,
      });

      const { body: perf } = await fetchJson(`${baseUrl}/api/rider/performance`, {
        headers: { 'x-auth-token': riderToken },
      });

      assert.equal(perf.data.totalCompletedRides, 1);
      assert.equal(perf.data.totalWeeklyRides, 1);
      assert.equal(perf.data.totalWeeklyEarnings, 220);
      assert.equal(perf.data.weeklyActivity.length, 7);
    });

    await t.test('GET /api/ride/rider/active never leaks another driver active ride', async () => {
      const otherToken = createToken('other_driver_777', 'rider');
      rides.push({
        id: 'ride_other_active',
        riderId: riderRecord.id,
        customerId: 'cust_other',
        status: 'accepted',
        pickupAddress: 'A',
        dropAddress: 'B',
        pickupLat: 17.4,
        pickupLng: 78.4,
        dropLat: 17.41,
        dropLng: 78.41,
      });

      const { body: otherActive } = await fetchJson(`${baseUrl}/api/ride/rider/active`, {
        headers: { 'x-auth-token': otherToken },
      });
      assert.equal(otherActive.data, null);
    });

    await t.test('Customer history pagination, active ride, and ride rating work without mock data', async () => {
      const { body: hist } = await fetchJson(`${baseUrl}/api/ride/customer/history?page=1&limit=10&status=completed`, {
        headers: { 'x-auth-token': customerToken },
      });

      assert.equal(hist.data.rides.length, 1);
      assert.equal(hist.data.pagination.total, 1);
      assert.equal(hist.data.pagination.hasMore, false);

      const rateRes = await fetchJson(`${baseUrl}/api/ride/ride_perf_1/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': customerToken },
        body: JSON.stringify({ rating: 5, review: 'Great trip' }),
      });
      assert.equal(rateRes.status, 200);
      assert.equal(rateRes.body.data.submittedScore, 5);
    });

    await t.test('Operations, Fleet, Finance, Support metrics & FAQs return real zero/config values', async () => {
      rides.length = 0;
      const [fleet, finance, ops, sup, faqs] = await Promise.all([
        fetchJson(`${baseUrl}/api/fleet/metrics`).then((r) => r.body),
        fetchJson(`${baseUrl}/api/finance/metrics`).then((r) => r.body),
        fetchJson(`${baseUrl}/api/operations/metrics`).then((r) => r.body),
        fetchJson(`${baseUrl}/api/support/metrics`).then((r) => r.body),
        fetchJson(`${baseUrl}/api/support/faqs?role=customer`).then((r) => r.body),
      ]);

      assert.equal(fleet.data.activeFleetDrivers, 0);
      assert.equal(fleet.data.fleetComplianceRate, '0.0%');
      assert.equal(finance.data.totalDisbursedAmount, 0);
      assert.equal(finance.data.settlementSuccessRate, '0.0%');
      assert.equal(ops.data.avgEtaMinutes, 0);
      assert.equal(ops.data.fulfillmentRate, '0.0%');
      assert.equal(sup.data.totalTickets, 0);
      assert.equal(sup.data.csatScore, null);
      assert.ok(Array.isArray(faqs.data) && faqs.data.length > 0);
    });
  });
});
