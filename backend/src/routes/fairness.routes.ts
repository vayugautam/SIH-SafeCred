import express from 'express';
import { getFairnessMetrics } from '../controllers/fairness.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

router.get('/metrics', getFairnessMetrics);

export default router;
