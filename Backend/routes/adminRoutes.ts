import express, { Router } from 'express';
import {
  adminLogin,
  getAdminsList,
  createAdmin,
  getStats,
  getRecentRides,
  getCustomersList,
  getDriversList,
} from '../controllers/adminController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router: Router = express.Router();

router.post('/login', adminLogin);
router.get('/list', adminAuth, getAdminsList);
router.post('/create', adminAuth, createAdmin);
router.get('/stats', getStats);
router.get('/recent-rides', getRecentRides);
router.get('/customers', getCustomersList);
router.get('/drivers', getDriversList);

export default router;
