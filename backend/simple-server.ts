import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'SafeCred Backend API'
  });
});

// Registration endpoint directly in server
app.post('/api/auth/register', 
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('mobile').isLength({ min: 10, max: 15 }).matches(/^[0-9+\-\s()]+$/),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { email, mobile, password, name, role } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { mobile }]
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email or mobile already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          mobile,
          password: hashedPassword,
          name,
          role: role || 'borrower',
        }
      });

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          mobile: user.mobile,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
);

// Process error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`🚀 SafeCred Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
