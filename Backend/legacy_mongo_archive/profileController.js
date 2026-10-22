import Customer from '../models/Customer.js';
import PaymentMethod from '../models/PaymentMethod.js';
import Transaction from '../models/Transaction.js';
import Reward from '../models/Reward.js';
import Notification from '../models/Notification.js';
import Claim from '../models/Claim.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getPaymentMethods = asyncHandler(async (req, res) => {
  const methods = await PaymentMethod.find({ user: req.user.id });
  res.status(200).json(new ApiResponse(200, methods, 'Payment methods fetched successfully'));
});

export const addPaymentMethod = asyncHandler(async (req, res) => {
  const { type, provider, last4 } = req.body;
  const method = new PaymentMethod({ user: req.user.id, type, provider, last4 });
  await method.save();
  res.status(201).json(new ApiResponse(201, method, 'Payment method added successfully'));
});

export const getBalances = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.user.id).select('walletBalance coinBalance powerPass');
  if (!customer) throw new ApiError(404, 'Customer not found');
  res.status(200).json(new ApiResponse(200, customer, 'Balances fetched successfully'));
});

export const addWalletBalance = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const customer = await Customer.findById(req.user.id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  
  customer.walletBalance += Number(amount);
  await customer.save();

  const transaction = new Transaction({
    user: req.user.id, 
    type: 'credit', 
    amount: Number(amount), 
    currency: 'INR', 
    description: 'Wallet top-up'
  });
  await transaction.save();

  res.status(200).json(new ApiResponse(200, { balance: customer.walletBalance }, 'Added successfully'));
});

export const getTransactions = asyncHandler(async (req, res) => {
  const { currency } = req.query; 
  const query = { user: req.user.id };
  if (currency) query.currency = currency;
  
  const transactions = await Transaction.find(query).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, transactions, 'Transactions fetched successfully'));
});

export const getRewards = asyncHandler(async (req, res) => {
  const rewards = await Reward.find({ user: req.user.id });
  res.status(200).json(new ApiResponse(200, rewards, 'Rewards fetched successfully'));
});

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, notifications, 'Notifications fetched successfully'));
});

export const markNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
  res.status(200).json(new ApiResponse(200, null, 'All marked as read'));
});

export const getClaims = asyncHandler(async (req, res) => {
  const claims = await Claim.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, claims, 'Claims fetched successfully'));
});

export const addClaim = asyncHandler(async (req, res) => {
  const { type, description, rideId } = req.body;
  const claim = new Claim({ user: req.user.id, type, description, rideId });
  await claim.save();
  res.status(201).json(new ApiResponse(201, claim, 'Claim added successfully'));
});

export const subscribePowerPass = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.user.id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);
  
  customer.powerPass = {
    isActive: true,
    planName: 'Monthly Power Pass',
    validUntil
  };
  await customer.save();
  
  res.status(200).json(new ApiResponse(200, { powerPass: customer.powerPass }, 'Subscribed to Power Pass'));
});
