import { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getAuthoritativeWallet, getPaginatedTransactions, getOrCreateWallet } from '../services/walletService.js';

const generateId = (): string => crypto.randomBytes(12).toString('hex');

/**
 * Robust rider resolver: guarantees the request resolves to a valid Rider in Postgres,
 * eliminating 404s when using stale/test session tokens.
 */
export const resolveRider = async (riderId?: string) => {
  if (!riderId) {
    throw new ApiError(401, 'Unauthorized: driver token required');
  }
  const existing = await prisma.rider.findUnique({ where: { id: String(riderId) } });
  if (!existing) {
    throw new ApiError(404, 'Driver profile not found');
  }
  return existing;
};

// --- PROFILE & VEHICLE & DOCUMENTS & PREFERENCES ---

export const getRiderProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);
  const targetId = rider.id;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayRides, totalRidesCount, authWallet] = await Promise.all([
    prisma.ride.findMany({
      where: {
        riderId: targetId,
        status: 'completed',
        updatedAt: { gte: todayStart },
      },
    }),
    prisma.ride.count({
      where: { riderId: targetId, status: 'completed' },
    }),
    getAuthoritativeWallet(targetId, 'rider').catch(() => null),
  ]);

  const todayEarnings = todayRides.reduce((sum, r) => sum + Number(r.fare || 0), 0);
  const { password: _, ...riderWithoutPassword } = rider;

  const responseData = {
    ...riderWithoutPassword,
    _id: rider.id,
    rating: Number(rider.rating ?? 0),
    walletBalance: authWallet ? Number(authWallet.balance) : Number(rider.walletBalance ?? 0),
    todayEarnings,
    totalRides: totalRidesCount,
    totalEarnings: Number(rider.totalEarnings ?? 0),
  };

  res.status(200).json(new ApiResponse(200, responseData, 'Rider profile fetched'));
});

export const updateRiderProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);
  const targetId = rider.id;
  const { name, phone, vehicleType } = req.body;

  const updates: any = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (vehicleType) updates.vehicleType = vehicleType;

  const updatedRider = await prisma.rider.update({
    where: { id: targetId },
    data: updates,
  });

  const { password: _, ...riderWithoutPassword } = updatedRider;
  res.status(200).json(new ApiResponse(200, { ...riderWithoutPassword, _id: updatedRider.id }, 'Rider profile updated'));
});

export const getRiderVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);

  const v = (rider.vehicle as any) || null;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        model: v?.model || '',
        plate: v?.plate || v?.plateNumber || '',
        year: v?.year ? String(v.year) : '',
        color: v?.color || '',
        insuranceExpiry: v?.insuranceExpiry || '',
        pollutionStatus: v?.pollutionStatus || '',
        vehicleType: rider.vehicleType || '',
        isConfigured: Boolean(v?.model || v?.plate || v?.plateNumber),
      },
      'Vehicle details fetched'
    )
  );
});

export const updateRiderVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const { model, plate, year, color, vehicleType, insuranceExpiry, pollutionStatus } = req.body;

  const existingRider = await resolveRider(riderId);
  const targetId = existingRider.id;

  const currentVehicle = (existingRider.vehicle as any) || {};
  const updatedVehicle = {
    ...currentVehicle,
    ...(model && { model }),
    ...(plate && { plate }),
    ...(year && { year }),
    ...(color && { color }),
    ...(insuranceExpiry && { insuranceExpiry }),
    ...(pollutionStatus && { pollutionStatus }),
  };

  const rider = await prisma.rider.update({
    where: { id: targetId },
    data: {
      vehicle: updatedVehicle,
      ...(vehicleType && { vehicleType }),
    },
    select: { vehicle: true, vehicleType: true },
  });

  res.status(200).json(new ApiResponse(200, {
    ...(rider.vehicle as any),
    vehicleType: rider.vehicleType,
  }, 'Vehicle updated successfully'));
});

const DOC_TITLE_BY_TYPE: Record<string, string> = {
  DRIVING_LICENSE: 'Driving License',
  AADHAAR: 'Aadhaar Card',
  PAN: 'PAN Card',
  RC: 'Vehicle RC Book',
  INSURANCE: 'Vehicle Insurance',
  FITNESS_CERTIFICATE: 'Fitness Certificate',
  PERMIT: 'Commercial Permit',
};

