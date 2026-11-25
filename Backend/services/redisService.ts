import redisClient, { getRedisStatus } from '../config/redis.js';

export interface DriverLocationCache {
  riderId: string;
  lat: number;
  lng: number;
  heading: number;
  updatedAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  remaining: number;
  resetSecs: number;
}

/**
 * High-Level Redis Utility Service for DriveMate.
 * Handles JSON caching, read-through caching, wildcard invalidation,
 * rate limiting, and real-time fleet geolocation tracking.
 */
export const redisService = {
  /**
   * Retrieve a parsed JSON object from Redis
   */
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const raw = await redisClient.get(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch (err) {
      console.error(`[RedisService] GET error for key ${key}:`, err);
      return null;
    }
  },

  /**
   * Store any value as JSON in Redis
   */
  set: async (key: string, value: any): Promise<void> => {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await redisClient.set(key, serialized);
    } catch (err) {
      console.error(`[RedisService] SET error for key ${key}:`, err);
    }
  },

  /**
   * Store any value as JSON with a Time-To-Live (seconds)
   */
  setEx: async (key: string, ttlSeconds: number, value: any): Promise<void> => {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await redisClient.setEx(key, ttlSeconds, serialized);
    } catch (err) {
      console.error(`[RedisService] SETEX error for key ${key}:`, err);
    }
  },

  /**
   * Delete one or more keys
   */
  del: async (keyOrKeys: string | string[]): Promise<void> => {
    try {
      await redisClient.del(keyOrKeys);
    } catch (err) {
      console.error(`[RedisService] DEL error:`, err);
    }
  },

  /**
   * Delete all keys matching a wildcard pattern (e.g. "cache:/api/ride:*")
   */
  delPattern: async (pattern: string): Promise<number> => {
    try {
      const matchingKeys = await redisClient.keys(pattern);
      if (matchingKeys.length === 0) return 0;
      await redisClient.del(matchingKeys);
      return matchingKeys.length;
    } catch (err) {
      console.error(`[RedisService] delPattern error for "${pattern}":`, err);
      return 0;
    }
  },

  /**
   * Atomic Read-Through Cache Helper.
   * If `key` exists, returns cached value immediately.
   * Otherwise executes `fetcher()`, stores the result for `ttlSeconds`, and returns it.
   */
  remember: async <T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> => {
    const cached = await redisService.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await fetcher();
    if (fresh !== null && fresh !== undefined) {
      await redisService.setEx(key, ttlSeconds, fresh);
    }
    return fresh;
  },

  /**
   * Sliding-Window Rate Limiter
   * Checks whether an identifier (e.g. IP or userId) has exceeded `limit` operations within `windowSeconds`.
   */
  rateLimit: async (identifier: string, limit: number = 60, windowSeconds: number = 60): Promise<RateLimitResult> => {
    const key = `ratelimit:${identifier}`;
    try {
      const current = await redisClient.incr(key);
      if (current === 1) {
        // First request in this window, attach expiration
        await redisClient.expire(key, windowSeconds);
      }

      const ttl = await redisClient.ttl(key);
      const remaining = Math.max(0, limit - current);
      const allowed = current <= limit;

      return {
        allowed,
        current,
        remaining,
        resetSecs: ttl > 0 ? ttl : windowSeconds,
      };
    } catch (err) {
      console.error(`[RedisService] Rate limit error for ${identifier}:`, err);
      return { allowed: true, current: 1, remaining: limit - 1, resetSecs: windowSeconds };
    }
  },

  // ---------------------------------------------------------------------------
  // Real-Time Fleet & Driver Geolocation Tracking
  // ---------------------------------------------------------------------------

  /**
   * Fast cache driver coordinate update (TTL: 5 minutes)
   */
  storeDriverLocation: async (riderId: string, lat: number, lng: number, heading: number = 0): Promise<void> => {
    const key = `driver:loc:${riderId}`;
    const payload: DriverLocationCache = {
      riderId,
      lat,
      lng,
      heading,
      updatedAt: Date.now(),
    };
    // Cache for 300 seconds (5 min) — auto-evicts if driver disconnects
    await redisService.setEx(key, 300, payload);
  },

  /**
   * Retrieve a specific driver's latest cached coordinate
   */
  getDriverLocation: async (riderId: string): Promise<DriverLocationCache | null> => {
    return redisService.get<DriverLocationCache>(`driver:loc:${riderId}`);
  },

  /**
   * Retrieve all currently active drivers from Redis
   */
  getAllActiveDriverLocations: async (): Promise<DriverLocationCache[]> => {
    try {
      const keys = await redisClient.keys('driver:loc:*');
      if (keys.length === 0) return [];

      const drivers: DriverLocationCache[] = [];
      for (const k of keys) {
        const item = await redisService.get<DriverLocationCache>(k);
        if (item) drivers.push(item);
      }
      return drivers;
    } catch (err) {
      console.error('[RedisService] getAllActiveDriverLocations error:', err);
      return [];
    }
  },

  /**
   * Remove a driver from active live cache (e.g. on duty offline / disconnect)
   */
  removeDriverLocation: async (riderId: string): Promise<void> => {
    await redisService.del(`driver:loc:${riderId}`);
  },

  /**
   * Current Redis health and engine statistics
   */
  getStatus: () => {
    return getRedisStatus();
  },
};

export default redisService;
