import { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import {
  getCoordsFromAddress,
  getAddressFromCoords,
  getRouteDetails,
  getDistanceFromLatLonInKm,
  getPlaceAutocomplete,
  getPlaceDetails,
} from '../services/locationService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const generateId = (): string => crypto.randomBytes(12).toString('hex');

export const formatRideDisplayId = (id?: string | null): string => {
  if (!id) return 'DM-000000';
  return `DM-${id.slice(-6).toUpperCase()}`;
};

const VEHICLE_PRICING: Record<string, { label: string; emoji: string; base: number; perKm: number; maxKm: number }> = {
  bike: { label: 'Bike', emoji: '🏍️', base: 20, perKm: 10, maxKm: 40 },
  scooty: { label: 'Scooty', emoji: '🛵', base: 25, perKm: 10, maxKm: 40 },
  auto: { label: 'Auto', emoji: '🛺', base: 30, perKm: 12, maxKm: 40 },
  car: { label: 'Car', emoji: '🚗', base: 50, perKm: 15, maxKm: 40 },
};

// ---------------------------------------------------------------------------
// 1. Place Autocomplete Endpoint
// ---------------------------------------------------------------------------
export const autocomplete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { input, lat, lng, radius, sessionToken } = req.query;

  if (!input || typeof input !== 'string' || !input.trim()) {
    return res.status(200).json(new ApiResponse(200, [], 'Empty query'));
  }

  const bias = lat && lng ? {
    lat: parseFloat(lat as string),
    lng: parseFloat(lng as string),
    radius: radius ? parseFloat(radius as string) : undefined,
  } : undefined;

  const suggestions = await getPlaceAutocomplete(input, bias, sessionToken as string | undefined);
  res.status(200).json(new ApiResponse(200, suggestions, 'Autocomplete suggestions fetched'));
});

// ---------------------------------------------------------------------------
// 2. Place Details Endpoint (Resolve to Coordinates)
// ---------------------------------------------------------------------------
export const getPlaceDetailsById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { placeId, sessionToken } = req.query;

  if (!placeId || typeof placeId !== 'string') {
    throw new ApiError(400, 'placeId is required');
  }

  const details = await getPlaceDetails(placeId, sessionToken as string | undefined);
  if (!details) {
    throw new ApiError(404, 'Could not resolve place details');
  }

  res.status(200).json(new ApiResponse(200, details, 'Place details fetched'));
});

// ---------------------------------------------------------------------------
// 3. Reverse Geocode Endpoint (Lat/Lng -> Readable Address)
// ---------------------------------------------------------------------------
export const reverseGeocode = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { lat, lng } = req.query;

  if (lat == null || lng == null) {
    throw new ApiError(400, 'lat and lng are required');
  }

  const address = await getAddressFromCoords(parseFloat(lat as string), parseFloat(lng as string));
  res.status(200).json(new ApiResponse(200, { address, lat: parseFloat(lat as string), lng: parseFloat(lng as string) }, 'Address resolved'));
});

// ---------------------------------------------------------------------------
// 4. Estimate Ride (Route, Duration, Distance & Vehicle Fares)
// ---------------------------------------------------------------------------
export const estimateRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { pickup, drop } = req.body;
  let pickupData: any, dropData: any;

  if (!pickup || !drop) {
    throw new ApiError(400, 'Pickup and drop locations are required');
  }

  if (typeof pickup === 'string') {
    pickupData = await getCoordsFromAddress(pickup);
  } else {
    const address = pickup.address || (await getAddressFromCoords(pickup.lat, pickup.lng));
    pickupData = { ...pickup, address };
  }

  if (typeof drop === 'string') {
    dropData = await getCoordsFromAddress(drop);
  } else {
    const address = drop.address || (await getAddressFromCoords(drop.lat, drop.lng));
    dropData = { ...drop, address };
  }

  const route = await getRouteDetails(pickupData, dropData);
  if (!route) throw new ApiError(400, 'Could not calculate road route');

  const distanceKm = parseFloat(route.distance.toFixed(2));

  if (distanceKm > 40) {
    return res.status(400).json(
      new ApiResponse(400, { limitExceeded: true, distance: distanceKm }, `Distance of ${distanceKm} km exceeds the 40 km booking limit.`)
    );
  }

  const fareOptions = Object.entries(VEHICLE_PRICING).map(([key, v]) => ({
    type: key,
    label: v.label,
    emoji: v.emoji,
    fare: Math.round(v.base + distanceKm * v.perKm),
    perKm: v.perKm,
    eta: Math.max(1, Math.ceil((distanceKm / 25) * 60)),
  }));

  res.status(200).json(
    new ApiResponse(200, {
      pickup: pickupData,
      drop: dropData,
      distance: distanceKm,
      duration: Math.max(1, Math.ceil(route.duration)),
      polyline: route.polyline,
      coordinates: route.coordinates,
      fareOptions,
    }, 'Estimate generated')
  );
});

