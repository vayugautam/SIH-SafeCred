import { Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

const getAdminEmails = (): string[] => {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
};

const normalizeRiskBand = (riskBand?: string | null): 'veryLow' | 'low' | 'medium' | 'high' | 'veryHigh' | null => {
  if (!riskBand) return null;
  const normalized = riskBand.toLowerCase().replace(/\s+/g, '');
  if (normalized.includes('verylow')) return 'veryLow';
  if (normalized.includes('low')) return 'low';
  if (normalized.includes('medium')) return 'medium';
  if (normalized.includes('veryhigh')) return 'veryHigh';
  if (normalized.includes('high')) return 'high';
  return null;
};

const calculateAverage = (values: number[]): number => {
  const safeValues = values.filter((value) => Number.isFinite(value));
  if (safeValues.length === 0) {
    return 0;
  }
  const total = safeValues.reduce((sum, value) => sum + value, 0);
  return total / safeValues.length;
};

const parseScoreDetails = (scoreDetails: Prisma.JsonValue | null) => {
  if (!scoreDetails || typeof scoreDetails !== 'object') {
    return null;
  }
  const details = scoreDetails as Record<string, any>;
  const scoreBreakdown = details.score_breakdown as Record<string, number> | undefined;
  const combineDetails = details.combine_details as Record<string, any> | undefined;

  const sortedBreakdown = scoreBreakdown
    ? Object.entries(scoreBreakdown)
        .map(([factor, score]) => ({ factor, score: Number(score) || 0 }))
        .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
        .slice(0, 5)
    : [];

  const adjustments: Array<{ key: string; value: number }> = [];
  if (combineDetails) {
    Object.entries(combineDetails).forEach(([key, value]) => {
      if (value && typeof value === 'object' && 'adjusted_final_sci' in (value as Record<string, any>)) {
        const data = value as Record<string, any>;
        if (typeof data.adjusted_final_sci === 'number' && typeof data.previous_final_sci === 'number') {
          adjustments.push({
            key,
            value: data.adjusted_final_sci - data.previous_final_sci,
          });
        }
      }
    });
  }

  return {
    topFactors: sortedBreakdown,
    adjustments,
  };
};

export const getAdminAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const adminEmails = getAdminEmails();
    if (adminEmails.length > 0 && !adminEmails.includes((user.email || '').toLowerCase())) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const applications = await prisma.application.findMany({
      include: {
        user: {
          select: {
            age: true,
            hasChildren: true,
            isSociallyDisadvantaged: true,
          },
        },
      },
    });

    const totalApplications = applications.length;
    const approvedApplications = applications.filter((application) => application.status === 'APPROVED');
    const rejectedApplications = applications.filter((application) => application.status === 'REJECTED');
    const pendingApplications = applications.filter((application) =>
      application.status === 'PROCESSING' || application.status === 'MANUAL_REVIEW'
    );

    const totalLoanAmount = applications.reduce((sum, application) => sum + Number(application.loanAmount || 0), 0);
    const averageRiskScore = calculateAverage(
      applications.map((application) => Number(application.compositeScore ?? 0))
    );
    const approvalRate = totalApplications > 0 ? (approvedApplications.length / totalApplications) * 100 : 0;

    const riskDistribution = {
      veryLow: 0,
      low: 0,
      medium: 0,
      high: 0,
      veryHigh: 0,
    };

    const needCategoryBreakdown: Record<string, number> = {};
    const lowRiskAutoApprovals = applications.filter(
      (application) => application.riskBand === 'Low Risk' && application.status === 'APPROVED'
    );

    applications.forEach((application) => {
      const bucket = normalizeRiskBand(application.riskBand);
      if (bucket) {
        riskDistribution[bucket] += 1;
      }

      if (application.needCategory) {
        const key = application.needCategory.trim() || 'Unclassified';
        needCategoryBreakdown[key] = (needCategoryBreakdown[key] || 0) + 1;
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const temporalTrends = Array.from({ length: 14 }, (_, index) => {
      const startOfDay = new Date(today);
      startOfDay.setDate(today.getDate() - (13 - index));
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(startOfDay.getDate() + 1);

      const applicationsForDay = applications.filter((application) => {
        const createdAt = application.createdAt ? new Date(application.createdAt) : null;
        return createdAt ? createdAt >= startOfDay && createdAt < endOfDay : false;
      });

      const approvalsForDay = applicationsForDay.filter((application) => application.status === 'APPROVED');
      const averageScoreForDay = calculateAverage(
        applicationsForDay.map((application) => Number(application.compositeScore ?? 0))
      );

      return {
        date: startOfDay.toISOString(),
        applications: applicationsForDay.length,
        approvals: approvalsForDay.length,
        avgRiskScore: Number(averageScoreForDay.toFixed(2)),
      };
    });

    const ageBuckets = [
      { range: '18-25', count: 0 },
      { range: '26-35', count: 0 },
      { range: '36-45', count: 0 },
      { range: '46-60', count: 0 },
      { range: '60+', count: 0 },
    ];

    applications.forEach((application) => {
      const age = application.user?.age ?? null;
      if (age === null || age < 18) {
        return;
      }
      if (age <= 25) ageBuckets[0].count += 1;
      else if (age <= 35) ageBuckets[1].count += 1;
      else if (age <= 45) ageBuckets[2].count += 1;
      else if (age <= 60) ageBuckets[3].count += 1;
      else ageBuckets[4].count += 1;
    });

    const hasChildrenCounts = {
      yes: applications.filter((application) => application.user?.hasChildren).length,
      no: applications.filter((application) => !application.user?.hasChildren).length,
    };

    const sociallyDisadvantagedCounts = {
      yes: applications.filter((application) => application.user?.isSociallyDisadvantaged).length,
      no: applications.filter((application) => !application.user?.isSociallyDisadvantaged).length,
    };

    const sciValues = applications.map((application) => Number(application.finalSci ?? 0));
    const mlProbabilityValues = applications.map((application) => Number(application.mlProbability ?? 0));

    const scoreInsight = {
      averageFinalSci: calculateAverage(sciValues),
      averageCompositeScore: averageRiskScore,
      averageMlProbability: calculateAverage(mlProbabilityValues),
      autoApprovalRate:
        totalApplications > 0 ? (lowRiskAutoApprovals.length / totalApplications) * 100 : 0,
    };

    const recentDecisions = applications
      .filter((application) => application.processedAt !== null)
      .sort((a, b) => (b.processedAt?.getTime() || 0) - (a.processedAt?.getTime() || 0))
      .slice(0, 10)
      .map((application) => ({
        id: application.id,
        applicationId: application.applicationId,
        status: application.status,
        riskBand: application.riskBand,
        needCategory: application.needCategory,
        finalSci: application.finalSci,
        compositeScore: application.compositeScore,
        processedAt: application.processedAt,
        scoreDetails: parseScoreDetails(application.scoreDetails),
      }));

    return res.json({
      analytics: {
        overview: {
          totalApplications,
          approvedApplications: approvedApplications.length,
          rejectedApplications: rejectedApplications.length,
          pendingApplications: pendingApplications.length,
          totalLoanAmount,
          averageRiskScore: Number(averageRiskScore.toFixed(2)),
          approvalRate: Number(approvalRate.toFixed(2)),
        },
        riskDistribution,
        demandSignals: {
          needCategoryBreakdown,
          lowRiskAutoApprovals: lowRiskAutoApprovals.length,
        },
        temporalTrends,
        demographics: {
          ageGroups: ageBuckets,
          hasChildren: hasChildrenCounts,
          sociallyDisadvantaged: sociallyDisadvantagedCounts,
        },
        scoreInsights: {
          averageFinalSci: Number(scoreInsight.averageFinalSci.toFixed(2)),
          averageCompositeScore: Number(scoreInsight.averageCompositeScore.toFixed(2)),
          averageMlProbability: Number(scoreInsight.averageMlProbability.toFixed(3)),
          autoApprovalRate: Number(scoreInsight.autoApprovalRate.toFixed(2)),
        },
        recentDecisions,
      },
    });
  } catch (error: any) {
    console.error('Admin analytics error:', error);
    return res.status(500).json({
      error: 'Failed to build analytics dashboard',
      details: error?.message,
    });
  }
};
