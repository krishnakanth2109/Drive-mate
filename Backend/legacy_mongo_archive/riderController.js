import bcrypt from 'bcryptjs';
import Rider from '../models/Rider.js';
import Ride from '../models/Ride.js';
import Transaction from '../models/Transaction.js';
import PaymentMethod from '../models/PaymentMethod.js';
import Notification from '../models/Notification.js';
import Reward from '../models/Reward.js';
import Claim from '../models/Claim.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// --- PROFILE & VEHICLE & DOCUMENTS & PREFERENCES ---

export const getRiderProfile = asyncHandler(async (req, res) => {
  const rider = await Rider.findById(req.user.id).select('-password');
  if (!rider) throw new ApiError(404, 'Rider not found');

  // Calculate today's earnings from completed rides
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayRides = await Ride.find({
    rider: req.user.id,
    status: 'completed',
    updatedAt: { $gte: todayStart }
  });

  const todayEarnings = todayRides.reduce((sum, r) => sum + (r.fare || 0), 0);
  const totalRidesCount = await Ride.countDocuments({ rider: req.user.id, status: 'completed' });

  const responseData = {
    ...rider.toObject(),
    todayEarnings: todayEarnings > 0 ? todayEarnings : 850, // default if fresh
    totalRides: totalRidesCount > 0 ? totalRidesCount : (rider.totalRides || 24),
  };

  res.status(200).json(new ApiResponse(200, responseData, 'Rider profile fetched'));
});

export const updateRiderProfile = asyncHandler(async (req, res) => {
  const { name, phone, vehicleType } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (vehicleType) updates.vehicleType = vehicleType;

  const rider = await Rider.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select('-password');
  if (!rider) throw new ApiError(404, 'Rider not found');

  res.status(200).json(new ApiResponse(200, rider, 'Rider profile updated'));
});

export const getRiderVehicle = asyncHandler(async (req, res) => {
  const rider = await Rider.findById(req.user.id).select('vehicle vehicleType');
  if (!rider) throw new ApiError(404, 'Rider not found');

  res.status(200).json(new ApiResponse(200, {
    ...rider.vehicle,
    vehicleType: rider.vehicleType
  }, 'Vehicle details fetched'));
});

export const updateRiderVehicle = asyncHandler(async (req, res) => {
  const { model, plate, year, color, vehicleType, insuranceExpiry, pollutionStatus } = req.body;

  const updateFields = {};
  if (model) updateFields['vehicle.model'] = model;
  if (plate) updateFields['vehicle.plate'] = plate;
  if (year) updateFields['vehicle.year'] = year;
  if (color) updateFields['vehicle.color'] = color;
  if (insuranceExpiry) updateFields['vehicle.insuranceExpiry'] = insuranceExpiry;
  if (pollutionStatus) updateFields['vehicle.pollutionStatus'] = pollutionStatus;
  if (vehicleType) updateFields.vehicleType = vehicleType;

  const rider = await Rider.findByIdAndUpdate(req.user.id, { $set: updateFields }, { new: true }).select('vehicle vehicleType');
  if (!rider) throw new ApiError(404, 'Rider not found');

  res.status(200).json(new ApiResponse(200, {
    ...rider.vehicle,
    vehicleType: rider.vehicleType
  }, 'Vehicle updated successfully'));
});

export const getRiderDocuments = asyncHandler(async (req, res) => {
  const rider = await Rider.findById(req.user.id).select('documents');
  if (!rider) throw new ApiError(404, 'Rider not found');

  res.status(200).json(new ApiResponse(200, rider.documents || [], 'Documents fetched'));
});

export const updateRiderDocument = asyncHandler(async (req, res) => {
  const { id, documentNumber, status } = req.body;
  const rider = await Rider.findById(req.user.id);
  if (!rider) throw new ApiError(404, 'Rider not found');

  let docIndex = rider.documents.findIndex(d => d.id === id);
  if (docIndex >= 0) {
    if (documentNumber !== undefined) rider.documents[docIndex].documentNumber = documentNumber;
    if (status !== undefined) rider.documents[docIndex].status = status;
    rider.documents[docIndex].verifiedAt = new Date();
  } else {
    rider.documents.push({
      id: id || Date.now().toString(),
      title: req.body.title || 'Document',
      documentNumber: documentNumber || '',
      status: status || 'Pending Review',
      verifiedAt: new Date()
    });
  }

  await rider.save();
  res.status(200).json(new ApiResponse(200, rider.documents, 'Document updated successfully'));
});

