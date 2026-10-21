import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error({ err }, 'Error caught by error handler');

  // Our custom AppError hierarchy
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      code: err.code,
      message: err.message,
    };
    if (err.details) {
      response.details = err.details;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.') || '_root';
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(issue.message);
    }
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details,
    } satisfies ErrorResponse);
    return;
  }

  // JWT errors
  if (err instanceof TokenExpiredError) {
    res.status(401).json({
      code: 'TOKEN_EXPIRED',
      message: 'Token has expired',
    } satisfies ErrorResponse);
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid token',
    } satisfies ErrorResponse);
    return;
  }

  // PostgreSQL errors
  const pgError = err as Error & { code?: string; constraint?: string; detail?: string };
  if (pgError.code === '23505') {
    // unique_violation
    res.status(409).json({
      code: 'CONFLICT',
      message: 'A record with the same value already exists',
    } satisfies ErrorResponse);
    return;
  }

  if (pgError.code === '23503') {
    // foreign_key_violation
    res.status(400).json({
      code: 'FOREIGN_KEY_VIOLATION',
      message: 'Referenced record does not exist',
    } satisfies ErrorResponse);
    return;
  }

  if (pgError.code === '23502') {
    // not_null_violation
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'A required field is missing',
    } satisfies ErrorResponse);
    return;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    const multerErr = err as Error & { code: string };
    let message = 'File upload error';
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the allowed limit';
    } else if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    } else if (multerErr.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
    }
    res.status(400).json({
      code: 'FILE_UPLOAD_ERROR',
      message,
    } satisfies ErrorResponse);
    return;
  }

  // Generic error - don't leak details in production
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: isProduction ? 'An unexpected error occurred' : err.message,
  } satisfies ErrorResponse);
}
