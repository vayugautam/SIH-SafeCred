import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Admin Dashboard stats
router.get('/dashboard', adminController.getDashboardStats);

// Admin Analytics
router.get('/analytics', adminController.getAnalytics);

// Admin Rescore
router.post('/rescore', adminController.rescoreApplications);

export default router;
