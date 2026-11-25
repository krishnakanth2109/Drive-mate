import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  startOnboarding,
  getOnboardingProgress,
  saveStepProgress,
  verifyDl,
  verifyAadhaar,
  verifyPan,
  verifyRc,
  submitOnboarding,
  getVerificationStatus,
  uploadDocumentImage,
  getStorageHealth,
} from '../controllers/driverOnboardingController.js';

const router = Router();

// Protect all driver onboarding routes with authenticated rider middleware
router.use(auth);

// 7-Step Wizard Flow
router.post('/start', startOnboarding);
router.get('/progress', getOnboardingProgress);
router.put('/step/:step', saveStepProgress);
router.post('/submit', submitOnboarding);

// Specialized Document Verification Endpoints
router.post('/dl', verifyDl);
router.post('/aadhaar', verifyAadhaar);
router.post('/pan', verifyPan);
router.post('/rc', verifyRc);
router.get('/status', getVerificationStatus);

// Direct Document Storage & Cloudinary Endpoints
router.post('/upload', uploadDocumentImage);
router.get('/storage-health', getStorageHealth);

export default router;

