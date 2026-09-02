import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Customer from '../models/Customer.js';
import Rider from '../models/Rider.js';
import Ride from '../models/Ride.js';

const router = express.Router();

// Middleware to check for Admin role
const adminAuth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.user.role !== 'admin' && decoded.user.role !== 'superadmin') {
      return res.status(403).json({ msg: 'Authorization denied: Requires Admin' });
    }
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// 1. ADMIN LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const adminUser = await Admin.findOne({ email });

    if (!adminUser) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // In a real app, use bcrypt to compare passwords. 
    // Here we check if they match, or allow bypass for 'admin123' just for dev.
    if (adminUser.password !== password && password !== 'admin123') { 
       return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = { user: { id: adminUser.id, role: adminUser.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: { id: adminUser.id, name: adminUser.name, email: adminUser.email, role: adminUser.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2. GET ADMINS LIST
router.get('/list', adminAuth, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3. CREATE ADMIN
router.post('/create', adminAuth, async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    let existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ msg: 'Admin with this email already exists' });
    }

    const newAdmin = new Admin({
      name,
      email,
      password, // In real app, hash it
      role: role || 'admin'
    });

    await newAdmin.save();
    
    // Return admin without password
    const adminToReturn = {
      _id: newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      createdAt: newAdmin.createdAt
    };

    res.json(adminToReturn);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 4. GET STATS
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await Customer.countDocuments();
    const totalRiders = await Rider.countDocuments();
    const totalRides = await Ride.countDocuments();
    
    // Calculate total revenue (sum of fare from completed rides)
    const revenueResult = await Ride.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$fare' } } }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      totalUsers,
      totalRiders,
      totalRides,
      totalRevenue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 5. GET RECENT RIDES
router.get('/recent-rides', adminAuth, async (req, res) => {
  try {
    const recentRides = await Ride.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customer', 'name phone email')
      .populate('rider', 'name phone vehicle');

    res.json(recentRides);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
