import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import {
  GEOFENCE_RADIUS_METERS,
  MAX_GPS_ACCURACY_METERS,
  MAX_LOCATION_AGE_MS,
  calculateDistanceMeters,
  evaluateGeofence,
  declareArrivalAtTarget,
} from '../services/geofenceService.js';
import {
  arriveAtPickupEndpoint,
  arriveAtDropEndpoint,
  updateRideStatus,
} from '../controllers/rideController.js';
import { errorHandler } from '../middleware/errorHandler.js';
import authMiddleware from '../middleware/auth.js';

const riderGeofenceUrl = pathToFileURL(path.resolve(process.cwd(), '../RiderApp/src/utils/geofence.ts')).href;
const { evaluateDriverGeofence } = await import(riderGeofenceUrl);

type DriverGpsSnapshot = {
  latitude: number | null;
  longitude: number | null;
  heading?: number | null;
  accuracy: number | null;
  timestamp: number | null;
  isMocked: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  servicesEnabled: boolean;
  error?: string | null;
};

// Helper: Generates coordinates offset horizontally (~east) from a reference point by exact meters
function offsetCoordsEast(lat: number, lng: number, meters: number): { lat: number; lng: number } {
  const metersPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
  return {
    lat,
    lng: lng + meters / metersPerDegLng,
  };
}

const PICKUP = { lat: 17.385, lng: 78.4867 };
const DROP = { lat: 17.4435, lng: 78.3772 };

interface InMemoryRide {
  id: string;
  customerId: string;
  riderId: string;
  status: string;
  otp: string;
  fare: number;
  waitCharges: number;
  pickupLat: number | null;
  pickupLng: number | null;
  pickupPlaceName: string;
  pickupAddress: string;
  dropLat: number | null;
  dropLng: number | null;
  dropPlaceName: string;
  dropAddress: string;
  arrivedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  customer: { id: string; name: string; phone: string };
}

function makeInMemoryDb(initialRide: Partial<InMemoryRide> = {}) {
  const ride: InMemoryRide = {
    id: 'ride_test_001',
    customerId: 'cust_001',
    riderId: 'driver_001',
    status: 'accepted',
    otp: '1234',
    fare: 120,
    waitCharges: 0,
    pickupLat: PICKUP.lat,
    pickupLng: PICKUP.lng,
    pickupPlaceName: 'Charminar',
    pickupAddress: 'Charminar, Hyderabad',
    dropLat: DROP.lat,
    dropLng: DROP.lng,
    dropPlaceName: 'Cyber Towers',
    dropAddress: 'Hitec City, Hyderabad',
    arrivedAt: null,
    startedAt: null,
    completedAt: null,
    customer: { id: 'cust_001', name: 'Ananya', phone: '9884522109' },
    ...initialRide,
  };

  let forceRaceMiss = false;

  return {
    rideData: ride,
    setForceRaceMiss: (v: boolean) => {
      forceRaceMiss = v;
    },
    ride: {
      findUnique: async ({ where }: any) => (where?.id === ride.id ? { ...ride } : null),
      updateMany: async ({ where, data }: any) => {
        if (forceRaceMiss) return { count: 0 };
        if (where.id !== ride.id) return { count: 0 };
        if (where.riderId && where.riderId !== ride.riderId) return { count: 0 };
        if (where.status && where.status !== ride.status) return { count: 0 };
        Object.assign(ride, data);
        return { count: 1 };
      },
    },
    rider: {
      update: async () => ({ id: ride.riderId }),
    },
  };
}

function makeClientGps(coords: { lat: number; lng: number }, overrides: Partial<DriverGpsSnapshot> = {}): DriverGpsSnapshot {
  return {
    latitude: coords.lat,
    longitude: coords.lng,
    accuracy: 12,
    timestamp: Date.now(),
    isMocked: false,
    permissionStatus: 'granted',
    servicesEnabled: true,
    error: null,
    ...overrides,
  };
}

