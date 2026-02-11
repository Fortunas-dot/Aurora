import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details (but don't expose to client)
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  } else {
    // In production, only log error message (no stack traces)
    console.error('Error:', err.message);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    res.status(400).json({
      success: false,
      message: 'Duplicate field value entered',
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  
  // In production, don't expose error details
  const message = isDevelopment 
    ? (err.message || 'Server Error')
    : 'An error occurred. Please try again later.';

  res.status(statusCode).json({
    success: false,
    message,
    // Only include error details in development
    ...(isDevelopment && { error: err.message, stack: err.stack }),
  });
};







