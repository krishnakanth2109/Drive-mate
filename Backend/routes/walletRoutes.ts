import express, { Router } from 'express';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import {
  getWallet,
  getTransactions,
  createTopup,
  verifyTopup,
  getTopupStatus,
  simulatePayment,
  deductFare,
  refundFare,
  handleWebhook,
  getRiderSettlements,
} from '../controllers/walletController.js';
import {
  listBatches,
  getBatchDetails,
  triggerCalculation,
  approveBatch,
  retryItem,
  exportReport,
} from '../controllers/settlementAdminController.js';

const router: Router = express.Router();

// --- Public Webhook Route (Signature Verified against Raw Request Body) ---
router.post('/webhook', handleWebhook);

// --- Protected Wallet Routes (Authenticated Customer or Rider) ---
router.get('/', auth, getWallet);
router.get('/transactions', auth, getTransactions);
router.post('/topup/order', auth, createTopup);
router.post('/topup/verify', auth, verifyTopup);
router.get('/topup/:id', auth, getTopupStatus);
router.post('/topup/simulate-test-payment', auth, simulatePayment);
router.post('/fare/deduct', auth, deductFare);
router.post('/fare/refund', auth, refundFare);
router.get('/settlements', auth, getRiderSettlements);

// --- Admin Settlement Management Routes (Protected by Staff/Admin RBAC) ---
router.get('/admin/settlements', adminAuth, listBatches);
router.get('/admin/settlements/:id', adminAuth, getBatchDetails);
router.post('/admin/settlements/calculate', adminAuth, triggerCalculation);
router.post('/admin/settlements/:id/approve', adminAuth, approveBatch);
router.post('/admin/settlements/items/:itemId/retry', adminAuth, retryItem);
router.get('/admin/settlements/:id/export', adminAuth, exportReport);

export default router;