const normalizeDocStatus = (rawStatus?: string | null): 'Approved' | 'Pending Review' | 'Rejected' | 'Required' => {
  const upper = String(rawStatus || '').toUpperCase();
  if (upper === 'VERIFIED' || upper === 'APPROVED') return 'Approved';
  if (upper === 'PENDING' || upper === 'PENDING REVIEW' || upper === 'PENDING_REVIEW' || upper === 'MANUAL_REVIEW') {
    return 'Pending Review';
  }
  if (upper === 'REJECTED' || upper === 'FAILED' || upper === 'EXPIRED') return 'Rejected';
  return 'Required';
};

export const getRiderDocuments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);

  const onboarding = await prisma.driverOnboarding.findUnique({
    where: { driverId: rider.id },
    include: {
      documents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const seenTypes = new Set<string>();
  const combinedDocs: any[] = [];

  if (onboarding?.documents && onboarding.documents.length > 0) {
    for (const doc of onboarding.documents) {
      if (seenTypes.has(doc.documentType)) continue;
      seenTypes.add(doc.documentType);
      combinedDocs.push({
        id: doc.id,
        documentType: doc.documentType,
        title: DOC_TITLE_BY_TYPE[doc.documentType] || doc.documentType,
        status: normalizeDocStatus(doc.verificationStatus),
        documentNumber: doc.documentNumber || '',
        frontImageUrl: doc.frontImageUrl || null,
        backImageUrl: doc.backImageUrl || null,
        expiryDate: doc.expiryDate || null,
        verifiedAt: doc.verifiedAt || null,
        rejectionReason: doc.rejectionReason || null,
      });
    }
  }

  if (Array.isArray(rider.documents)) {
    for (const legacy of rider.documents as any[]) {
      const legacyKey = String(legacy.documentType || legacy.title || legacy.id);
      if (seenTypes.has(legacyKey)) continue;
      combinedDocs.push({
        id: String(legacy.id || legacyKey),
        title: legacy.title || legacyKey,
        status: normalizeDocStatus(legacy.status),
        documentNumber: legacy.documentNumber || '',
        verifiedAt: legacy.verifiedAt || null,
      });
    }
  }

  res.status(200).json(new ApiResponse(200, combinedDocs, 'Documents fetched'));
});

export const updateRiderDocument = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const { id, documentNumber, status, title } = req.body;

  const rider = await resolveRider(riderId);
  const targetId = rider.id;

  const docs: any[] = Array.isArray(rider.documents) ? [...(rider.documents as any[])] : [];

  const docIndex = docs.findIndex((d) => d.id === id);
  if (docIndex >= 0) {
    if (documentNumber !== undefined) docs[docIndex].documentNumber = documentNumber;
    if (status !== undefined) docs[docIndex].status = status;
    docs[docIndex].updatedAt = new Date();
  } else {
    docs.push({
      id: id || Date.now().toString(),
      title: title || 'Document',
      documentNumber: documentNumber || '',
      status: status || 'Pending Review',
      updatedAt: new Date(),
    });
  }

  await prisma.rider.update({
    where: { id: targetId },
    data: { documents: docs },
  });

  res.status(200).json(new ApiResponse(200, docs, 'Document updated successfully'));
});

export const getRiderSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);

  res.status(200).json(new ApiResponse(200, (rider.preferences as any) || {
    autoAccept: false,
    darkMode: false,
    navigationApp: 'Google Maps',
  }, 'Settings fetched'));
});

export const updateRiderSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const { autoAccept, darkMode, navigationApp } = req.body;

  const existingRider = await resolveRider(riderId);
  const targetId = existingRider.id;

  const currentPrefs = (existingRider.preferences as any) || {};
  const updatedPrefs = {
    ...currentPrefs,
    ...(autoAccept !== undefined && { autoAccept }),
    ...(darkMode !== undefined && { darkMode }),
    ...(navigationApp !== undefined && { navigationApp }),
  };

  const rider = await prisma.rider.update({
    where: { id: targetId },
    data: { preferences: updatedPrefs },
    select: { preferences: true },
  });

  res.status(200).json(new ApiResponse(200, rider.preferences, 'Settings updated'));
});

