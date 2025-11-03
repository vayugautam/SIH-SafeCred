import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, Prisma } from '@prisma/client'
import axios from 'axios'
import { z } from 'zod'

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8002'

const requestSchema = z.object({
  applicationIds: z.array(z.string()).min(1).optional(),
  statuses: z.array(z.string()).min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  staleOnly: z.boolean().optional(),
})

type Numeric = number | null | undefined

const avg = (values: Numeric[]): number | undefined => {
  const filtered = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  if (!filtered.length) return undefined
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length
}

const stdDev = (values: Numeric[]): number | undefined => {
  const filtered = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  if (filtered.length < 2) return undefined
  const mean = avg(filtered)
  if (mean === undefined) return undefined
  const variance = filtered.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (filtered.length - 1)
  return Math.sqrt(variance)
}

const monthsCovered = (dates: Date[]) => {
  const labels = new Set<string>()
  dates.forEach((date) => {
    labels.add(`${date.getFullYear()}-${date.getMonth() + 1}`)
  })
  return labels.size || 1
}

const computeBankAggregates = (records: Prisma.BankStatementGetPayload<{}>[]) => {
  if (!records.length) return undefined
  const credits = records.map((record) => record.credit ?? 0)
  const balances = records.map((record) => record.balance ?? 0)
  const totalCredit = credits.reduce((sum, value) => sum + value, 0)
  const timelineMonths = monthsCovered(records.map((record) => record.date))

  return {
    monthly_credits: Number(((totalCredit / timelineMonths) || 0).toFixed(2)),
    avg_balance: avg(balances) ? Number(avg(balances)?.toFixed(2)) : undefined,
  }
}

const computeRechargeAggregates = (records: Prisma.RechargeDataGetPayload<{}>[]) => {
  if (!records.length) return undefined
  const amounts = records.map((record) => record.amount ?? 0)
  const total = amounts.reduce((sum, value) => sum + value, 0)
  const months = monthsCovered(records.map((record) => record.date))

  return {
    frequency: Number((records.length / months).toFixed(2)),
    avg_amount: Number(((total / records.length) || 0).toFixed(2)),
  }
}

const computeElectricityAggregates = (records: Prisma.ElectricityBillGetPayload<{}>[]) => {
  if (!records.length) return undefined
  const payments = records.map((record) => record.amount ?? 0)
  const avgPayment = avg(payments)
  const paymentStd = stdDev(payments)
  const consistency = avgPayment && paymentStd ? Math.max(0, 1 - paymentStd / (avgPayment || 1)) : 0.5

  return {
    frequency: records.length,
    avg_payment: avgPayment ? Number(avgPayment.toFixed(2)) : undefined,
    consistency: Number(consistency.toFixed(2)),
  }
}

const computeEducationAggregates = (records: Prisma.EducationFeeGetPayload<{}>[]) => {
  if (!records.length) return undefined
  const amounts = records.map((record) => record.amount ?? 0)
  const paidOnTime = records.filter((record) => !record.isLate).length

  return {
    avg_fee: avg(amounts) ? Number(avg(amounts)?.toFixed(2)) : undefined,
    consistency: records.length ? Number((paidOnTime / records.length).toFixed(2)) : undefined,
    ontime_ratio: records.length ? Number((paidOnTime / records.length).toFixed(2)) : undefined,
    frequency: records.length,
  }
}

