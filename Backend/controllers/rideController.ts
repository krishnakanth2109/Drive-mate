import { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import {
  getCoordsFromAddress,
  getAddressFromCoords,
  getRouteDetails,
  getDistanceFromLatLonInKm,
} from '../services/locationService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const generateId = (): string => crypto.randomBytes(12).toString('hex');

const VEHICLE_PRICING: Record<string, { label: string; emoji: string; base: number; perKm: number; maxKm: number }> = {
  bike: { label: 'Bike', emoji: '🏍️', base: 20, perKm: 10, maxKm: 40 },
  scooty: { label: 'Scooty', emoji: '🛵', base: 25, perKm: 10, maxKm: 40 },
  auto: { label: 'Auto', emoji: '🛺', base: 30, perKm: 12, maxKm: 40 },
  car: { label: 'Car', emoji: '🚗', base: 50, perKm: 15, maxKm: 40 },
};

export const estimateRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { pickup, drop } = req.body;
  let pickupData: any, dropData: any;

  if (typeof pickup === 'string') {
    pickupData = await getCoordsFromAddress(pickup);
  } else {
    const address = await getAddressFromCoords(pickup.lat, pickup.lng);
    pickupData = { ...pickup, address };
  }

  if (typeof drop === 'string') {
    dropData = await getCoordsFromAddress(drop);
  } else {
    const address = await getAddressFromCoords(drop.lat, drop.lng);
    dropData = { ...drop, address };
  }

  const route = await getRouteDetails(pickupData, dropData);
  if (!route) throw new ApiError(400, 'Could not calculate route');

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
    eta: Math.ceil((distanceKm / 25) * 60),
  }));

  res.status(200).json(
    new ApiResponse(200, {
      pickup: pickupData,
      drop: dropData,
      distance: distanceKm,
      duration: Math.ceil(route.duration),
      polyline: route.polyline,
      fareOptions,
    }, 'Estimate generated')
  );
});

export const createRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { pickup, drop, fare, distance, duration, polyline, vehicleType } = req.body;
  const customerId = req.user.id || req.user._id;

  if (distance > 40) {
    throw new ApiError(400, 'Distance exceeds 40 km limit.');
  }

  const rideId = generateId();
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  const savedRide = await prisma.ride.create({
    data: {
      id: rideId,
      customerId,
      pickupAddress: pickup?.address || 'Pickup Location',
      pickupLat: pickup?.lat != null ? Number(pickup.lat) : null,
      pickupLng: pickup?.lng != null ? Number(pickup.lng) : null,
      dropAddress: drop?.address || 'Drop Location',
      dropLat: drop?.lat != null ? Number(drop.lat) : null,
      dropLng: drop?.lng != null ? Number(drop.lng) : null,
      fare: Number(fare),
      distance: distance != null ? Number(distance) : null,
      duration: duration != null ? Number(duration) : null,
      polyline: polyline || null,
      vehicleType: vehicleType || 'bike',
      status: 'pending',
      otp,
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
    },
  });

  const availableDrivers = await prisma.rider.findMany({
    where: {
      isAvailable: true,
      ...(vehicleType ? { vehicleType } : {}),
    },
  });

  // Filter within 3 km using Haversine
  const driversToNotify = availableDrivers.filter((d) => {
    if (d.currentLat == null || d.currentLng == null || pickup?.lat == null || pickup?.lng == null) {
      return false;
    }
    const dist = getDistanceFromLatLonInKm(pickup.lat, pickup.lng, d.currentLat, d.currentLng);
    return dist <= 3;
  });

  const finalDrivers = driversToNotify.length > 0 ? driversToNotify : availableDrivers;

  console.log(`Notifying ${finalDrivers.length} drivers for ride ${savedRide.id}`);

  const clientRidePayload = {
    ...savedRide,
    _id: savedRide.id,
    customer: savedRide.customer ? { ...savedRide.customer, _id: savedRide.customer.id } : null,
    pickup: { address: savedRide.pickupAddress, lat: savedRide.pickupLat, lng: savedRide.pickupLng },
    drop: { address: savedRide.dropAddress, lat: savedRide.dropLat, lng: savedRide.dropLng },
  };

  if (req.io) {
    finalDrivers.forEach((driver) => {
      req.io.to(driver.id).emit('new_ride_request', clientRidePayload);
    });
  }

  res.status(201).json(new ApiResponse(201, clientRidePayload, 'Ride created successfully'));

  // Timeout after 10 seconds if ride remains unassigned
  setTimeout(async () => {
    try {
      const rideCheck = await prisma.ride.findUnique({ where: { id: savedRide.id } });
      if (rideCheck && rideCheck.status === 'pending') {
        await prisma.ride.update({
          where: { id: savedRide.id },
          data: { status: 'cancelled' },
        });

        if (req.io) {
          if (rideCheck.customerId) {
            req.io.to(rideCheck.customerId).emit('ride_timeout', {
              rideId: rideCheck.id,
              message: 'No riders available right now. Please try again.',
            });
          }
          req.io.to('drivers').emit('ride_taken', { rideId: rideCheck.id });
        }
      }
    } catch (err) {
      console.error('Ride timeout error:', err);
    }
  }, 10000);
});

