import express from 'express';
import auth from '../middleware/auth.js';
import { estimateRide, createRide, acceptRide, updateRideStatus, cancelRide } from '../controllers/rideController.js';

const router = express.Router();

router.post('/estimate', auth, estimateRide);
router.post('/create', auth, createRide);
router.put('/accept', auth, acceptRide);
router.put('/update-status', auth, updateRideStatus);
router.put('/cancel', auth, cancelRide);

export default router;