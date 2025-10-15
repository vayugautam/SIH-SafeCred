import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 })
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

    const totalLoanAmount = applications.reduce((sum: number, a: any) => sum + a.loanAmount, 0)
    const avgRiskScore = applications.length > 0
      ? applications.reduce((sum: number, a: any) => sum + (a.compositeScore || 0), 0) / applications.length
      : 0
    const approvalRate = totalApplications > 0 
      ? (approvedApplications / totalApplications) * 100 
      : 0

    // Risk distribution
    const riskBands = {
      veryLow: 0,
      low: 0,
      medium: 0,
      high: 0,
      veryHigh: 0
    }

    applications.forEach((app: any) => {
      const band = app.riskBand?.toLowerCase().replace('_', '')
      if (band === 'verylow') riskBands.veryLow++
      else if (band === 'low') riskBands.low++
      else if (band === 'medium') riskBands.medium++
      else if (band === 'high') riskBands.high++
      else if (band === 'veryhigh') riskBands.veryHigh++
    })

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
        }
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
