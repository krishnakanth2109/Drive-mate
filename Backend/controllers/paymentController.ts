import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import {
  razorpay,
  getRazorpayKeyId,
  getRazorpayKeySecret,
  createTopupOrder,
  verifyTopupPayment,
  handleRazorpayWebhook,
} from '../services/walletService.js';

/**
 * Creates a Razorpay payment order.
 * If user context (or userId) is provided, links order directly to the user's Wallet
 * and creates an authoritative PaymentOrder record in Neon PostgreSQL.
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency = 'INR', receipt, idempotencyKey } = req.body;
    const authUser = (req as any).user;
    const userId = authUser?.id || authUser?._id || req.body.userId;
    const userType = authUser?.role === 'rider' ? 'rider' : (req.body.userType === 'rider' ? 'rider' : 'customer');

    if (!amount || isNaN(Number(amount))) {
      res.status(400).json({ success: false, message: 'Valid numeric amount is required' });
      return;
    }

    const numericAmount = Number(amount);
    if (numericAmount < 1) {
      res.status(400).json({ success: false, message: 'Minimum payment amount is ₹1.00' });
      return;
    }

    // If userId is provided or authenticated, create authoritative Wallet payment order
    if (userId) {
      const topupOrder = await createTopupOrder(userId, userType, numericAmount, idempotencyKey);
      res.status(201).json({
        success: true,
        order: {
          id: topupOrder.orderId,
          amount: topupOrder.amountPaise,
          currency: topupOrder.currency,
          receipt: topupOrder.receipt,
          status: topupOrder.status,
        },
        orderId: topupOrder.orderId,
        amount: topupOrder.amount,
        amountPaise: topupOrder.amountPaise,
        currency: topupOrder.currency,
        receipt: topupOrder.receipt,
        keyId: topupOrder.keyId,
        status: topupOrder.status,
      });
      return;
    }

    // Standalone Razorpay Order when no user is specified
    const options = {
      amount: Math.round(numericAmount * 100), // Amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      notes: {
        purpose: req.body.purpose || 'direct_payment',
      },
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({
      success: true,
      order,
      orderId: order.id,
      amount: Number(order.amount) / 100,
      amountPaise: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
    });
  } catch (error: any) {
    console.error('Create Razorpay order error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Payment order creation failed',
    });
  }
};

/**
 * Cryptographically verifies Razorpay payment signature.
 * If a matching PaymentOrder exists in the database, atomically credits the user's wallet,
 * syncs customer/rider balance, records the immutable transaction ledger, and notifies via Socket.io.
 */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const authUser = (req as any).user;
    const providedUserId = authUser?.id || authUser?._id || req.body.userId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({
        success: false,
        message: 'Missing required payment verification details (razorpay_order_id, razorpay_payment_id, razorpay_signature)',
      });
      return;
    }

    // Check if there is an associated PaymentOrder in database
    const existingOrder = await prisma.paymentOrder.findUnique({
      where: { orderId: razorpay_order_id },
    });

    if (existingOrder) {
      const targetUserId = providedUserId || existingOrder.userId;
      const targetUserType = existingOrder.userType as 'customer' | 'rider';

      const result = await verifyTopupPayment(targetUserId, targetUserType, {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      // Emit real-time WebSocket update to connected client
      if ((req as any).io && targetUserId) {
        (req as any).io.to(targetUserId).emit('wallet:updated', {
          balance: result.newBalance,
          orderId: result.orderId,
          transaction: result.transaction,
        });
        (req as any).io.to(`user_${targetUserId}`).emit('wallet:updated', {
          balance: result.newBalance,
          orderId: result.orderId,
          transaction: result.transaction,
        });
      }

      res.status(200).json({
        success: true,
        message: result.message || 'Payment verified and credited to wallet successfully',
        newBalance: result.newBalance,
        orderId: result.orderId,
        paymentId: result.paymentId,
        transaction: result.transaction,
      });
      return;
    }

    // Fallback: Standalone signature verification
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSign = crypto
      .createHmac('sha256', getRazorpayKeySecret())
      .update(sign)
      .digest('hex');

    const isValid =
      expectedSign.length === razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSign), Buffer.from(razorpay_signature));

    if (isValid) {
      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid cryptographic signature sent!',
      });
    }
  } catch (error: any) {
    console.error('Verify Razorpay payment error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Payment verification failed',
    });
  }
};

/**
 * Handles incoming Razorpay Webhook on /api/payment/webhook
 */
export const handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  try {
    const result = await handleRazorpayWebhook(rawBody, signature);
    res.status(200).json({ status: 'ok', ...result });
  } catch (err: any) {
    console.error('Payment webhook error:', err.message);
    res.status(err.statusCode || 400).json({ status: 'error', message: err.message });
  }
};