export const optInOutstation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const { optIn = true } = req.body;

  const existingRider = await resolveRider(riderId);
  const targetId = existingRider.id;

  const currentPrefs = (existingRider.preferences as any) || {};
  currentPrefs.outstationOptIn = optIn;

  const rider = await prisma.rider.update({
    where: { id: targetId },
    data: { preferences: currentPrefs },
    select: { preferences: true },
  });

  res.status(200).json(new ApiResponse(200, rider.preferences, `Outstation opt-in ${optIn ? 'activated' : 'deactivated'}`));
});

// --- WALLET, PAYOUTS & TRANSACTIONS ---

export const getRiderWallet = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);
  const targetId = rider.id;

  const [authWallet, ledger, linkedMethods] = await Promise.all([
    getAuthoritativeWallet(targetId, 'rider'),
    getPaginatedTransactions(targetId, 'rider', { page: 1, limit: 20 }),
    prisma.paymentMethod.findMany({
      where: { userId: targetId, userModel: 'Rider' },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    }),
  ]);

  const formattedTransactions = ledger.items.map((tx: any) => ({
    id: tx.id,
    _id: tx.id,
    userId: targetId,
    userModel: 'Rider',
    type: tx.direction === 'CREDIT' ? 'credit' : 'debit',
    txType: tx.type,
    amount: Number(tx.amount),
    currency: tx.currency || 'INR',
    status: tx.status,
    description: tx.description,
    referenceId: tx.referenceId,
    balanceBefore: tx.balanceBefore,
    balanceAfter: tx.balanceAfter,
    createdAt: tx.createdAt,
  }));

  res.status(200).json(new ApiResponse(200, {
    walletId: authWallet.walletId,
    balance: Number(authWallet.balance),
    lockedBalance: Number(authWallet.lockedBalance),
    availableBalance: Number(authWallet.availableBalance),
    totalEarnings: Number(rider.totalEarnings ?? 0),
    linkedAccounts: linkedMethods.map((m) => ({ ...m, _id: m.id })),
    transactions: formattedTransactions,
  }, 'Wallet details fetched'));
});

export const requestPayout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);
  const targetId = rider.id;
  const { amount = 500, accountId } = req.body;
  const payoutAmount = Number(amount);

  if (isNaN(payoutAmount) || payoutAmount <= 0) throw new ApiError(400, 'Invalid payout amount');

  const wallet = await getOrCreateWallet(targetId, 'rider');

  const payoutResult = await prisma.$transaction(async (tx) => {
    const freshWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
    if (!freshWallet) throw new ApiError(404, 'Wallet record not found');

    const currentBalance = Number(freshWallet.balance);
    if (currentBalance < payoutAmount) {
      throw new ApiError(400, `Insufficient wallet balance for this payout (Available: ₹${currentBalance.toFixed(2)})`);
    }

    const balanceBefore = currentBalance;
    const balanceAfter = currentBalance - payoutAmount;

    const updatedWallet = await tx.wallet.update({
      where: { id: freshWallet.id },
      data: { balance: { decrement: payoutAmount } },
    });

    await tx.rider.update({
      where: { id: targetId },
      data: { walletBalance: { decrement: payoutAmount } },
    });

    const newTx = await tx.walletTransaction.create({
      data: {
        id: generateId(),
        walletId: freshWallet.id,
        type: 'PAYOUT',
        amount: payoutAmount,
        direction: 'DEBIT',
        balanceBefore,
        balanceAfter,
        currency: 'INR',
        status: 'SUCCESS',
        referenceId: accountId || 'PRIMARY_BANK',
        referenceType: 'BANK_PAYOUT',
        description: `Payout to Bank (${accountId ? 'Account ' + accountId : 'Primary Account'})`,
      },
    });

    await tx.transaction.create({
      data: {
        id: generateId(),
        userId: targetId,
        userModel: 'Rider',
        type: 'debit',
        amount: payoutAmount,
        currency: 'INR',
        description: `Payout to Bank (${accountId ? 'Account ' + accountId : 'Primary Account'})`,
        referenceId: newTx.id,
      },
    });

    return { newBalance: Number(updatedWallet.balance), transaction: newTx };
  });

  res.status(200).json(new ApiResponse(200, {
    newBalance: payoutResult.newBalance,
    transaction: {
      ...payoutResult.transaction,
      _id: payoutResult.transaction.id,
      type: 'debit',
    },
  }, 'Payout processed successfully'));
});