export const getRiderSettings = asyncHandler(async (req, res) => {
  const rider = await Rider.findById(req.user.id).select('preferences');
  if (!rider) throw new ApiError(404, 'Rider not found');

  res.status(200).json(new ApiResponse(200, rider.preferences || {
    autoAccept: false,
    darkMode: false,
    navigationApp: 'Google Maps'
  }, 'Settings fetched'));
});

export const updateRiderSettings = asyncHandler(async (req, res) => {
  const { autoAccept, darkMode, navigationApp } = req.body;
  const updates = {};
  if (autoAccept !== undefined) updates['preferences.autoAccept'] = autoAccept;
  if (darkMode !== undefined) updates['preferences.darkMode'] = darkMode;
  if (navigationApp !== undefined) updates['preferences.navigationApp'] = navigationApp;

  const rider = await Rider.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select('preferences');
  if (!rider) throw new ApiError(404, 'Rider not found');

  res.status(200).json(new ApiResponse(200, rider.preferences, 'Settings updated'));
});

export const optInOutstation = asyncHandler(async (req, res) => {
  const { optIn = true } = req.body;
  const rider = await Rider.findByIdAndUpdate(
    req.user.id,
    { $set: { 'preferences.outstationOptIn': optIn } },
    { new: true }
  ).select('preferences');

  res.status(200).json(new ApiResponse(200, rider.preferences, `Outstation opt-in ${optIn ? 'activated' : 'deactivated'}`));
});

// --- WALLET, PAYOUTS & TRANSACTIONS ---

export const getRiderWallet = asyncHandler(async (req, res) => {
  const rider = await Rider.findById(req.user.id).select('walletBalance totalEarnings');
  if (!rider) throw new ApiError(404, 'Rider not found');

  // Find linked accounts
  let linkedAccounts = await PaymentMethod.find({ user: req.user.id, userModel: 'Rider' });
  if (linkedAccounts.length === 0) {
    // Seed default bank account
    const defaultAcc = new PaymentMethod({
      user: req.user.id,
      userModel: 'Rider',
      type: 'Bank Account',
      provider: 'Chase Checking',
      last4: '8912',
      isDefault: true
    });
    await defaultAcc.save();
    linkedAccounts = [defaultAcc];
  }

  // Find recent transactions
  let transactions = await Transaction.find({ user: req.user.id, userModel: 'Rider' }).sort({ createdAt: -1 }).limit(10);
  if (transactions.length === 0) {
    // Seed sample initial transactions
    const initialTxs = [
      { user: req.user.id, userModel: 'Rider', type: 'credit', amount: 850, currency: 'INR', description: 'Ride Earnings - Trip #8942' },
      { user: req.user.id, userModel: 'Rider', type: 'debit', amount: 500, currency: 'INR', description: 'Payout to Bank' },
      { user: req.user.id, userModel: 'Rider', type: 'credit', amount: 500, currency: 'INR', description: 'Weekly Bonus' },
    ];
    await Transaction.insertMany(initialTxs);
    transactions = await Transaction.find({ user: req.user.id, userModel: 'Rider' }).sort({ createdAt: -1 });
  }

  res.status(200).json(new ApiResponse(200, {
    balance: rider.walletBalance || 3450,
    totalEarnings: rider.totalEarnings || 3450,
    linkedAccounts,
    transactions
  }, 'Wallet details fetched'));
});

export const requestPayout = asyncHandler(async (req, res) => {
  const { amount = 500, accountId } = req.body;
  const rider = await Rider.findById(req.user.id);
  if (!rider) throw new ApiError(404, 'Rider not found');

  const payoutAmount = Number(amount);
  if (payoutAmount <= 0) throw new ApiError(400, 'Invalid payout amount');
  if ((rider.walletBalance || 0) < payoutAmount) {
    throw new ApiError(400, 'Insufficient wallet balance for this payout');
  }

  rider.walletBalance -= payoutAmount;
  await rider.save();

  // Create debit transaction
  const tx = new Transaction({
    user: req.user.id,
    userModel: 'Rider',
    type: 'debit',
    amount: payoutAmount,
    currency: 'INR',
    description: `Payout to Bank (${accountId ? 'Account ' + accountId : 'Primary Account'})`
  });
  await tx.save();

  // Create notification
  const notif = new Notification({
    user: req.user.id,
    userModel: 'Rider',
    title: 'Payout Processed',
    body: `₹${payoutAmount} has been transferred to your bank account.`,
    type: 'payout'
  });
  await notif.save();

  res.status(200).json(new ApiResponse(200, {
    newBalance: rider.walletBalance,
    transaction: tx
  }, 'Payout processed successfully'));
});