// ---------------------------------------------------------------------------
// 5. Create Ride (Atomic Creation with Idempotency & Driver Dispatch)
// ---------------------------------------------------------------------------
export const createRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { pickup, drop, distance, duration, polyline, vehicleType } = req.body;
  const idempotencyKey = (req.headers['x-idempotency-key'] as string) || req.body.idempotencyKey;
  const customerId = req.user.id || req.user._id;

  if (!pickup || !drop) {
    throw new ApiError(400, 'Pickup and drop locations are required');
  }

  // Idempotency check: prevent duplicate rides from rapid double clicks or network retries
  if (idempotencyKey) {
    const existingRide = await prisma.ride.findFirst({
      where: { idempotencyKey },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });

    if (existingRide) {
      const clientPayload = {
        ...existingRide,
        _id: existingRide.id,
        customer: existingRide.customer ? { ...existingRide.customer, _id: existingRide.customer.id } : null,
        pickup: {
          name: existingRide.pickupPlaceName,
          address: existingRide.pickupAddress,
          lat: existingRide.pickupLat,
          lng: existingRide.pickupLng,
        },
        drop: {
          name: existingRide.dropPlaceName,
          address: existingRide.dropAddress,
          lat: existingRide.dropLat,
          lng: existingRide.dropLng,
        },
      };
      return res.status(200).json(new ApiResponse(200, clientPayload, 'Ride already exists (idempotent replay)'));
    }
  }

  // Authoritative server-side distance & fare calculation
  let finalDistance = distance != null ? Number(distance) : null;
  let finalDuration = duration != null ? Number(duration) : null;
  let finalPolyline = polyline || null;

  if (pickup.lat && pickup.lng && drop.lat && drop.lng) {
    const calculatedRoute = await getRouteDetails(
      { lat: Number(pickup.lat), lng: Number(pickup.lng) },
      { lat: Number(drop.lat), lng: Number(drop.lng) }
    );
    if (calculatedRoute) {
      finalDistance = parseFloat(calculatedRoute.distance.toFixed(2));
      finalDuration = calculatedRoute.duration;
      finalPolyline = calculatedRoute.polyline || finalPolyline;
    }
  }

  if (finalDistance && finalDistance > 40) {
    throw new ApiError(400, 'Distance exceeds 40 km limit.');
  }

  const selectedVehicleKey = vehicleType && VEHICLE_PRICING[vehicleType] ? vehicleType : 'bike';
  const pricingConfig = VEHICLE_PRICING[selectedVehicleKey];
  const authoritativeFare = finalDistance
    ? Math.round(pricingConfig.base + finalDistance * pricingConfig.perKm)
    : pricingConfig.base;

  const rideId = generateId();
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  const savedRide = await prisma.ride.create({
    data: {
      id: rideId,
      customerId,
      pickupPlaceName: pickup?.name || null,
      pickupAddress: pickup?.address || 'Pickup Location',
      pickupLat: pickup?.lat != null ? Number(pickup.lat) : null,
      pickupLng: pickup?.lng != null ? Number(pickup.lng) : null,
      dropPlaceName: drop?.name || null,
      dropAddress: drop?.address || 'Drop Location',
      dropLat: drop?.lat != null ? Number(drop.lat) : null,
      dropLng: drop?.lng != null ? Number(drop.lng) : null,
      fare: authoritativeFare,
      currency: 'INR',
      distance: finalDistance,
      duration: finalDuration,
      polyline: finalPolyline,
      vehicleType: selectedVehicleKey,
      status: 'pending',
      otp,
      idempotencyKey: idempotencyKey || null,
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
    },
  });

  const availableDrivers = await prisma.rider.findMany({
    where: {
      isAvailable: true,
      ...(selectedVehicleKey ? { vehicleType: selectedVehicleKey } : {}),
    },
  });

  // Filter within 3 km using Haversine
  const driversToNotify = availableDrivers.filter((d) => {
    if (d.currentLat == null || d.currentLng == null || pickup?.lat == null || pickup?.lng == null) {
      return false;
    }
    const dist = getDistanceFromLatLonInKm(Number(pickup.lat), Number(pickup.lng), d.currentLat, d.currentLng);
    return dist <= 5; // 5 km dispatch radius
  });

  const finalDrivers = driversToNotify.length > 0 ? driversToNotify : availableDrivers;

  console.log(`Notifying ${finalDrivers.length} drivers for ride ${savedRide.id}`);

  const clientRidePayload = {
    ...savedRide,
    _id: savedRide.id,
    displayId: formatRideDisplayId(savedRide.id),
    customer: savedRide.customer ? { ...savedRide.customer, _id: savedRide.customer.id } : null,
    pickup: {
      name: savedRide.pickupPlaceName,
      address: savedRide.pickupAddress,
      lat: savedRide.pickupLat,
      lng: savedRide.pickupLng,
    },
    drop: {
      name: savedRide.dropPlaceName,
      address: savedRide.dropAddress,
      lat: savedRide.dropLat,
      lng: savedRide.dropLng,
    },
  };

  if (req.io) {
    finalDrivers.forEach((driver) => {
      req.io.to(driver.id).emit('new_ride_request', clientRidePayload);
    });
  }

  res.status(201).json(new ApiResponse(201, clientRidePayload, 'Ride created successfully'));

  // Timeout after 15 seconds if ride remains unassigned
  setTimeout(async () => {
    try {
      const rideCheck = await prisma.ride.findUnique({ where: { id: savedRide.id } });
      if (rideCheck && rideCheck.status === 'pending') {
        await prisma.ride.update({
          where: { id: savedRide.id },
          data: { status: 'cancelled', cancellationReason: 'No riders accepted within dispatch timeout' },
        });

        if (req.io) {
          if (rideCheck.customerId) {
            req.io.to(rideCheck.customerId).emit('ride_timeout', {
              rideId: rideCheck.id,
              message: 'No drivers available right now. Please try again.',
            });
          }
          req.io.to('drivers').emit('ride_taken', { rideId: rideCheck.id });
        }
      }
    } catch (err) {
      console.error('Ride timeout error:', err);
    }
  }, 15000);
});

