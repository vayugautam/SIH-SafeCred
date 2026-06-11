import { Router } from 'express';
import { body } from 'express-validator';
import { createApplication, getUserApplications, getApplicationById } from '../controllers/application.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create new application and submit to ML simultaneously
router.post(
  '/',
  [
    body('declaredIncome').isFloat({ min: 0 }),
    body('loanAmount').isFloat({ min: 1000 }),
    body('tenureMonths').isInt({ min: 1, max: 60 }),
  ],
  createApplication
);

// Get user's applications
router.get('/', getUserApplications);

// Get specific application
router.get('/:id', getApplicationById);

export default router;
