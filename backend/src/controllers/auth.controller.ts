import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email, mobile, password, name, age, hasChildren, isSociallyDisadvantaged, role } = req.body;

    console.log('Registration attempt:', { email, mobile, name, age, role });

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { mobile }]
      }
    });

    if (existingUser) {
      console.log('User already exists:', existingUser.email);
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
        age: age ? parseInt(age.toString()) : null,
        hasChildren: hasChildren === true || hasChildren === 'true',
        isSociallyDisadvantaged: isSociallyDisadvantaged === true || isSociallyDisadvantaged === 'true'
      },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        role: true,
        age: true,
        hasChildren: true,
        isSociallyDisadvantaged: true,
        createdAt: true
      }
    });

    console.log('User created successfully:', user.id);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error: any) {
    console.error('Register error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to register user', message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      (process.env.JWT_SECRET || 'default-secret-key') as jwt.Secret
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        name: user.name,
        age: user.age,
        hasChildren: user.hasChildren,
        isSociallyDisadvantaged: user.isSociallyDisadvantaged
      },
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, (process.env.JWT_SECRET || 'default-secret-key') as jwt.Secret) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        age: true,
        hasChildren: true,
        isSociallyDisadvantaged: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user, valid: true });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token', valid: false });
  }
};