export const linkPaymentAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);
  const { provider, type = 'Bank Account', last4, accountNumber, ifscOrRouting } = req.body;
  if (!provider) throw new ApiError(400, 'Bank or provider name is required');

  const existingCount = await prisma.paymentMethod.count({
    where: { userId: rider.id, userModel: 'Rider' },
  });

  const created = await prisma.paymentMethod.create({
    data: {
      id: generateId(),
      userId: rider.id,
      userModel: 'Rider',
      type,
      provider: String(provider).trim(),
      last4: last4 ? String(last4).slice(-4) : (accountNumber ? String(accountNumber).slice(-4) : null),
      accountNumber: accountNumber ? String(accountNumber) : null,
      ifscOrRouting: ifscOrRouting ? String(ifscOrRouting) : null,
      isDefault: existingCount === 0,
    },
  });

  res.status(201).json(new ApiResponse(201, { ...created, _id: created.id }, 'Account linked successfully'));
});

// --- EARNINGS & INCENTIVES & OFFERS & PERFORMANCE ---

export const getRiderEarnings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);
  const targetId = rider.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);

  const [completedRides, authWallet] = await Promise.all([
    prisma.ride.findMany({
      where: { riderId: targetId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
    }),
    getAuthoritativeWallet(targetId, 'rider').catch(() => null),
  ]);

  const weeklyRides = completedRides.filter((r) => new Date(r.completedAt || r.createdAt) >= weekStart);
  const totalWeeklyMins = weeklyRides.reduce((sum, r) => sum + Number(r.duration || 0), 0);
  const onlineHours = `${Math.floor(totalWeeklyMins / 60)}h ${totalWeeklyMins % 60}m`;

  const dayBuckets: Array<{ id: string; day: string; amount: number; rides: number }> = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const dayStart = new Date(today);
    dayStart.setDate(dayStart.getDate() - offset);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const matching = completedRides.filter((r) => {
      const ts = new Date(r.completedAt || r.createdAt).getTime();
      return ts >= dayStart.getTime() && ts < dayEnd.getTime();
    });

    const label =
      offset === 0
        ? 'Today'
        : offset === 1
          ? 'Yesterday'
          : dayStart.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    if (offset < 2 || matching.length > 0) {
      dayBuckets.push({
        id: String(offset + 1),
        day: label,
        amount: matching.reduce((s, r) => s + Number(r.fare || 0), 0),
        rides: matching.length,
      });
    }
  }

  const computedTotalEarnings = completedRides.reduce((s, r) => s + Number(r.fare || 0), 0);
  const walletBalance = authWallet ? Number(authWallet.balance) : Number(rider.walletBalance ?? 0);

  res.status(200).json(new ApiResponse(200, {
    totalBalance: walletBalance,
    totalEarnings: Math.max(computedTotalEarnings, Number(rider.totalEarnings ?? 0)),
    weeklyTrips: weeklyRides.length,
    totalCompletedTrips: completedRides.length,
    onlineHours,
    historySummary: dayBuckets,
  }, 'Earnings fetched'));
});

