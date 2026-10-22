import express, { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';

const router: Router = express.Router();

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

export default router;
