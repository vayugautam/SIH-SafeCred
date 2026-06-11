import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  req.headers['x-request-id'] = requestId as string;
  
  const startTime = Date.now();
  
  // Create a safe copy of body without PII
  const safeBody = { ...req.body };
  const piiFields = ['password', 'email', 'mobile', 'pan_number', 'aadhaar_number'];
  piiFields.forEach(field => {
    if (safeBody[field]) safeBody[field] = '[REDACTED]';
  });
  
  console.log(`[REQ] [${requestId}] ${req.method} ${req.url}`);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[RES] [${requestId}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};
