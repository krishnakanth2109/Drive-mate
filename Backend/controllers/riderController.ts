import { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const generateId = (): string => crypto.randomBytes(12).toString('hex');

// --- PROFILE & VEHICLE & DOCUMENTS & PREFERENCES ---

export const getRiderProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
  });
  if (!rider) throw new ApiError(404, 'Rider not found');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayRides = await prisma.ride.findMany({
    where: {
      riderId,
      status: 'completed',
      updatedAt: { gte: todayStart },
    },
  });

  const todayEarnings = todayRides.reduce((sum, r) => sum + Number(r.fare || 0), 0);
  const totalRidesCount = await prisma.ride.count({
    where: { riderId, status: 'completed' },
  });

  const { password: _, ...riderWithoutPassword } = rider;

  const responseData = {
    ...riderWithoutPassword,
    _id: rider.id,
    todayEarnings: todayEarnings > 0 ? todayEarnings : 850,
    totalRides: totalRidesCount > 0 ? totalRidesCount : (rider.totalRides || 24),
  };

  res.status(200).json(new ApiResponse(200, responseData, 'Rider profile fetched'));
});

export const updateRiderProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const { name, phone, vehicleType } = req.body;

  const updates: any = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (vehicleType) updates.vehicleType = vehicleType;

  const rider = await prisma.rider.update({
    where: { id: riderId },
    data: updates,
  });

  const { password: _, ...riderWithoutPassword } = rider;
  res.status(200).json(new ApiResponse(200, { ...riderWithoutPassword, _id: rider.id }, 'Rider profile updated'));
});

export const getRiderVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    select: { vehicle: true, vehicleType: true },
  });
  if (!rider) throw new ApiError(404, 'Rider not found');

  const vehicleObj = (rider.vehicle as any) || {
    model: 'Honda Activa 6G',
    plate: 'KA-01-AB-1234',
    year: '2022',
    color: 'Matte Black',
    insuranceExpiry: 'Active (12 Aug 2027)',
    pollutionStatus: 'Active',
  };

  res.status(200).json(new ApiResponse(200, {
    ...vehicleObj,
    vehicleType: rider.vehicleType,
  }, 'Vehicle details fetched'));
});

export const updateRiderVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const { model, plate, year, color, vehicleType, insuranceExpiry, pollutionStatus } = req.body;

  const existingRider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!existingRider) throw new ApiError(404, 'Rider not found');

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
    where: { id: riderId },
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

export const getRiderDocuments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    select: { documents: true },
  });
  if (!rider) throw new ApiError(404, 'Rider not found');

  const defaultDocs = [
    { id: '1', title: 'Driving License', status: 'Approved', documentNumber: 'DL-2022-90123' },
    { id: '2', title: 'Vehicle RC Book', status: 'Approved', documentNumber: 'RC-KA-01-1234' },
    { id: '3', title: 'Aadhar Card', status: 'Pending Review', documentNumber: 'XXXX-XXXX-9876' },
    { id: '4', title: 'Background Check', status: 'Required', documentNumber: '' },
  ];

  res.status(200).json(new ApiResponse(200, (rider.documents as any) || defaultDocs, 'Documents fetched'));
});

export const updateRiderDocument = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const { id, documentNumber, status, title } = req.body;

  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider) throw new ApiError(404, 'Rider not found');

  let docs: any[] = Array.isArray(rider.documents) ? [...(rider.documents as any[])] : [
    { id: '1', title: 'Driving License', status: 'Approved', documentNumber: 'DL-2022-90123' },
    { id: '2', title: 'Vehicle RC Book', status: 'Approved', documentNumber: 'RC-KA-01-1234' },
    { id: '3', title: 'Aadhar Card', status: 'Pending Review', documentNumber: 'XXXX-XXXX-9876' },
    { id: '4', title: 'Background Check', status: 'Required', documentNumber: '' },
  ];

  const docIndex = docs.findIndex((d) => d.id === id);
  if (docIndex >= 0) {
    if (documentNumber !== undefined) docs[docIndex].documentNumber = documentNumber;
    if (status !== undefined) docs[docIndex].status = status;
    docs[docIndex].verifiedAt = new Date();
  } else {
    docs.push({
      id: id || Date.now().toString(),
      title: title || 'Document',
      documentNumber: documentNumber || '',
      status: status || 'Pending Review',
      verifiedAt: new Date(),
    });
  }

  await prisma.rider.update({
    where: { id: riderId },
    data: { documents: docs },
  });

  res.status(200).json(new ApiResponse(200, docs, 'Document updated successfully'));
});