// ---------------------------------------------------------------------------
// 6. Accept Ride (Driver Acceptance with Atomic State Lock)
// ---------------------------------------------------------------------------
export const acceptRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { rideId } = req.body;
  const riderId = req.user.id || req.user._id;

  // Atomic transaction prevents race conditions when multiple drivers try to accept the same ride
  const { updatedRide, rider } = await prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new ApiError(404, 'Ride not found');
    if (ride.status !== 'pending') throw new ApiError(400, 'Ride already taken');

    const updatedRide = await tx.ride.update({
      where: { id: rideId },
      data: { riderId, status: 'accepted', acceptedAt: new Date() },
      include: { customer: true },
    });

    const rider = await tx.rider.update({
      where: { id: riderId },
      data: { isAvailable: false },
    });

    return { updatedRide, rider };
  });

  const clientRide = {
    ...updatedRide,
    _id: updatedRide.id,
    displayId: formatRideDisplayId(updatedRide.id),
    customer: updatedRide.customerId,
    rider: updatedRide.riderId,
    pickup: {
      name: updatedRide.pickupPlaceName,
      address: updatedRide.pickupAddress,
      lat: updatedRide.pickupLat,
      lng: updatedRide.pickupLng,
    },
    drop: {
      name: updatedRide.dropPlaceName,
      address: updatedRide.dropAddress,
      lat: updatedRide.dropLat,
      lng: updatedRide.dropLng,
    },
  };

  const vehicleObj = (rider.vehicle as any) || {};

  if (req.io && updatedRide.customerId) {
    req.io.to(updatedRide.customerId).emit('ride_accepted', {
      ride: clientRide,
      rider: {
        name: rider.name,
        phone: rider.phone,
        vehicle: `${vehicleObj.model || 'Vehicle'} (${vehicleObj.plate || 'XX-XX-XXXX'})`,
        vehicleType: rider.vehicleType || 'bike',
        location: {
          type: 'Point',
          coordinates: [rider.currentLng ?? 0, rider.currentLat ?? 0],
          heading: rider.heading,
        },
      },
    });

    req.io.to('drivers').emit('ride_taken', { rideId });
  }

  res.status(200).json(new ApiResponse(200, { ride: clientRide }, 'Ride accepted successfully'));
});

