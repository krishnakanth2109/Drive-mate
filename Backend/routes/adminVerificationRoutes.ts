import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  listDriverRegistrations,
  getDriverRegistrationDetails,
  listDocumentsByType,
  getPendingReviewsQueue,
  approveDocument,
  rejectDocument,
  requestDocumentReupload,
  retryDocumentVerification,
  getSecureDocumentFile,
} from '../controllers/adminVerificationController.js';

const router = Router();

// Master Admin & Fleet Operations Authorization
router.use(auth);

// Driver Registrations Management
router.get('/driver-verifications', listDriverRegistrations);
router.get('/driver-verifications/:driverId', getDriverRegistrationDetails);

// Document-specific Review Streams
router.get('/documents/by-type/:type', listDocumentsByType);
router.get('/verifications/pending', getPendingReviewsQueue);
router.get('/documents/:documentId/file', getSecureDocumentFile);

// Document Decision Actions
router.post('/documents/:documentId/approve', approveDocument);
router.post('/documents/:documentId/reject', rejectDocument);
router.post('/documents/:documentId/request-reupload', requestDocumentReupload);
router.post('/documents/:documentId/retry-verification', retryDocumentVerification);

export default router;
