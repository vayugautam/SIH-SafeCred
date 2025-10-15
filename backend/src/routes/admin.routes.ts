import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAdminAnalytics } from '../controllers/admin.controller';

const router = Router();

router.use(authenticate);

router.get('/analytics', getAdminAnalytics);

export default router;
