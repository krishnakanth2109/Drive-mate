import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// 1. LOGIN / REGISTER (unified endpoint)
router.post('/login', async (req, res) => {
  const { email, name, role, phone, currentLocation, vehicleType } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        role,
        phone,
        vehicleType: vehicleType || (role === 'rider' ? 'bike' : undefined),
        currentLocation: {
          type: 'Point',
          coordinates: [0, 0],
        },
      });

      if (currentLocation && currentLocation.lat) {
        user.currentLocation = {
          type: 'Point',
          coordinates: [parseFloat(currentLocation.lng), parseFloat(currentLocation.lat)],
          heading: currentLocation.heading || 0,
        };
        if (role === 'rider') user.isAvailable = true;
      }

      await user.save();
    }

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2. UPDATE RIDER LOCATION
router.put('/location', auth, async (req, res) => {
  const { lat, lng, heading } = req.body;

  try {
    await User.findByIdAndUpdate(req.user.id, {
      currentLocation: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
        heading: heading || 0,
      },
      isAvailable: true,
    });
    res.json({ msg: 'Location updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. SET RIDER UNAVAILABLE (go offline)
router.put('/offline', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isAvailable: false });
    res.json({ msg: 'Rider set offline' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET NEARBY RIDERS
router.get('/nearby', auth, async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) return res.status(400).json({ msg: 'Lat/Lng required' });

  try {
    const riders = await User.find({
      role: 'rider',
      isAvailable: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: 5000,
        },
      },
    });
    res.json(riders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;