export const linkPaymentAccount = asyncHandler(async (req, res) => {
  const { provider, type = 'Bank Account', last4, accountNumber, ifscOrRouting } = req.body;
  if (!provider) throw new ApiError(400, 'Bank or provider name is required');

  const newMethod = new PaymentMethod({
    user: req.user.id,
    userModel: 'Rider',
    type,
    provider,
    last4: last4 || (accountNumber ? accountNumber.slice(-4) : '0000'),
    accountNumber,
    ifscOrRouting,
    isDefault: false
  });
  await newMethod.save();

  res.status(201).json(new ApiResponse(201, newMethod, 'Account linked successfully'));
});

// --- EARNINGS & INCENTIVES & OFFERS ---

export const getRiderEarnings = asyncHandler(async (req, res) => {
  const rider = await Rider.findById(req.user.id).select('walletBalance totalEarnings totalRides');
  if (!rider) throw new ApiError(404, 'Rider not found');

  // Daily breakdown
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const completedRides = await Ride.find({
    rider: req.user.id,
    status: 'completed'
  }).sort({ createdAt: -1 });

  const todayRides = completedRides.filter(r => new Date(r.createdAt) >= today);
  const yesterdayRides = completedRides.filter(r => new Date(r.createdAt) >= yesterday && new Date(r.createdAt) < today);

  const todayAmount = todayRides.reduce((s, r) => s + (r.fare || 0), 0) || 850;
  const yesterdayAmount = yesterdayRides.reduce((s, r) => s + (r.fare || 0), 0) || 1200;

  const historySummary = [
    { id: '1', day: 'Today', amount: todayAmount, rides: todayRides.length || 6 },
    { id: '2', day: 'Yesterday', amount: yesterdayAmount, rides: yesterdayRides.length || 10 },
    { id: '3', day: 'Mon, 31 Aug', amount: 950, rides: 8 },
  ];

  res.status(200).json(new ApiResponse(200, {
    totalBalance: rider.walletBalance || 3450,
    totalEarnings: rider.totalEarnings || 3450,
    weeklyTrips: completedRides.length || 24,
    onlineHours: '32h',
    historySummary
  }, 'Earnings fetched'));
});

