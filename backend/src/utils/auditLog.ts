import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const logAudit = async (action: string, actorId: string, targetId: string, metadata: any = {}, ipAddress: string = '') => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        actorId,
        targetId,
        metadata,
        ipAddress
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
