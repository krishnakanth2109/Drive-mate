import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface AuthenticatedUser {
  id: string;
  role: string;
  _id?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: any;
  io?: any;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token = req.header('x-auth-token');
  if (!token) {
    const authHeader = req.header('Authorization') || req.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    req.user = decoded.user || decoded;
    if (req.user && req.user.id && !req.user._id) {
      req.user._id = req.user.id;
    }
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

export default authMiddleware;
