import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, UserRole } from '@prisma/client'
import { z } from 'zod'

const partnerPayloadSchema = z.object({
  partnerId: z.string().min(1),
  applicationId: z.string().optional(),
  createApplicationIfMissing: z.boolean().optional(),
  beneficiary: z
    .object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      mobile: z.string().min(6).optional(),
      age: z.number().int().min(18).max(100).optional(),
      hasChildren: z.boolean().optional(),
      isSociallyDisadvantaged: z.boolean().optional(),
    })
    .optional(),
  loanContext: z
    .object({
      declaredIncome: z.number().min(0),
      loanAmount: z.number().min(1000).max(200000),
      tenureMonths: z.number().int().min(3).max(60),
      purpose: z.string().optional(),
      consentRecharge: z.boolean().optional(),
      consentElectricity: z.boolean().optional(),
      consentEducation: z.boolean().optional(),
      consentBankStatement: z.boolean().optional(),
    })
    .optional(),
  bankStatements: z
    .array(
      z.object({
        date: z.string().min(4),
        description: z.string().default('Partner uploaded statement'),
        debit: z.number().optional(),
        credit: z.number().optional(),
        balance: z.number().optional(),
      })
    )
    .optional(),
  rechargeData: z
    .array(
      z.object({
        date: z.string().min(4),
        amount: z.number(),
        operator: z.string().optional(),
        planType: z.string().optional(),
      })
    )
    .optional(),
  electricityBills: z
    .array(
      z.object({
        month: z.string().min(4),
        billDate: z.string().min(4),
        dueDate: z.string().min(4),
        amount: z.number(),
        unitsConsumed: z.number().optional(),
        paidDate: z.string().optional(),
        isPaid: z.boolean().optional(),
        isLate: z.boolean().optional(),
      })
    )
    .optional(),
  educationFees: z
    .array(
      z.object({
        academicYear: z.string().min(4),
        term: z.string().optional(),
        amount: z.number(),
        dueDate: z.string().min(4),
        paidDate: z.string().optional(),
        institutionName: z.string().optional(),
        isPaid: z.boolean().optional(),
        isLate: z.boolean().optional(),
      })
    )
    .optional(),
  repaymentHistory: z
    .array(
      z.object({
        emiNumber: z.number().int().min(1),
        emiAmount: z.number().min(0),
        dueDate: z.string().min(4),
        paidDate: z.string().optional(),
        paidAmount: z.number().optional(),
        isPaid: z.boolean().optional(),
        isLate: z.boolean().optional(),
        daysLate: z.number().int().min(0).optional(),
      })
    )
    .optional(),
})

type PartnerPayload = z.infer<typeof partnerPayloadSchema>

