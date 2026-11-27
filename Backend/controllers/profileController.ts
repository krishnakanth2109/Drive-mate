import { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getAuthoritativeWallet } from '../services/walletService.js';

export const getPaymentMethods = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const methods = await prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const formattedMethods = methods.map((m) => ({
    ...m,
    _id: m.id,
    user: m.userId,
  }));

  res.status(200).json(new ApiResponse(200, formattedMethods, 'Payment methods fetched successfully'));
});

export const addPaymentMethod = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { type, provider, last4, accountNumber, ifscOrRouting } = req.body;
  if (!type || !provider) {
    throw new ApiError(400, 'Type and provider are required');
  }

  const id = crypto.randomBytes(12).toString('hex');
  const method = await prisma.paymentMethod.create({
    data: {
      id,
      userId,
      userModel: 'Customer',
      type,
      provider,
      last4: last4 || null,
      accountNumber: accountNumber || null,
      ifscOrRouting: ifscOrRouting || null,
    },
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        ...method,
        _id: method.id,
        user: method.userId,
      },
      'Payment method added successfully'
    )
  );
});

export const getBalances = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const [customer, authWallet] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletBalance: true,
        coinBalance: true,
        powerPassActive: true,
        powerPassPlan: true,
        powerPassValidUntil: true,
      },
    }),
    getAuthoritativeWallet(userId, 'customer').catch(() => null),
  ]);

  if (!customer) throw new ApiError(404, 'Customer not found');

  const responseData = {
    _id: customer.id,
    walletBalance: authWallet ? Number(authWallet.balance) : Number(customer.walletBalance),
    coinBalance: customer.coinBalance,
    powerPass: {
      isActive: customer.powerPassActive,
      planName: customer.powerPassPlan,
      validUntil: customer.powerPassValidUntil,
    },
  };

  res.status(200).json(new ApiResponse(200, responseData, 'Balances fetched successfully'));
});

export const addWalletBalance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { amount } = req.body;
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new ApiError(400, 'Valid positive amount is required');
  }

  const customer = await prisma.customer.findUnique({
    where: { id: userId },
  });
  if (!customer) throw new ApiError(404, 'Customer not found');

  const transactionId = crypto.randomBytes(12).toString('hex');

  const [updatedCustomer] = await prisma.$transaction([
    prisma.customer.update({
      where: { id: userId },
      data: {
        walletBalance: {
          increment: numAmount,
        },
      },
    }),
    prisma.transaction.create({
      data: {
        id: transactionId,
        userId,
        userModel: 'Customer',
        type: 'credit',
        amount: numAmount,
        currency: 'INR',
        description: 'Wallet top-up',
      },
    }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        balance: Number(updatedCustomer.walletBalance),
      },
      'Added successfully'
    )
  );
});

export const getTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { currency } = req.query;
  const where: any = { userId };
  if (currency && typeof currency === 'string') {
    where.currency = currency;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const formatted = transactions.map((t) => ({
    ...t,
    _id: t.id,
    user: t.userId,
    amount: Number(t.amount),
  }));

  res.status(200).json(new ApiResponse(200, formatted, 'Transactions fetched successfully'));
});

export const getRewards = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const rewards = await prisma.reward.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = rewards.map((r) => ({
    ...r,
    _id: r.id,
    user: r.userId,
    discountValue: Number(r.discountValue),
    progress: Number(r.progress),
    target: Number(r.target),
    rewardAmount: Number(r.rewardAmount),
  }));

  res.status(200).json(new ApiResponse(200, formatted, 'Rewards fetched successfully'));
});

export const getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = notifications.map((n) => ({
    ...n,
    _id: n.id,
    user: n.userId,
  }));

  res.status(200).json(new ApiResponse(200, formatted, 'Notifications fetched successfully'));
});

export const markNotificationsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  res.status(200).json(new ApiResponse(200, null, 'All marked as read'));
});

export const getClaims = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const claims = await prisma.claim.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = claims.map((c) => ({
    ...c,
    _id: c.id,
    user: c.userId,
  }));

  res.status(200).json(new ApiResponse(200, formatted, 'Claims fetched successfully'));
});

export const addClaim = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { type, description, rideId } = req.body;
  if (!type || !description) {
    throw new ApiError(400, 'Type and description are required');
  }

  const id = crypto.randomBytes(12).toString('hex');
  const claim = await prisma.claim.create({
    data: {
      id,
      userId,
      userModel: 'Customer',
      type,
      description,
      rideId: rideId || null,
      status: 'open',
    },
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        ...claim,
        _id: claim.id,
        user: claim.userId,
      },
      'Claim added successfully'
    )
  );
});

export const subscribePowerPass = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const customer = await prisma.customer.findUnique({
    where: { id: userId },
  });
  if (!customer) throw new ApiError(404, 'Customer not found');

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  const updatedCustomer = await prisma.customer.update({
    where: { id: userId },
    data: {
      powerPassActive: true,
      powerPassPlan: 'Monthly Power Pass',
      powerPassValidUntil: validUntil,
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        powerPass: {
          isActive: updatedCustomer.powerPassActive,
          planName: updatedCustomer.powerPassPlan,
          validUntil: updatedCustomer.powerPassValidUntil,
        },
      },
      'Subscribed to Power Pass'
    )
  );
});