export const acceptRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { rideId } = req.body;
  const riderId = req.user.id || req.user._id;

  // Use atomic transaction to prevent race conditions when multiple drivers try to accept the same ride
  const { updatedRide, rider } = await prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new ApiError(404, 'Ride not found');
    if (ride.status !== 'pending') throw new ApiError(400, 'Ride already taken');

    const updatedRide = await tx.ride.update({
      where: { id: rideId },
      data: { riderId, status: 'accepted' },
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
    customer: updatedRide.customerId,
    rider: updatedRide.riderId,
    pickup: { address: updatedRide.pickupAddress, lat: updatedRide.pickupLat, lng: updatedRide.pickupLng },
    drop: { address: updatedRide.dropAddress, lat: updatedRide.dropLat, lng: updatedRide.dropLng },
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

export const updateRideStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { rideId, status, otp } = req.body;

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) throw new ApiError(404, 'Ride not found');

  let waitCharges = Number(ride.waitCharges || 0);
  let fare = Number(ride.fare);
  let arrivedAt = ride.arrivedAt;

  if (status === 'ongoing') {
    if (ride.otp !== otp) {
      throw new ApiError(400, 'Invalid OTP');
    }
    // Calculate wait time charges
    if (ride.arrivedAt) {
      const waitTimeMs = Date.now() - new Date(ride.arrivedAt).getTime();
      const waitTimeMins = Math.floor(waitTimeMs / 60000);
      if (waitTimeMins > 3) {
        const extraMins = waitTimeMins - 3;
        waitCharges = extraMins * 2;
        fare += waitCharges;
      }
    }
  }

  if (status === 'arrived') {
    arrivedAt = new Date();
  }

  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status,
      waitCharges,
      fare,
      arrivedAt,
    },
  });

  const clientRide = {
    ...updatedRide,
    _id: updatedRide.id,
    customer: updatedRide.customerId,
    rider: updatedRide.riderId,
    pickup: { address: updatedRide.pickupAddress, lat: updatedRide.pickupLat, lng: updatedRide.pickupLng },
    drop: { address: updatedRide.dropAddress, lat: updatedRide.dropLat, lng: updatedRide.dropLng },
  };

  if (req.io) {
    req.io.to(`ride_${ride.id}`).emit('ride_status_update', { status, ride: clientRide });
  }

  if (status === 'completed' && ride.riderId) {
    await prisma.rider.update({
      where: { id: ride.riderId },
      data: { isAvailable: true },
    });
  }

  res.status(200).json(new ApiResponse(200, { ride: clientRide }, `Ride status updated to ${status}`));
});

export const cancelRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { rideId, reason } = req.body;

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) throw new ApiError(404, 'Ride not found');
  if (!['pending', 'accepted', 'arrived'].includes(ride.status)) {
    throw new ApiError(400, 'Cannot cancel this ride');
  }

  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: 'cancelled',
      cancellationReason: reason || 'No reason provided',
      cancelledBy: req.user?.role || 'rider',
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
    pickup: { address: updatedRide.pickupAddress, lat: updatedRide.pickupLat, lng: updatedRide.pickupLng },
    drop: { address: updatedRide.dropAddress, lat: updatedRide.dropLat, lng: updatedRide.dropLng },
  };

  res.status(200).json(new ApiResponse(200, { ride: clientRide }, 'Ride cancelled successfully'));
});

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
    pickup: { address: r.pickupAddress, lat: r.pickupLat, lng: r.pickupLng },
    drop: { address: r.dropAddress, lat: r.dropLat, lng: r.dropLng },
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
    customer: activeRide.customer ? { ...activeRide.customer, _id: activeRide.customer.id } : null,
    pickup: { address: activeRide.pickupAddress, lat: activeRide.pickupLat, lng: activeRide.pickupLng },
    drop: { address: activeRide.dropAddress, lat: activeRide.dropLat, lng: activeRide.dropLng },
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
    customer: ride.customer ? { ...ride.customer, _id: ride.customer.id } : null,
    rider: ride.rider ? { ...ride.rider, _id: ride.rider.id } : null,
    pickup: { address: ride.pickupAddress, lat: ride.pickupLat, lng: ride.pickupLng },
    drop: { address: ride.dropAddress, lat: ride.dropLat, lng: ride.dropLng },
  };

  res.status(200).json(new ApiResponse(200, clientRide, 'Ride details fetched'));
});
