'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, FileText, CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DashboardStats {
  totalApplications: number
  pendingApplications: number
  approvedApplications: number
  rejectedApplications: number
  totalUsers: number
  totalLoanAmountRequested: number
  totalLoanAmountApproved: number
  riskBandDistribution: {
    LOW_RISK: number
    MEDIUM_RISK: number
    HIGH_RISK: number
    REJECT: number
  }
  recentApplications: Array<{
    id: string
    applicationId: string
    status: string
    riskBand: string | null
    loanAmount: number
    approvedLoanAmount: number | null
    finalSci: number | null
    createdAt: string
    user: {
      name: string
      email: string
    }
  }>
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'LOAN_OFFICER') {
      router.push('/dashboard')
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load stats')
        setIsLoading(false)
        return
      }

      setStats(data)
    } catch (error) {
      setError('Failed to load dashboard stats')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) return null

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'REJECTED': return 'destructive'
      case 'MANUAL_REVIEW': return 'warning'
      case 'PENDING': return 'warning'
      case 'PROCESSING': return 'info'
      default: return 'default'
    }
  }

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'LOW_RISK': return 'success'
      case 'MEDIUM_RISK': return 'warning'
      case 'HIGH_RISK': return 'destructive'
      case 'REJECT': return 'destructive'
      default: return 'default'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">SafeCred Admin</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/admin/applications">
                <Button variant="outline">All Applications</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost">User View</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of all loan applications and system statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-5 w-5 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-gray-600 mt-1">All time submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingApplications}</div>
              <p className="text-xs text-gray-600 mt-1">Awaiting decision</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.approvedApplications}</div>
              <p className="text-xs text-gray-600 mt-1">{formatCurrency(stats.totalLoanAmountApproved)} disbursed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
              <p className="text-xs text-gray-600 mt-1">Registered borrowers</p>
            </CardContent>
          </Card>
        </div>

        {/* Risk Distribution & Loan Amounts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Risk Band Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Low Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{stats.riskBandDistribution.LOW_RISK}</span>
                    <span className="text-sm text-gray-500">
                      ({Math.round((stats.riskBandDistribution.LOW_RISK / stats.totalApplications) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(stats.riskBandDistribution.LOW_RISK / stats.totalApplications) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">Medium Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{stats.riskBandDistribution.MEDIUM_RISK}</span>
                    <span className="text-sm text-gray-500">
                      ({Math.round((stats.riskBandDistribution.MEDIUM_RISK / stats.totalApplications) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(stats.riskBandDistribution.MEDIUM_RISK / stats.totalApplications) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">High Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{stats.riskBandDistribution.HIGH_RISK}</span>
                    <span className="text-sm text-gray-500">
                      ({Math.round((stats.riskBandDistribution.HIGH_RISK / stats.totalApplications) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(stats.riskBandDistribution.HIGH_RISK / stats.totalApplications) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-800"></div>
                    <span className="text-sm">Reject</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{stats.riskBandDistribution.REJECT}</span>
                    <span className="text-sm text-gray-500">
                      ({Math.round((stats.riskBandDistribution.REJECT / stats.totalApplications) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-800 h-2 rounded-full" 
                    style={{ width: `${(stats.riskBandDistribution.REJECT / stats.totalApplications) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loan Portfolio Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Total Requested</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(stats.totalLoanAmountRequested)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Total Approved</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(stats.totalLoanAmountApproved)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Approval Rate</p>
                <p className="text-3xl font-bold">
                  {Math.round((stats.approvedApplications / stats.totalApplications) * 100)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Applications</CardTitle>
            <Link href="/admin/applications">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentApplications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No applications yet</p>
            ) : (
              <div className="space-y-4">
                {stats.recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-blue-600">{app.applicationId}</p>
                        <Badge variant={getStatusBadgeVariant(app.status)}>
                          {app.status.replace(/_/g, ' ')}
                        </Badge>
                        {app.riskBand && (
                          <Badge variant={getRiskBadgeVariant(app.riskBand)}>
                            {app.riskBand.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {app.user.name} • {app.user.email}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(new Date(app.createdAt))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Requested</p>
                      <p className="font-semibold">{formatCurrency(app.loanAmount)}</p>
                      {app.approvedLoanAmount !== null && (
                        <>
                          <p className="text-sm text-gray-600 mt-2">Approved</p>
                          <p className="font-semibold text-green-600">{formatCurrency(app.approvedLoanAmount)}</p>
                        </>
                      )}
                      {app.finalSci !== null && (
                        <>
                          <p className="text-sm text-gray-600 mt-2">Score</p>
                          <p className="font-semibold">{app.finalSci.toFixed(0)}/100</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
