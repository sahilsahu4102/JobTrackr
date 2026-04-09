import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';

interface ErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
  stack?: string;
}

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Mongoose duplicate key error
  if ((err as { code?: number }).code === 11000) {
    statusCode = 409;
    message = 'A resource with that value already exists';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
