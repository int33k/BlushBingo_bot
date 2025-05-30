/**
 * Ultra-compact error handling middleware with aggressive optimization
 */
import { Request, Response, NextFunction } from 'express';
import { handleHttpError } from '../utils/math';
import { logger, env } from '../config';

// Ultra-compact error handler with inline operations and functional composition
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  const appError = handleHttpError(err);

  // Optimized logging with ternary and template literals
  appError.isOperational
    ? (logger.warn(`Operational error: ${appError.message}`), appError.details && logger.debug(`Error details: ${JSON.stringify(appError.details)}`))
    : (logger.error(`Unhandled error: ${appError.message}`), logger.error(appError.stack || ''));

  // Ultra-compact response with spread optimization and inline conditionals
  res.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: env.nodeEnv === 'production' && !appError.isOperational ? 'Server error' : appError.message,
      ...(env.nodeEnv !== 'production' && { details: appError.details })
    }
  });
};

export default errorHandler;
