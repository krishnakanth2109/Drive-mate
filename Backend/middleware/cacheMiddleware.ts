import { Response, NextFunction } from 'express';
import redisClient from '../config/redis.js';
import { AuthenticatedRequest } from './auth.js';

export const cacheMiddleware = (duration: number = 60) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Construct unique cache key based on route path, query params, and optional user context
    const userId = req.user?.id || req.user?._id || '';
    const key = `cache:${req.originalUrl || req.url}${userId ? ':' + userId : ''}`;

    try {
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Engine', redisClient.isRealRedis ? 'Redis' : 'InMemory');
        return res.json(JSON.parse(cachedResponse));
      }

      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Engine', redisClient.isRealRedis ? 'Redis' : 'InMemory');

      // Intercept res.json to capture response body and store in cache
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // Only cache successful 2xx responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient
            .setEx(key, duration, JSON.stringify(body))
            .catch((err: any) => console.error('[CacheMiddleware] SETEX error:', err));
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('[CacheMiddleware] Error:', error);
      next();
    }
  };
};

/**
 * Invalidate cached routes matching a given wildcard pattern
 * Example: invalidateRouteCache('/api/rider/offers*')
 */
export const invalidateRouteCache = async (routePattern: string): Promise<number> => {
  try {
    const cleanPattern = routePattern.startsWith('cache:') ? routePattern : `cache:${routePattern}`;
    const keys = await redisClient.keys(cleanPattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return keys.length;
  } catch (err) {
    console.error('[CacheMiddleware] Invalidation error:', err);
    return 0;
  }
};

export default cacheMiddleware;
