'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Loader2, TrendingUp, TrendingDown, FileText, Clock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts'

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
    unscored: number
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
  advancedInsights: {
    pillarScores: {
      financial: number
      repayment: number
      consumption: number
      history: number
    }
    dataCoverage: {
      consents: {
        recharge: number
        electricity: number
        education: number
        bankStatement: number
      }
      ingestion: {
        bankStatements: number
        rechargeData: number
        electricityBills: number
        educationFees: number
        repaymentHistory: number
      }
    }
    riskShift: {
      windowDays: number
      current: {
        total: number
        distribution: {
          low: number
          medium: number
          high: number
          veryHigh: number
          unscored: number
        }
        approvalRate: number
        rejectRate: number
        manualReviewRate: number
      }
      previous: {
        total: number
        distribution: {
          low: number
          medium: number
          high: number
          veryHigh: number
          unscored: number
        }
        approvalRate: number
        rejectRate: number
        manualReviewRate: number
      }
    }
    kris: {
      id: string
      severity: 'low' | 'medium' | 'high'
      label: string
      description: string
      value: number
      target: number
    }[]
    audit: {
      ingestionCount30d: number
      rescoreCount30d: number
      lastIngestionAt: string | null
      lastRescoreAt: string | null
    }
  }
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState('')

  const loadAnalytics = useCallback(async () => {
    try {
      setError('')
      const response = await fetch('/api/admin/analytics')

      if (!response.ok) throw new Error('Failed to load analytics')
  
      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Error loading analytics:', error)
      setError('Unable to load analytics right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    loadAnalytics()
  }, [status, session, router, loadAnalytics])

  const safePercentage = useCallback((value: number, total: number) => {
    if (!total) return 0
    return Number(((value / total) * 100).toFixed(1))
  }, [])

  const isAuthorised = useMemo(() => session?.user?.role === 'ADMIN', [session])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isAuthorised) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <p className="text-red-600 font-medium">{error}</p>
        <Button variant="outline" onClick={() => {
          setLoading(true)
          loadAnalytics()
        }}>
          Retry
        </Button>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  const { overview, riskDistribution, temporalTrends, demographics, advancedInsights } = analytics
  const totalApplications = overview.totalApplications || 0
  const pillarLabelMap: Record<string, string> = {
    financial: 'Financial Capacity',
    repayment: 'Repayment Behaviour',
    consumption: 'Household Signals',
    history: 'Loan History'
  }
  const coverageLabelMap: Record<string, string> = {
    recharge: 'Recharge Consent',
    electricity: 'Electricity Consent',
    education: 'Education Consent',
    bankStatement: 'Bank Statement Consent',
    bankStatements: 'Bank Statements',
    rechargeData: 'Recharge Records',
    electricityBills: 'Electricity Bills',
    educationFees: 'Education Fees',
    repaymentHistory: 'Repayment History'
  }
  const severityStyles: Record<'low' | 'medium' | 'high', string> = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-rose-100 text-rose-700'
  }

  const pillarChartData = Object.entries(advancedInsights.pillarScores).map(([key, value]) => ({
    pillar: pillarLabelMap[key] ?? key,
    score: Number(value.toFixed(1))
  }))

  const consentCoverage = Object.entries(advancedInsights.dataCoverage.consents).map(([key, value]) => ({
    label: coverageLabelMap[key] ?? key,
    value: Number(value.toFixed(1))
  }))

  const ingestionCoverage = Object.entries(advancedInsights.dataCoverage.ingestion).map(([key, value]) => ({
    label: coverageLabelMap[key] ?? key,
    value: Number(value.toFixed(1))
  }))

  const riskShiftBands = [
    { key: 'low', label: 'Low' },
    { key: 'medium', label: 'Medium' },
    { key: 'high', label: 'High' },
    { key: 'veryHigh', label: 'Reject' },
    { key: 'unscored', label: 'Unscored' }
  ] as const

  const riskShiftChartData = riskShiftBands.map(({ key, label }) => ({
    band: label,
    current: Number(advancedInsights.riskShift.current.distribution[key].toFixed(1)),
    previous: Number(advancedInsights.riskShift.previous.distribution[key].toFixed(1))
  }))

  const riskShiftWindowDays = advancedInsights.riskShift.windowDays

  const formatPercent = (value: number, decimals = 1) => `${value.toFixed(decimals)}%`
  const formatDateTime = (value: string | null) => (value ? new Date(value).toLocaleString() : '—')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">SafeCred Admin</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Link href="/admin/operations">
                <Button variant="outline">Operations</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost">User View</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

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
                {safePercentage(overview.approvedApplications, totalApplications)}%
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="risk">Risk Distribution</TabsTrigger>
            <TabsTrigger value="trends">Temporal Trends</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="insights">Operational Insights</TabsTrigger>
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
                    { label: 'Unscored', value: riskDistribution.unscored, color: 'bg-gray-400' },
                    { label: 'Very Low Risk', value: riskDistribution.veryLow, color: 'bg-green-500' },
                    { label: 'Low Risk', value: riskDistribution.low, color: 'bg-blue-500' },
                    { label: 'Medium Risk', value: riskDistribution.medium, color: 'bg-yellow-500' },
                    { label: 'High Risk', value: riskDistribution.high, color: 'bg-orange-500' },
                    { label: 'Very High Risk', value: riskDistribution.veryHigh, color: 'bg-red-500' }
                  ].map((risk) => {
                    const percentage = safePercentage(risk.value, totalApplications)
                    return (
                      <div key={risk.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{risk.label}</span>
                          <span className="text-sm text-gray-500">
                            {risk.value} ({percentage}%)
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
                    {demographics.ageGroups.map((group) => {
                      const percentage = safePercentage(group.count, totalApplications)
                      return (
                        <div key={group.range} className="flex justify-between items-center">
                          <span className="text-sm">{group.range}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{group.count}</span>
                          </div>
                        </div>
                      )
                    })}
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

          {/* Operational insights */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pillar Strength Profile</CardTitle>
                  <CardDescription>Average pillar scores for scored applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={pillarChartData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="pillar" tick={{ fill: '#4b5563', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <Radar
                          name="Pillar Score"
                          dataKey="score"
                          stroke="#2563eb"
                          fill="#2563eb"
                          fillOpacity={0.35}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Shift (Last {riskShiftWindowDays} days)</CardTitle>
                  <CardDescription>Current vs. previous period risk distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskShiftChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="band" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `${value}%`} width={40} />
                        <Tooltip formatter={(value: number) => `${value}%`} />
                        <Legend />
                        <Bar dataKey="current" name="Current" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="previous" name="Previous" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="rounded-lg bg-blue-50 p-3">
                      <p className="font-semibold text-blue-700">Current Window</p>
                      <p className="text-gray-600">Applications: {advancedInsights.riskShift.current.total}</p>
                      <p className="text-gray-600">Approval Rate: {formatPercent(advancedInsights.riskShift.current.approvalRate)}</p>
                      <p className="text-gray-600">Manual Review: {formatPercent(advancedInsights.riskShift.current.manualReviewRate)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="font-semibold text-slate-700">Previous Window</p>
                      <p className="text-gray-600">Applications: {advancedInsights.riskShift.previous.total}</p>
                      <p className="text-gray-600">Approval Rate: {formatPercent(advancedInsights.riskShift.previous.approvalRate)}</p>
                      <p className="text-gray-600">Manual Review: {formatPercent(advancedInsights.riskShift.previous.manualReviewRate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data Coverage</CardTitle>
                  <CardDescription>Consent uptake and ingestion footprint</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Consent Uptake</h4>
                    <div className="space-y-3">
                      {consentCoverage.map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.label}</span>
                            <span className="text-gray-600">{formatPercent(item.value)}</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${item.value}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Ingestion Coverage</h4>
                    <div className="space-y-3">
                      {ingestionCoverage.map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.label}</span>
                            <span className="text-gray-600">{formatPercent(item.value)}</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full">
                            <div
                              className="h-2 rounded-full bg-emerald-500"
                              style={{ width: `${item.value}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Automation & Audit Signals</CardTitle>
                  <CardDescription>Recent scheduler execution and data ingestion activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-blue-600">Rescore Runs</p>
                      <p className="text-2xl font-semibold text-blue-700">
                        {advancedInsights.audit.rescoreCount30d}
                      </p>
                      <p className="text-xs text-blue-600">Last 30 days</p>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-emerald-600">Partner Ingest</p>
                      <p className="text-2xl font-semibold text-emerald-700">
                        {advancedInsights.audit.ingestionCount30d}
                      </p>
                      <p className="text-xs text-emerald-600">Last 30 days</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-600">Last Scheduler Run</p>
                    <p className="text-sm text-slate-700">{formatDateTime(advancedInsights.audit.lastRescoreAt)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-600">Last Partner Ingestion</p>
                    <p className="text-sm text-slate-700">{formatDateTime(advancedInsights.audit.lastIngestionAt)}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Review audit trails in /admin/operations if timings diverge from expectations.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Key Risk Indicators</CardTitle>
                <CardDescription>Alerts raised from operational thresholds</CardDescription>
              </CardHeader>
              <CardContent>
                {advancedInsights.kris.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No active risk alerts. System operating within configured thresholds.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {advancedInsights.kris.map((kri) => (
                      <div key={kri.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{kri.label}</p>
                          <Badge className={severityStyles[kri.severity]}>{kri.severity.toUpperCase()}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{kri.description}</p>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-gray-900">{formatPercent(kri.value)}</span>
                          <span className="text-gray-500">Target: {formatPercent(kri.target)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
