import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorMiddleware = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const dbError = err as Error & { code?: string; cause?: { code?: string } };
  const code = dbError.code || dbError.cause?.code || '';
  const databaseStack = /pg-pool|mongoose-postgres|node_modules[\\/]pg[\\/]/.test(err.stack || '');
  const networkCodes = ['ETIMEDOUT', 'ENETUNREACH', 'ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENOTFOUND', 'EAI_AGAIN'];
  if (/^08\w{3}$/.test(code) || ['57P01', '57P02', '57P03'].includes(code) || (databaseStack && (networkCodes.includes(code) || /connection timeout|connection terminated|timeout exceeded when trying to connect/i.test(err.message)))) {
    console.error('PostgreSQL temporarily unavailable:', err);
    res.setHeader('Retry-After', '5');
    res.status(503).json({ success: false, message: 'Database temporarily unavailable. Please try again shortly.' });
    return;
  }
  if ((err as any).code === 'P0001' && err.message.includes('Employee limit reached')) {
    res.status(409).json({ success: false, message: 'Employee limit reached: maximum 3 employees, excluding Master Admin' });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values((err as any).errors).map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    });
    return;
  }

  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0];
    res.status(409).json({
      success: false,
      message: field ? `${field} already exists` : 'Duplicate value',
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token expired' });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid ID format' });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
