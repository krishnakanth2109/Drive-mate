import { Response, NextFunction } from 'express';
import redisClient from '../config/redis.js';
import { AuthenticatedRequest } from './auth.js';

export const cacheMiddleware = (duration: number = 60) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Use URL + user ID (if available) to construct a unique cache key
    const userId = req.user?.id || req.user?._id || '';
    const key = `cache:${req.originalUrl || req.url}${userId ? ':' + userId : ''}`;

    try {
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      } else {
        // Override res.json to capture response body and cache it
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
          redisClient
            .setEx(key, duration, JSON.stringify(body))
            .catch((err: any) => console.error('Redis SETEX error:', err));

          return originalJson(body);
        };
        next();
      }
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

export default cacheMiddleware;