const computeRepaymentAggregates = (records: Prisma.RepaymentHistoryGetPayload<{}>[]) => {
  if (!records.length) return undefined
  const onTimePayments = records.filter((record) => record.isPaid && !record.isLate).length
  const totalPayments = records.length
  const totalDelayDays = records.reduce((sum, record) => sum + (record.daysLate ?? 0), 0)
  const lastDueDate = records.reduce<Date | null>((latest, record) => {
    const candidate = record.paidDate ?? record.dueDate
    if (!candidate) return latest
    if (!latest || candidate > latest) {
      return candidate
    }
    return latest
  }, null)

  const monthsSinceLastLoan = lastDueDate
    ? Math.max(0, Math.round((Date.now() - lastDueDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
    : 999

  return {
    on_time_ratio: totalPayments ? Number((onTimePayments / totalPayments).toFixed(3)) : undefined,
    avg_payment_delay_days: totalPayments ? Number((totalDelayDays / totalPayments).toFixed(2)) : undefined,
    missed_count: records.filter((record) => !record.isPaid).length,
    avg_repayment_ratio: totalPayments ? Number((onTimePayments / totalPayments).toFixed(3)) : undefined,
    previous_loans_count: totalPayments ? 1 : 0,
    time_since_last_loan: monthsSinceLastLoan,
  }
}

export async function POST(request: NextRequest) {
  try {
    const cronTokenHeader = request.headers.get('x-safecred-cron-token')
    const expectedCronToken = process.env.RESCORE_CRON_TOKEN
    const cronInvoker = Boolean(expectedCronToken && cronTokenHeader && expectedCronToken === cronTokenHeader)

    let invokerUserId: string | null = null
    let invokerRole: UserRole | null = null

    if (!cronInvoker) {
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const admin = await prisma.user.findUnique({ where: { id: session.user.id } })

      if (!admin || (admin.role !== UserRole.ADMIN && admin.role !== UserRole.LOAN_OFFICER)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      invokerUserId = admin.id
      invokerRole = admin.role
    } else {
      invokerUserId = process.env.RESCORE_CRON_ACTOR_ID ?? null
    }

    const rawBody = await request.json().catch(() => ({}))
    const parsed = requestSchema.parse(rawBody)

    const applicationIds = parsed.applicationIds
    const statuses = parsed.statuses ?? (cronInvoker ? ['PROCESSING', 'MANUAL_REVIEW'] : undefined)
    const limit = parsed.limit ?? (cronInvoker ? 50 : 25)
    const staleOnly = parsed.staleOnly ?? cronInvoker

    const where: Prisma.ApplicationWhereInput = {}
    if (applicationIds?.length) {
      where.applicationId = { in: applicationIds }
    }
    if (statuses?.length) {
      where.status = { in: statuses as any }
    }
    if (staleOnly) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 1)
      where.OR = [
        { processedAt: null },
        { updatedAt: { lt: cutoff } },
      ]
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: { updatedAt: 'asc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            age: true,
            hasChildren: true,
            isSociallyDisadvantaged: true,
          },
        },
        bankStatements: true,
        rechargeData: true,
        electricityBills: true,
        educationFees: true,
        repaymentHistory: true,
      },
    })

    if (!applications.length) {
      return NextResponse.json({
        message: 'No applications matched the provided filters',
        processed: 0,
      })
    }

    const successes: Array<{ applicationId: string; status: string; finalSci: number | null }> = []
    const failures: Array<{ applicationId: string; error: string }> = []

    for (const appRecord of applications) {
      try {
        const bankMetrics = computeBankAggregates(appRecord.bankStatements)
        const rechargeMetrics = computeRechargeAggregates(appRecord.rechargeData)
        const electricityMetrics = computeElectricityAggregates(appRecord.electricityBills)
        const educationMetrics = computeEducationAggregates(appRecord.educationFees)
        const repaymentMetrics = computeRepaymentAggregates(appRecord.repaymentHistory)

        const mlPayload = {
          name: appRecord.user?.name || 'Beneficiary',
          mobile: appRecord.user?.mobile || '0000000000',
          email: appRecord.user?.email || 'unknown@safecred.com',
          age: appRecord.user?.age || 30,
          has_children: appRecord.user?.hasChildren || false,
          is_socially_disadvantaged: appRecord.user?.isSociallyDisadvantaged || false,
          dependents: 0,
          declared_income: appRecord.declaredIncome,
          loan_amount: appRecord.loanAmount,
          tenure_months: appRecord.tenureMonths,
          purpose: appRecord.purpose || 'Partner Upload',
          existing_loan_amt: appRecord.approvedLoanAmount || 0,
          consent_recharge: appRecord.consentRecharge,
          consent_electricity: appRecord.consentElectricity,
          consent_education: appRecord.consentEducation,
          consent_bank_statement: appRecord.consentBankStatement,
          application_id: appRecord.applicationId,
          bank_statement: bankMetrics,
          recharge_history: rechargeMetrics,
          electricity_bills: electricityMetrics,
          education_fees: educationMetrics,
          repayment_history: repaymentMetrics,
        }

        const mlResponse = await axios.post(`${ML_API_URL}/apply_direct`, mlPayload, {
          timeout: 30000,
        })

        const mlResult = mlResponse.data
        const normalizedRiskBand = mlResult.risk_band?.replace(' ', '_').toUpperCase()
        const riskNeedLabel = mlResult.risk_category
          ? `${mlResult.risk_category} + ${mlResult.risk_band}`
          : `${appRecord.user?.isSociallyDisadvantaged ? 'High Need' : 'Low Need'} + ${mlResult.risk_band ?? 'Unclassified'}`

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

        const updated = await prisma.application.update({
          where: { id: appRecord.id },
          data: updateData,
        })

        await prisma.auditLog.create({
          data: {
            userId: invokerUserId,
            action: 'application_rescored',
            entity: 'Application',
            entityId: updated.id,
            details: JSON.stringify({
              applicationId: updated.applicationId,
              status: updated.status,
              riskBand: updated.riskBand,
              finalSci: updated.finalSci,
              initiatedBy: cronInvoker ? 'scheduler' : invokerRole ?? 'ADMIN',
            }),
          },
        })

        successes.push({
          applicationId: updated.applicationId,
          status: updated.status,
          finalSci: updated.finalSci,
        })
      } catch (rescoreError: any) {
        console.error('Rescore failure:', rescoreError?.message)
        failures.push({
          applicationId: appRecord.applicationId,
          error: rescoreError?.message || 'Unknown error during re-score',
        })
      }
    }

    return NextResponse.json({
      processed: applications.length,
      successes,
      failures,
      initiatedBy: cronInvoker ? 'scheduler' : 'interactive',
    })
  } catch (error: any) {
    console.error('Rescore endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger re-scoring', details: error?.message },
      { status: 500 }
    )
  }
}