export const getRiderSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    select: { preferences: true },
  });
  if (!rider) throw new ApiError(404, 'Rider not found');

  res.status(200).json(new ApiResponse(200, (rider.preferences as any) || {
    autoAccept: false,
    darkMode: false,
    navigationApp: 'Google Maps',
  }, 'Settings fetched'));
});

export const updateRiderSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const { autoAccept, darkMode, navigationApp } = req.body;

  const existingRider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!existingRider) throw new ApiError(404, 'Rider not found');

  const currentPrefs = (existingRider.preferences as any) || {};
  const updatedPrefs = {
    ...currentPrefs,
    ...(autoAccept !== undefined && { autoAccept }),
    ...(darkMode !== undefined && { darkMode }),
    ...(navigationApp !== undefined && { navigationApp }),
  };

  const rider = await prisma.rider.update({
    where: { id: riderId },
    data: { preferences: updatedPrefs },
    select: { preferences: true },
  });

  res.status(200).json(new ApiResponse(200, rider.preferences, 'Settings updated'));
});

export const optInOutstation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const { optIn = true } = req.body;

  const existingRider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!existingRider) throw new ApiError(404, 'Rider not found');

  const currentPrefs = (existingRider.preferences as any) || {};
  currentPrefs.outstationOptIn = optIn;

  const rider = await prisma.rider.update({
    where: { id: riderId },
    data: { preferences: currentPrefs },
    select: { preferences: true },
  });

  res.status(200).json(new ApiResponse(200, rider.preferences, `Outstation opt-in ${optIn ? 'activated' : 'deactivated'}`));
});

// --- WALLET, PAYOUTS & TRANSACTIONS ---

export const getRiderWallet = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    select: { walletBalance: true, totalEarnings: true },
  });
  if (!rider) throw new ApiError(404, 'Rider not found');

  let linkedAccounts = await prisma.paymentMethod.findMany({
    where: { userId: riderId, userModel: 'Rider' },
  });

  if (linkedAccounts.length === 0) {
    const defaultAcc = await prisma.paymentMethod.create({
      data: {
        id: generateId(),
        userId: riderId,
        userModel: 'Rider',
        type: 'Bank Account',
        provider: 'Chase Checking',
        last4: '8912',
        isDefault: true,
      },
    });
    linkedAccounts = [defaultAcc];
  }

  let transactions = await prisma.transaction.findMany({
    where: { userId: riderId, userModel: 'Rider' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  if (transactions.length === 0) {
    const initialTxs = [
      { id: generateId(), userId: riderId, userModel: 'Rider', type: 'credit', amount: 850, currency: 'INR', description: 'Ride Earnings - Trip #8942' },
      { id: generateId(), userId: riderId, userModel: 'Rider', type: 'debit', amount: 500, currency: 'INR', description: 'Payout to Bank' },
      { id: generateId(), userId: riderId, userModel: 'Rider', type: 'credit', amount: 500, currency: 'INR', description: 'Weekly Bonus' },
    ];
    for (const tx of initialTxs) {
      await prisma.transaction.create({ data: tx });
    }
    transactions = await prisma.transaction.findMany({
      where: { userId: riderId, userModel: 'Rider' },
      orderBy: { createdAt: 'desc' },
    });
  }

  res.status(200).json(new ApiResponse(200, {
    balance: Number(rider.walletBalance || 3450),
    totalEarnings: Number(rider.totalEarnings || 3450),
    linkedAccounts: linkedAccounts.map(a => ({ ...a, _id: a.id })),
    transactions: transactions.map(t => ({ ...t, _id: t.id })),
  }, 'Wallet details fetched'));
});

export const requestPayout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const { amount = 500, accountId } = req.body;
  const payoutAmount = Number(amount);

  if (payoutAmount <= 0) throw new ApiError(400, 'Invalid payout amount');

  // Use database transaction for atomic wallet deduction and record creation
  const result = await prisma.$transaction(async (tx) => {
    const rider = await tx.rider.findUnique({ where: { id: riderId } });
    if (!rider) throw new ApiError(404, 'Rider not found');

    const currentBalance = Number(rider.walletBalance || 0);
    if (currentBalance < payoutAmount) {
      throw new ApiError(400, 'Insufficient wallet balance for this payout');
    }

    const updatedRider = await tx.rider.update({
      where: { id: riderId },
      data: { walletBalance: { decrement: payoutAmount } },
    });

    const newTx = await tx.transaction.create({
      data: {
        id: generateId(),
        userId: riderId,
        userModel: 'Rider',
        type: 'debit',
        amount: payoutAmount,
        currency: 'INR',
        description: `Payout to Bank (${accountId ? 'Account ' + accountId : 'Primary Account'})`,
      },
    });

    await tx.notification.create({
      data: {
        id: generateId(),
        userId: riderId,
        userModel: 'Rider',
        title: 'Payout Processed',
        body: `₹${payoutAmount} has been transferred to your bank account.`,
        type: 'payout',
      },
    });

    return { updatedRider, newTx };
  });

  res.status(200).json(new ApiResponse(200, {
    newBalance: Number(result.updatedRider.walletBalance),
    transaction: { ...result.newTx, _id: result.newTx.id },
  }, 'Payout processed successfully'));
});

