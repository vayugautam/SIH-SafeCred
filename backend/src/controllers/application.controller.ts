import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { sendEmail, applicationSubmittedEmail, adminNotificationEmail } from '../utils/email';

const prisma = new PrismaClient();

const generateApplicationId = (): string => {
  const timestamp = new Date().toISOString().replace(/[-:\.TZ]/g, '').substring(0, 14);
  return `APP${timestamp}`;
};

const boundedCount = (value: number | undefined, max = 24) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0;
  return Math.min(max, Math.max(0, Math.round(value)));
};

const monthsAgo = (index: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() - index);
  return date;
};

const normalizeRiskBand = (riskBand?: string | null) =>
  riskBand?.replace(' ', '_').toUpperCase() ?? null;

const statusFromMl = (status?: string) =>
  status === 'approved' ? 'APPROVED' :
  status === 'rejected' ? 'REJECTED' : 'MANUAL_REVIEW';

export const createApplication = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      declaredIncome,
      loanAmount,
      tenureMonths,
      purpose,
      consentRecharge,
      consentElectricity,
      consentEducation,
      consentBankStatement,
      existingLoanAmount,
      bankStatement,
      rechargeHistory,
      electricityBills,
      educationFees,
      repaymentHistory: repaymentHistoryInput,
    } = req.body;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rechargeCount = boundedCount(rechargeHistory?.frequency);
    const electricityCount = boundedCount(electricityBills?.frequency);
    const educationCount = boundedCount(educationFees?.frequency);
    const electricityOnTimeCount = Math.round(electricityCount * (electricityBills?.consistency ?? 1));
    const educationOnTimeCount = Math.round(educationCount * (educationFees?.onTimeRatio ?? educationFees?.consistency ?? 1));

    const applicationId = generateApplicationId();

    // Create application and persist user-provided consumption evidence
    const application = await prisma.application.create({
      data: {
        applicationId,
        userId: user.id,
        declaredIncome,
        loanAmount,
        tenureMonths,
        purpose,
        consentRecharge: consentRecharge || false,
        consentElectricity: consentElectricity || false,
        consentEducation: consentEducation || false,
        consentBankStatement: consentBankStatement || false,
        status: 'PROCESSING',
        ...(consentBankStatement && bankStatement?.monthlyCredits && {
          bankStatements: {
            create: [{
              date: new Date(),
              description: 'User provided income summary',
              credit: bankStatement.monthlyCredits,
              debit: 0,
              balance: bankStatement.avgBalance ?? 0,
              category: 'income_summary',
            }],
          },
        }),
        ...(consentRecharge && rechargeCount > 0 && rechargeHistory?.avgAmount && {
          rechargeData: {
            create: Array.from({ length: rechargeCount }, (_, index) => ({
              date: monthsAgo(index),
              amount: rechargeHistory.avgAmount ?? 0,
              operator: 'User Provided',
            })),
          },
        }),
        ...(consentElectricity && electricityCount > 0 && electricityBills?.avgPayment && {
          electricityBills: {
            create: Array.from({ length: electricityCount }, (_, index) => {
              const billDate = monthsAgo(index);
              const dueDate = new Date(billDate);
              dueDate.setDate(dueDate.getDate() + 15);
              const paidOnTime = index < electricityOnTimeCount;
              const paidDate = new Date(dueDate);
              if (!paidOnTime) paidDate.setDate(paidDate.getDate() + 7);

              return {
                month: `${billDate.getFullYear()}-${String(billDate.getMonth() + 1).padStart(2, '0')}`,
                billDate,
                dueDate,
                amount: electricityBills.avgPayment ?? 0,
                unitsConsumed: (electricityBills.avgPayment ?? 0) / 6,
                paidDate,
                isPaid: true,
                isLate: !paidOnTime,
              };
            }),
          },
        }),
        ...(consentEducation && user.hasChildren && educationCount > 0 && educationFees?.avgFee && {
          educationFees: {
            create: Array.from({ length: educationCount }, (_, index) => {
              const dueDate = monthsAgo(index);
              const paidOnTime = index < educationOnTimeCount;
              const paidDate = new Date(dueDate);
              if (!paidOnTime) paidDate.setDate(paidDate.getDate() + 10);

              return {
                academicYear: `${dueDate.getFullYear()}-${String((dueDate.getFullYear() + 1) % 100).padStart(2, '0')}`,
                amount: educationFees.avgFee ?? 0,
                dueDate,
                paidDate,
                isPaid: true,
                isLate: !paidOnTime,
                institutionName: 'User Provided',
              };
            }),
          },
        }),
      },
    });

    // Fetch user's historical data for ML scoring
    const previousApplications = await prisma.application.findMany({
      where: {
        userId: user.id,
        status: { in: ['DISBURSED', 'APPROVED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        repaymentHistory: {
          orderBy: { dueDate: 'desc' },
        },
      },
    });

    let totalPayments = 0;
    let onTimePayments = 0;
    let totalDelayDays = 0;
    let totalDefaults = 0;
    let totalPreviousLoanAmount = 0;

    previousApplications.forEach((app: any) => {
      totalPreviousLoanAmount += app.loanAmount;
      app.repaymentHistory.forEach((payment: any) => {
        totalPayments++;
        if (!payment.isLate) {
          onTimePayments++;
        } else {
          totalDelayDays += payment.daysLate;
        }
        if (!payment.isPaid) {
          totalDefaults++;
        }
      });
    });

    const onTimeRatio = totalPayments > 0 ? onTimePayments / totalPayments : 0;
    const avgDelayDays = totalPayments > 0 ? totalDelayDays / totalPayments : 0;
    const avgPrevRepaymentRatio = totalPayments > 0 ? onTimePayments / totalPayments : 0;

    let timeSinceLastLoan = 999;
    if (previousApplications.length > 0 && previousApplications[0].createdAt) {
      try {
        timeSinceLastLoan = Math.floor(
          (Date.now() - new Date(previousApplications[0].createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)
        );
      } catch (e) {
        timeSinceLastLoan = 999;
      }
    }

    const existingLoanAmt = typeof existingLoanAmount === 'number' ? existingLoanAmount : totalPreviousLoanAmount;

    const trustedRepaymentHistory = totalPayments > 0
      ? {
          on_time_ratio: onTimeRatio,
          avg_payment_delay_days: avgDelayDays,
          missed_count: totalDefaults,
          avg_repayment_ratio: avgPrevRepaymentRatio,
          previous_loans_count: previousApplications.length,
          time_since_last_loan: timeSinceLastLoan,
        }
      : undefined;

    const mlPayload = {
      name: user.name,
      mobile: user.mobile || '0000000000',
      email: user.email,
      age: user.age || 30,
      has_children: user.hasChildren || false,
      is_socially_disadvantaged: user.isSociallyDisadvantaged || false,
      dependents: 0,
      declared_income: declaredIncome,
      loan_amount: loanAmount,
      tenure_months: tenureMonths,
      purpose: purpose || 'Personal',
      existing_loan_amt: existingLoanAmt,
      consent_recharge: consentRecharge || false,
      consent_electricity: consentElectricity || false,
      consent_education: consentEducation || false,
      consent_bank: consentBankStatement || false,
      consent_bank_statement: consentBankStatement || false,
      application_id: application.applicationId,
      bank_statement: bankStatement
        ? {
            monthly_credits: bankStatement.monthlyCredits,
            avg_balance: bankStatement.avgBalance,
          }
        : undefined,
      recharge_history: rechargeHistory
        ? {
            frequency: rechargeHistory.frequency,
            avg_amount: rechargeHistory.avgAmount,
          }
        : undefined,
      electricity_bills: electricityBills
        ? {
            frequency: electricityBills.frequency,
            avg_payment: electricityBills.avgPayment,
            consistency: electricityBills.consistency,
          }
        : undefined,
      education_fees: educationFees
        ? {
            avg_fee: educationFees.avgFee,
            consistency: educationFees.consistency,
            ontime_ratio: educationFees.onTimeRatio,
            frequency: educationFees.frequency,
          }
        : undefined,
      repayment_history: trustedRepaymentHistory,
    };

    console.log('🤖 Calling ML API at:', `${process.env.ML_API_URL || 'http://localhost:8002'}/apply_direct`);

    try {
      const mlResponse = await axios.post(`${process.env.ML_API_URL || 'http://localhost:8002'}/apply_direct`, mlPayload, {
        timeout: 30000,
      });

      const mlResult = mlResponse.data;

      const normalizedRiskBand = normalizeRiskBand(mlResult.risk_band);
      const riskNeedLabel = mlResult.risk_category
        ? `${mlResult.risk_category} + ${mlResult.risk_band}`
        : `${user.isSociallyDisadvantaged ? 'High Need' : 'Low Need'} + ${mlResult.risk_band ?? 'Unclassified'}`;

      const updateData: any = {
        mlProbability: mlResult.ml_probability,
        compositeScore: mlResult.composite_score,
        finalSci: mlResult.final_sci,
        riskBand: normalizedRiskBand,
        riskCategory: mlResult.risk_category ?? null,
        needCategory: riskNeedLabel,
        approvedLoanAmount: mlResult.loan_offer,
        decisionMessage: mlResult.message,
        scoreDetails: mlResult.details ?? null,
        status: statusFromMl(mlResult.status),
        processedAt: new Date(),
        submittedAt: new Date(),
      };

      if (mlResult.status === 'approved') {
        updateData.approvedAt = new Date();
      } else if (mlResult.status === 'rejected') {
        updateData.rejectedAt = new Date();
      }

      const updatedApplication = await prisma.application.update({
        where: { id: application.id },
        data: updateData,
        include: {
          user: {
            select: { id: true, name: true, email: true, mobile: true },
          },
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Loan Application Processed',
          message: mlResult.message,
          type: mlResult.status === 'approved' ? 'success' : mlResult.status === 'rejected' ? 'error' : 'info',
          link: `/dashboard/applications/${application.applicationId}`,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'application_submitted',
          entity: 'Application',
          entityId: application.id,
          details: JSON.stringify({
            applicationId: application.applicationId,
            loanAmount: loanAmount,
            status: updatedApplication.status,
            riskBand: updatedApplication.riskBand,
          }),
        },
      });

      // Send emails
      try {
        const userEmailContent = applicationSubmittedEmail(user.name, application.applicationId, loanAmount);
        await sendEmail({
          to: user.email,
          subject: userEmailContent.subject,
          html: userEmailContent.html
        });

        if (updatedApplication.status === 'MANUAL_REVIEW') {
          const adminUsers = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { email: true }
          });

          const adminEmailContent = adminNotificationEmail(
            application.applicationId,
            user.name,
            loanAmount,
            mlResult.composite_score || 0
          );

          for (const admin of adminUsers) {
            await sendEmail({
              to: admin.email,
              subject: adminEmailContent.subject,
              html: adminEmailContent.html
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send emails:', emailError);
      }

      return res.status(201).json({
        success: true,
        message: 'Application processed successfully',
        application: updatedApplication,
        mlResult: {
          applicationId: mlResult.application_id,
          status: mlResult.status,
          riskBand: mlResult.risk_band,
          riskCategory: mlResult.risk_category,
          needCategory: riskNeedLabel,
          loanOffer: mlResult.loan_offer,
          finalSci: mlResult.final_sci,
          compositeScore: mlResult.composite_score,
          mlProbability: mlResult.ml_probability,
          message: mlResult.message,
          details: mlResult.details
            ? {
                ...mlResult.details,
                scoreBreakdown: mlResult.details.score_breakdown,
                combineDetails: mlResult.details.combine_details,
              }
            : null,
        },
      });

    } catch (mlError: any) {
      console.error('❌ ML API error:', mlError.message);
      
      await prisma.application.update({
        where: { id: application.id },
        data: {
          status: 'MANUAL_REVIEW',
          decisionMessage: 'Application requires manual review due to processing error',
        },
      });

      return res.status(202).json({
        success: true,
        message: 'Your application is submitted and queued for manual review while we reconnect to the scoring service.',
        application: {
          applicationId: application.applicationId,
          status: 'MANUAL_REVIEW',
          decisionMessage: 'Application requires manual review due to temporary scoring outage.',
        },
        mlResult: null
      });
    }
  } catch (error: any) {
    console.error('Submit application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserApplications = async (req: AuthRequest, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        applicationId: true,
        loanAmount: true,
        approvedLoanAmount: true,
        tenureMonths: true,
        status: true,
        riskBand: true,
        riskCategory: true,
        needCategory: true,
        finalSci: true,
        mlProbability: true,
        compositeScore: true,
        decisionMessage: true,
        scoreDetails: true,
        consentRecharge: true,
        consentElectricity: true,
        consentEducation: true,
        consentBankStatement: true,
        createdAt: true,
        processedAt: true,
      },
    });

    res.json({ applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
};

export const getApplicationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findFirst({
      where: {
        id,
        userId: req.userId
      },
      include: {
        bankStatements: true,
        rechargeData: true,
        electricityBills: true,
        educationFees: true,
        user: {
          select: {
            name: true,
            email: true,
            mobile: true,
            age: true,
            hasChildren: true,
            isSociallyDisadvantaged: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to get application' });
  }
};

// Remove the legacy 'submitApplication' endpoint entirely since it's merged into createApplication.
