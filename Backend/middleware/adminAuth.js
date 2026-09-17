import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import Admin from '../models/Admin.js';

export const adminAuth = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return next(new ApiError(401, 'No token, authorization denied'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('adminAuth decoded:', decoded);
    
    // We need to fetch the admin to make sure they are still active
    // and have their current roles populated if needed
    const admin = await Admin.findById(decoded.user.id || decoded.user._id).select('-password');
    
    if (!admin || !admin.isActive) {
      console.log('adminAuth failed: admin not found or inactive. decoded id:', decoded.user?.id);
      return next(new ApiError(403, 'Admin account deactivated or not found'));
    }

    req.user = admin;
    next();
  } catch (err) {
    console.log('adminAuth failed: Token is not valid', err.message);
    next(new ApiError(401, 'Token is not valid'));
  }
};
