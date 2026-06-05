import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();


// Generate unique application ID
const generateApplicationId = (): string => {
  const timestamp = new Date().toISOString().replace(/[-:\.TZ]/g, '').substring(0, 14);
  return `APP${timestamp}`;
};

export const createApplication = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    console.log('📝 Creating application for user:', req.userId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const {
      declaredIncome,
      loanAmount,
      tenureMonths,
      purpose,
      consumptionData, // New: consumption-based income verification data
      consentDataSharing,
      consentRecharge,
      consentElectricity,
      consentEducation,
      consentBankStatement,
      bankStatements,
      rechargeData: legacyRechargeData,
      electricityBills: legacyElectricityBills,
      educationFees: legacyEducationFees,
      // Frontend summary objects
      bankStatement,
      rechargeHistory,
      electricityBills,
      educationFees,
      repaymentHistory
    } = req.body;

    const applicationId = generateApplicationId();

    // Extract consumption data with defaults
    const {
      monthlyElectricityUnits = 0,
      monthlyElectricityAmount = 0,
      monthlyRechargeAmount = 0,
      rechargeFrequency = 0,
      monthlyEducationExpense = 0,
      householdSize = 1
    } = consumptionData || {};

    console.log('📊 Consumption data:', {
      monthlyElectricityUnits,
      monthlyElectricityAmount,
      monthlyRechargeAmount,
      rechargeFrequency,
      monthlyEducationExpense,
      householdSize
    });

    // Create application with consumption data
    const application = await prisma.application.create({
      data: {
        applicationId,
        userId: req.userId!,
        declaredIncome,
        loanAmount,
        tenureMonths,
        purpose: purpose || null,
        consentRecharge: consentRecharge || consentDataSharing || false,
        consentElectricity: consentElectricity || consentDataSharing || false,
        consentEducation: consentEducation || consentDataSharing || false,
        consentBankStatement: consentBankStatement || false,
        status: 'PENDING',
        
        // Store consumption data in related tables
        // 1. Electricity
        ...((electricityBills?.avgPayment > 0 || monthlyElectricityAmount > 0) && {
          electricityBills: {
            create: [{
              month: new Date().toISOString().substring(0, 7), // Format: "2025-10"
              amount: Number(electricityBills?.avgPayment || monthlyElectricityAmount),
              units: Number(electricityBills?.avgPayment || monthlyElectricityAmount) / 6.0, // Approx units
              paidOnTime: true
            }]
          }
        }),
        
        // 2. Recharge
        ...((rechargeHistory?.avgAmount > 0 || monthlyRechargeAmount > 0) && {
          rechargeData: {
            create: Array(Number(rechargeHistory?.frequency || 1)).fill(0).map((_, i) => ({
              date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000), // Spread over months
              amount: Number(rechargeHistory?.avgAmount || monthlyRechargeAmount),
              operator: 'User Provided'
            }))
          }
        }),
        
        // 3. Education
        ...((educationFees?.avgFee > 0 || monthlyEducationExpense > 0) && {
          educationFees: {
            create: [{
              academicYear: '2024-25',
              amount: Number(educationFees?.avgFee || monthlyEducationExpense),
              institutionName: 'User Provided',
              dueDate: new Date(),
              paidDate: new Date(),
              isPaid: true,
              isLate: false
            }]
          }
        }),
        
        // 4. Bank Statement (Create dummy entries to represent summary)
        ...((bankStatement?.monthlyCredits > 0) && {
          bankStatements: {
            create: [{
              date: new Date(),
              description: 'Salary/Income Credit',
              credit: Number(bankStatement.monthlyCredits),
              debit: 0,
              balance: Number(bankStatement.avgBalance || 0),
              category: 'salary'
            }]
          }
        }),

        // 5. Repayment History (Store in related table)
        ...((repaymentHistory?.previousLoansCount > 0) && {
          repaymentHistory: {
            create: [{
              emiNumber: 1,
              emiAmount: 0, // Unknown
              dueDate: new Date(),
              isPaid: true,
              isLate: false,
              daysLate: Number(repaymentHistory.avgPaymentDelayDays || 0)
            }]
          }
        }),
        
        // Create related documents from legacy data if provided (keeping existing logic)
        ...(bankStatements?.length > 0 && {
          bankStatements: {
            create: bankStatements.map((stmt: any) => ({
              date: new Date(stmt.date),
              description: stmt.description,
              debit: stmt.debit || 0,
              credit: stmt.credit || 0,
              balance: stmt.balance
            }))
          }
        }),
        
        ...(legacyRechargeData?.length > 0 && {
          rechargeData: {
            create: legacyRechargeData.map((rd: any) => ({
              date: new Date(rd.date),
              amount: rd.amount,
              operator: rd.operator
            }))
          }
        }),
        
        ...(legacyElectricityBills?.length > 0 && {
          electricityBills: {
            create: legacyElectricityBills.map((eb: any) => ({
              month: eb.month,
              amount: eb.amount,
              units: eb.units,
              paidOnTime: eb.paidOnTime !== false
            }))
          }
        }),
        
        ...(legacyEducationFees?.length > 0 && {
          educationFees: {
            create: legacyEducationFees.map((ef: any) => ({
              month: ef.month,
              amount: ef.amount,
              institution: ef.institution,
              paidOnTime: ef.paidOnTime !== false
            }))
          }
        })
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

    console.log('✅ Application created successfully:', applicationId);

    res.status(201).json({
      message: 'Application created successfully',
      application
    });
  } catch (error: any) {
    console.error('❌ Create application error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    res.status(500).json({ 
      error: 'Failed to create application',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getUserApplications = async (req: AuthRequest, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.userId },
      include: {
        bankStatements: true,
        rechargeData: true,
        electricityBills: true,
        educationFees: true
      },
      orderBy: { createdAt: 'desc' }
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

export const submitApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get application with all related data
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
        repaymentHistory: true,
        user: true
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ error: 'Application already submitted' });
    }

    // Update status to processing
    await prisma.application.update({
      where: { id },
      data: { status: 'PROCESSING' }
    });

    // Prepare data for ML API
    const round = (value: number, decimals = 2) => {
      if (value === undefined || value === null) {
        return 0;
      }
      const factor = Math.pow(10, decimals);
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return 0;
      }
      return Math.round(numeric * factor) / factor;
    };

    const bankStatementSummary = application.bankStatements.length > 0
      ? (() => {
          const totalCredits = application.bankStatements.reduce((sum: number, stmt: any) => sum + Number(stmt.credit ?? 0), 0);
          const totalDebits = application.bankStatements.reduce((sum: number, stmt: any) => sum + Number(stmt.debit ?? 0), 0);
          const avgBalance = application.bankStatements.reduce((sum: number, stmt: any) => sum + Number(stmt.balance ?? 0), 0) /
            application.bankStatements.length;
          const monthsTracked = new Set(
            application.bankStatements.map((stmt: any) => stmt.date.toISOString().substring(0, 7))
          );
          const monthlyCredits = totalCredits / Math.max(1, monthsTracked.size);
          const salaryCount = application.bankStatements.filter((stmt: any) =>
            stmt.description?.toLowerCase().includes('salary')
          ).length;
          const bounceCount = application.bankStatements.filter((stmt: any) =>
            stmt.description?.toLowerCase().includes('bounce')
          ).length;

          return {
            monthly_credits: round(monthlyCredits),
            avg_balance: round(avgBalance),
            total_credits: round(totalCredits),
            total_debits: round(totalDebits),
            salary_count: salaryCount,
            bounce_count: bounceCount
          };
        })()
      : undefined;

    const rechargeSummary = application.rechargeData.length > 0
      ? (() => {
          const totalAmount = application.rechargeData.reduce((sum: number, rd: any) => sum + Number(rd.amount ?? 0), 0);
          const frequency = application.rechargeData.length;
          const avgAmount = totalAmount / Math.max(1, frequency);
          return {
            total_amount: round(totalAmount),
            frequency,
            avg_amount: round(avgAmount),
            consistency: 0.9,
            recharge_count: frequency
          };
        })()
      : undefined;

    const electricitySummary = application.electricityBills.length > 0
      ? (() => {
          const totalPaid = application.electricityBills.reduce((sum: number, bill: any) => sum + Number(bill.amount ?? 0), 0);
          const frequency = application.electricityBills.length;
          const avgPayment = totalPaid / Math.max(1, frequency);
          const onTimeCount = application.electricityBills.filter((bill: any) => bill.paidOnTime).length;
          const onTimeRatio = frequency > 0 ? onTimeCount / frequency : 0.5;
          return {
            total_paid: round(totalPaid),
            frequency,
            avg_payment: round(avgPayment),
            consistency: round(onTimeRatio, 2),
            ontime_ratio: round(onTimeRatio, 2)
          };
        })()
      : undefined;

    const educationSummary = application.educationFees.length > 0
      ? (() => {
          const totalPaid = application.educationFees.reduce((sum: number, fee: any) => sum + Number(fee.amount ?? 0), 0);
          const frequency = application.educationFees.length;
          const avgFee = totalPaid / Math.max(1, frequency);
          return {
            total_paid: round(totalPaid),
            frequency,
            avg_fee: round(avgFee),
            consistency: 0.9,
            ontime_ratio: 0.95
          };
        })()
      : undefined;

    // Build repayment history from actual database records only
    const repaymentRecords = (application as any).repaymentHistory || [];
    const repaymentHistorySummary = repaymentRecords.length > 0
      ? (() => {
          const onTimeCount = repaymentRecords.filter((r: any) => r.isPaid && !r.isLate).length;
          const lateCount = repaymentRecords.filter((r: any) => r.isPaid && r.isLate).length;
          const missedCount = repaymentRecords.filter((r: any) => !r.isPaid).length;
          const total = repaymentRecords.length;
          const avgDelayDays = repaymentRecords.reduce(
            (sum: number, r: any) => sum + (r.daysLate || 0), 0
          ) / Math.max(1, total);

          return {
            ontime_count: onTimeCount,
            late_count: lateCount,
            missed_count: missedCount,
            avg_repayment_ratio: total > 0 ? round(onTimeCount / total) : 0.5,
            previous_loans_count: total,
            on_time_ratio: total > 0 ? round(onTimeCount / total) : 0.5,
            avg_payment_delay_days: round(avgDelayDays),
            time_since_last_loan: 12,
            previous_defaults: missedCount
          };
        })()
      : undefined; // No history → ML treats as new user

    const mlPayload = {
      name: application.user.name,
      mobile: application.user.mobile,
      email: application.user.email,
      age: application.user.age ?? 30,
      has_children: application.user.hasChildren,
      is_socially_disadvantaged: application.user.isSociallyDisadvantaged,
      dependents: application.user.hasChildren ? Math.max(1, application.educationFees.length || 1) : 0,
      declared_income: application.declaredIncome,
      loan_amount: application.loanAmount,
      tenure_months: application.tenureMonths,
      purpose: application.purpose || 'Personal',
      existing_loan_amt: 0,
      consent_recharge: application.consentRecharge,
      consent_electricity: application.consentElectricity,
      consent_education: application.consentEducation,
      consent_bank: application.bankStatements.length > 0,
      bank_statement: bankStatementSummary,
      recharge_history: rechargeSummary,
      electricity_bills: electricitySummary,
      education_fees: educationSummary,
      repayment_history: repaymentHistorySummary,
      application_id: application.applicationId
    };

    // Call ML API
    try {
      console.log('🤖 Calling ML API at:', `${process.env.ML_API_URL}/apply_direct`);
      
      const mlResponse = await axios.post(
        `${process.env.ML_API_URL}/apply_direct`,
        mlPayload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      console.log('✅ ML API response received:', mlResponse.data);

      const mlResult = mlResponse.data;

      // Store ML outputs exactly as returned by the guarded ML decision layer.
      let finalSci = Number(mlResult.final_sci ?? 0);
      const mlProbability = Number(mlResult.ml_probability ?? 0);
      const compositeScore = Number(mlResult.composite_score ?? 0);
      const riskBand = mlResult.risk_band;
      const needCategory = mlResult.risk_category || riskBand;

      let appStatus: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW' = 'MANUAL_REVIEW';
      if (mlResult.status === 'approved') appStatus = 'APPROVED';
      else if (mlResult.status === 'rejected') appStatus = 'REJECTED';

      if (appStatus === 'MANUAL_REVIEW' && riskBand === 'Low Risk') {
        mlResult.message = `Your application is under review. You may be eligible for a loan up to ₹${Number(mlResult.loan_offer || application.loanAmount).toLocaleString()}.`;
      }

      if (appStatus === 'APPROVED') {
        const approvedAmount = Number(application.loanAmount);
        const formattedAmount = Number.isFinite(approvedAmount)
          ? `₹${approvedAmount.toLocaleString()}`
          : 'the requested amount';
        const approvalLine = ` Your loan is approved for ${formattedAmount}.`;
        mlResult.message = `${mlResult.message || 'Your loan is approved.'}${approvalLine}`.trim();
      }

      mlResult.final_sci = finalSci;

      // Update application with ML results
      const updatedApplication = await prisma.application.update({
        where: { id },
        data: {
          status: appStatus,
          mlProbability: mlProbability,
          compositeScore: compositeScore,
          finalSci: finalSci,
          riskBand: riskBand,
          needCategory: needCategory,
          // loanOffer and interestRate removed - NBCFDC is non-profit (no interest)
          scoreDetails: mlResult.details ?? undefined,
          decisionMessage: mlResult.message,
          processedAt: new Date()
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

      res.json({
        message: 'Application processed successfully',
        application: updatedApplication,
        mlResult
      });

    } catch (mlError: any) {
      console.error('❌ ML API error:', mlError.message);
      console.error('ML API error details:', {
        url: `${process.env.ML_API_URL}/apply_direct`,
        status: mlError.response?.status,
        data: mlError.response?.data,
        message: mlError.message,
        payload: mlPayload // Log the payload that was sent
      });
      
      // Update status back to pending on ML error
      await prisma.application.update({
        where: { id },
        data: { status: 'PENDING' }
      });

      return res.status(500).json({ 
        error: 'Failed to process application with ML service',
        details: mlError.message,
        mlApiUrl: `${process.env.ML_API_URL}/apply_direct`,
        mlErrorData: mlError.response?.data, // Include ML error response
        mlStatus: mlError.response?.status
      });
    }

  } catch (error: any) {
    console.error('Submit application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};
