import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from './auth.js';

export const adminAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return next(new ApiError(401, 'No token, authorization denied'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    const adminId = decoded.user?.id || decoded.user?._id;

    if (!adminId) {
      return next(new ApiError(401, 'Invalid token payload'));
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      include: {
        adminRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!admin || !admin.isActive) {
      return next(new ApiError(403, 'Admin account deactivated or not found'));
    }

    // Attach admin to req.user with compatibility aliases
    const roles = admin.adminRoles.map((ar) => ({
      ...ar.role,
      _id: ar.role.id,
    }));

    req.user = {
      ...admin,
      _id: admin.id,
      roles,
    };

    next();
  } catch (err: any) {
    next(new ApiError(401, 'Token is not valid'));
  }
};

export default adminAuth;