test('Haversine distance calculation accurately reflects meter offsets', () => {
  assert.equal(calculateDistanceMeters(PICKUP.lat, PICKUP.lng, PICKUP.lat, PICKUP.lng), 0);

  const p45 = offsetCoordsEast(PICKUP.lat, PICKUP.lng, 45);
  const d45 = calculateDistanceMeters(p45.lat, p45.lng, PICKUP.lat, PICKUP.lng);
  assert.ok(Math.abs(d45 - 45) < 0.25, `Expected ~45m, got ${d45}`);

  const p51 = offsetCoordsEast(PICKUP.lat, PICKUP.lng, 51);
  const d51 = calculateDistanceMeters(p51.lat, p51.lng, PICKUP.lat, PICKUP.lng);
  assert.ok(d51 > 50 && d51 < 51.5, `Expected >50m and <51.5m, got ${d51}`);

  const p200 = offsetCoordsEast(PICKUP.lat, PICKUP.lng, 200);
  const d200 = calculateDistanceMeters(p200.lat, p200.lng, PICKUP.lat, PICKUP.lng);
  assert.ok(Math.abs(d200 - 200) < 0.5, `Expected ~200m, got ${d200}`);
});

test('1. Pickup at 200m -> arrival disabled in client & rejected by backend', async () => {
  const pos200 = offsetCoordsEast(PICKUP.lat, PICKUP.lng, 200);
  const clientEval = evaluateDriverGeofence(makeClientGps(pos200), PICKUP, 'pickup');
  assert.equal(clientEval.canDeclareArrival, false);
  assert.equal(clientEval.isWithinRadius, false);

  const db = makeInMemoryDb({ status: 'accepted' });
  await assert.rejects(
    () =>
      declareArrivalAtTarget({
        rideId: 'ride_test_001',
        driverId: 'driver_001',
        driverRole: 'rider',
        target: 'pickup',
        coords: { lat: pos200.lat, lng: pos200.lng, accuracy: 10, timestamp: Date.now() },
        db,
      }),
    (err: any) => err.statusCode === 400 && err.data?.code === 'OUTSIDE_GEOFENCE'
  );
  assert.equal(db.rideData.status, 'accepted');
});

test('2. Pickup at 51m -> arrival disabled in client & rejected by backend', async () => {
  const pos51 = offsetCoordsEast(PICKUP.lat, PICKUP.lng, 51);
  const clientEval = evaluateDriverGeofence(makeClientGps(pos51), PICKUP, 'pickup');
  assert.equal(clientEval.canDeclareArrival, false);

  const db = makeInMemoryDb({ status: 'accepted' });
  await assert.rejects(
    () =>
      declareArrivalAtTarget({
        rideId: 'ride_test_001',
        driverId: 'driver_001',
        driverRole: 'rider',
        target: 'pickup',
        coords: { lat: pos51.lat, lng: pos51.lng, accuracy: 10, timestamp: Date.now() },
        db,
      }),
    (err: any) => err.statusCode === 400 && err.data?.code === 'OUTSIDE_GEOFENCE' && err.data?.requiredRadiusMeters === GEOFENCE_RADIUS_METERS
  );
});

test('3. Pickup at <= 50m -> arrival enabled in client & accepted by backend', async () => {
  const pos49 = offsetCoordsEast(PICKUP.lat, PICKUP.lng, 49.5);
  const clientEval = evaluateDriverGeofence(makeClientGps(pos49), PICKUP, 'pickup');
  assert.equal(clientEval.canDeclareArrival, true);
  assert.equal(clientEval.isWithinRadius, true);

  const boundary = evaluateGeofence(pos49, PICKUP, 50);
  assert.equal(boundary.isWithinRadius, true);

  const db = makeInMemoryDb({ status: 'accepted' });
  const result = await declareArrivalAtTarget({
    rideId: 'ride_test_001',
    driverId: 'driver_001',
    driverRole: 'rider',
    target: 'pickup',
    coords: { lat: pos49.lat, lng: pos49.lng, accuracy: 12, timestamp: Date.now() },
    db,
  });

  assert.equal(result.updatedRide.status, 'arrived');
  assert.ok(result.updatedRide.arrivedAt instanceof Date);
  assert.equal(result.geofence.target, 'pickup');
  assert.ok(result.geofence.distanceMeters <= 50);
});

