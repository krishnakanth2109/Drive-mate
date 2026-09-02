import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Customer from '../models/Customer.js';
import Rider from '../models/Rider.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// RIDER AUTHENTICATION
// ==========================================

// 1. RIDER REGISTER
router.post('/rider/register', async (req, res) => {
  const { name, email, phone, password, vehicleType } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    let rider = await Rider.findOne({ email });
    if (rider) {
      return res.status(400).json({ error: 'Rider already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    rider = new Rider({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      vehicleType: vehicleType || 'bike',
      currentLocation: { type: 'Point', coordinates: [0, 0] },
    });

    await rider.save();
    res.json({ msg: 'Rider registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2. RIDER LOGIN
router.post('/rider/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const rider = await Rider.findOne({ email: email.toLowerCase() });
    if (!rider) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, rider.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const payload = { user: { id: rider.id, role: 'rider' } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: rider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// CUSTOMER AUTHENTICATION
// ==========================================

// 3. CUSTOMER REGISTER
router.post('/customer/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    let customer = await Customer.findOne({ email: email.toLowerCase() });
    if (customer) {
      return res.status(400).json({ error: 'Customer already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    customer = new Customer({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
    });

    await customer.save();
    res.json({ msg: 'Customer registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 4. CUSTOMER LOGIN
router.post('/customer/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const customer = await Customer.findOne({ email: email.toLowerCase() });
    if (!customer) return res.status(400).json({ error: 'Invalid credentials' });

    // Ensure password exists before comparing (legacy users might not have one)
    if (!customer.password) return res.status(400).json({ error: 'Invalid credentials. Please register again.' });

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const payload = { user: { id: customer.id, role: 'customer' } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: customer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// RIDER ACTIONS
// ==========================================

// 5. UPDATE RIDER LOCATION
router.put('/location', auth, async (req, res) => {
  const { lat, lng, heading } = req.body;

  try {
    await Rider.findByIdAndUpdate(req.user.id, {
      currentLocation: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
        heading: heading || 0,
      },
      isAvailable: true,
    });

    const rider = await Rider.findById(req.user.id);
    if (!rider) return res.status(404).json({ error: 'Rider not found' });

    req.io.to('customers').emit('available_driver_location', {
      driverId: req.user.id,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      heading: heading || 0,
      vehicleType: rider.vehicleType || 'bike',
    });

    res.json({ msg: 'Location updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. SET RIDER UNAVAILABLE (go offline)
router.put('/offline', auth, async (req, res) => {
  try {
    await Rider.findByIdAndUpdate(req.user.id, { isAvailable: false });
    res.json({ msg: 'Rider set offline' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. GET NEARBY RIDERS
router.get('/nearby', auth, async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) return res.status(400).json({ msg: 'Lat/Lng required' });

  try {
    const riders = await Rider.find({
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