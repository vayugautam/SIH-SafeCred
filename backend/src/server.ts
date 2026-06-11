import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import applicationRoutes from './routes/application.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import fairnessRoutes from './routes/fairness.routes';
import { securityHeaders, generalRateLimiter, bodySizeLimit, urlEncodedLimit } from './middleware/security';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(requestLogger);
app.use(securityHeaders);
app.use(generalRateLimiter);
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodySizeLimit);
app.use(urlEncodedLimit);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/fairness', fairnessRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'SafeCred Backend API'
  });
});

// Error handling
app.use(errorHandler);

// Process error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`🚀 SafeCred Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🤖 ML API URL: ${process.env.ML_API_URL}`);
});

export default app;