test('4. Drop at 200m -> drop arrival disabled in client & rejected by backend', async () => {
  const pos200 = offsetCoordsEast(DROP.lat, DROP.lng, 200);
  const clientEval = evaluateDriverGeofence(makeClientGps(pos200), DROP, 'drop');
  assert.equal(clientEval.canDeclareArrival, false);

  const db = makeInMemoryDb({ status: 'ongoing' });
  await assert.rejects(
    () =>
      declareArrivalAtTarget({
        rideId: 'ride_test_001',
        driverId: 'driver_001',
        driverRole: 'rider',
        target: 'drop',
        coords: { lat: pos200.lat, lng: pos200.lng, accuracy: 10, timestamp: Date.now() },
        db,
      }),
    (err: any) => err.statusCode === 400 && err.data?.code === 'OUTSIDE_GEOFENCE'
  );
});

test('5. Drop at 51m -> drop arrival disabled in client & rejected by backend', async () => {
  const pos51 = offsetCoordsEast(DROP.lat, DROP.lng, 51);
  const clientEval = evaluateDriverGeofence(makeClientGps(pos51), DROP, 'drop');
  assert.equal(clientEval.canDeclareArrival, false);

  const db = makeInMemoryDb({ status: 'ongoing' });
  await assert.rejects(
    () =>
      declareArrivalAtTarget({
        rideId: 'ride_test_001',
        driverId: 'driver_001',
        driverRole: 'rider',
        target: 'drop',
        coords: { lat: pos51.lat, lng: pos51.lng, accuracy: 10, timestamp: Date.now() },
        db,
      }),
    (err: any) => err.statusCode === 400 && err.data?.code === 'OUTSIDE_GEOFENCE'
  );
});

test('6. Drop at <= 50m -> drop arrival enabled in client & accepted by backend', async () => {
  const pos35 = offsetCoordsEast(DROP.lat, DROP.lng, 35);
  const clientEval = evaluateDriverGeofence(makeClientGps(pos35), DROP, 'drop');
  assert.equal(clientEval.canDeclareArrival, true);
  assert.equal(clientEval.isWithinRadius, true);

  const db = makeInMemoryDb({ status: 'ongoing' });
  const result = await declareArrivalAtTarget({
    rideId: 'ride_test_001',
    driverId: 'driver_001',
    driverRole: 'rider',
    target: 'drop',
    coords: { lat: pos35.lat, lng: pos35.lng, accuracy: 15, timestamp: Date.now() },
    db,
  });

  assert.equal(result.updatedRide.status, 'drop_arrived');
  assert.equal(result.geofence.target, 'drop');
  assert.ok(result.geofence.distanceMeters <= 50);
});

test('7. Driver GPS unavailable (null, missing, or (0,0)) -> disabled & rejected', async () => {
  const nullClientEval = evaluateDriverGeofence(null, PICKUP, 'pickup');
  assert.equal(nullClientEval.canDeclareArrival, false);
  assert.equal(nullClientEval.isGpsUnavailable, true);

  const deniedClientEval = evaluateDriverGeofence(
    makeClientGps(PICKUP, { permissionStatus: 'denied', latitude: null, longitude: null }),
    PICKUP,
    'pickup'
  );
  assert.equal(deniedClientEval.canDeclareArrival, false);
  assert.equal(deniedClientEval.isPermissionDenied, true);

  const db = makeInMemoryDb({ status: 'accepted' });
  await assert.rejects(
    () =>
      declareArrivalAtTarget({
        rideId: 'ride_test_001',
        driverId: 'driver_001',
        driverRole: 'rider',
        target: 'pickup',
        coords: {},
        db,
      }),
    (err: any) => err.statusCode === 400 && err.data?.code === 'GPS_UNAVAILABLE'
  );

  await assert.rejects(
    () =>
      declareArrivalAtTarget({
        rideId: 'ride_test_001',
        driverId: 'driver_001',
        driverRole: 'rider',
        target: 'pickup',
        coords: { lat: 0, lng: 0, accuracy: 5, timestamp: Date.now() },
        db,
      }),
    (err: any) => err.statusCode === 400 && err.data?.code === 'GPS_UNAVAILABLE'
  );
});