const parseDateSafe = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!admin || (admin.role !== UserRole.ADMIN && admin.role !== UserRole.LOAN_OFFICER)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rawBody = await request.json()
    const payload = partnerPayloadSchema.parse(rawBody)

    let application = payload.applicationId
      ? await prisma.application.findUnique({ where: { applicationId: payload.applicationId } })
      : null

    if (!application && !payload.createApplicationIfMissing) {
      return NextResponse.json({
        error: 'Application not found and auto-create not enabled',
      }, { status: 404 })
    }

    if (!application && payload.createApplicationIfMissing) {
      if (!payload.beneficiary || !payload.loanContext) {
        return NextResponse.json({
          error: 'Beneficiary and loanContext are required to create new applications',
        }, { status: 400 })
      }

      const { beneficiary, loanContext } = payload

      let user = null
      if (beneficiary.email) {
        user = await prisma.user.findUnique({ where: { email: beneficiary.email } })
      }
      if (!user && beneficiary.mobile) {
        user = await prisma.user.findUnique({ where: { mobile: beneficiary.mobile } })
      }

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: beneficiary.email || `partner-${Date.now()}@safecred.com`,
            mobile: beneficiary.mobile || `000${Math.floor(Math.random() * 1_000_000)}`,
            password: '',
            name: beneficiary.name,
            role: 'USER',
            age: beneficiary.age,
            hasChildren: beneficiary.hasChildren ?? false,
            isSociallyDisadvantaged: beneficiary.isSociallyDisadvantaged ?? false,
            isActive: true,
          },
        })
      }

      application = await prisma.application.create({
        data: {
          userId: user.id,
          declaredIncome: loanContext.declaredIncome,
          loanAmount: loanContext.loanAmount,
          tenureMonths: loanContext.tenureMonths,
          purpose: loanContext.purpose,
          consentRecharge: loanContext.consentRecharge ?? !!payload.rechargeData?.length,
          consentElectricity: loanContext.consentElectricity ?? !!payload.electricityBills?.length,
          consentEducation: loanContext.consentEducation ?? !!payload.educationFees?.length,
          consentBankStatement: loanContext.consentBankStatement ?? !!payload.bankStatements?.length,
          status: 'PROCESSING',
        },
      })
    }

    if (!application) {
      return NextResponse.json({ error: 'Failed to initialise application context' }, { status: 500 })
    }

  const operations: Prisma.PrismaPromise<unknown>[] = []
    const ingestionSummary: Record<string, number> = {}

    if (payload.bankStatements?.length) {
      const data = payload.bankStatements.map((statement) => ({
        applicationId: application!.id,
        date: parseDateSafe(statement.date) ?? new Date(),
        description: statement.description,
        debit: statement.debit ?? 0,
        credit: statement.credit ?? 0,
        balance: statement.balance ?? 0,
      }))

      operations.push(prisma.bankStatement.createMany({ data }))
      ingestionSummary.bankStatements = data.length
    }

    if (payload.rechargeData?.length) {
      const data = payload.rechargeData.map((item) => ({
        applicationId: application!.id,
        date: parseDateSafe(item.date) ?? new Date(),
        amount: item.amount,
        operator: item.operator || 'Unknown',
        planType: item.planType,
      }))
      operations.push(prisma.rechargeData.createMany({ data }))
      ingestionSummary.rechargeData = data.length
    }

    if (payload.electricityBills?.length) {
      const data = payload.electricityBills.map((bill) => ({
        applicationId: application!.id,
        month: bill.month,
        billDate: parseDateSafe(bill.billDate) ?? new Date(),
        dueDate: parseDateSafe(bill.dueDate) ?? new Date(),
        amount: bill.amount,
        unitsConsumed: bill.unitsConsumed ?? 0,
        paidDate: parseDateSafe(bill.paidDate),
        isPaid: bill.isPaid ?? !!bill.paidDate,
        isLate: bill.isLate ?? false,
      }))
      operations.push(prisma.electricityBill.createMany({ data }))
      ingestionSummary.electricityBills = data.length
    }

    if (payload.educationFees?.length) {
      const data = payload.educationFees.map((fee) => ({
        applicationId: application!.id,
        academicYear: fee.academicYear,
        term: fee.term,
        amount: fee.amount,
        dueDate: parseDateSafe(fee.dueDate) ?? new Date(),
        paidDate: parseDateSafe(fee.paidDate),
        isPaid: fee.isPaid ?? !!fee.paidDate,
        isLate: fee.isLate ?? false,
        institutionName: fee.institutionName,
      }))
      operations.push(prisma.educationFee.createMany({ data }))
      ingestionSummary.educationFees = data.length
    }

    if (payload.repaymentHistory?.length) {
      const data = payload.repaymentHistory.map((entry) => ({
        applicationId: application!.id,
        emiNumber: entry.emiNumber,
        emiAmount: entry.emiAmount,
        dueDate: parseDateSafe(entry.dueDate) ?? new Date(),
        paidDate: parseDateSafe(entry.paidDate),
        paidAmount: entry.paidAmount,
        isPaid: entry.isPaid ?? !!entry.paidDate,
        isLate: entry.isLate ?? false,
        daysLate: entry.daysLate ?? 0,
      }))
      operations.push(prisma.repaymentHistory.createMany({ data }))
      ingestionSummary.repaymentHistory = data.length
    }

    if (operations.length) {
      await prisma.$transaction(operations)
    }

    const consentUpdates: Prisma.ApplicationUpdateInput = {}
    if (payload.bankStatements?.length) consentUpdates.consentBankStatement = true
    if (payload.rechargeData?.length) consentUpdates.consentRecharge = true
    if (payload.electricityBills?.length) consentUpdates.consentElectricity = true
    if (payload.educationFees?.length) consentUpdates.consentEducation = true

    if (Object.keys(consentUpdates).length) {
      await prisma.application.update({
        where: { id: application.id },
        data: consentUpdates,
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'partner_data_ingested',
        entity: 'Application',
        entityId: application.id,
        details: JSON.stringify({
          partnerId: payload.partnerId,
          applicationId: application.applicationId,
          ...ingestionSummary,
        }),
      },
    })

    return NextResponse.json({
      message: 'Partner data ingested successfully',
      applicationId: application.applicationId,
      ingested: ingestionSummary,
    })
  } catch (error: any) {
    console.error('Partner ingestion error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.flatten() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to ingest partner data', details: error?.message },
      { status: 500 }
    )
  }
}
