import express, { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  autocomplete,
  getPlaceDetailsById,
  reverseGeocode,
  estimateRide,
  createRide,
  acceptRide,
  updateRideStatus,
  cancelRide,
  getRiderHistory,
  getRiderActiveRide,
  getRideById,
  getRideWaitTime,
} from '../controllers/rideController.js';

const router: Router = express.Router();

// Places & Geocoding
router.get('/autocomplete', auth, autocomplete);
router.get('/place-details', auth, getPlaceDetailsById);
router.get('/reverse-geocode', auth, reverseGeocode);

// Wait Time
router.get('/wait-time/:id', auth, getRideWaitTime);
router.get('/:id/wait-time', auth, getRideWaitTime);

// Ride booking & lifecycle
router.post('/estimate', auth, estimateRide);
router.post('/create', auth, createRide);
router.put('/accept', auth, acceptRide);
router.put('/update-status', auth, updateRideStatus);
router.put('/cancel', auth, cancelRide);

// Rider ride queries
router.get('/rider/history', auth, getRiderHistory);
router.get('/rider/active', auth, getRiderActiveRide);
router.get('/:id', auth, getRideById);

export default router;
