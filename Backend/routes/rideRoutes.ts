import express, { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  autocomplete,
  getPlaceDetailsById,
  reverseGeocode,
  getSurgeStatus,
  estimateRide,
  createRide,
  acceptRide,
  arriveAtPickupEndpoint,
  arriveAtDropEndpoint,
  updateRideStatus,
  cancelRide,
  getRiderHistory,
  getRiderActiveRide,
  getCustomerHistory,
  getCustomerActiveRide,
  getRideById,
  rateRide,
  getRideWaitTime,
} from '../controllers/rideController.js';

const router: Router = express.Router();

// Places & Geocoding
router.get('/autocomplete', auth, autocomplete);
router.get('/place-details', auth, getPlaceDetailsById);
router.get('/reverse-geocode', auth, reverseGeocode);
router.get('/surge-status', auth, getSurgeStatus);

// Wait Time
router.get('/wait-time/:id', auth, getRideWaitTime);
router.get('/:id/wait-time', auth, getRideWaitTime);

// Ride booking & lifecycle
router.post('/estimate', auth, estimateRide);
router.post('/create', auth, createRide);
router.put('/accept', auth, acceptRide);
router.post('/:id/arrive-pickup', auth, arriveAtPickupEndpoint);
router.post('/:id/arrive-drop', auth, arriveAtDropEndpoint);
router.put('/update-status', auth, updateRideStatus);
router.put('/cancel', auth, cancelRide);

// Rider & Customer ride queries (registered before /:id wildcard)
router.get('/rider/history', auth, getRiderHistory);
router.get('/rider/active', auth, getRiderActiveRide);
router.get('/customer/history', auth, getCustomerHistory);
router.get('/customer/active', auth, getCustomerActiveRide);
router.post('/:id/rate', auth, rateRide);
router.get('/:id', auth, getRideById);

export default router;