export const FREE_WAIT_MINUTES = 3;
export const WAIT_CHARGE_PER_MIN = 2; // ₹2 per minute after 3 minutes free

// ---------------------------------------------------------------------------
// 7. Get Live Ride Wait Time (Elapsed, Free Remaining, Billable Charges)
// ---------------------------------------------------------------------------
export const getRideWaitTime = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const rideId = String(req.params.id || req.params.rideId);
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) throw new ApiError(404, 'Ride not found');

  if (!ride.arrivedAt) {
    return res.status(200).json(
      new ApiResponse(200, {
        rideId: ride.id,
        status: ride.status,
        hasArrived: false,
        arrivedAt: null,
        startedAt: null,
        freeWaitMinutes: FREE_WAIT_MINUTES,
        freeWaitSeconds: FREE_WAIT_MINUTES * 60,
        elapsedWaitSeconds: 0,
        freeWaitRemainingSeconds: FREE_WAIT_MINUTES * 60,
        isFreeWaitExpired: false,
        billableWaitMinutes: 0,
        currentWaitCharges: 0,
        ratePerMinute: WAIT_CHARGE_PER_MIN,
      }, 'Driver has not arrived yet')
    );
  }

  const startTime = new Date(ride.arrivedAt).getTime();
  const endTime = ride.startedAt ? new Date(ride.startedAt).getTime() : Date.now();
  const elapsedMs = Math.max(0, endTime - startTime);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const freeWaitMs = FREE_WAIT_MINUTES * 60 * 1000;
  const isFreeWaitExpired = elapsedMs > freeWaitMs;
  const freeWaitRemainingSeconds = Math.max(0, Math.floor((freeWaitMs - elapsedMs) / 1000));

  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const billableWaitMinutes = Math.max(0, elapsedMinutes - FREE_WAIT_MINUTES);
  const currentWaitCharges = billableWaitMinutes * WAIT_CHARGE_PER_MIN;

  res.status(200).json(
    new ApiResponse(200, {
      rideId: ride.id,
      status: ride.status,
      hasArrived: true,
      arrivedAt: ride.arrivedAt,
      startedAt: ride.startedAt,
      freeWaitMinutes: FREE_WAIT_MINUTES,
      freeWaitSeconds: FREE_WAIT_MINUTES * 60,
      freeWaitExpiresAt: new Date(startTime + freeWaitMs).toISOString(),
      elapsedWaitSeconds: elapsedSeconds,
      elapsedWaitMinutes: elapsedMinutes,
      freeWaitRemainingSeconds,
      isFreeWaitExpired,
      billableWaitMinutes,
      currentWaitCharges,
      ratePerMinute: WAIT_CHARGE_PER_MIN,
      baseFare: Math.max(0, Number(ride.fare) - Number(ride.waitCharges || 0)),
      totalFare: Number(ride.fare),
    }, 'Wait time details retrieved')
  );
});

