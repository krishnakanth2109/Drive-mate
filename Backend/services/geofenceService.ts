import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const GEOFENCE_RADIUS_METERS = 50;
export const MAX_GPS_ACCURACY_METERS = 80;
export const MAX_LOCATION_AGE_MS = 60 * 1000; // 60 seconds
export const MAX_FUTURE_SKEW_MS = 30 * 1000; // 30 seconds clock skew tolerance
const EARTH_RADIUS_METERS = 6371000;

export type GeofenceTarget = 'pickup' | 'drop';

export interface DriverCoordsPayload {
  lat?: unknown;
  lng?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  accuracy?: unknown;
  timestamp?: unknown;
  isMocked?: unknown;
  mocked?: unknown;
}

export interface ValidatedDriverCoords {
  lat: number;
  lng: number;
  accuracy: number | null;
  timestamp: number | null;
}

export interface GeofenceEvaluation {
  distanceMeters: number;
  roundedMeters: number;
  isWithinRadius: boolean;
  radiusMeters: number;
}

/**
 * Calculates great-circle distance in meters using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}

/**
 * Validates raw driver GPS coordinates, accuracy, freshness, and spoofing flags.
 */
export function validateDriverCoordinates(
  payload: DriverCoordsPayload,
  nowMs: number = Date.now()
): ValidatedDriverCoords {
  if (!payload || typeof payload !== 'object') {
    throw createGeofenceError(400, 'GPS coordinates payload is required', 'GPS_UNAVAILABLE');
  }

  if (payload.isMocked === true || payload.mocked === true) {
    throw createGeofenceError(
      400,
      'Mocked or manually injected GPS coordinates are not allowed for arrival detection.',
      'MOCKED_LOCATION'
    );
  }

  const rawLat = payload.lat ?? payload.latitude;
  const rawLng = payload.lng ?? payload.longitude;

  if (rawLat === undefined || rawLat === null || rawLat === '' || rawLng === undefined || rawLng === null || rawLng === '') {
    throw createGeofenceError(
      400,
      'Driver GPS location is unavailable. Please enable location services and retry.',
      'GPS_UNAVAILABLE'
    );
  }

  const lat = Number(rawLat);
  const lng = Number(rawLng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw createGeofenceError(400, 'Valid numeric driver latitude and longitude are required.', 'INVALID_COORDINATES');
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw createGeofenceError(400, 'Driver GPS coordinates are out of geographic bounds.', 'INVALID_COORDINATES');
  }

  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) {
    throw createGeofenceError(
      400,
      'Unresolved GPS coordinates (0, 0) cannot be used to mark arrival.',
      'GPS_UNAVAILABLE'
    );
  }

  let parsedAccuracy: number | null = null;
  if (payload.accuracy !== undefined && payload.accuracy !== null && payload.accuracy !== '') {
    const acc = Number(payload.accuracy);
    if (!Number.isFinite(acc) || acc < 0) {
      throw createGeofenceError(400, 'Invalid GPS accuracy value.', 'INVALID_GPS_ACCURACY');
    }
    if (acc > MAX_GPS_ACCURACY_METERS) {
      throw createGeofenceError(
        400,
        `GPS signal accuracy is too poor (±${Math.round(acc)} m). Required accuracy is within ${MAX_GPS_ACCURACY_METERS} m.`,
        'POOR_GPS_ACCURACY',
        { accuracy: acc, maxAllowedAccuracyMeters: MAX_GPS_ACCURACY_METERS }
      );
    }
    parsedAccuracy = acc;
  }

  let parsedTimestamp: number | null = null;
  if (payload.timestamp !== undefined && payload.timestamp !== null && payload.timestamp !== '') {
    const ts =
      typeof payload.timestamp === 'number'
        ? payload.timestamp
        : Date.parse(String(payload.timestamp));
    if (!Number.isFinite(ts) || ts <= 0) {
      throw createGeofenceError(400, 'Invalid GPS timestamp provided.', 'INVALID_TIMESTAMP');
    }
    const ageMs = nowMs - ts;
    if (ageMs > MAX_LOCATION_AGE_MS) {
      throw createGeofenceError(
        400,
        `Driver GPS location is stale (${Math.round(ageMs / 1000)}s old). Wait for a fresh GPS fix and try again.`,
        'STALE_LOCATION',
        { ageMs, maxAgeMs: MAX_LOCATION_AGE_MS }
      );
    }
    if (ts - nowMs > MAX_FUTURE_SKEW_MS) {
      throw createGeofenceError(400, 'Driver GPS timestamp is invalid (ahead of server time).', 'INVALID_TIMESTAMP');
    }
    parsedTimestamp = ts;
  }

  return {
    lat,
    lng,
    accuracy: parsedAccuracy,
    timestamp: parsedTimestamp,
  };
}

