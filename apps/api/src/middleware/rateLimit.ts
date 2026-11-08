import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
  ip?: string;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  skipInTests?: boolean;
  identifier?: 'ip' | 'user' | 'global';
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests from this IP. Please try again later.',
    skipInTests = true,
    identifier = 'ip',
  } = options;

  // Distributed IP extraction: prefer x-forwarded-for, fall back to connection IP
  const getClientIp = (req: Request): string => {
    const forwardedFor = req.headers['x-forwarded-for'] as string | undefined;
    if (forwardedFor) {
      // Take the leftmost IP (original client) when multiple proxies are chained
      const ips = forwardedFor.split(',').map((ip) => ip.trim());
      return ips[0] || req.ip || req.socket.remoteAddress || 'unknown-ip';
    }
    return req.ip || req.socket.remoteAddress || 'unknown-ip';
  };

  const hits = new Map<string, RateLimitRecord>();

  // Periodically clean up expired entries every 3 minutes
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 3 * 60 * 1000);

  // Unref interval so it doesn't hold the Node process open
  if (interval.unref) {
    interval.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting during automated test suites
    if (skipInTests && (config.env === 'test' || process.env.NODE_ENV === 'test')) {
      return next();
    }

    let ip: string;
    let key: string;

    // Use identifier strategy to determine rate limit key
    switch (identifier) {
      case 'user':
        // Rate limit per authenticated user
        ip = req.user?.id || 'anonymous';
        key = `${req.baseUrl}${req.path}:${ip}`;
        break;
      case 'global':
        // Rate limit globally (shared across all IPs/users)
        ip = 'global';
        key = 'global-rate-limit';
        break;
      default:
        // Default: IP-based rate limiting with proxy support
        ip = getClientIp(req);
        key = `${req.baseUrl}${req.path}:${ip}`;
    }

    const now = Date.now();

    const record = hits.get(key);

    if (!record || now > record.resetTime) {
      hits.set(key, { count: 1, resetTime: now + windowMs, ip });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      res.setHeader('X-RateLimit-Identifier', identifier);
      return next();
    }

    record.count += 1;
    const remaining = Math.max(0, max - record.count);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Identifier', identifier);

    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message,
        retryAfter: retryAfterSeconds,
        identifier,
      });
    }

    next();
  };
}