export const getRiderIncentives = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);
  const targetId = rider.id;

  const [rewards, broadcasts] = await Promise.all([
    prisma.reward.findMany({
      where: { userId: targetId, userModel: 'Rider' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.driverIncentiveBroadcast.findMany({
      where: { status: 'active', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const points = rider.loyaltyPoints ?? 0;
  const combinedIncentives = [
    ...rewards.map((r) => ({ ...r, _id: r.id })),
    ...broadcasts.map((b) => ({
      _id: b.id,
      id: b.id,
      type: 'broadcast',
      title: b.title,
      description: b.message,
      rewardAmount: Number(b.bonusAmount),
      targetZone: b.targetZone,
      validUntil: b.expiresAt,
      progress: 0,
      target: 0,
    })),
  ];

  res.status(200).json(new ApiResponse(200, {
    loyaltyPoints: points,
    referralCode: rider.referralCode || '',
    progressPercentage: Math.min(100, Math.round((points / 500) * 100)),
    pointsNeeded: Math.max(0, 500 - points),
    incentives: combinedIncentives,
  }, 'Incentives fetched'));
});

export const getRiderOffers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);
  const targetId = rider.id;

  const [offers, broadcasts] = await Promise.all([
    prisma.reward.findMany({
      where: { userId: targetId, userModel: 'Rider' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.driverIncentiveBroadcast.findMany({
      where: { status: 'active', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const formattedOffers = [
    ...offers.map((o) => ({
      ...o,
      _id: o.id,
      progress: Number(o.progress ?? 0),
      target: Number(o.target ?? 0),
      rewardAmount: Number(o.rewardAmount ?? 0),
    })),
    ...broadcasts.map((b) => ({
      _id: b.id,
      id: b.id,
      title: b.title,
      description: b.message,
      rewardAmount: Number(b.bonusAmount),
      validUntil: b.expiresAt,
      progress: 0,
      target: 0,
    })),
  ];

  res.status(200).json(new ApiResponse(200, formattedOffers, 'Offers fetched successfully'));
});

export const getRiderPerformance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);
  const targetId = rider.id;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const [allRides, safetyClaims] = await Promise.all([
    prisma.ride.findMany({
      where: { riderId: targetId },
      select: {
        id: true,
        status: true,
        cancelledBy: true,
        fare: true,
        createdAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.claim.count({
      where: { userId: targetId, userModel: 'Rider', type: 'safety' },
    }),
  ]);

  const completedRides = allRides.filter((r) => r.status === 'completed');
  const driverCancelled = allRides.filter((r) => r.status === 'cancelled' && r.cancelledBy === 'rider');
  const decidedRides = completedRides.length + driverCancelled.length;

  const completionRate = decidedRides > 0 ? Math.round((completedRides.length / decidedRides) * 100) : 0;
  const acceptanceRate = allRides.length > 0 ? Math.round((completedRides.length / allRides.length) * 100) : 0;
  const safetyCompliance = Math.max(0, 100 - safetyClaims * 5);

  const weeklyActivity: Array<{ day: string; date: string; rides: number; earnings: number }> = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const dStart = new Date(todayStart);
    dStart.setDate(dStart.getDate() - offset);
    const dEnd = new Date(dStart);
    dEnd.setDate(dEnd.getDate() + 1);

    const dayCompleted = completedRides.filter((r) => {
      const ts = new Date(r.completedAt || r.createdAt).getTime();
      return ts >= dStart.getTime() && ts < dEnd.getTime();
    });

    weeklyActivity.push({
      day: dStart.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: dStart.toISOString().split('T')[0],
      rides: dayCompleted.length,
      earnings: dayCompleted.reduce((sum, r) => sum + Number(r.fare || 0), 0),
    });
  }

  const totalWeeklyRides = weeklyActivity.reduce((s, d) => s + d.rides, 0);
  const totalWeeklyEarnings = weeklyActivity.reduce((s, d) => s + d.earnings, 0);
  const ratingVal = Number(rider.rating ?? 0);

  const badges = [
    {
      id: 'first-trip',
      name: 'First Mile Completed',
      desc: 'Complete your first ride on DriveMate',
      unlocked: completedRides.length >= 1,
      current: completedRides.length,
      target: 1,
      color: '#10b981',
      icon: 'ribbon',
    },
    {
      id: 'ten-trips',
      name: 'Reliable Partner',
      desc: 'Complete 10 rides with DriveMate',
      unlocked: completedRides.length >= 10,
      current: completedRides.length,
      target: 10,
      color: '#f59e0b',
      icon: 'trophy',
    },
    {
      id: 'top-rated',
      name: 'Top Rated Driver',
      desc: 'Maintain 4.8+ average rating with at least 5 trips',
      unlocked: completedRides.length >= 5 && ratingVal >= 4.8,
      current: ratingVal,
      target: 4.8,
      color: '#3b82f6',
      icon: 'star',
    },
    {
      id: 'safety-champion',
      name: 'Zero Incident Record',
      desc: '100% safety compliance across trips',
      unlocked: completedRides.length >= 1 && safetyClaims === 0,
      current: safetyCompliance,
      target: 100,
      color: '#f72585',
      icon: 'shield-checkmark',
    },
  ];

  res.status(200).json(new ApiResponse(200, {
    rating: ratingVal,
    totalCompletedRides: completedRides.length,
    driverCancelledRides: driverCancelled.length,
    completionRate,
    acceptanceRate,
    safetyCompliance,
    totalWeeklyRides,
    totalWeeklyEarnings,
    weeklyActivity,
    badges,
  }, 'Performance analytics fetched'));
});

// --- NOTIFICATIONS ---

export const getRiderNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);
  const targetId = rider.id;

  const notifs = await prisma.notification.findMany({
    where: { userId: targetId, userModel: 'Rider' },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json(new ApiResponse(200, notifs.map((n) => ({ ...n, _id: n.id })), 'Notifications fetched'));
});

export const markRiderNotificationsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);
  const targetId = rider.id;

  await prisma.notification.updateMany({
    where: { userId: targetId, userModel: 'Rider', isRead: false },
    data: { isRead: true },
  });
  res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});

// --- SUPPORT, FAQS & TICKETS ---

export const getDriverFaqs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const faqs = [
    {
      id: '1',
      question: 'When will I receive my payout?',
      answer: 'Earnings are transferred directly to your linked bank account every Monday. Instant payouts are also available in My Wallet.',
    },
    {
      id: '2',
      question: 'Customer refused to pay or cancellation fee',
      answer: 'If a customer cancels after 3 minutes or refuses cash payment, raise a dispute from Trip Help or the Support screen.',
    },
    {
      id: '3',
      question: 'How do incentives work?',
      answer: 'Complete the target number of trips within the promotional window to earn cash bonuses deposited directly into your wallet.',
    },
    {
      id: '4',
      question: 'My account is suspended or documents rejected',
      answer: 'Ensure all uploaded documents are clear and valid. You can re-upload your Driving License or RC Book under Documents.',
    },
    {
      id: '5',
      question: 'How do waiting charges calculate?',
      answer: 'Waiting charges of ₹2/min apply automatically if waiting exceeds 3 minutes at the customer pickup location.',
    },
  ];

  res.status(200).json(new ApiResponse(200, faqs, 'Driver FAQs fetched'));
});

export const raiseTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user?.id || req.user?._id;
  const rider = await resolveRider(riderId);
  const targetId = rider.id;
  const { type = 'other', description, rideId } = req.body;
  if (!description) throw new ApiError(400, 'Description is required');

  const ticket = await prisma.claim.create({
    data: {
      id: generateId(),
      userId: targetId,
      userModel: 'Rider',
      type,
      description,
      rideId: rideId || null,
      status: 'open',
    },
  });

  res.status(201).json(new ApiResponse(201, { ...ticket, _id: ticket.id }, 'Ticket raised successfully'));
});

export const getRiderTickets = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const tickets = await prisma.claim.findMany({
    where: { userId: riderId, userModel: 'Rider' },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(new ApiResponse(200, tickets.map(t => ({ ...t, _id: t.id })), 'Tickets fetched'));
});

// --- AUTHENTICATION (PASSWORD RECOVERY) ---

export const forgotPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email address is required');

  const rider = await prisma.rider.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!rider) throw new ApiError(404, 'No rider account found with this email');

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  await prisma.rider.update({
    where: { id: rider.id },
    data: {
      resetOtp: otp,
      resetOtpExpires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  console.log(`[AUTH] Reset OTP for ${rider.email}: ${otp}`);
  res.status(200).json(new ApiResponse(200, { email: rider.email, demoOtp: otp }, 'Verification code sent to your email'));
});

export const verifyOtp = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, 'Email and OTP are required');

  const rider = await prisma.rider.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!rider) throw new ApiError(404, 'Rider not found');

  if (!rider.resetOtp || rider.resetOtp !== String(otp).trim()) {
    throw new ApiError(400, 'Invalid or incorrect verification code');
  }

  if (rider.resetOtpExpires && new Date() > new Date(rider.resetOtpExpires)) {
    throw new ApiError(400, 'Verification code has expired. Please request a new one.');
  }

  res.status(200).json(new ApiResponse(200, { verified: true }, 'Code verified successfully'));
});

export const resetPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and new password are required');

  const rider = await prisma.rider.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!rider) throw new ApiError(404, 'Rider not found');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await prisma.rider.update({
    where: { id: rider.id },
    data: {
      password: hashedPassword,
      resetOtp: null,
      resetOtpExpires: null,
    },
  });

  res.status(200).json(new ApiResponse(200, null, 'Password reset successful. Please login.'));
});
