import express from 'express';
import Ride from '../models/Ride.js';
import Customer from '../models/Customer.js';
import Rider from '../models/Rider.js';
import auth from '../middleware/auth.js';
import { getCoordsFromAddress, getAddressFromCoords, getRouteDetails } from '../services/locationService.js';

const router = express.Router();

// Vehicle pricing config
const VEHICLE_PRICING = {
  bike: {
    label: 'Bike',
    emoji: '🏍️',
    base: 20,
    perKm: 10,
    maxKm: 40,
  },
  scooty: {
    label: 'Scooty',
    emoji: '🛵',
    base: 25,
    perKm: 10,
    maxKm: 40,
  },
  auto: {
    label: 'Auto',
    emoji: '🛺',
    base: 30,
    perKm: 12,
    maxKm: 40,
  },
  car: {
    label: 'Car',
    emoji: '🚗',
    base: 50,
    perKm: 15,
    maxKm: 40,
  },
};

// 1. ESTIMATE RIDE — returns fare for ALL vehicle types
router.post('/estimate', auth, async (req, res) => {
  const { pickup, drop } = req.body;

  try {
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
    if (!route) return res.status(400).json({ msg: 'Could not calculate route' });

    const distanceKm = parseFloat(route.distance.toFixed(2));

    // Enforce 40 km limit
    if (distanceKm > 40) {
      return res.status(400).json({
        msg: `Distance of ${distanceKm} km exceeds the 40 km booking limit.`,
        distance: distanceKm,
        limitExceeded: true,
      });
    }

    // Build fare options for all vehicle types
    const fareOptions = Object.entries(VEHICLE_PRICING).map(([key, v]) => ({
      type: key,
      label: v.label,
      emoji: v.emoji,
      fare: Math.round(v.base + distanceKm * v.perKm),
      perKm: v.perKm,
      eta: Math.ceil(distanceKm / 25 * 60), // rough ETA in mins
    }));

    res.json({
      pickup: pickupData,
      drop: dropData,
      distance: distanceKm,
      duration: Math.ceil(route.duration),
      polyline: route.polyline,
      fareOptions,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: 'Estimation failed', error: err.message });
  }
});

// 2. CREATE RIDE REQUEST
router.post('/create', auth, async (req, res) => {
  const { pickup, drop, fare, distance, duration, polyline, vehicleType } = req.body;

  // Final 40km guard on server side
  if (distance > 40) {
    return res.status(400).json({ msg: 'Distance exceeds 40 km limit.' });
  }

  try {
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

    // Find nearby drivers matching vehicle type
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

    // Fallback: if no drivers with matching vehicle, broadcast to all nearby riders
    const driversToNotify =
      nearbyDrivers.length > 0
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

    res.json(savedRide);

    // Auto-expire if not accepted in 10 seconds
    setTimeout(async () => {
      try {
        const rideCheck = await Ride.findById(savedRide._id);
        if (rideCheck && rideCheck.status === 'pending') {
          rideCheck.status = 'cancelled';
          await rideCheck.save();
          
          // Notify customer
          req.io.to(rideCheck.customer.toString()).emit('ride_timeout', {
            rideId: rideCheck._id,
            message: 'No riders available right now. Please try again.'
          });
          
          // Notify drivers to hide it (optional, but good practice)
          req.io.to('drivers').emit('ride_taken', { rideId: rideCheck._id });
        }
      } catch (err) {
        console.error('Ride timeout error:', err);
      }
    }, 10000);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. ACCEPT RIDE
router.put('/accept', auth, async (req, res) => {
  const { rideId } = req.body;
  const riderId = req.user.id;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });
    if (ride.status !== 'pending') return res.status(400).json({ msg: 'Ride already taken' });

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

    res.json({ success: true, ride });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. UPDATE RIDE STATUS
router.put('/update-status', auth, async (req, res) => {
  const { rideId, status, otp } = req.body;

  try {
    const ride = await Ride.findById(rideId);

    if (status === 'ongoing' && ride.otp !== otp) {
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    ride.status = status;
    await ride.save();

    req.io.to(ride.customer.toString()).emit('ride_status_update', { status, ride });

    if (status === 'completed') {
      await Rider.findByIdAndUpdate(ride.rider, { isAvailable: true });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. CANCEL RIDE (by customer)
router.put('/cancel', auth, async (req, res) => {
  const { rideId } = req.body;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });
    if (!['pending', 'accepted'].includes(ride.status)) {
      return res.status(400).json({ msg: 'Cannot cancel this ride' });
    }

    ride.status = 'cancelled';
    await ride.save();

    // Free up rider if one was assigned
    if (ride.rider) {
      await Rider.findByIdAndUpdate(ride.rider, { isAvailable: true });
      req.io.to(ride.rider.toString()).emit('ride_cancelled', { rideId });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;