test('8. Poor GPS accuracy (> 80m) & mocked GPS -> disabled & rejected', async () => {
  const poorAcc = MAX_GPS_ACCURACY_METERS + 40;
  const clientEval = evaluateDriverGeofence(makeClientGps(PICKUP, { accuracy: poorAcc }), PICKUP, 'pickup');
  assert.equal(clientEval.canDeclareArrival, false);
  assert.equal(clientEval.isPoorAccuracy, true);

  const mockedEval = evaluateDriverGeofence(makeClientGps(PICKUP, { isMocked: true }), PICKUP, 'pickup');
  assert.equal(mockedEval.canDeclareArrival, false);
  assert.equal(mockedEval.isMockedLocation, true);

  const db = makeInMemoryDb({ status: 'accepted' });
  await assert.rejects(
    () =>
      declareArrivalAtTarget({
        rideId: 'ride_test_001',
        driverId: 'driver_001',
        driverRole: 'rider',
        target: 'pickup',
        coords: { lat: PICKUP.lat, lng: PICKUP.lng, accuracy: poorAcc, timestamp: Date.now() },
        db,
      }),
    (err: any) => err.statusCode === 400 && err.data?.code === 'POOR_GPS_ACCURACY'
  );

  await assert.rejects(
    () =>
      declareArrivalAtTarget({
        rideId: 'ride_test_001',
        driverId: 'driver_001',
        driverRole: 'rider',
        target: 'pickup',
        coords: { lat: PICKUP.lat, lng: PICKUP.lng, accuracy: 10, timestamp: Date.now(), isMocked: true },
        db,
      }),
    (err: any) => err.statusCode === 400 && err.data?.code === 'MOCKED_LOCATION'
  );
});

test('9. Stale driver GPS location (> 60s old) -> disabled & rejected', async () => {
  const nowMs = Date.now();
  const staleTs = nowMs - (MAX_LOCATION_AGE_MS + 15_000);
  const clientEval = evaluateDriverGeofence(makeClientGps(PICKUP, { timestamp: staleTs }), PICKUP, 'pickup', nowMs);
  assert.equal(clientEval.canDeclareArrival, false);
  assert.equal(clientEval.isStaleLocation, true);

  const db = makeInMemoryDb({ status: 'accepted' });
  await assert.rejects(
    () =>
      declareArrivalAtTarget({
        rideId: 'ride_test_001',
        driverId: 'driver_001',
        driverRole: 'rider',
        target: 'pickup',
        coords: { lat: PICKUP.lat, lng: PICKUP.lng, accuracy: 10, timestamp: staleTs },
        nowMs,
        db,
      }),
    (err: any) => err.statusCode === 400 && err.data?.code === 'STALE_LOCATION'
  );
});

test('10. Driver attempts arrival for another driver\'s ride or with customer role -> 403 rejected', async () => {
  const db = makeInMemoryDb({ status: 'accepted', riderId: 'driver_001' });

  await assert.rejects(
    () =>
      declareArrivalAtTarget({
        rideId: 'ride_test_001',
        driverId: 'other_driver_999',
        driverRole: 'rider',
        target: 'pickup',
        coords: { lat: PICKUP.lat, lng: PICKUP.lng, accuracy: 10, timestamp: Date.now() },
        db,
      }),
    (err: any) => err.statusCode === 403 && err.data?.code === 'NOT_ASSIGNED_DRIVER'
  );

  await assert.rejects(
    () =>
      declareArrivalAtTarget({
        rideId: 'ride_test_001',
        driverId: 'cust_001',
        driverRole: 'customer',
        target: 'pickup',
        coords: { lat: PICKUP.lat, lng: PICKUP.lng, accuracy: 10, timestamp: Date.now() },
        db,
      }),
    (err: any) => err.statusCode === 403 && err.data?.code === 'FORBIDDEN_ROLE'
  );
});

