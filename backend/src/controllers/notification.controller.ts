import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.userId,
        isRead: false,
      },
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId, markAllAsRead } = req.body;

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId: req.userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      await prisma.notification.update({
        where: {
          id: notificationId,
          userId: req.userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
