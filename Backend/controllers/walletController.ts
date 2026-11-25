import { Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import {
  getAuthoritativeWallet,
  getPaginatedTransactions,
  createTopupOrder,
  verifyTopupPayment,
  deductRideFare,
  creditRefund,
  handleRazorpayWebhook,
  simulateTestPayment,
} from '../services/walletService.js';

/**
 * GET /api/wallet — retrieve the authenticated user's wallet
 */
export const getWallet = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id || req.user._id;
  const userType = req.user.role === 'rider' ? 'rider' : 'customer';

  const wallet = await getAuthoritativeWallet(userId, userType);
  res.status(200).json(new ApiResponse(200, wallet, 'Wallet details fetched successfully'));
});

/**
 * GET /api/wallet/transactions — retrieve paginated transactions
 */
export const getTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id || req.user._id;
  const userType = req.user.role === 'rider' ? 'rider' : 'customer';
  const { page, limit, type, direction } = req.query;

  const result = await getPaginatedTransactions(userId, userType, {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 15,
    type: type ? String(type) : undefined,
    direction: direction ? String(direction) : undefined,
  });

  res.status(200).json(new ApiResponse(200, result, 'Transactions fetched successfully'));
});

/**
 * POST /api/wallet/topup/order — create a top-up payment order
 */
export const createTopup = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id || req.user._id;
  const userType = req.user.role === 'rider' ? 'rider' : 'customer';
  const { amount, idempotencyKey } = req.body;

  if (!amount || isNaN(Number(amount))) {
    throw new ApiError(400, 'Valid numeric amount is required');
  }

  const order = await createTopupOrder(userId, userType, Number(amount), idempotencyKey);
  res.status(201).json(new ApiResponse(201, order, 'Top-up payment order created'));
});

/**
 * POST /api/wallet/topup/verify — verify the payment result and credit wallet
 */
export const verifyTopup = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id || req.user._id;
  const userType = req.user.role === 'rider' ? 'rider' : 'customer';
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, 'Missing razorpay payment verification parameters');
  }

  const result = await verifyTopupPayment(userId, userType, {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  // Emit real-time WebSocket update to client
  if (req.io && userId) {
    req.io.to(userId).emit('wallet:updated', {
      balance: result.newBalance,
      orderId: result.orderId,
      transaction: result.transaction,
    });
    req.io.to(`user_${userId}`).emit('wallet:updated', {
      balance: result.newBalance,
      orderId: result.orderId,
      transaction: result.transaction,
    });
  }

  res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * GET /api/wallet/topup/:id — retrieve a top-up order status
 */
export const getTopupStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id || req.user._id;
  const orderId = req.params.id;

  const order = await prisma.paymentOrder.findFirst({
    where: {
      orderId,
      userId,
    },
    select: {
      orderId: true,
      amount: true,
      currency: true,
      status: true,
      receipt: true,
      razorpayPaymentId: true,
      verifiedAt: true,
      createdAt: true,
    },
  });

  if (!order) {
    throw new ApiError(404, 'Top-up order not found');
  }

  res.status(200).json(new ApiResponse(200, order, 'Top-up order status retrieved'));
});

/**
 * POST /api/wallet/topup/simulate-test-payment — helper for testing in Expo Go
 */
export const simulatePayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id || req.user._id;
  const userType = req.user.role === 'rider' ? 'rider' : 'customer';
  const { orderId } = req.body;

  if (!orderId) {
    throw new ApiError(400, 'Order ID is required to simulate payment');
  }

  const result = await simulateTestPayment(userId, userType, orderId);

  // Emit real-time WebSocket update to client
  if (req.io && userId) {
    req.io.to(userId).emit('wallet:updated', {
      balance: result.newBalance,
      orderId: result.orderId,
    });
    req.io.to(`user_${userId}`).emit('wallet:updated', {
      balance: result.newBalance,
      orderId: result.orderId,
    });
  }

  res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/wallet/fare/deduct — ride fare deduction
 */
export const deductFare = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id || req.user._id;
  const userType = req.user.role === 'rider' ? 'rider' : 'customer';
  const { amount, rideId, description, idempotencyKey } = req.body;

  if (!amount || !rideId) {
    throw new ApiError(400, 'Ride ID and fare amount are required');
  }

  const result = await deductRideFare(userId, userType, {
    amount: Number(amount),
    rideId: String(rideId),
    description,
    idempotencyKey,
  });

  res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/wallet/fare/refund — refund ride fare
 */
export const refundFare = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id || req.user._id;
  const userType = req.user.role === 'rider' ? 'rider' : 'customer';
  const { amount, referenceId, reason, idempotencyKey } = req.body;

  if (!amount || !reason) {
    throw new ApiError(400, 'Amount and refund reason are required');
  }

  const result = await creditRefund(userId, userType, {
    amount: Number(amount),
    referenceId,
    reason,
    idempotencyKey,
  });

  res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/wallet/webhook — Razorpay Webhook listener
 */
export const handleWebhook = async (req: any, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = req.rawBody || JSON.stringify(req.body);

  try {
    const result = await handleRazorpayWebhook(rawBody, signature);
    res.status(200).json({ status: 'ok', ...result });
  } catch (err: any) {
    console.error('Webhook processing error:', err.message);
    res.status(err.statusCode || 400).json({ status: 'error', message: err.message });
  }
};

/**
 * GET /api/wallet/settlements — retrieve settlements for driver (Rider)
 */
export const getRiderSettlements = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id || req.user._id;

  const items = await prisma.settlementItem.findMany({
    where: { beneficiaryId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      batch: {
        select: {
          batchReference: true,
          periodStart: true,
          periodEnd: true,
          status: true,
          isDryRun: true,
        },
      },
    },
  });

  const formatted = items.map((item) => ({
    id: item.id,
    payoutRef: item.payoutRef,
    batchReference: item.batch.batchReference,
    periodStart: item.batch.periodStart,
    periodEnd: item.batch.periodEnd,
    rideCount: item.rideCount,
    grossAmount: Number(item.grossAmount),
    deductions: Number(item.deductions),
    incentives: Number(item.incentives),
    netAmount: Number(item.netAmount),
    status: item.status,
    batchStatus: item.batch.status,
    createdAt: item.createdAt,
  }));

  res.status(200).json(new ApiResponse(200, formatted, 'Settlement records fetched'));
});
