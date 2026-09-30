import { Request, Response, NextFunction } from 'express';

const hits = new Map<string, { count: number; resetAt: number }>();

export const rateLimitPublicPost = (maxPerMinute = 10) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || now > entry.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + 60_000 });
      next();
      return;
    }

    if (entry.count >= maxPerMinute) {
      res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
      return;
    }

    entry.count += 1;
    next();
  };
};
