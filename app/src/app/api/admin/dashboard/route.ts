import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or loan officer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.LOAN_OFFICER)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get statistics
    const [
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalUsers,
      totalLoanAmount,
      totalApprovedAmount,
      riskBandStats,
      recentApplications,
    ] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { status: 'PENDING' } }),
      prisma.application.count({ where: { status: 'APPROVED' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.application.aggregate({
        _sum: { loanAmount: true },
      }),
      prisma.application.aggregate({
        where: { status: 'APPROVED' },
        _sum: { approvedLoanAmount: true },
      }),
      prisma.application.groupBy({
        by: ['riskBand'],
        _count: true,
      }),
      prisma.application.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      statistics: {
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalUsers,
        totalLoanAmount: totalLoanAmount._sum.loanAmount || 0,
        totalApprovedAmount: totalApprovedAmount._sum.approvedLoanAmount || 0,
        riskBandDistribution: riskBandStats,
      },
      recentApplications,
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
