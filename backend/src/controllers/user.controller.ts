import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        age: true,
        hasChildren: true,
        isSociallyDisadvantaged: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, age, hasChildren, isSociallyDisadvantaged } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name && { name }),
        ...(age !== undefined && { age }),
        ...(hasChildren !== undefined && { hasChildren }),
        ...(isSociallyDisadvantaged !== undefined && { isSociallyDisadvantaged })
      },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        age: true,
        hasChildren: true,
        isSociallyDisadvantaged: true,
        updatedAt: true
      }
    });

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
