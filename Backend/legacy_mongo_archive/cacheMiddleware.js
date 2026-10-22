import redisClient from '../config/redis.js';

export const cacheMiddleware = (duration = 60) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Use URL + user ID (if available) to construct a unique cache key
    const key = `cache:${req.originalUrl || req.url}${req.user ? ':' + req.user.id : ''}`;

    try {
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        console.log(`Cache hit for key: ${key}`);
        return res.json(JSON.parse(cachedResponse));
      } else {
        console.log(`Cache miss for key: ${key}`);
        // Override res.json to capture the response body and cache it
        const originalJson = res.json.bind(res);
        res.json = (body) => {
          // Fire and forget caching
          redisClient.setEx(key, duration, JSON.stringify(body))
            .catch(err => console.error('Redis SETEX error:', err));
          
          return originalJson(body);
        };
        next();
      }
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Fallback to calling next() on error
      next();
    }
  };
};