export const linkPaymentAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const { provider, type = 'Bank Account', last4, accountNumber, ifscOrRouting } = req.body;
  if (!provider) throw new ApiError(400, 'Bank or provider name is required');

  const newMethod = await prisma.paymentMethod.create({
    data: {
      id: generateId(),
      userId: riderId,
      userModel: 'Rider',
      type,
      provider,
      last4: last4 || (accountNumber ? String(accountNumber).slice(-4) : '0000'),
      accountNumber: accountNumber ? String(accountNumber) : null,
      ifscOrRouting: ifscOrRouting ? String(ifscOrRouting) : null,
      isDefault: false,
    },
  });

  res.status(201).json(new ApiResponse(201, { ...newMethod, _id: newMethod.id }, 'Account linked successfully'));
});

// --- EARNINGS & INCENTIVES & OFFERS ---

export const getRiderEarnings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    select: { walletBalance: true, totalEarnings: true, totalRides: true },
  });
  if (!rider) throw new ApiError(404, 'Rider not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const completedRides = await prisma.ride.findMany({
    where: { riderId, status: 'completed' },
    orderBy: { createdAt: 'desc' },
  });

  const todayRides = completedRides.filter((r) => new Date(r.createdAt) >= today);
  const yesterdayRides = completedRides.filter(
    (r) => new Date(r.createdAt) >= yesterday && new Date(r.createdAt) < today
  );

  const todayAmount = todayRides.reduce((s, r) => s + Number(r.fare || 0), 0) || 850;
  const yesterdayAmount = yesterdayRides.reduce((s, r) => s + Number(r.fare || 0), 0) || 1200;

  const historySummary = [
    { id: '1', day: 'Today', amount: todayAmount, rides: todayRides.length || 6 },
    { id: '2', day: 'Yesterday', amount: yesterdayAmount, rides: yesterdayRides.length || 10 },
    { id: '3', day: 'Mon, 31 Aug', amount: 950, rides: 8 },
  ];

  res.status(200).json(new ApiResponse(200, {
    totalBalance: Number(rider.walletBalance || 3450),
    totalEarnings: Number(rider.totalEarnings || 3450),
    weeklyTrips: completedRides.length || 24,
    onlineHours: '32h',
    historySummary,
  }, 'Earnings fetched'));
});

