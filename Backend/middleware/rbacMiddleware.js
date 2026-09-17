import { ApiError } from '../utils/ApiError.js';
import redisClient from '../config/redis.js';
import Admin from '../models/Admin.js';
import Role from '../models/Role.js';

// Get user's effective permissions (with caching)
export const getEffectivePermissions = async (userId) => {
  const cacheKey = `user_permissions:${userId}`;
  
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.error('Redis error:', err);
  }

  const admin = await Admin.findById(userId).populate('roles');
  if (!admin || !admin.isActive) return [];

  const permissions = new Set();
  
  // Aggregate permissions from all active roles
  for (const role of admin.roles) {
    if (role.status === 'Active') {
      role.permissions.forEach(p => permissions.add(p));
    }
  }

  const permissionsArray = Array.from(permissions);
  
  try {
    // Cache for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(permissionsArray));
  } catch (err) {
    console.error('Redis error on set:', err);
  }
  
  return permissionsArray;
};

// Middleware to enforce a specific permission
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Unauthorized access'));
      }

      const permissions = await getEffectivePermissions(req.user._id);
      
      // If no permissions, deny
      if (!permissions || permissions.length === 0) {
        return res.status(403).json({
          message: 'You do not have permission to perform this action.',
          requiredPermission: permission
        });
      }

      if (!permissions.includes(permission)) {
        return res.status(403).json({
          message: 'You do not have permission to perform this action.',
          requiredPermission: permission
        });
      }

      next();
    } catch (error) {
      next(new ApiError(500, 'Server error during authorization check'));
    }
  };
};

export const clearUserPermissionCache = async (userId) => {
  try {
    await redisClient.del(`user_permissions:${userId}`);
  } catch (err) {
    console.error('Redis del error:', err);
  }
};
