import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  
  // Redact PII in error messages
  let errorMessage = err.message || 'Internal Server Error';
  errorMessage = errorMessage.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED EMAIL]');
  errorMessage = errorMessage.replace(/\b\d{10}\b/g, '[REDACTED MOBILE]');
  
  console.error(`[ERROR] [${requestId}] ${req.method} ${req.url} - ${errorMessage}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  res.status(err.status || 500).json({
    error: errorMessage,
    requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
