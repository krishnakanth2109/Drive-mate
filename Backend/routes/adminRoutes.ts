import express, { Router } from 'express';
import {
  adminLogin,
  getAdminsList,
  createAdmin,
  getStats,
  getRecentRides,
} from '../controllers/adminController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router: Router = express.Router();

router.post('/login', adminLogin);
router.get('/list', adminAuth, getAdminsList);
router.post('/create', adminAuth, createAdmin);
router.get('/stats', adminAuth, getStats);
router.get('/recent-rides', adminAuth, getRecentRides);

export default router;
