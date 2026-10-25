import { Router } from 'express';
import {
  getCityZones,
  updateZoneSurge,
  getIncentiveBroadcasts,
  createIncentiveBroadcast,
  getOperationsMetrics,
} from '../controllers/operationsController.js';

const router = Router();

// Metrics & Dispatch Overview
router.get('/metrics', getOperationsMetrics);

// City Zones & Surge Management
router.get('/zones', getCityZones);
router.patch('/zones/:id/surge', updateZoneSurge);

// Driver Incentive Broadcasts
router.get('/broadcasts', getIncentiveBroadcasts);
router.post('/broadcasts', createIncentiveBroadcast);

export default router;
