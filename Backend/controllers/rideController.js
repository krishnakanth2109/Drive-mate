import Ride from '../models/Ride.js';
import Customer from '../models/Customer.js';
import Rider from '../models/Rider.js';
import { getCoordsFromAddress, getAddressFromCoords, getRouteDetails } from '../services/locationService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const VEHICLE_PRICING = {
  bike: { label: 'Bike', emoji: '🏍️', base: 20, perKm: 10, maxKm: 40 },
  scooty: { label: 'Scooty', emoji: '🛵', base: 25, perKm: 10, maxKm: 40 },
  auto: { label: 'Auto', emoji: '🛺', base: 30, perKm: 12, maxKm: 40 },
  car: { label: 'Car', emoji: '🚗', base: 50, perKm: 15, maxKm: 40 },
};

export const estimateRide = asyncHandler(async (req, res) => {
  const { pickup, drop } = req.body;
  let pickupData, dropData;

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

export const createRide = asyncHandler(async (req, res) => {
  const { pickup, drop, fare, distance, duration, polyline, vehicleType } = req.body;

  if (distance > 40) {
    throw new ApiError(400, 'Distance exceeds 40 km limit.');
  }

  const newRide = new Ride({
    customer: req.user.id,
    pickup,
    drop,
    fare,
    distance,
    duration,
    polyline,
    vehicleType: vehicleType || 'bike',
    status: 'pending',
    otp: Math.floor(1000 + Math.random() * 9000).toString(),
  });

  const savedRide = await newRide.save();
  const fullRide = await Ride.findById(savedRide._id).populate('customer', 'name phone');

  const nearbyDrivers = await Rider.find({
    isAvailable: true,
    ...(vehicleType && { vehicleType }),
    currentLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [pickup.lng, pickup.lat],
        },
        $maxDistance: 3000,
      },
    },
  });

  const driversToNotify = nearbyDrivers.length > 0
    ? nearbyDrivers
    : await Rider.find({
        isAvailable: true,
        currentLocation: {
          $near: {
            $geometry: { type: 'Point', coordinates: [pickup.lng, pickup.lat] },
            $maxDistance: 3000,
          },
        },
      });

  console.log(`Notifying ${driversToNotify.length} drivers for ride ${savedRide._id}`);

  driversToNotify.forEach((driver) => {
    req.io.to(driver._id.toString()).emit('new_ride_request', fullRide);
  });

  res.status(201).json(new ApiResponse(201, savedRide, 'Ride created successfully'));

  setTimeout(async () => {
    try {
      const rideCheck = await Ride.findById(savedRide._id);
      if (rideCheck && rideCheck.status === 'pending') {
        rideCheck.status = 'cancelled';
        await rideCheck.save();
        
        req.io.to(rideCheck.customer.toString()).emit('ride_timeout', {
          rideId: rideCheck._id,
          message: 'No riders available right now. Please try again.'
        });
        
        req.io.to('drivers').emit('ride_taken', { rideId: rideCheck._id });
      }
    } catch (err) {
      console.error('Ride timeout error:', err);
    }
  }, 10000);
});

export const acceptRide = asyncHandler(async (req, res) => {
  const { rideId } = req.body;
  const riderId = req.user.id;

  const ride = await Ride.findById(rideId);
  if (!ride) throw new ApiError(404, 'Ride not found');
  if (ride.status !== 'pending') throw new ApiError(400, 'Ride already taken');

  ride.rider = riderId;
  ride.status = 'accepted';
  await ride.save();

  const rider = await Rider.findByIdAndUpdate(riderId, { isAvailable: false }, { new: true });

  req.io.to(ride.customer.toString()).emit('ride_accepted', {
    ride,
    rider: {
      name: rider.name,
      phone: rider.phone,
      vehicle: `${rider.vehicle?.model || 'Vehicle'} (${rider.vehicle?.plate || 'XX-XX-XXXX'})`,
      vehicleType: rider.vehicleType || 'bike',
      location: rider.currentLocation,
    },
  });

  req.io.to('drivers').emit('ride_taken', { rideId });

  res.status(200).json(new ApiResponse(200, { ride }, 'Ride accepted successfully'));
});

export const updateRideStatus = asyncHandler(async (req, res) => {
  const { rideId, status, otp } = req.body;

  const ride = await Ride.findById(rideId);
  if (!ride) throw new ApiError(404, 'Ride not found');

  if (status === 'ongoing') {
    if (ride.otp !== otp) {
      throw new ApiError(400, 'Invalid OTP');
    }
    // Calculate wait time charges
    if (ride.arrivedAt) {
      const waitTimeMs = new Date() - new Date(ride.arrivedAt);
      const waitTimeMins = Math.floor(waitTimeMs / 60000);
      if (waitTimeMins > 3) {
        // Rs 2 per minute after 3 minutes
        const extraMins = waitTimeMins - 3;
        ride.waitCharges = extraMins * 2;
        ride.fare += ride.waitCharges;
      }
    }
  }

  if (status === 'arrived') {
    ride.arrivedAt = new Date();
  }

  ride.status = status;
  await ride.save();

  req.io.to(`ride_${ride._id}`).emit('ride_status_update', { status, ride });

  if (status === 'completed') {
    await Rider.findByIdAndUpdate(ride.rider, { isAvailable: true });
  }

  res.status(200).json(new ApiResponse(200, { ride }, `Ride status updated to ${status}`));
});

export const cancelRide = asyncHandler(async (req, res) => {
  const { rideId, reason } = req.body;

  const ride = await Ride.findById(rideId);
  if (!ride) throw new ApiError(404, 'Ride not found');
  if (!['pending', 'accepted', 'arrived'].includes(ride.status)) {
    throw new ApiError(400, 'Cannot cancel this ride');
  }

  ride.status = 'cancelled';
  ride.cancellationReason = reason || 'No reason provided';
  ride.cancelledBy = req.user?.role || 'rider';
  await ride.save();

  if (ride.rider) {
    await Rider.findByIdAndUpdate(ride.rider, { isAvailable: true });
    req.io.to(ride.rider.toString()).emit('ride_cancelled', { rideId, reason });
  }

  if (ride.customer) {
    req.io.to(ride.customer.toString()).emit('ride_cancelled', { rideId, reason });
  }

  req.io.to(`ride_${ride._id}`).emit('ride_cancelled', { rideId, reason });

  res.status(200).json(new ApiResponse(200, { ride }, 'Ride cancelled successfully'));
});

export const getRiderHistory = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ rider: req.user.id })
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, rides, 'Rider trip history fetched'));
});

export const getRiderActiveRide = asyncHandler(async (req, res) => {
  const activeRide = await Ride.findOne({
    rider: req.user.id,
    status: { $in: ['accepted', 'arrived', 'ongoing'] }
  }).populate('customer', 'name phone');

  res.status(200).json(new ApiResponse(200, activeRide, 'Active ride fetched'));
});

export const getRideById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ride = await Ride.findById(id)
    .populate('customer', 'name phone')
    .populate('rider', 'name phone vehicle vehicleType rating');

  if (!ride) throw new ApiError(404, 'Ride not found');

  res.status(200).json(new ApiResponse(200, ride, 'Ride details fetched'));
});