/**
 * Evaluates whether driver coordinates lie within radiusMeters of target destination coordinates.
 */
export function evaluateGeofence(
  driverCoords: { lat: number; lng: number },
  targetCoords: { lat: number; lng: number },
  radiusMeters: number = GEOFENCE_RADIUS_METERS
): GeofenceEvaluation {
  const distanceMeters = calculateDistanceMeters(
    driverCoords.lat,
    driverCoords.lng,
    targetCoords.lat,
    targetCoords.lng
  );
  return {
    distanceMeters,
    roundedMeters: Math.round(distanceMeters),
    isWithinRadius: distanceMeters <= radiusMeters,
    radiusMeters,
  };
}

function createGeofenceError(
  statusCode: number,
  message: string,
  code: string,
  details: Record<string, any> = {}
): ApiError {
  const err = new ApiError(statusCode, message, [{ code, ...details }]);
  err.data = { code, ...details };
  return err;
}

export interface ArrivalExecutionInput {
  rideId: string;
  driverId: string;
  driverRole?: string;
  target: GeofenceTarget;
  coords: DriverCoordsPayload;
  nowMs?: number;
  db?: {
    ride: {
      findUnique: (args: any) => Promise<any>;
      updateMany: (args: any) => Promise<{ count: number }>;
    };
    rider?: {
      update?: (args: any) => Promise<any>;
    };
  };
}

export interface ArrivalExecutionResult {
  updatedRide: any;
  geofence: {
    target: GeofenceTarget;
    distanceMeters: number;
    roundedMeters: number;
    radiusMeters: number;
    accuracy: number | null;
    timestamp: string;
  };
}

/**
 * Validates driver authorization, ride state transitions, GPS reliability,
 * and server-side 50m Haversine geofence before atomically recording arrival.
 */
