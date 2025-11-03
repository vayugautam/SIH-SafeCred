import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import axios from 'axios'
import { sendEmail, applicationSubmittedEmail, adminNotificationEmail } from '@/lib/email'

const bankStatementSchema = z
  .object({
    monthlyCredits: z.number().min(0).optional(),
    avgBalance: z.number().min(0).optional(),
  })
  .optional()

const rechargeHistorySchema = z
  .object({
    frequency: z.number().min(0).optional(),
    avgAmount: z.number().min(0).optional(),
  })
  .optional()

const electricityBillsSchema = z
  .object({
    frequency: z.number().min(0).optional(),
    avgPayment: z.number().min(0).optional(),
    consistency: z.number().min(0).max(1).optional(),
  })
  .optional()

const educationFeesSchema = z
  .object({
    avgFee: z.number().min(0).optional(),
    consistency: z.number().min(0).max(1).optional(),
    onTimeRatio: z.number().min(0).max(1).optional(),
    frequency: z.number().min(0).optional(),
  })
  .optional()

const repaymentHistorySchema = z
  .object({
    onTimeRatio: z.number().min(0).max(1).optional(),
    avgPaymentDelayDays: z.number().min(0).optional(),
    missedCount: z.number().min(0).optional(),
    previousLoansCount: z.number().min(0).optional(),
    timeSinceLastLoan: z.number().min(0).optional(),
  })
  .optional()

