import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import axios from 'axios'
import { sendEmail, applicationSubmittedEmail, adminNotificationEmail } from '@/lib/email'

const applicationSchema = z.object({
  declaredIncome: z.number().min(0),
  loanAmount: z.number().min(1000).max(100000),
  tenureMonths: z.number().min(3).max(36),
  purpose: z.string().optional(),
  consentRecharge: z.boolean().default(false),
  consentElectricity: z.boolean().default(false),
  consentEducation: z.boolean().default(false),
  consentBankStatement: z.boolean().default(false),
})

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8001'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = applicationSchema.parse(body)

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
        ...validatedData,
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
    const mlPayload = {
      name: user.name,
      mobile: user.mobile || '0000000000',
      email: user.email,
      age: user.age || 30,
      has_children: user.hasChildren || false,
      is_socially_disadvantaged: user.isSociallyDisadvantaged || false,
      dependents: 0, // Default value
      declared_income: validatedData.declaredIncome,
      loan_amount: validatedData.loanAmount,
      tenure_months: validatedData.tenureMonths,
      purpose: validatedData.purpose || 'Personal',
      existing_loan_amt: totalPreviousLoanAmount,
      consent_recharge: validatedData.consentRecharge || false,
      consent_electricity: validatedData.consentElectricity || false,
      consent_education: validatedData.consentEducation || false,
      consent_bank_statement: validatedData.consentBankStatement || false,
      application_id: application.applicationId,
      // Historical repayment data - using exact field names expected by ML API
      repayment_history: {
        on_time_ratio: onTimeRatio,
        avg_payment_delay_days: avgDelayDays,
        missed_count: totalDefaults,
        avg_repayment_ratio: avgPrevRepaymentRatio,
        previous_loans_count: previousApplications.length,
        time_since_last_loan: timeSinceLastLoan,
      },
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
      const updatedApplication = await prisma.application.update({
        where: { id: application.id },
        data: {
          mlProbability: mlResult.ml_probability,
          compositeScore: mlResult.composite_score,
          finalSci: mlResult.final_sci,
          riskBand: mlResult.risk_band?.replace(' ', '_').toUpperCase(),
          approvedLoanAmount: mlResult.loan_offer,
          decisionMessage: mlResult.message,
          status: mlResult.status === 'approved' ? 'APPROVED' : 
                  mlResult.status === 'rejected' ? 'REJECTED' : 'MANUAL_REVIEW',
          processedAt: new Date(),
          submittedAt: new Date(),
        },
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
          loanOffer: mlResult.loan_offer,
          finalSci: mlResult.final_sci,
          message: mlResult.message,
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
          success: false,
          error: 'ML processing failed',
          message: 'Your application has been submitted and will be reviewed manually',
          applicationId: application.applicationId,
        },
        { status: 500 }
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
        finalSci: true,
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
