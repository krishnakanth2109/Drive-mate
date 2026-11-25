import express, { Router } from 'express';
import { createOrder, verifyPayment, handlePaymentWebhook } from '../controllers/paymentController.js';
import { optionalAuth } from '../middleware/auth.js';

const router: Router = express.Router();

// Order creation & payment verification (supports both authenticated users and standalone payments)
router.post('/create-order', optionalAuth, createOrder);
router.post('/verify-payment', optionalAuth, verifyPayment);

// Webhook listener for Razorpay payment events
router.post('/webhook', handlePaymentWebhook);

export default router;
