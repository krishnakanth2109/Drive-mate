import { Router } from 'express';
import auth from '../middleware/auth.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimitMiddleware.js';
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
router.post('/register/send-otp', otpLimiter, sendVerificationOtp);
router.post('/register/verify-and-register', authLimiter, verifyAndRegister);

// User / Commuter Login
router.post('/login', authLimiter, customerAuthLogin);

// Firebase Google Login
router.post('/google', authLimiter, googleAuthLogin);
router.post('/firebase-login', authLimiter, googleAuthLogin);

// Password Management (Forgot / Reset / Change)
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', otpLimiter, resetPasswordWithOtp);
router.post('/change-password', auth, changePassword);

// Commuter Profile
router.get('/me', auth, getMyProfile);
router.put('/profile', auth, updateMyProfile);

export default router;
