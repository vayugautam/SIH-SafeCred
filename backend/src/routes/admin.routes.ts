import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAdminAnalytics } from '../controllers/admin.controller';

const router = Router();

router.use(authenticate);

// Main analytics endpoint
router.get('/analytics', getAdminAnalytics);

// TODO: Add additional endpoints:
// - /overview (overview dashboard)
// - /beneficiaries (beneficiary scoring with pagination)
// - /beneficiaries/:id (detailed beneficiary drill-down)
// - /risk-compliance (bias monitoring, audit trails)
// - /income-verification (income validation monitor)
// - /model-management (ML model info, re-scoring)
// - /direct-lending (auto-approval tracking, manual review queue)
// - /analytics-reports (regional stats, demographic breakdowns)

export default router;
