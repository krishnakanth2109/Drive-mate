import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  sendVerificationOtp,
  verifyAndRegister,
  customerAuthLogin,
  googleAuthLogin,
  getMyProfile,
  updateMyProfile,
  changePassword,
  forgotPassword,
  resetPasswordWithOtp,
} from '../controllers/communityAuthController.js';

const router = Router();

// 7-Step Registration Routes
router.post('/register/send-otp', sendVerificationOtp);
router.post('/register/verify-and-register', verifyAndRegister);

// User / Commuter Login
router.post('/login', customerAuthLogin);

// Firebase Google Login
router.post('/google', googleAuthLogin);
router.post('/firebase-login', googleAuthLogin);

// Password Management (Forgot / Reset / Change)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordWithOtp);
router.post('/change-password', auth, changePassword);

// Commuter Profile
router.get('/me', auth, getMyProfile);
router.put('/profile', auth, updateMyProfile);

export default router;
