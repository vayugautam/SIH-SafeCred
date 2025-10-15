'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Plus, FileText, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Application {
  id: string
  applicationId: string
  loanAmount: number
  approvedLoanAmount: number | null
  tenureMonths: number
  status: string
  riskBand: string | null
  finalSci: number | null
  createdAt: string
  processedAt: string | null
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchApplications()
    }
  }, [status, router])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications')
      const data = await response.json()
      setApplications(data.applications || [])
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: 'warning', icon: Clock, label: 'Pending' },
      PROCESSING: { variant: 'info', icon: AlertCircle, label: 'Processing' },
      APPROVED: { variant: 'success', icon: CheckCircle, label: 'Approved' },
      REJECTED: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
      MANUAL_REVIEW: { variant: 'warning', icon: FileText, label: 'Under Review' },
    }
    const config = variants[status] || { variant: 'default', icon: Clock, label: status }
    const Icon = config.icon
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getRiskBadge = (riskBand: string | null) => {
    if (!riskBand) return null
    const variants: Record<string, string> = {
      LOW_RISK: 'success',
      MEDIUM_RISK: 'warning',
      HIGH_RISK: 'destructive',
      REJECT: 'destructive',
    }
    const labels: Record<string, string> = {
      LOW_RISK: 'Low Risk',
      MEDIUM_RISK: 'Medium Risk',
      HIGH_RISK: 'High Risk',
      REJECT: 'Rejected',
    }
    return (
      <Badge variant={variants[riskBand] as any}>
        {labels[riskBand] || riskBand}
      </Badge>
    )
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">SafeCred</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/api/auth/signout')}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600">Manage your loan applications and track your credit score</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Applications</CardDescription>
              <CardTitle className="text-3xl">{applications.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Approved</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {applications.filter(a => a.status === 'APPROVED').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">
                {applications.filter(a => a.status === 'PENDING' || a.status === 'PROCESSING').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Approved Amount</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {formatCurrency(
                  applications
                    .filter(a => a.status === 'APPROVED')
                    .reduce((sum, a) => sum + (a.approvedLoanAmount || 0), 0)
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <Link href="/apply">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Apply for New Loan
            </Button>
          </Link>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Applications</CardTitle>
            <CardDescription>Track the status of your loan applications</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4">Start your loan application process today</p>
                <Link href="/apply">
                  <Button>Apply for Loan</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">Application #{app.applicationId}</h3>
                          {getStatusBadge(app.status)}
                          {app.riskBand && getRiskBadge(app.riskBand)}
                        </div>
                        <p className="text-sm text-gray-500">
                          Applied on {formatDate(app.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Requested Amount</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(app.loanAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tenure</p>
                        <p className="font-medium">{app.tenureMonths} months</p>
                      </div>
                      {app.approvedLoanAmount && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Approved Amount</p>
                          <p className="font-medium text-green-600">
                            {formatCurrency(app.approvedLoanAmount)}
                          </p>
                        </div>
                      )}
                      {app.finalSci && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Credit Score</p>
                          <p className="font-medium">
                            <span className={`text-lg ${
                              app.finalSci >= 80 ? 'text-green-600' :
                              app.finalSci >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {app.finalSci.toFixed(0)}
                            </span>
                            <span className="text-gray-400">/100</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {app.status === 'APPROVED' && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded">
                          <CheckCircle className="h-4 w-4" />
                          <span>Your loan has been approved! Disbursement will be processed within 24 hours.</span>
                        </div>
                      </div>
                    )}

                    {app.status === 'MANUAL_REVIEW' && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-4 py-2 rounded">
                          <AlertCircle className="h-4 w-4" />
                          <span>Your application is under manual review. You'll be notified of the decision soon.</span>
                        </div>
                      </div>
                    )}
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
