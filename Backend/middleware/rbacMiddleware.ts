import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import redisClient from '../config/redis.js';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from './auth.js';

// Get user's effective permissions (with caching)
export const getEffectivePermissions = async (userId: string): Promise<string[]> => {
  const cacheKey = `user_permissions:${userId}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.error('Redis error:', err);
  }

  const admin = await prisma.admin.findUnique({
    where: { id: userId },
    include: {
      adminRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!admin || !admin.isActive) return [];

  const permissions = new Set<string>();

  // Aggregate permissions from all active roles
  for (const ar of admin.adminRoles) {
    if (ar.role.status === 'Active') {
      ar.role.permissions.forEach((p) => permissions.add(p));
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
export const requirePermission = (permission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Unauthorized access'));
      }

      const userId = req.user.id || req.user._id;
      const permissions = await getEffectivePermissions(userId);

      // If no permissions, deny
      if (!permissions || permissions.length === 0 || !permissions.includes(permission)) {
        return res.status(403).json({
          message: 'You do not have permission to perform this action.',
          requiredPermission: permission,
        });
      }

      next();
    } catch (error) {
      next(new ApiError(500, 'Server error during authorization check'));
    }
  };
};

export const clearUserPermissionCache = async (userId: string): Promise<void> => {
  try {
    await redisClient.del(`user_permissions:${userId}`);
  } catch (err) {
    console.error('Redis del error:', err);
  }
};

export default {
  getEffectivePermissions,
  requirePermission,
  clearUserPermissionCache,
};
