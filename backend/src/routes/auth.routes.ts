import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('mobile').isLength({ min: 10, max: 15 }).matches(/^[0-9+\-\s()]+$/),
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
