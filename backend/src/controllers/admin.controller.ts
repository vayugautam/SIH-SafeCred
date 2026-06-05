import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient, UserRole, Prisma } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8002';

const normalizeRiskBand = (riskBand?: string | null) =>
  riskBand?.replace(' ', '_').toUpperCase() ?? null;

const statusFromMl = (status?: string) =>
  status === 'approved' ? 'APPROVED' :
  status === 'rejected' ? 'REJECTED' : 'MANUAL_REVIEW';

const RISK_BAND_KEYS = ['LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK', 'REJECT'] as const;

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const applications = await prisma.application.findMany({
      include: {
        user: {
          select: { age: true, hasChildren: true, isSociallyDisadvantaged: true }
        }
      }
    });

    const totalApplications = applications.length;
    const approvedApplications = applications.filter((a: any) => a.status === 'APPROVED').length;
    const rejectedApplications = applications.filter((a: any) => a.status === 'REJECTED').length;
    const pendingApplications = applications.filter(
      (a: any) => a.status === 'PROCESSING' || a.status === 'MANUAL_REVIEW'
    ).length;
    const manualReviewApplications = applications.filter((a: any) => a.status === 'MANUAL_REVIEW').length;

    const totalLoanAmount = applications.reduce((sum: number, a: any) => sum + (a.loanAmount || 0), 0);
    const avgRiskScore = applications.length > 0
      ? applications.reduce((sum: number, a: any) => sum + (a.compositeScore || 0), 0) / applications.length
      : 0;
    const approvalRate = totalApplications > 0 ? (approvedApplications / totalApplications) * 100 : 0;

    const riskBands = { unscored: 0, veryLow: 0, low: 0, medium: 0, high: 0, veryHigh: 0 };
    applications.forEach((app: any) => {
      if (!app.riskBand) { riskBands.unscored++; return; }
      switch (app.riskBand) {
        case 'LOW_RISK': riskBands.low++; break;
        case 'MEDIUM_RISK': riskBands.medium++; break;
        case 'HIGH_RISK': riskBands.high++; break;
        case 'REJECT': riskBands.veryHigh++; break;
        default: riskBands.veryLow++;
      }
    });

    const ageGroups = [
      { range: '18-25', count: 0 },
      { range: '26-35', count: 0 },
      { range: '36-45', count: 0 },
      { range: '46-60', count: 0 },
      { range: '60+', count: 0 }
    ];

    applications.forEach((app: any) => {
      const age = app.user.age || 30;
      if (age <= 25) ageGroups[0].count++;
      else if (age <= 35) ageGroups[1].count++;
      else if (age <= 45) ageGroups[2].count++;
      else if (age <= 60) ageGroups[3].count++;
      else ageGroups[4].count++;
    });

    return res.json({
      analytics: {
        overview: {
          totalApplications, approvedApplications, rejectedApplications, pendingApplications,
          totalLoanAmount, averageRiskScore: avgRiskScore, approvalRate
        },
        riskDistribution: riskBands,
        demographics: {
          ageGroups,
          hasChildren: {
            yes: applications.filter((a: any) => a.user.hasChildren).length,
            no: applications.filter((a: any) => !a.user.hasChildren).length
          },
          sociallyDisadvantaged: {
            yes: applications.filter((a: any) => a.user.isSociallyDisadvantaged).length,
            no: applications.filter((a: any) => !a.user.isSociallyDisadvantaged).length
          }
        }
      }
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.LOAN_OFFICER)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [
      totalApplications,
      approvedApplications,
      rejectedApplications,
      processingApplications,
      manualReviewApplications,
      totalUsers,
      totalLoanAmount,
      totalApprovedAmount,
      riskBandStats,
      disadvantagedLowRisk,
      disadvantagedApplications,
      manualQueue
    ] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { status: 'APPROVED' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
      prisma.application.count({ where: { status: 'PROCESSING' } }),
      prisma.application.count({ where: { status: 'MANUAL_REVIEW' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.application.aggregate({ _sum: { loanAmount: true } }),
      prisma.application.aggregate({ where: { status: 'APPROVED' }, _sum: { approvedLoanAmount: true } }),
      prisma.application.groupBy({ by: ['riskBand'], _count: true, where: { riskBand: { not: null } } }),
      prisma.application.count({ where: { riskBand: 'LOW_RISK', user: { isSociallyDisadvantaged: true } } }),
      prisma.application.count({ where: { user: { isSociallyDisadvantaged: true } } }),
      prisma.application.findMany({
        where: { status: { in: ['MANUAL_REVIEW', 'PROCESSING'] } },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true, email: true } } }
      })
    ]);

    const riskBandDistribution = RISK_BAND_KEYS.reduce((acc, key) => { acc[key] = 0; return acc; }, {} as any);
    riskBandStats.forEach((entry: any) => {
      if (!entry.riskBand) return;
      const normalized = entry.riskBand.replace(' ', '_').toUpperCase();
      if (normalized in riskBandDistribution) riskBandDistribution[normalized] = entry._count;
    });

    const fairnessScore = (() => {
      const totalLowRisk = riskBandDistribution.LOW_RISK || 1;
      const ratio = disadvantagedLowRisk / totalLowRisk;
      return Math.min(100, Math.round(70 + ratio * 30));
    })();

    return res.json({
      overview: {
        totalBeneficiaries: totalUsers,
        totalApplications,
        approvals: approvedApplications,
        rejected: rejectedApplications,
        pending: processingApplications + manualReviewApplications,
        approvalRate: totalApplications ? Math.round((approvedApplications / totalApplications) * 100) : 0,
        totalRequested: totalLoanAmount._sum.loanAmount ?? 0,
        totalDisbursed: totalApprovedAmount._sum.approvedLoanAmount ?? 0,
        manualReview: manualReviewApplications,
        fairnessScore,
      },
      risk: {
        distribution: riskBandDistribution,
        fairnessScore
      },
      manualReviewQueue: manualQueue
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

type Numeric = number | null | undefined;
const avg = (values: Numeric[]): number | undefined => {
  const filtered = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (!filtered.length) return undefined;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
};
const monthsCovered = (dates: Date[]) => {
  const labels = new Set<string>();
  dates.forEach((date) => labels.add(\`\${date.getFullYear()}-\${date.getMonth() + 1}\`));
  return labels.size || 1;
};

const computeBankAggregates = (records: any[]) => {
  if (!records.length) return undefined;
  const credits = records.map((record) => record.credit ?? 0);
  const balances = records.map((record) => record.balance ?? 0);
  const totalCredit = credits.reduce((sum, value) => sum + value, 0);
  const timelineMonths = monthsCovered(records.map((record) => record.date));
  return {
    monthly_credits: Number(((totalCredit / timelineMonths) || 0).toFixed(2)),
    avg_balance: avg(balances) ? Number(avg(balances)?.toFixed(2)) : undefined,
  };
};

export const rescoreApplications = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.LOAN_OFFICER)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { applicationIds, limit = 25 } = req.body;
    const where: any = {};
    if (applicationIds?.length) where.applicationId = { in: applicationIds };

    const applications = await prisma.application.findMany({
      where, orderBy: { updatedAt: 'asc' }, take: limit,
      include: {
        user: true, bankStatements: true, rechargeData: true, electricityBills: true, educationFees: true, repaymentHistory: true
      }
    });

    if (!applications.length) return res.json({ message: 'No applications found', processed: 0 });

    const successes = [];
    const failures = [];

    for (const appRecord of applications) {
      try {
        const mlPayload = {
          name: appRecord.user?.name || 'Beneficiary',
          mobile: appRecord.user?.mobile || '0000000000',
          email: appRecord.user?.email || 'unknown@safecred.com',
          age: appRecord.user?.age || 30,
          has_children: appRecord.user?.hasChildren || false,
          is_socially_disadvantaged: appRecord.user?.isSociallyDisadvantaged || false,
          dependents: 0, declared_income: appRecord.declaredIncome, loan_amount: appRecord.loanAmount,
          tenure_months: appRecord.tenureMonths, purpose: appRecord.purpose || 'Partner Upload', existing_loan_amt: 0,
          consent_recharge: appRecord.consentRecharge, consent_electricity: appRecord.consentElectricity,
          consent_education: appRecord.consentEducation, consent_bank: appRecord.consentBankStatement,
          consent_bank_statement: appRecord.consentBankStatement, application_id: appRecord.applicationId,
          bank_statement: computeBankAggregates(appRecord.bankStatements),
        };

        const mlResponse = await axios.post(\`\${ML_API_URL}/apply_direct\`, mlPayload, { timeout: 30000 });
        const mlResult = mlResponse.data;
        const normalizedRiskBand = normalizeRiskBand(mlResult.risk_band);

        const updated = await prisma.application.update({
          where: { id: appRecord.id },
          data: {
            mlProbability: mlResult.ml_probability, compositeScore: mlResult.composite_score, finalSci: mlResult.final_sci,
            riskBand: normalizedRiskBand, approvedLoanAmount: mlResult.loan_offer, decisionMessage: mlResult.message,
            status: statusFromMl(mlResult.status), processedAt: new Date()
          }
        });

        successes.push({ applicationId: updated.applicationId, status: updated.status, finalSci: updated.finalSci });
      } catch (err: any) {
        failures.push({ applicationId: appRecord.applicationId, error: err.message });
      }
    }

    return res.json({ processed: applications.length, successes, failures });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to trigger re-scoring' });
  }
};
