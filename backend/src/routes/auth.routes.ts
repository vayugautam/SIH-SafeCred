import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('mobile').isMobilePhone('en-IN'),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('age').optional().isInt({ min: 18, max: 100 }),
  ],
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  authController.login
);

// Verify token
router.get('/verify', authController.verifyToken);

export default router;