export const getRiderIncentives = asyncHandler(async (req, res) => {
  const rider = await Rider.findById(req.user.id).select('loyaltyPoints referralCode');
  if (!rider) throw new ApiError(404, 'Rider not found');

  // Query rewards/incentives
  let rewards = await Reward.find({ user: req.user.id, userModel: 'Rider' });
  if (rewards.length === 0) {
    const defaultRewards = [
      {
        user: req.user.id,
        userModel: 'Rider',
        type: 'bonus',
        title: 'Weekend Bonanza',
        description: 'Complete 15 rides this weekend and earn an extra ₹500 bonus.',
        progress: 8,
        target: 15,
        rewardAmount: 500,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        user: req.user.id,
        userModel: 'Rider',
        type: 'incentive',
        title: 'Top Rated Driver',
        description: 'Maintain a 4.8+ rating for the month to unlock 0% commission week.',
        progress: 4.9,
        target: 4.8,
        rewardAmount: 0,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    ];
    await Reward.insertMany(defaultRewards);
    rewards = await Reward.find({ user: req.user.id, userModel: 'Rider' });
  }

  res.status(200).json(new ApiResponse(200, {
    loyaltyPoints: rider.loyaltyPoints || 350,
    referralCode: rider.referralCode || 'ALEX2025',
    progressPercentage: Math.min(100, Math.round(((rider.loyaltyPoints || 350) / 500) * 100)),
    pointsNeeded: Math.max(0, 500 - (rider.loyaltyPoints || 350)),
    incentives: rewards
  }, 'Incentives fetched'));
});

export const getRiderOffers = asyncHandler(async (req, res) => {
  let offers = await Reward.find({ user: req.user.id, userModel: 'Rider' });
  if (offers.length === 0) {
    offers = [
      {
        _id: '1',
        title: 'Weekend Bonanza',
        description: 'Complete 15 rides this weekend and earn an extra ₹500 bonus.',
        code: 'WEEKEND500',
        progress: 8,
        target: 15,
        validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      {
        _id: '2',
        title: 'Top Rated Driver',
        description: 'Maintain a 4.8+ rating for the month to unlock 0% commission week.',
        code: 'TOPSTAR',
        progress: 4.9,
        target: 4.8,
        validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
      },
      {
        _id: '3',
        title: 'Fuel Cashback',
        description: 'Get ₹100 instant cashback on your 20th ride of the week.',
        code: 'FUEL100',
        progress: 14,
        target: 20,
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  res.status(200).json(new ApiResponse(200, offers, 'Offers fetched successfully'));
});

// --- NOTIFICATIONS ---

export const getRiderNotifications = asyncHandler(async (req, res) => {
  let notifs = await Notification.find({ user: req.user.id, userModel: 'Rider' }).sort({ createdAt: -1 });

  if (notifs.length === 0) {
    const seedNotifs = [
      {
        user: req.user.id,
        userModel: 'Rider',
        title: 'Welcome to DriveMate',
        body: 'Your partner account is active. Turn on duty to start receiving ride requests!',
        type: 'system',
        isRead: false
      },
      {
        user: req.user.id,
        userModel: 'Rider',
        title: 'Weekend Bonus Active',
        body: 'Earn an extra ₹500 by completing 15 rides this weekend.',
        type: 'bonus',
        isRead: false
      },
      {
        user: req.user.id,
        userModel: 'Rider',
        title: 'Ride Completed',
        body: 'You completed trip #8942 and earned ₹500.',
        type: 'ride',
        isRead: true
      }
    ];
    await Notification.insertMany(seedNotifs);
    notifs = await Notification.find({ user: req.user.id, userModel: 'Rider' }).sort({ createdAt: -1 });
  }

  res.status(200).json(new ApiResponse(200, notifs, 'Notifications fetched'));
});

export const markRiderNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, userModel: 'Rider', isRead: false }, { isRead: true });
  res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});

// --- SUPPORT, FAQS & TICKETS ---

export const getDriverFaqs = asyncHandler(async (req, res) => {
  const faqs = [
    {
      id: '1',
      question: 'When will I receive my payout?',
      answer: 'Earnings are transferred directly to your linked bank account every Monday. Instant payouts are also available in My Wallet.'
    },
    {
      id: '2',
      question: 'Customer refused to pay or cancellation fee',
      answer: 'If a customer cancels after 3 minutes or refuses cash payment, raise a dispute from Trip Help or the Support screen.'
    },
    {
      id: '3',
      question: 'How do incentives work?',
      answer: 'Complete the target number of trips within the promotional window to earn cash bonuses deposited directly into your wallet.'
    },
    {
      id: '4',
      question: 'My account is suspended or documents rejected',
      answer: 'Ensure all uploaded documents are clear and valid. You can re-upload your Driving License or RC Book under Documents.'
    },
    {
      id: '5',
      question: 'How do waiting charges calculate?',
      answer: 'Waiting charges of ₹2/min apply automatically if waiting exceeds 3 minutes at the customer pickup location.'
    }
  ];

  res.status(200).json(new ApiResponse(200, faqs, 'Driver FAQs fetched'));
});

export const raiseTicket = asyncHandler(async (req, res) => {
  const { type = 'other', description, rideId } = req.body;
  if (!description) throw new ApiError(400, 'Description is required');

  const ticket = new Claim({
    user: req.user.id,
    userModel: 'Rider',
    type,
    description,
    rideId: rideId || null,
    status: 'open'
  });
  await ticket.save();

  res.status(201).json(new ApiResponse(201, ticket, 'Ticket raised successfully'));
});

export const getRiderTickets = asyncHandler(async (req, res) => {
  const tickets = await Claim.find({ user: req.user.id, userModel: 'Rider' }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, tickets, 'Tickets fetched'));
});

// --- AUTHENTICATION (PASSWORD RECOVERY) ---

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email address is required');

  const rider = await Rider.findOne({ email: email.toLowerCase().trim() });
  if (!rider) throw new ApiError(404, 'No rider account found with this email');

  // Generate 4 digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  rider.resetOtp = otp;
  rider.resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  await rider.save();

  console.log(`[AUTH] Reset OTP for ${rider.email}: ${otp}`);

  res.status(200).json(new ApiResponse(200, { email: rider.email, demoOtp: otp }, 'Verification code sent to your email'));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, 'Email and OTP are required');

  const rider = await Rider.findOne({ email: email.toLowerCase().trim() });
  if (!rider) throw new ApiError(404, 'Rider not found');

  if (!rider.resetOtp || rider.resetOtp !== otp.trim()) {
    throw new ApiError(400, 'Invalid or incorrect verification code');
  }

  if (new Date() > new Date(rider.resetOtpExpires)) {
    throw new ApiError(400, 'Verification code has expired. Please request a new one.');
  }

  res.status(200).json(new ApiResponse(200, { verified: true }, 'Code verified successfully'));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and new password are required');

  const rider = await Rider.findOne({ email: email.toLowerCase().trim() });
  if (!rider) throw new ApiError(404, 'Rider not found');

  const salt = await bcrypt.genSalt(10);
  rider.password = await bcrypt.hash(password, salt);
  rider.resetOtp = null;
  rider.resetOtpExpires = null;
  await rider.save();

  res.status(200).json(new ApiResponse(200, null, 'Password reset successful. Please login.'));
});
