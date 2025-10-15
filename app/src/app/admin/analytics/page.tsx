'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, TrendingUp, TrendingDown, Users, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalApplications: number
    approvedApplications: number
    rejectedApplications: number
    pendingApplications: number
    totalLoanAmount: number
    averageRiskScore: number
    approvalRate: number
  }
  riskDistribution: {
    veryLow: number
    low: number
    medium: number
    high: number
    veryHigh: number
  }
  temporalTrends: {
    date: string
    applications: number
    approvals: number
    avgRiskScore: number
  }[]
  demographics: {
    ageGroups: { range: string; count: number }[]
    hasChildren: { yes: number; no: number }
    sociallyDisadvantaged: { yes: number; no: number }
  }
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    if (!token || !user) {
      router.push('/login')
      return
    }

    if (user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    loadAnalytics()
  }, [token, user, router])

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load analytics')

      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!analytics) {
    return <div className="container p-6">Failed to load analytics</div>
  }

  const { overview, riskDistribution, temporalTrends, demographics } = analytics

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-500 mt-1">Comprehensive insights and metrics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{(overview.totalLoanAmount / 100000).toFixed(2)}L total requested
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overview.approvalRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.approvedApplications} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {overview.pendingApplications}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires manual review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.averageRiskScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Composite risk metric
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="risk" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="risk">Risk Distribution</TabsTrigger>
          <TabsTrigger value="trends">Temporal Trends</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        {/* Risk Distribution */}
        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Band Distribution</CardTitle>
              <CardDescription>Applications grouped by risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Very Low Risk', value: riskDistribution.veryLow, color: 'bg-green-500' },
                  { label: 'Low Risk', value: riskDistribution.low, color: 'bg-blue-500' },
                  { label: 'Medium Risk', value: riskDistribution.medium, color: 'bg-yellow-500' },
                  { label: 'High Risk', value: riskDistribution.high, color: 'bg-orange-500' },
                  { label: 'Very High Risk', value: riskDistribution.veryHigh, color: 'bg-red-500' }
                ].map((risk) => {
                  const percentage = overview.totalApplications > 0 
                    ? (risk.value / overview.totalApplications) * 100 
                    : 0
                  return (
                    <div key={risk.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{risk.label}</span>
                        <span className="text-sm text-gray-500">
                          {risk.value} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${risk.color}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Temporal Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Trends</CardTitle>
              <CardDescription>Daily application and approval patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {temporalTrends && temporalTrends.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Date</th>
                          <th className="text-right p-2">Applications</th>
                          <th className="text-right p-2">Approvals</th>
                          <th className="text-right p-2">Avg Risk Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {temporalTrends.map((trend, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2">{new Date(trend.date).toLocaleDateString()}</td>
                            <td className="text-right p-2">{trend.applications}</td>
                            <td className="text-right p-2 text-green-600">{trend.approvals}</td>
                            <td className="text-right p-2">{trend.avgRiskScore.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No trend data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demographics */}
        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>Applicants by age group</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {demographics.ageGroups.map((group) => (
                    <div key={group.range} className="flex justify-between items-center">
                      <span className="text-sm">{group.range}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ 
                              width: `${(group.count / overview.totalApplications) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{group.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demographic Insights</CardTitle>
                <CardDescription>Key demographic factors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Has Children</h4>
                  <div className="flex gap-4">
                    <div className="flex-1 text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {demographics.hasChildren.yes}
                      </div>
                      <div className="text-xs text-gray-600">Yes</div>
                    </div>
                    <div className="flex-1 text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {demographics.hasChildren.no}
                      </div>
                      <div className="text-xs text-gray-600">No</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Socially Disadvantaged</h4>
                  <div className="flex gap-4">
                    <div className="flex-1 text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {demographics.sociallyDisadvantaged.yes}
                      </div>
                      <div className="text-xs text-gray-600">Yes</div>
                    </div>
                    <div className="flex-1 text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {demographics.sociallyDisadvantaged.no}
                      </div>
                      <div className="text-xs text-gray-600">No</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
