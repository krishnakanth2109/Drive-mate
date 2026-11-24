import { Request, Response, NextFunction } from 'express';
import redisService from '../services/redisService.js';

export interface RateLimitOptions {
  windowSeconds?: number;
  maxRequests?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Redis-Backed Sliding-Window Rate Limiting Middleware.
 * Automatically tracks request quotas by client IP or authenticated user ID.
 */
export const rateLimiter = (options: RateLimitOptions = {}) => {
  const windowSeconds = options.windowSeconds || 60;
  const maxRequests = options.maxRequests || 60;
  const message = options.message || 'Too many requests, please slow down and try again later.';

  return async (req: Request, res: Response, next: NextFunction) => {
    // Generate identifier: custom generator, or authenticated user ID, or IP address
    const authUser = (req as any).user;
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'anonymous';

    const identifier = options.keyGenerator
      ? options.keyGenerator(req)
      : authUser?.id || authUser?._id || clientIp;

    try {
      const result = await redisService.rateLimit(String(identifier), maxRequests, windowSeconds);

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetSecs);

      if (!result.allowed) {
        res.setHeader('Retry-After', result.resetSecs);
        return res.status(429).json({
          status: 'error',
          message,
          retryAfter: result.resetSecs,
        });
      }

      next();
    } catch (err) {
      console.error('[RateLimitMiddleware] Evaluation error:', err);
      // Gracefully allow the request through if rate limiting fails
      next();
    }
  };
};

/**
 * Preconfigured limiter for authentication endpoints (e.g. login, sign-up)
 * 15 requests per minute
 */
export const authLimiter = rateLimiter({
  windowSeconds: 60,
  maxRequests: 15,
  message: 'Too many authentication attempts. Please wait 1 minute before trying again.',
});

/**
 * Preconfigured limiter for SMS/Email OTP generation
 * 5 requests per minute
 */
export const otpLimiter = rateLimiter({
  windowSeconds: 60,
  maxRequests: 5,
  message: 'Too many OTP verification requests. Please wait a minute before requesting another code.',
});

/**
 * Standard API throughput limiter
 * 120 requests per minute
 */
export const standardApiLimiter = rateLimiter({
  windowSeconds: 60,
  maxRequests: 120,
  message: 'API rate limit exceeded. Please throttle requests.',
});

export default rateLimiter;
