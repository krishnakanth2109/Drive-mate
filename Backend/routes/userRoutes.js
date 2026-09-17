import express from 'express';
import auth from '../middleware/auth.js';
import {
  riderRegister,
  riderLogin,
  customerRegister,
  customerLogin,
  updateLocation,
  setOffline,
  getNearbyRiders
} from '../controllers/userController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

router.post('/rider/register', riderRegister);
router.post('/rider/login', riderLogin);

router.post('/customer/register', customerRegister);
router.post('/customer/login', customerLogin);

router.put('/location', auth, updateLocation);
router.put('/offline', auth, setOffline);
router.get('/nearby', auth, cacheMiddleware(10), getNearbyRiders);

export default router;