test('11. Invalid ride status transitions rejected for both pickup and drop arrival', async () => {
  for (const badStatus of ['pending', 'ongoing', 'drop_arrived', 'completed', 'cancelled']) {
    const db = makeInMemoryDb({ status: badStatus });
    await assert.rejects(
      () =>
        declareArrivalAtTarget({
          rideId: 'ride_test_001',
          driverId: 'driver_001',
          driverRole: 'rider',
          target: 'pickup',
          coords: { lat: PICKUP.lat, lng: PICKUP.lng, accuracy: 10, timestamp: Date.now() },
          db,
        }),
      (err: any) => err.statusCode === 400 && err.data?.code === 'INVALID_RIDE_STATUS'
    );
  }

  for (const badStatus of ['pending', 'accepted', 'arrived', 'completed', 'cancelled']) {
    const db = makeInMemoryDb({ status: badStatus });
    await assert.rejects(
      () =>
        declareArrivalAtTarget({
          rideId: 'ride_test_001',
          driverId: 'driver_001',
          driverRole: 'rider',
          target: 'drop',
          coords: { lat: DROP.lat, lng: DROP.lng, accuracy: 10, timestamp: Date.now() },
          db,
        }),
      (err: any) => err.statusCode === 400 && err.data?.code === 'INVALID_RIDE_STATUS'
    );
  }
});

test('12. Duplicate sequential and concurrent arrival requests rejected with 409', async () => {
  const db = makeInMemoryDb({ status: 'accepted' });

  await declareArrivalAtTarget({
    rideId: 'ride_test_001',
    driverId: 'driver_001',
    driverRole: 'rider',
    target: 'pickup',
    coords: { lat: PICKUP.lat, lng: PICKUP.lng, accuracy: 10, timestamp: Date.now() },
    db,
  });

  await assert.rejects(
    () =>
      declareArrivalAtTarget({
        rideId: 'ride_test_001',
        driverId: 'driver_001',
        driverRole: 'rider',
        target: 'pickup',
        coords: { lat: PICKUP.lat, lng: PICKUP.lng, accuracy: 10, timestamp: Date.now() },
        db,
      }),
    (err: any) => err.statusCode === 409 && err.data?.code === 'DUPLICATE_ARRIVAL'
  );

  // Simulated concurrent race condition where updateMany matches 0 rows
  const dropDb = makeInMemoryDb({ status: 'ongoing' });
  dropDb.setForceRaceMiss(true);
  await assert.rejects(
    () =>
      declareArrivalAtTarget({
        rideId: 'ride_test_001',
        driverId: 'driver_001',
        driverRole: 'rider',
        target: 'drop',
        coords: { lat: DROP.lat, lng: DROP.lng, accuracy: 10, timestamp: Date.now() },
        db: dropDb,
      }),
    (err: any) => err.statusCode === 409 && err.data?.code === 'DUPLICATE_ARRIVAL'
  );
});