export async function declareArrivalAtTarget(
  input: ArrivalExecutionInput
): Promise<ArrivalExecutionResult> {
  const {
    rideId,
    driverId,
    driverRole,
    target,
    coords,
    nowMs = Date.now(),
    db = prisma,
  } = input;

  if (!rideId) {
    throw createGeofenceError(400, 'Ride ID is required.', 'INVALID_RIDE_ID');
  }

  if (!driverId) {
    throw createGeofenceError(401, 'Authenticated driver identity is required.', 'UNAUTHORIZED');
  }

  if (driverRole && driverRole !== 'rider') {
    throw createGeofenceError(403, 'Only assigned drivers can declare ride arrival.', 'FORBIDDEN_ROLE');
  }

  // 1. Validate live GPS coordinates, accuracy, freshness & anti-spoofing
  const validCoords = validateDriverCoordinates(coords, nowMs);

  // 2. Fetch authoritative ride record & coordinates from PostgreSQL (never trust client status/coords)
  const ride = await db.ride.findUnique({ where: { id: rideId } });
  if (!ride) {
    throw createGeofenceError(404, 'Ride not found.', 'RIDE_NOT_FOUND');
  }

  // 3. Ownership validation
  if (!ride.riderId || ride.riderId !== driverId) {
    throw createGeofenceError(
      403,
      'Unauthorized: you are not the assigned driver for this ride.',
      'NOT_ASSIGNED_DRIVER'
    );
  }

  // 4. Lifecycle transition & duplicate prevention
  const expectedCurrentStatus = target === 'pickup' ? 'accepted' : 'ongoing';
  const nextStatus = target === 'pickup' ? 'arrived' : 'drop_arrived';

  if (ride.status === nextStatus) {
    throw createGeofenceError(
      409,
      target === 'pickup'
        ? 'Pickup arrival has already been recorded for this ride.'
        : 'Drop arrival has already been recorded for this ride.',
      'DUPLICATE_ARRIVAL'
    );
  }

  if (ride.status !== expectedCurrentStatus) {
    throw createGeofenceError(
      400,
      `Cannot mark ${target} arrival while ride is in "${ride.status}" state. Expected "${expectedCurrentStatus}".`,
      'INVALID_RIDE_STATUS',
      { currentStatus: ride.status, expectedStatus: expectedCurrentStatus }
    );
  }

  // 5. Load authoritative pickup or drop coordinates from database
  const targetLat = target === 'pickup' ? ride.pickupLat : ride.dropLat;
  const targetLng = target === 'pickup' ? ride.pickupLng : ride.dropLng;

  if (targetLat == null || targetLng == null || !Number.isFinite(Number(targetLat)) || !Number.isFinite(Number(targetLng))) {
    throw createGeofenceError(
      400,
      `Ride ${target} coordinates are missing in database.`,
      'MISSING_TARGET_COORDINATES'
    );
  }

  // 6. Server-side Haversine 50m geofence enforcement
  const evaluation = evaluateGeofence(
    { lat: validCoords.lat, lng: validCoords.lng },
    { lat: Number(targetLat), lng: Number(targetLng) },
    GEOFENCE_RADIUS_METERS
  );

  if (!evaluation.isWithinRadius) {
    throw createGeofenceError(
      400,
      `You are ${evaluation.roundedMeters} m away from the ${target} location. Move within ${GEOFENCE_RADIUS_METERS} m to declare arrival.`,
      'OUTSIDE_GEOFENCE',
      {
        target,
        distanceMeters: evaluation.distanceMeters,
        roundedMeters: evaluation.roundedMeters,
        requiredRadiusMeters: GEOFENCE_RADIUS_METERS,
      }
    );
  }

  // 7. Atomic conditional update prevents race-condition duplicates on rapid taps
  const arrivedTimestamp = new Date(nowMs);
  const updateData =
    target === 'pickup'
      ? { status: 'arrived', arrivedAt: arrivedTimestamp }
      : { status: 'drop_arrived' };

  const atomicUpdate = await db.ride.updateMany({
    where: {
      id: rideId,
      riderId: driverId,
      status: expectedCurrentStatus,
    },
    data: updateData,
  });

  if (!atomicUpdate || atomicUpdate.count === 0) {
    throw createGeofenceError(
      409,
      `Duplicate or concurrent ${target} arrival request rejected.`,
      'DUPLICATE_ARRIVAL'
    );
  }

  const updatedRide = await db.ride.findUnique({
    where: { id: rideId },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
    },
  });

  // Sync latest verified driver coordinates on rider profile (non-blocking)
  if (db.rider?.update) {
    Promise.resolve(
      db.rider.update({
        where: { id: driverId },
        data: { currentLat: validCoords.lat, currentLng: validCoords.lng },
      })
    ).catch(() => {});
  }

  return {
    updatedRide,
    geofence: {
      target,
      distanceMeters: evaluation.distanceMeters,
      roundedMeters: evaluation.roundedMeters,
      radiusMeters: GEOFENCE_RADIUS_METERS,
      accuracy: validCoords.accuracy,
      timestamp: arrivedTimestamp.toISOString(),
    },
  };
}