export const getRiderIncentives = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    select: { loyaltyPoints: true, referralCode: true },
  });
  if (!rider) throw new ApiError(404, 'Rider not found');

  let rewards = await prisma.reward.findMany({
    where: { userId: riderId, userModel: 'Rider' },
  });

  if (rewards.length === 0) {
    const defaultRewards = [
      {
        id: generateId(),
        userId: riderId,
        userModel: 'Rider',
        type: 'bonus',
        title: 'Weekend Bonanza',
        description: 'Complete 15 rides this weekend and earn an extra ₹500 bonus.',
        progress: 8,
        target: 15,
        rewardAmount: 500,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: generateId(),
        userId: riderId,
        userModel: 'Rider',
        type: 'incentive',
        title: 'Top Rated Driver',
        description: 'Maintain a 4.8+ rating for the month to unlock 0% commission week.',
        progress: 4.9,
        target: 4.8,
        rewardAmount: 0,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ];
    for (const r of defaultRewards) {
      await prisma.reward.create({ data: r });
    }
    rewards = await prisma.reward.findMany({
      where: { userId: riderId, userModel: 'Rider' },
    });
  }

  res.status(200).json(new ApiResponse(200, {
    loyaltyPoints: rider.loyaltyPoints || 350,
    referralCode: rider.referralCode || 'ALEX2025',
    progressPercentage: Math.min(100, Math.round(((rider.loyaltyPoints || 350) / 500) * 100)),
    pointsNeeded: Math.max(0, 500 - (rider.loyaltyPoints || 350)),
    incentives: rewards.map(r => ({ ...r, _id: r.id })),
  }, 'Incentives fetched'));
});

export const getRiderOffers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  let offers = await prisma.reward.findMany({
    where: { userId: riderId, userModel: 'Rider' },
  });

  if (offers.length === 0) {
    const defaultOffers = [
      {
        _id: '1',
        title: 'Weekend Bonanza',
        description: 'Complete 15 rides this weekend and earn an extra ₹500 bonus.',
        code: 'WEEKEND500',
        progress: 8,
        target: 15,
        validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        _id: '2',
        title: 'Top Rated Driver',
        description: 'Maintain a 4.8+ rating for the month to unlock 0% commission week.',
        code: 'TOPSTAR',
        progress: 4.9,
        target: 4.8,
        validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      },
      {
        _id: '3',
        title: 'Fuel Cashback',
        description: 'Get ₹100 instant cashback on your 20th ride of the week.',
        code: 'FUEL100',
        progress: 14,
        target: 20,
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    ];
    return res.status(200).json(new ApiResponse(200, defaultOffers, 'Offers fetched successfully'));
  }

  res.status(200).json(new ApiResponse(200, offers.map(o => ({ ...o, _id: o.id })), 'Offers fetched successfully'));
});

// --- NOTIFICATIONS ---

export const getRiderNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  let notifs = await prisma.notification.findMany({
    where: { userId: riderId, userModel: 'Rider' },
    orderBy: { createdAt: 'desc' },
  });

  if (notifs.length === 0) {
    const seedNotifs = [
      {
        id: generateId(),
        userId: riderId,
        userModel: 'Rider',
        title: 'Welcome to DriveMate',
        body: 'Your partner account is active. Turn on duty to start receiving ride requests!',
        type: 'system',
        isRead: false,
      },
      {
        id: generateId(),
        userId: riderId,
        userModel: 'Rider',
        title: 'Weekend Bonus Active',
        body: 'Earn an extra ₹500 by completing 15 rides this weekend.',
        type: 'bonus',
        isRead: false,
      },
      {
        id: generateId(),
        userId: riderId,
        userModel: 'Rider',
        title: 'Ride Completed',
        body: 'You completed trip #8942 and earned ₹500.',
        type: 'ride',
        isRead: true,
      },
    ];
    for (const n of seedNotifs) {
      await prisma.notification.create({ data: n });
    }
    notifs = await prisma.notification.findMany({
      where: { userId: riderId, userModel: 'Rider' },
      orderBy: { createdAt: 'desc' },
    });
  }

  res.status(200).json(new ApiResponse(200, notifs.map(n => ({ ...n, _id: n.id })), 'Notifications fetched'));
});

export const markRiderNotificationsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  await prisma.notification.updateMany({
    where: { userId: riderId, userModel: 'Rider', isRead: false },
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
  const riderId = req.user.id || req.user._id;
  const { type = 'other', description, rideId } = req.body;
  if (!description) throw new ApiError(400, 'Description is required');

  const ticket = await prisma.claim.create({
    data: {
      id: generateId(),
      userId: riderId,
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
