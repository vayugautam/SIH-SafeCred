import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all applications with user data
    const applications = await prisma.application.findMany({
      include: {
        user: {
          select: {
            age: true,
            hasChildren: true,
            isSociallyDisadvantaged: true
          }
        }
      }
    })

    // Calculate overview metrics
    const totalApplications = applications.length
    const approvedApplications = applications.filter((a: any) => a.status === 'APPROVED').length
    const rejectedApplications = applications.filter((a: any) => a.status === 'REJECTED').length
    const pendingApplications = applications.filter(
      (a: any) => a.status === 'PROCESSING' || a.status === 'MANUAL_REVIEW'
    ).length
    const manualReviewApplications = applications.filter((a: any) => a.status === 'MANUAL_REVIEW').length

    const totalLoanAmount = applications.reduce((sum: number, a: any) => sum + a.loanAmount, 0)
    const avgRiskScore = applications.length > 0
      ? applications.reduce((sum: number, a: any) => sum + (a.compositeScore || 0), 0) / applications.length
      : 0
    const approvalRate = totalApplications > 0 
      ? (approvedApplications / totalApplications) * 100 
      : 0

    // Risk distribution
    const riskBands = {
      unscored: 0,
      veryLow: 0,
      low: 0,
      medium: 0,
      high: 0,
      veryHigh: 0
    }

    applications.forEach((app: any) => {
      if (!app.riskBand) {
        riskBands.unscored++
        return
      }

      switch (app.riskBand) {
        case 'LOW_RISK':
          riskBands.low++
          break
        case 'MEDIUM_RISK':
          riskBands.medium++
          break
        case 'HIGH_RISK':
          riskBands.high++
          break
        case 'REJECT':
          riskBands.veryHigh++
          break
        default:
          riskBands.veryLow++
      }
    })

    // Advanced analytics inputs
    const pillarTotals = {
      financial: 0,
      repayment: 0,
      consumption: 0,
      history: 0
    }
    let pillarSamples = 0
    let loanToIncomeAccum = 0
    let loanToIncomeSamples = 0
    let highLoanToIncomeCount = 0
    let fraudPenaltyCount = 0

    applications.forEach((app: any) => {
      const details = app.scoreDetails as any
      const breakdown = details?.score_breakdown || details?.scoreBreakdown || null
      const pillarScores = breakdown?.pillar_scores || breakdown?.pillarScores

      if (pillarScores) {
        pillarSamples += 1
        const { financial, repayment, consumption, history } = pillarScores
        if (typeof financial === 'number') pillarTotals.financial += financial
        if (typeof repayment === 'number') pillarTotals.repayment += repayment
        if (typeof consumption === 'number') pillarTotals.consumption += consumption
        if (typeof history === 'number') pillarTotals.history += history
      }

      const loanRatio = breakdown?.loan_to_income_ratio ?? details?.loan_to_income_ratio
      if (typeof loanRatio === 'number' && Number.isFinite(loanRatio)) {
        loanToIncomeAccum += loanRatio
        loanToIncomeSamples += 1
        if (loanRatio >= 0.8) {
          highLoanToIncomeCount += 1
        }
      }

      const fraudPenalty = breakdown?.fraud_risk_penalty ?? details?.fraud_risk_penalty
      if (typeof fraudPenalty === 'number' && fraudPenalty > 0) {
        fraudPenaltyCount += 1
      }
    })

    const pillarAverages = {
      financial: pillarSamples ? (pillarTotals.financial / pillarSamples) * 100 : 0,
      repayment: pillarSamples ? (pillarTotals.repayment / pillarSamples) * 100 : 0,
      consumption: pillarSamples ? (pillarTotals.consumption / pillarSamples) * 100 : 0,
      history: pillarSamples ? (pillarTotals.history / pillarSamples) * 100 : 0
    }

    const averageLoanToIncome = loanToIncomeSamples ? loanToIncomeAccum / loanToIncomeSamples : 0
  const highLoanToIncomeRate = loanToIncomeSamples ? highLoanToIncomeCount / loanToIncomeSamples : 0
  const fraudPenaltyRate = totalApplications ? (fraudPenaltyCount / totalApplications) * 100 : 0

    const consentRates = {
      recharge: totalApplications ? (applications.filter((a: any) => a.consentRecharge).length / totalApplications) * 100 : 0,
      electricity: totalApplications ? (applications.filter((a: any) => a.consentElectricity).length / totalApplications) * 100 : 0,
      education: totalApplications ? (applications.filter((a: any) => a.consentEducation).length / totalApplications) * 100 : 0,
      bankStatement: totalApplications ? (applications.filter((a: any) => a.consentBankStatement).length / totalApplications) * 100 : 0
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      bankCoverageApps,
      rechargeCoverageApps,
      electricityCoverageApps,
      educationCoverageApps,
      repaymentCoverageApps,
      ingestionCount30d,
      rescoreCount30d,
      lastIngestionLog,
      lastRescoreLog
    ] = await Promise.all([
      prisma.bankStatement.findMany({ distinct: ['applicationId'], select: { applicationId: true } }),
      prisma.rechargeData.findMany({ distinct: ['applicationId'], select: { applicationId: true } }),
      prisma.electricityBill.findMany({ distinct: ['applicationId'], select: { applicationId: true } }),
      prisma.educationFee.findMany({ distinct: ['applicationId'], select: { applicationId: true } }),
      prisma.repaymentHistory.findMany({ distinct: ['applicationId'], select: { applicationId: true } }),
      prisma.auditLog.count({ where: { action: 'partner_data_ingested', createdAt: { gte: thirtyDaysAgo } } }),
      prisma.auditLog.count({ where: { action: 'application_rescored', createdAt: { gte: thirtyDaysAgo } } }),
      prisma.auditLog.findFirst({ where: { action: 'partner_data_ingested' }, select: { createdAt: true }, orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.findFirst({ where: { action: 'application_rescored' }, select: { createdAt: true }, orderBy: { createdAt: 'desc' } })
    ])

    const ingestionCoverage = {
      bankStatements: totalApplications ? (bankCoverageApps.length / totalApplications) * 100 : 0,
      rechargeData: totalApplications ? (rechargeCoverageApps.length / totalApplications) * 100 : 0,
      electricityBills: totalApplications ? (electricityCoverageApps.length / totalApplications) * 100 : 0,
      educationFees: totalApplications ? (educationCoverageApps.length / totalApplications) * 100 : 0,
      repaymentHistory: totalApplications ? (repaymentCoverageApps.length / totalApplications) * 100 : 0
    }

    const referenceDate = (app: any) => {
      const processedAt = app.processedAt ? new Date(app.processedAt) : null
      const updatedAt = app.updatedAt ? new Date(app.updatedAt) : null
      const createdAt = app.createdAt ? new Date(app.createdAt) : null
      return processedAt || updatedAt || createdAt
    }

    const windowDays = 30
    const currentWindowStart = new Date()
    currentWindowStart.setDate(currentWindowStart.getDate() - windowDays)
    const previousWindowStart = new Date()
    previousWindowStart.setDate(previousWindowStart.getDate() - windowDays * 2)

    const withinWindow = (app: any, start: Date, end?: Date) => {
      const ref = referenceDate(app)
      if (!ref) return false
      if (end) {
        return ref >= start && ref < end
      }
      return ref >= start
    }

    const currentWindowApps = applications.filter((app: any) => withinWindow(app, currentWindowStart))
    const previousWindowApps = applications.filter((app: any) => withinWindow(app, previousWindowStart, currentWindowStart))

    const computeRiskShare = (appsForWindow: any[]) => {
      const counts = {
        low: 0,
        medium: 0,
        high: 0,
        veryHigh: 0,
        unscored: 0
      }

      appsForWindow.forEach((app: any) => {
        if (!app.riskBand) {
          counts.unscored += 1
          return
        }
        switch (app.riskBand) {
          case 'LOW_RISK':
            counts.low += 1
            break
          case 'MEDIUM_RISK':
            counts.medium += 1
            break
          case 'HIGH_RISK':
            counts.high += 1
            break
          case 'REJECT':
            counts.veryHigh += 1
            break
          default:
            counts.unscored += 1
        }
      })

      const total = appsForWindow.length || 1
      return {
        total: appsForWindow.length,
        distribution: {
          low: (counts.low / total) * 100,
          medium: (counts.medium / total) * 100,
          high: (counts.high / total) * 100,
          veryHigh: (counts.veryHigh / total) * 100,
          unscored: (counts.unscored / total) * 100
        },
        approvalRate: appsForWindow.length
          ? (appsForWindow.filter((app: any) => app.status === 'APPROVED').length / appsForWindow.length) * 100
          : 0,
        rejectRate: appsForWindow.length
          ? (appsForWindow.filter((app: any) => app.status === 'REJECTED').length / appsForWindow.length) * 100
          : 0,
        manualReviewRate: appsForWindow.length
          ? (appsForWindow.filter((app: any) => app.status === 'MANUAL_REVIEW').length / appsForWindow.length) * 100
          : 0
      }
    }

    const currentWindowStats = computeRiskShare(currentWindowApps)
    const previousWindowStats = computeRiskShare(previousWindowApps)

    const manualReviewRate = totalApplications ? (manualReviewApplications / totalApplications) * 100 : 0
    const unscoredRate = totalApplications ? (riskBands.unscored / totalApplications) * 100 : 0

    const kris = [] as Array<{
      id: string
      severity: 'low' | 'medium' | 'high'
      label: string
      description: string
      value: number
      target: number
    }>

    if (manualReviewRate > 20) {
      kris.push({
        id: 'manual-review',
        severity: manualReviewRate > 35 ? 'high' : 'medium',
        label: 'Manual Review Load',
        description: 'Share of applications pending manual review exceeds target threshold.',
        value: Number(manualReviewRate.toFixed(1)),
        target: 15
      })
    }

    if (unscoredRate > 10) {
      kris.push({
        id: 'unscored',
        severity: unscoredRate > 25 ? 'high' : 'medium',
        label: 'Unscored Applications',
        description: 'Significant portion of applications lack ML scoring or pillar assessment.',
        value: Number(unscoredRate.toFixed(1)),
        target: 5
      })
    }

    if (averageLoanToIncome > 0.6 || highLoanToIncomeRate > 0.2) {
      kris.push({
        id: 'loan-to-income',
        severity: averageLoanToIncome > 0.9 ? 'high' : 'medium',
        label: 'Loan-to-Income Pressure',
        description: 'Average loan-to-income ratio for scored applications is elevated.',
        value: Number((averageLoanToIncome * 100).toFixed(1)),
        target: 50
      })
    }

    if (fraudPenaltyRate > 5) {
      kris.push({
        id: 'fraud-penalty',
        severity: fraudPenaltyRate > 10 ? 'high' : 'medium',
        label: 'Fraud Penalty Applied',
        description: 'Elevated share of applications triggered anti-fraud penalty.',
        value: Number(fraudPenaltyRate.toFixed(1)),
        target: 5
      })
    }

    const advancedInsights = {
      pillarScores: pillarAverages,
      dataCoverage: {
        consents: consentRates,
        ingestion: ingestionCoverage
      },
      riskShift: {
        windowDays,
        current: currentWindowStats,
        previous: previousWindowStats
      },
      kris,
      audit: {
        ingestionCount30d,
        rescoreCount30d,
        lastIngestionAt: lastIngestionLog?.createdAt?.toISOString() ?? null,
        lastRescoreAt: lastRescoreLog?.createdAt?.toISOString() ?? null
      }
    }

    // Temporal trends (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      date.setHours(0, 0, 0, 0)
      return date
    })

    const temporalTrends = last7Days.map(date => {
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayApps = applications.filter((app: any) => {
        const appDate = new Date(app.createdAt)
        return appDate >= date && appDate < nextDate
      })

      const dayApprovals = dayApps.filter((app: any) => app.status === 'APPROVED').length
      const avgScore = dayApps.length > 0
        ? dayApps.reduce((sum: number, a: any) => sum + (a.compositeScore || 0), 0) / dayApps.length
        : 0

      return {
        date: date.toISOString(),
        applications: dayApps.length,
        approvals: dayApprovals,
        avgRiskScore: avgScore
      }
    })

    // Demographics
    const ageGroups = [
      { range: '18-25', count: 0 },
      { range: '26-35', count: 0 },
      { range: '36-45', count: 0 },
      { range: '46-60', count: 0 },
      { range: '60+', count: 0 }
    ]

    applications.forEach((app: any) => {
      const age = app.user.age || 30
      if (age <= 25) ageGroups[0].count++
      else if (age <= 35) ageGroups[1].count++
      else if (age <= 45) ageGroups[2].count++
      else if (age <= 60) ageGroups[3].count++
      else ageGroups[4].count++
    })

    const hasChildren = {
      yes: applications.filter((a: any) => a.user.hasChildren).length,
      no: applications.filter((a: any) => !a.user.hasChildren).length
    }

    const sociallyDisadvantaged = {
      yes: applications.filter((a: any) => a.user.isSociallyDisadvantaged).length,
      no: applications.filter((a: any) => !a.user.isSociallyDisadvantaged).length
    }

    return NextResponse.json({
      analytics: {
        overview: {
          totalApplications,
          approvedApplications,
          rejectedApplications,
          pendingApplications,
          totalLoanAmount,
          averageRiskScore: avgRiskScore,
          approvalRate
        },
  riskDistribution: riskBands,
        temporalTrends,
        demographics: {
          ageGroups,
          hasChildren,
          sociallyDisadvantaged
        },
            advancedInsights
      }
    })

  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    )
  }
}