// ---------------------------------------------------------------------------
// 8. Update Ride Status (arrived -> ongoing -> completed)
// ---------------------------------------------------------------------------
export const updateRideStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { rideId, status, otp } = req.body;

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) throw new ApiError(404, 'Ride not found');

  let waitCharges = Number(ride.waitCharges || 0);
  let fare = Number(ride.fare);
  let arrivedAt = ride.arrivedAt;
  let startedAt = ride.startedAt;
  let completedAt = ride.completedAt;

  if (status === 'ongoing') {
    if (ride.otp !== otp) {
      throw new ApiError(400, 'Invalid OTP');
    }
    startedAt = new Date();

    // Calculate wait time charges after 3-minute free window
    if (ride.arrivedAt) {
      const waitTimeMs = Math.max(0, startedAt.getTime() - new Date(ride.arrivedAt).getTime());
      const totalWaitMins = Math.floor(waitTimeMs / 60000);
      if (totalWaitMins > FREE_WAIT_MINUTES) {
        const extraMins = totalWaitMins - FREE_WAIT_MINUTES;
        waitCharges = extraMins * WAIT_CHARGE_PER_MIN;
        fare += waitCharges;
      }
    }
  }

  if (status === 'arrived') {
    arrivedAt = new Date();

    // 3-Minute Background Timer:
    // If the rider does not start the ride within 3 minutes of arrival,
    // notify customer and driver that free wait time expired and wait charges apply.
    setTimeout(async () => {
      try {
        const checkRide = await prisma.ride.findUnique({ where: { id: rideId } });
        if (checkRide && checkRide.status === 'arrived') {
          console.log(`[WaitTime] Free 3-minute waiting period expired for ride ${rideId}`);
          if (req.io) {
            const waitExpiredPayload = {
              rideId,
              status: 'arrived',
              arrivedAt: checkRide.arrivedAt,
              freeWaitMinutes: FREE_WAIT_MINUTES,
              isFreeWaitExpired: true,
              waitChargeRatePerMinute: WAIT_CHARGE_PER_MIN,
              message: 'Free 3-minute wait period has ended. Waiting charges of ₹2/min now apply.',
            };
            req.io.to(`ride_${rideId}`).emit('wait_time_expired', waitExpiredPayload);
            if (checkRide.customerId) {
              req.io.to(checkRide.customerId).emit('wait_time_expired', waitExpiredPayload);
            }
            if (checkRide.riderId) {
              req.io.to(checkRide.riderId).emit('wait_time_expired', waitExpiredPayload);
            }
          }
        }
      } catch (err) {
        console.error('Wait timer check error:', err);
      }
    }, FREE_WAIT_MINUTES * 60 * 1000);
  }

  if (status === 'completed') {
    completedAt = new Date();
  }

  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status,
      waitCharges,
      fare,
      arrivedAt,
      startedAt,
      completedAt,
    },
  });

  const clientRide = {
    ...updatedRide,
    _id: updatedRide.id,
    displayId: formatRideDisplayId(updatedRide.id),
    customer: updatedRide.customerId,
    rider: updatedRide.riderId,
    pickup: {
      name: updatedRide.pickupPlaceName,
      address: updatedRide.pickupAddress,
      lat: updatedRide.pickupLat,
      lng: updatedRide.pickupLng,
    },
    drop: {
      name: updatedRide.dropPlaceName,
      address: updatedRide.dropAddress,
      lat: updatedRide.dropLat,
      lng: updatedRide.dropLng,
    },
  };

  const waitInfo = arrivedAt ? {
    freeWaitMinutes: FREE_WAIT_MINUTES,
    freeWaitSeconds: FREE_WAIT_MINUTES * 60,
    freeWaitExpiresAt: new Date(new Date(arrivedAt).getTime() + FREE_WAIT_MINUTES * 60 * 1000).toISOString(),
    waitChargeRatePerMinute: WAIT_CHARGE_PER_MIN,
  } : null;

  if (req.io) {
    req.io.to(`ride_${ride.id}`).emit('ride_status_update', {
      status,
      ride: clientRide,
      waitInfo: status === 'arrived' ? waitInfo : undefined,
    });

    if (status === 'arrived' && waitInfo) {
      req.io.to(`ride_${ride.id}`).emit('driver_arrived', {
        ride: clientRide,
        ...waitInfo,
      });
      if (ride.customerId) {
        req.io.to(ride.customerId).emit('driver_arrived', {
          ride: clientRide,
          ...waitInfo,
        });
      }
    }
  }

  if (status === 'completed' && ride.riderId) {
    await prisma.rider.update({
      where: { id: ride.riderId },
      data: { isAvailable: true },
    });
  }

  res.status(200).json(new ApiResponse(200, { ride: clientRide, waitInfo }, `Ride status updated to ${status}`));
});

