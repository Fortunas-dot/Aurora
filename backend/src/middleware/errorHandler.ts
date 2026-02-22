import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

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
  
  // Always log full error details server-side for debugging
  if (isDevelopment) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  } else {
    // In production, log error message and type (no stack traces in logs)
    console.error('Error:', {
      name: err.name,
      message: err.message,
      code: (err as any).code,
    });
  }

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const field = (err as any).keyPattern ? Object.keys((err as any).keyPattern)[0] : 'field';
    res.status(400).json({
      success: false,
      message: `This ${field} is already in use. Please choose a different value.`,
    });
    return;
  }

  // Mongoose validation error - sanitize to prevent schema information leakage
  if (err.name === 'ValidationError' || err instanceof mongoose.Error.ValidationError) {
    const validationError = err as mongoose.Error.ValidationError;
    const errors = validationError.errors;
    
    // Extract user-friendly error messages without exposing schema details
    const errorMessages: string[] = [];
    if (errors) {
      Object.keys(errors).forEach((key) => {
        const error = errors[key];
        if (error && error.message) {
          // Use generic field name instead of exposing actual field names in production
          if (isDevelopment) {
            errorMessages.push(`${key}: ${error.message}`);
          } else {
            // In production, use generic messages
            if (error.kind === 'required') {
              errorMessages.push('A required field is missing.');
            } else if (error.kind === 'minlength' || error.kind === 'maxlength') {
              errorMessages.push('Field length is invalid.');
            } else if (error.kind === 'min' || error.kind === 'max') {
              errorMessages.push('Field value is out of range.');
            } else if (error.kind === 'enum') {
              errorMessages.push('Invalid value selected.');
            } else {
              errorMessages.push('Invalid input provided.');
            }
          }
        }
      });
    }
    
    res.status(400).json({
      success: false,
      message: errorMessages.length > 0 
        ? (isDevelopment ? errorMessages.join(' ') : 'Validation failed. Please check your input.')
        : 'Invalid input provided.',
    });
    return;
  }

  // Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError' || err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format provided.',
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

  // MongoDB connection errors
  if (err.name === 'MongoServerError' || err.name === 'MongoNetworkError') {
    res.status(503).json({
      success: false,
      message: 'Database connection error. Please try again later.',
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