test('13. Express controller & Socket.IO room broadcasts emit exact status updates to customer app', async () => {
  const { prisma } = await import('../config/prisma.js');
  const db = makeInMemoryDb({ status: 'accepted' });

  // Stub Prisma methods cleanly in memory for HTTP route test without touching Postgres records
  const origFindUnique = prisma.ride.findUnique;
  const origUpdateMany = prisma.ride.updateMany;
  const origRiderUpdate = prisma.rider.update;

  prisma.ride.findUnique = db.ride.findUnique as any;
  prisma.ride.updateMany = db.ride.updateMany as any;
  prisma.rider.update = (async () => ({ id: 'driver_001', isAvailable: true })) as any;

  const emittedEvents: Array<{ rooms: any; event: string; payload: any }> = [];
  const fakeIo = {
    to: (rooms: any) => ({
      emit: (event: string, payload: any) => {
        emittedEvents.push({ rooms, event, payload });
      },
    }),
  };

  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.io = fakeIo;
    next();
  });
  app.post('/api/ride/:id/arrive-pickup', authMiddleware, arriveAtPickupEndpoint);
  app.post('/api/ride/:id/arrive-drop', authMiddleware, arriveAtDropEndpoint);
  app.put('/api/ride/update-status', authMiddleware, updateRideStatus);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address: any = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const driverToken = jwt.sign(
    { user: { id: 'driver_001', role: 'rider' } },
    process.env.JWT_SECRET || 'fallback_secret'
  );

  try {
    // 1. Outside geofence (200m) + client spoofing attempt rejected
    const spoofedPos = offsetCoordsEast(PICKUP.lat, PICKUP.lng, 200);
    const badRes = await fetch(`${baseUrl}/api/ride/ride_test_001/arrive-pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': driverToken },
      body: JSON.stringify({
        lat: spoofedPos.lat,
        lng: spoofedPos.lng,
        accuracy: 10,
        timestamp: Date.now(),
        pickupLat: spoofedPos.lat,
        pickupLng: spoofedPos.lng,
      }),
    });
    assert.equal(badRes.status, 400);

    // 2. Pickup arrival within 50m -> 200 + Socket.IO driver_arrived + ride_status_update
    const nearPickup = offsetCoordsEast(PICKUP.lat, PICKUP.lng, 25);
    const arrivePickupRes = await fetch(`${baseUrl}/api/ride/ride_test_001/arrive-pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': driverToken },
      body: JSON.stringify({ lat: nearPickup.lat, lng: nearPickup.lng, accuracy: 10, timestamp: Date.now() }),
    });
    assert.equal(arrivePickupRes.status, 200);
    const arrivePickupBody: any = await arrivePickupRes.json();
    assert.equal(arrivePickupBody.data.ride.status, 'arrived');
    assert.ok(
      emittedEvents.some(
        (e) =>
          e.event === 'ride_status_update' &&
          e.payload.status === 'arrived' &&
          e.rooms.includes('cust_001') &&
          e.rooms.includes('ride_ride_test_001')
      )
    );
    assert.ok(emittedEvents.some((e) => e.event === 'driver_arrived'));

    // 3. Start ride via OTP -> ongoing
    const startRes = await fetch(`${baseUrl}/api/ride/update-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': driverToken },
      body: JSON.stringify({ rideId: 'ride_test_001', status: 'ongoing', otp: '1234' }),
    });
    assert.equal(startRes.status, 200);

    // 4. Attempting to complete before drop arrival is blocked
    const prematureCompleteRes = await fetch(`${baseUrl}/api/ride/update-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': driverToken },
      body: JSON.stringify({ rideId: 'ride_test_001', status: 'completed' }),
    });
    assert.equal(prematureCompleteRes.status, 400);

    // 5. Drop arrival within 50m -> 200 + Socket.IO driver_arrived_drop + ride_status_update
    const nearDrop = offsetCoordsEast(DROP.lat, DROP.lng, 30);
    const arriveDropRes = await fetch(`${baseUrl}/api/ride/ride_test_001/arrive-drop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': driverToken },
      body: JSON.stringify({ lat: nearDrop.lat, lng: nearDrop.lng, accuracy: 10, timestamp: Date.now() }),
    });
    assert.equal(arriveDropRes.status, 200);
    const arriveDropBody: any = await arriveDropRes.json();
    assert.equal(arriveDropBody.data.ride.status, 'drop_arrived');
    assert.ok(
      emittedEvents.some(
        (e) =>
          e.event === 'ride_status_update' &&
          e.payload.status === 'drop_arrived' &&
          e.rooms.includes('cust_001')
      )
    );
    assert.ok(
      emittedEvents.some(
        (e) =>
          e.event === 'driver_arrived_drop' &&
          e.payload.message === 'Your driver has reached your destination.'
      )
    );

    // 6. Complete ride after drop arrival -> 200
    const completeRes = await fetch(`${baseUrl}/api/ride/update-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': driverToken },
      body: JSON.stringify({ rideId: 'ride_test_001', status: 'completed' }),
    });
    assert.equal(completeRes.status, 200);
    assert.equal(db.rideData.status, 'completed');
  } finally {
    prisma.ride.findUnique = origFindUnique;
    prisma.ride.updateMany = origUpdateMany;
    prisma.rider.update = origRiderUpdate;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