// ---------------------------------------------------------------------------
// 8. Cancel Ride
// ---------------------------------------------------------------------------
export const cancelRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { rideId, reason } = req.body;

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) throw new ApiError(404, 'Ride not found');
  if (!['pending', 'accepted', 'arrived'].includes(ride.status)) {
    throw new ApiError(400, 'Cannot cancel this ride');
  }

  let cancellationReason = reason || 'No reason provided';
  let isRiderNoShow = false;

  if (ride.status === 'arrived' && ride.arrivedAt) {
    const elapsedMs = Date.now() - new Date(ride.arrivedAt).getTime();
    if (elapsedMs >= FREE_WAIT_MINUTES * 60 * 1000) {
      isRiderNoShow = true;
      if (!reason) {
        cancellationReason = `Rider did not show up within ${FREE_WAIT_MINUTES} minutes free wait time`;
      }
    }
  }

  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: 'cancelled',
      cancellationReason,
      cancelledBy: isRiderNoShow ? 'rider_noshow' : (req.user?.role || 'rider'),
    },
  });

  if (ride.riderId) {
    await prisma.rider.update({
      where: { id: ride.riderId },
      data: { isAvailable: true },
    });
    if (req.io) {
      req.io.to(ride.riderId).emit('ride_cancelled', { rideId, reason });
    }
  }

  if (ride.customerId && req.io) {
    req.io.to(ride.customerId).emit('ride_cancelled', { rideId, reason });
  }

  if (req.io) {
    req.io.to(`ride_${ride.id}`).emit('ride_cancelled', { rideId, reason });
  }

  const clientRide = {
    ...updatedRide,
    _id: updatedRide.id,
    customer: updatedRide.customerId,
    rider: updatedRide.riderId,
    pickup: {
      name: updatedRide.pickupPlaceName,
      address: updatedRide.pickupAddress,
      lat: updatedRide.pickupLat,
      lng: updatedRide.pickupLng,
    },
    drop: {
      name: updatedRide.dropPlaceName,
      address: updatedRide.dropAddress,
      lat: updatedRide.dropLat,
      lng: updatedRide.dropLng,
    },
  };

  res.status(200).json(new ApiResponse(200, { ride: clientRide }, 'Ride cancelled successfully'));
});

// ---------------------------------------------------------------------------
// 9. Rider Trip Queries
// ---------------------------------------------------------------------------
export const getRiderHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const rides = await prisma.ride.findMany({
    where: { riderId },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formattedRides = rides.map((r) => ({
    ...r,
    _id: r.id,
    customer: r.customer ? { ...r.customer, _id: r.customer.id } : null,
    pickup: { name: r.pickupPlaceName, address: r.pickupAddress, lat: r.pickupLat, lng: r.pickupLng },
    drop: { name: r.dropPlaceName, address: r.dropAddress, lat: r.dropLat, lng: r.dropLng },
  }));

  res.status(200).json(new ApiResponse(200, formattedRides, 'Rider trip history fetched'));
});

export const getRiderActiveRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const activeRide = await prisma.ride.findFirst({
    where: {
      riderId,
      status: { in: ['accepted', 'arrived', 'ongoing'] },
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
    },
  });

  if (!activeRide) {
    return res.status(200).json(new ApiResponse(200, null, 'No active ride'));
  }

  const clientRide = {
    ...activeRide,
    _id: activeRide.id,
    displayId: formatRideDisplayId(activeRide.id),
    customer: activeRide.customer ? { ...activeRide.customer, _id: activeRide.customer.id } : null,
    pickup: { name: activeRide.pickupPlaceName, address: activeRide.pickupAddress, lat: activeRide.pickupLat, lng: activeRide.pickupLng },
    drop: { name: activeRide.dropPlaceName, address: activeRide.dropAddress, lat: activeRide.dropLat, lng: activeRide.dropLng },
  };

  res.status(200).json(new ApiResponse(200, clientRide, 'Active ride fetched'));
});

export const getRideById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      rider: { select: { id: true, name: true, phone: true, vehicle: true, vehicleType: true, rating: true } },
    },
  });

  if (!ride) throw new ApiError(404, 'Ride not found');

  const clientRide = {
    ...ride,
    _id: ride.id,
    displayId: formatRideDisplayId(ride.id),
    customer: ride.customer ? { ...ride.customer, _id: ride.customer.id } : null,
    rider: ride.rider ? { ...ride.rider, _id: ride.rider.id } : null,
    pickup: { name: ride.pickupPlaceName, address: ride.pickupAddress, lat: ride.pickupLat, lng: ride.pickupLng },
    drop: { name: ride.dropPlaceName, address: ride.dropAddress, lat: ride.dropLat, lng: ride.dropLng },
  };

  res.status(200).json(new ApiResponse(200, clientRide, 'Ride details fetched'));
});
