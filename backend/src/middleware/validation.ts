import { body } from 'express-validator';

export const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter'),
  body('name').notEmpty().withMessage('Name is required'),
  body('mobile').matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit mobile number')
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];
