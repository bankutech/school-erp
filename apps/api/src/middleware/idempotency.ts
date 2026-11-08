import { Request, Response, NextFunction } from 'express';

interface IdempotentRecord {
  status: 'PENDING' | 'COMPLETED';
  statusCode?: number;
  body?: any;
  createdAt: number;
}

// In-memory LRU-like store with TTL expiration
const idempotencyStore = new Map<string, IdempotentRecord>();

// Clean up expired keys every 10 minutes (TTL: 24 hours)
const TTL_MS = 24 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of idempotencyStore.entries()) {
    if (now - record.createdAt > TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Enterprise Idempotency Middleware
 * Ensures mutations with identical Idempotency-Key are executed exactly once.
 */
export function requireIdempotency(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = (
    req.headers['idempotency-key'] || req.headers['x-idempotency-key']
  ) as string | undefined;

  // If no key provided, allow standard execution
  if (!idempotencyKey || !idempotencyKey.trim()) {
    return next();
  }

  const key = `${req.method}:${req.baseUrl || req.path}:${idempotencyKey.trim()}`;
  const existing = idempotencyStore.get(key);

  if (existing) {
    if (existing.status === 'PENDING') {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'A request with this idempotency key is currently being processed. Please retry shortly.',
      });
    }

    if (existing.status === 'COMPLETED' && existing.body) {
      res.setHeader('X-Idempotent-Replay', 'true');
      return res.status(existing.statusCode || 200).json(existing.body);
    }
  }

  // Register key as PENDING
  idempotencyStore.set(key, {
    status: 'PENDING',
    createdAt: Date.now(),
  });

  // Intercept json response to capture output
  const originalJson = res.json.bind(res);

  res.json = (body: any) => {
    // Only cache successful or client-safe responses
    if (res.statusCode >= 200 && res.statusCode < 500) {
      idempotencyStore.set(key, {
        status: 'COMPLETED',
        statusCode: res.statusCode,
        body,
        createdAt: Date.now(),
      });
    } else {
      // Evict on server failure so client can safely retry
      idempotencyStore.delete(key);
    }

    return originalJson(body);
  };

  next();
}
