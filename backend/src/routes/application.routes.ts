import { Router } from 'express';
import { body } from 'express-validator';
import * as applicationController from '../controllers/application.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create new application
router.post(
  '/',
  [
    body('declaredIncome').isFloat({ min: 0 }),
    body('loanAmount').isFloat({ min: 1000 }),
    body('tenureMonths').isInt({ min: 1, max: 60 }),
  ],
  applicationController.createApplication
);

// Get user's applications
router.get('/', applicationController.getUserApplications);

// Get specific application
router.get('/:id', applicationController.getApplicationById);

// Submit application for ML processing
router.post('/:id/submit', applicationController.submitApplication);

export default router;
