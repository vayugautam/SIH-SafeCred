import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all user applications
    const applications = await prisma.application.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        repaymentHistory: {
          orderBy: { dueDate: 'desc' },
        },
      },
    })

    // Calculate statistics
    const totalApplications = applications.length
    const approvedApplications = applications.filter(a => a.status === 'APPROVED').length
    const rejectedApplications = applications.filter(a => a.status === 'REJECTED').length
    const pendingApplications = applications.filter(
      a => a.status === 'PENDING' || a.status === 'PROCESSING' || a.status === 'MANUAL_REVIEW'
    ).length

    // Calculate total approved amount
    const totalApprovedAmount = applications
      .filter(a => a.status === 'APPROVED')
      .reduce((sum, a) => sum + (a.approvedLoanAmount || 0), 0)

    // Calculate total requested amount
    const totalRequestedAmount = applications.reduce((sum, a) => sum + a.loanAmount, 0)

    // Calculate average SCI score
    const sciScores = applications.filter(a => a.finalSci !== null).map(a => a.finalSci!)
    const averageSci = sciScores.length > 0 
      ? sciScores.reduce((sum, s) => sum + s, 0) / sciScores.length 
      : null

    // Calculate repayment statistics
    let totalPayments = 0
    let onTimePayments = 0
    let latePayments = 0
    let missedPayments = 0
    let totalRepaid = 0

    applications.forEach((app: any) => {
      app.repaymentHistory.forEach((payment: any) => {
        totalPayments++
        if (payment.isPaid) {
          totalRepaid += payment.amount
          if (!payment.isLate) {
            onTimePayments++
          } else {
            latePayments++
          }
        } else {
          missedPayments++
        }
      })
    })

    const repaymentRate = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : null

    // Get recent activity
    const recentApplications = applications.slice(0, 5).map(app => ({
      id: app.id,
      applicationId: app.applicationId,
      status: app.status,
      loanAmount: app.loanAmount,
      approvedLoanAmount: app.approvedLoanAmount,
      createdAt: app.createdAt,
      processedAt: app.processedAt,
    }))

    // Calculate financial health score (0-100)
    let healthScore = 50 // Base score

    // Add points for good repayment history
    if (repaymentRate !== null) {
      healthScore += (repaymentRate / 100) * 20
    }

    // Add points for high SCI
    if (averageSci !== null) {
      healthScore += (averageSci / 100) * 20
    }

    // Add points for approved applications
    if (totalApplications > 0) {
      healthScore += (approvedApplications / totalApplications) * 10
    }

    healthScore = Math.min(100, Math.max(0, healthScore))

    // Generate personalized recommendations
    const recommendations: string[] = []

    if (repaymentRate !== null && repaymentRate < 80) {
      recommendations.push('Improve your repayment history to unlock better loan offers')
    }

    if (averageSci !== null && averageSci < 60) {
      recommendations.push('Share more alternative data sources to improve your credit score')
    }

    if (applications.filter(a => a.consentBankStatement).length === 0) {
      recommendations.push('Connect your bank statement for personalized offers')
    }

    if (applications.filter(a => a.consentRecharge).length === 0) {
      recommendations.push('Link your mobile recharge history for better credit assessment')
    }

    if (pendingApplications > 2) {
      recommendations.push('Consider consolidating your pending applications')
    }

    return NextResponse.json({
      stats: {
        totalApplications,
        approvedApplications,
        rejectedApplications,
        pendingApplications,
        totalApprovedAmount,
        totalRequestedAmount,
        averageSci,
        repaymentRate,
        totalPayments,
        onTimePayments,
        latePayments,
        missedPayments,
        totalRepaid,
        healthScore: Math.round(healthScore),
      },
      recentApplications,
      recommendations,
    })
  } catch (error) {
    console.error('Get user stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
