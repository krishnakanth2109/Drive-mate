import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  getPaymentMethods,
  addPaymentMethod,
  getBalances,
  addWalletBalance,
  getTransactions,
  getRewards,
  getNotifications,
  markNotificationsRead,
  getClaims,
  addClaim,
  subscribePowerPass
} from '../controllers/profileController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Wallet & Payment Methods
router.get('/payment-methods', cacheMiddleware(120), getPaymentMethods);
router.post('/payment-methods', addPaymentMethod);
router.get('/balances', cacheMiddleware(60), getBalances);
router.post('/wallet/add', addWalletBalance);

// Transactions
router.get('/transactions', cacheMiddleware(120), getTransactions);

// Rewards
router.get('/rewards', cacheMiddleware(300), getRewards);

// Notifications
router.get('/notifications', cacheMiddleware(60), getNotifications);
router.put('/notifications/mark-read', markNotificationsRead);

// Claims
router.get('/claims', cacheMiddleware(300), getClaims);
router.post('/claims', addClaim);

// Power Pass
router.post('/power-pass/subscribe', subscribePowerPass);

export default router;
