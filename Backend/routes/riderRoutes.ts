import express, { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  getRiderProfile,
  updateRiderProfile,
  getRiderVehicle,
  updateRiderVehicle,
  getRiderDocuments,
  updateRiderDocument,
  getRiderSettings,
  updateRiderSettings,
  optInOutstation,
  getRiderWallet,
  requestPayout,
  linkPaymentAccount,
  getRiderEarnings,
  getRiderIncentives,
  getRiderOffers,
  getRiderNotifications,
  markRiderNotificationsRead,
  getDriverFaqs,
  raiseTicket,
  getRiderTickets,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/riderController.js';

const router: Router = express.Router();

// --- Public Auth Routes ---
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/reset-password', resetPassword);
router.get('/support/faqs', getDriverFaqs);

// --- Protected Rider Routes ---
router.use(auth);

// Profile
router.get('/profile', getRiderProfile);
router.put('/profile', updateRiderProfile);

// Vehicle
router.get('/vehicle', getRiderVehicle);
router.put('/vehicle', updateRiderVehicle);

// Documents
router.get('/documents', getRiderDocuments);
router.put('/documents', updateRiderDocument);

// Settings & Preferences
router.get('/settings', getRiderSettings);
router.put('/settings', updateRiderSettings);
router.post('/outstation', optInOutstation);

// Wallet & Payout
router.get('/wallet', getRiderWallet);
router.post('/wallet/payout', requestPayout);
router.post('/wallet/link-account', linkPaymentAccount);

// Earnings, Incentives & Offers
router.get('/earnings', getRiderEarnings);
router.get('/incentives', getRiderIncentives);
router.get('/offers', getRiderOffers);

// Notifications
router.get('/notifications', getRiderNotifications);
router.put('/notifications/mark-read', markRiderNotificationsRead);

// Support & Tickets
router.post('/support/ticket', raiseTicket);
router.get('/support/tickets', getRiderTickets);

export default router;
