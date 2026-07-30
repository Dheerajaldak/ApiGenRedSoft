import { Request, Response, NextFunction } from 'express';

// In-memory sliding window store for rate limiting by Key ID
// Format: keyId -> Array of timestamps (in ms)
const requestLogs = new Map<string, number[]>();

// Cleanup stale timestamps older than 60 seconds periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 60 * 1000;
  for (const [keyId, timestamps] of requestLogs.entries()) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      requestLogs.delete(keyId);
    } else {
      requestLogs.set(keyId, valid);
    }
  }
}, 30 * 1000);

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = (req as any).apiKey;

  if (!apiKey) {
    res.status(401).json({ error: 'Unauthorized', message: 'API key is required' });
    return;
  }

  const keyId = apiKey._id ? apiKey._id.toString() : apiKey.keyHash;
  const limit = apiKey.rateLimit || 10; // RPM threshold
  const windowMs = 60 * 1000; // 1 minute window
  const now = Date.now();

  const userLogs = requestLogs.get(keyId) || [];
  // Filter out timestamps outside the 60-second window
  const activeLogs = userLogs.filter((timestamp) => now - timestamp < windowMs);

  const remaining = Math.max(0, limit - activeLogs.length);
  const oldestTimestamp = activeLogs[0] || now;
  const resetSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

  // Set standard rate limit headers
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', resetSeconds > 0 ? resetSeconds.toString() : '60');

  if (activeLogs.length >= limit) {
    res.setHeader('Retry-After', resetSeconds.toString());
    res.status(429).json({
      status: 429,
      error: 'Too Many Requests',
      message: `Rate limit of ${limit} requests per minute exceeded for key '${apiKey.name}'.`,
      limit,
      remaining: 0,
      retryAfterSeconds: resetSeconds > 0 ? resetSeconds : 60,
    });
    return;
  }

  // Record current request timestamp
  activeLogs.push(now);
  requestLogs.set(keyId, activeLogs);

  // Expose rate limit info on req object for downstream controllers
  (req as any).rateLimitInfo = {
    limit,
    remaining: remaining - 1,
    resetSeconds,
  };

  next();
};