const applicationSchema = z.object({
  declaredIncome: z.number().min(0),
  loanAmount: z.number().min(1000).max(100000),
  tenureMonths: z.number().min(3).max(36),
  purpose: z.string().optional(),
  consentRecharge: z.boolean().default(false),
  consentElectricity: z.boolean().default(false),
  consentEducation: z.boolean().default(false),
  consentBankStatement: z.boolean().default(false),
  existingLoanAmount: z.number().min(0).optional(),
  bankStatement: bankStatementSchema,
  rechargeHistory: rechargeHistorySchema,
  electricityBills: electricityBillsSchema,
  educationFees: educationFeesSchema,
  repaymentHistory: repaymentHistorySchema,
})

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8002'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = applicationSchema.parse(body)

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
    } = validatedData

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create application in database first
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        declaredIncome,
        loanAmount,
        tenureMonths,
        purpose,
        consentRecharge,
        consentElectricity,
        consentEducation,
        consentBankStatement,
        status: 'PROCESSING',
      },
    })

    // Fetch user's historical data for ML scoring
    const previousApplications = await prisma.application.findMany({
      where: {
        userId: user.id,
        status: { in: ['DISBURSED', 'APPROVED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 successful applications
      include: {
        repaymentHistory: {
          orderBy: { dueDate: 'desc' },
        },
      },
    })

    // Calculate repayment metrics from history
    let totalPayments = 0
    let onTimePayments = 0
    let totalDelayDays = 0
    let totalDefaults = 0
    let totalPreviousLoanAmount = 0

    previousApplications.forEach((app: any) => {
      totalPreviousLoanAmount += app.loanAmount
      app.repaymentHistory.forEach((payment: any) => {
        totalPayments++
        if (!payment.isLate) {
          onTimePayments++
        } else {
          totalDelayDays += payment.daysLate
        }
        if (!payment.isPaid) {
          totalDefaults++
        }
      })
    })

    const onTimeRatio = totalPayments > 0 ? onTimePayments / totalPayments : 0
  const avgDelayDays = totalPayments > 0 ? totalDelayDays / totalPayments : 0
  const avgPrevRepaymentRatio = totalPayments > 0 ? onTimePayments / totalPayments : 0

    // Calculate time since last loan safely
    let timeSinceLastLoan = 999 // Default for users with no previous loans
    if (previousApplications.length > 0 && previousApplications[0].createdAt) {
      try {
        timeSinceLastLoan = Math.floor(
          (Date.now() - new Date(previousApplications[0].createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)
        )
      } catch (dateError) {
        console.error('Error calculating time since last loan:', dateError)
        timeSinceLastLoan = 999
      }
    }

    // Prepare data for ML API with historical context
    const existingLoanAmt = typeof existingLoanAmount === 'number' ? existingLoanAmount : totalPreviousLoanAmount

    const mergedRepaymentHistory = {
      on_time_ratio:
        typeof repaymentHistoryInput?.onTimeRatio === 'number'
          ? repaymentHistoryInput.onTimeRatio
          : onTimeRatio,
      avg_payment_delay_days:
        typeof repaymentHistoryInput?.avgPaymentDelayDays === 'number'
          ? repaymentHistoryInput.avgPaymentDelayDays
          : avgDelayDays,
      missed_count:
        typeof repaymentHistoryInput?.missedCount === 'number'
          ? repaymentHistoryInput.missedCount
          : totalDefaults,
      avg_repayment_ratio:
        typeof repaymentHistoryInput?.onTimeRatio === 'number'
          ? repaymentHistoryInput.onTimeRatio
          : avgPrevRepaymentRatio,
      previous_loans_count:
        typeof repaymentHistoryInput?.previousLoansCount === 'number'
          ? repaymentHistoryInput.previousLoansCount
          : previousApplications.length,
      time_since_last_loan:
        typeof repaymentHistoryInput?.timeSinceLastLoan === 'number'
          ? repaymentHistoryInput.timeSinceLastLoan
          : timeSinceLastLoan,
    }

    const mlPayload = {
      name: user.name,
      mobile: user.mobile || '0000000000',
      email: user.email,
      age: user.age || 30,
      has_children: user.hasChildren || false,
      is_socially_disadvantaged: user.isSociallyDisadvantaged || false,
      dependents: 0, // Default value
      declared_income: declaredIncome,
      loan_amount: loanAmount,
      tenure_months: tenureMonths,
      purpose: purpose || 'Personal',
      existing_loan_amt: existingLoanAmt,
      consent_recharge: consentRecharge || false,
      consent_electricity: consentElectricity || false,
      consent_education: consentEducation || false,
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
      repayment_history: mergedRepaymentHistory,
    }

    console.log('📊 ML Payload Summary:', {
      user: user.email,
      income: validatedData.declaredIncome,
      loan: validatedData.loanAmount,
      previousLoans: previousApplications.length,
      onTimeRatio,
      totalPayments,
    })

    try {
      // Call Python ML API
      console.log('🚀 Calling ML API at:', ML_API_URL)
      const mlResponse = await axios.post(`${ML_API_URL}/apply_direct`, mlPayload, {
        timeout: 30000, // 30 seconds
      })

  console.log('✅ ML API Response received')
  const mlResult = mlResponse.data

      // Update application with ML results
        const normalizedRiskBand = mlResult.risk_band?.replace(' ', '_').toUpperCase()
        const riskNeedLabel = mlResult.risk_category
          ? `${mlResult.risk_category} + ${mlResult.risk_band}`
          : `${user.isSociallyDisadvantaged ? 'High Need' : 'Low Need'} + ${mlResult.risk_band ?? 'Unclassified'}`

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
          status: mlResult.status === 'approved' ? 'APPROVED' :
                  mlResult.status === 'rejected' ? 'REJECTED' : 'MANUAL_REVIEW',
          processedAt: new Date(),
          submittedAt: new Date(),
        }

        if (mlResult.status === 'approved') {
          updateData.approvedAt = new Date()
          updateData.rejectedAt = null
        } else if (mlResult.status === 'rejected') {
          updateData.approvedAt = null
          updateData.rejectedAt = new Date()
        } else {
          updateData.approvedAt = null
          updateData.rejectedAt = null
        }

        const updatedApplication = await prisma.application.update({
          where: { id: application.id },
          data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true,
            },
          },
        },
      })

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Loan Application Processed',
          message: mlResult.message,
          type: mlResult.status === 'approved' ? 'success' : 
                mlResult.status === 'rejected' ? 'error' : 'info',
          link: `/dashboard/applications/${application.applicationId}`,
        },
      })

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'application_submitted',
          entity: 'Application',
          entityId: application.id,
          details: JSON.stringify({
            applicationId: application.applicationId,
            loanAmount: validatedData.loanAmount,
            status: updatedApplication.status,
            riskBand: updatedApplication.riskBand,
            riskCategory: (updatedApplication as any).riskCategory,
            needCategory: (updatedApplication as any).needCategory,
          }),
        },
      })

      // Send emails (non-blocking)
      try {
        // Send confirmation email to applicant
        const userEmailContent = applicationSubmittedEmail(
          user.name, 
          application.applicationId, 
          validatedData.loanAmount
        )
        await sendEmail({
          to: user.email,
          subject: userEmailContent.subject,
          html: userEmailContent.html
        })

        // Send notification to admins if manual review needed
        if (updatedApplication.status === 'MANUAL_REVIEW') {
          const adminUsers = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { email: true }
          })

          const adminEmailContent = adminNotificationEmail(
            application.applicationId,
            user.name,
            validatedData.loanAmount,
            mlResult.composite_score || 0
          )

          for (const admin of adminUsers) {
            await sendEmail({
              to: admin.email,
              subject: adminEmailContent.subject,
              html: adminEmailContent.html
            })
          }
        }
      } catch (emailError) {
        console.error('Failed to send emails:', emailError)
        // Don't fail the application if email fails
      }

      return NextResponse.json({
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
      })
    } catch (mlError: any) {
      console.error('❌ ML API error:', mlError.message)
      if (mlError.response) {
        console.error('ML API Response Status:', mlError.response.status)
        console.error('ML API Response Data:', mlError.response.data)
      }

      // Update application status to pending manual review
      await prisma.application.update({
        where: { id: application.id },
        data: {
          status: 'MANUAL_REVIEW',
          decisionMessage: 'Application requires manual review due to processing error',
        },
      })

      return NextResponse.json(
        {
          success: true,
          message:
            'Your application is submitted and queued for manual review while we reconnect to the scoring service.',
          application: {
            applicationId: application.applicationId,
            status: 'MANUAL_REVIEW',
            decisionMessage: 'Application requires manual review due to temporary scoring outage.',
          },
          mlResult: {
            applicationId: application.applicationId,
            status: 'manual_review',
            riskBand: null,
            loanOffer: 0,
            finalSci: null,
            compositeScore: null,
            mlProbability: null,
            message:
              'We will finish your assessment shortly. No action needed from your side right now.',
          },
        },
        { status: 202 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Application submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applications = await prisma.application.findMany({
      where: { userId: session.user.id },
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
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Get applications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
