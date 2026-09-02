import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Customer from '../models/Customer.js';
import PaymentMethod from '../models/PaymentMethod.js';
import Transaction from '../models/Transaction.js';
import Reward from '../models/Reward.js';
import Notification from '../models/Notification.js';
import Claim from '../models/Claim.js';

const router = express.Router();

// Middleware to ensure route is accessed by a customer
router.use(authMiddleware);

// ==========================================
// WALLET & PAYMENT METHODS
// ==========================================

// Get Payment Methods
router.get('/payment-methods', async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ user: req.user.id });
    res.json(methods);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add Payment Method
router.post('/payment-methods', async (req, res) => {
  const { type, provider, last4 } = req.body;
  try {
    const method = new PaymentMethod({ user: req.user.id, type, provider, last4 });
    await method.save();
    res.status(201).json(method);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Wallet Balance & Coin Balance
router.get('/balances', async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id).select('walletBalance coinBalance powerPass');
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add money to wallet
router.post('/wallet/add', async (req, res) => {
  const { amount } = req.body;
  try {
    const customer = await Customer.findById(req.user.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    customer.walletBalance += Number(amount);
    await customer.save();

    const transaction = new Transaction({
      user: req.user.id, type: 'credit', amount: Number(amount), currency: 'INR', description: 'Wallet top-up'
    });
    await transaction.save();

    res.json({ message: 'Added successfully', balance: customer.walletBalance });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// TRANSACTIONS
// ==========================================

// Get Transactions (filter by currency INR or COINS)
router.get('/transactions', async (req, res) => {
  const { currency } = req.query; // ?currency=INR or ?currency=COINS
  const query = { user: req.user.id };
  if (currency) query.currency = currency;
  
  try {
    const transactions = await Transaction.find(query).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// REWARDS
// ==========================================

// Get all rewards for user
router.get('/rewards', async (req, res) => {
  try {
    const rewards = await Reward.find({ user: req.user.id });
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// NOTIFICATIONS
// ==========================================

router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/notifications/mark-read', async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// CLAIMS
// ==========================================

router.get('/claims', async (req, res) => {
  try {
    const claims = await Claim.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/claims', async (req, res) => {
  const { type, description, rideId } = req.body;
  try {
    const claim = new Claim({ user: req.user.id, type, description, rideId });
    await claim.save();
    res.status(201).json(claim);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// POWER PASS
// ==========================================

router.post('/power-pass/subscribe', async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    // Simulating a 30-day pass
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    
    customer.powerPass = {
      isActive: true,
      planName: 'Monthly Power Pass',
      validUntil
    };
    await customer.save();
    
    res.json({ message: 'Subscribed to Power Pass', powerPass: customer.powerPass });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
