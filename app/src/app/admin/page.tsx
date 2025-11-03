'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Shield,
  Loader2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Workflow,
  BarChart3,
  Users,
  Gauge
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface AdminDashboardData {
  overview: {
    totalBeneficiaries: number
    totalApplications: number
    approvals: number
    rejected: number
    pending: number
    approvalRate: number
    totalRequested: number
    totalDisbursed: number
    manualReview: number
    fraudAlerts: number
    fairnessScore: number
    disadvantagedShare: number
  }
  risk: {
    distribution: Record<'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'REJECT', number>
    needCategory: Record<string, number>
    disadvantagedLowRisk: number
    fairnessScore: number
  }
  alerts: Array<{
    type: 'critical' | 'warning' | 'info' | 'success'
    title: string
    detail: string
    action: string
  }>
  trends: {
    last14Days: Array<{
      date: string | Date
      applications: number
      approvals: number
      avgScore: number | null
    }>
    averageSci: number
    averageMlConfidence: number
  }
  scoringInsights: {
    highlight: Array<{
      id: string
      applicationId: string
      beneficiary: {
        name: string | null
        email: string
        state: string | null
      }
      finalSci: number
      mlProbability: number
      riskBand: string | null
      status: string
      loanAmount: number
      approvedLoanAmount: number | null
      declaredIncome: number
      incomeMismatchFlag: boolean
    }>
    totalBeneficiaries: number
  }
  dataQuality: {
    consentTotals: Record<'electricity' | 'recharge' | 'education' | 'bank', number>
    coverage: {
      electricity: number
      bankStatements: number
      repaymentHistory: number
      recharge: number
      educationFees: number
    }
  }
  manualReviewQueue: Array<{
    id: string
    applicationId: string
    status: string
    riskBand: string | null
    finalSci: number | null
    loanAmount: number
    approvedLoanAmount: number | null
    abilityToRepayIndex: number | null
    incomeVerificationStatus: string
    incomeMismatchFlag: boolean
    updatedAt: string | Date
    user: {
      name: string | null
      email: string
      state: string | null
    }
  }>
  incomeVerification: {
    pending: number
    autoVerified: number
    manualReview: number
    unneeded: number
    mismatches: number
  }
  directLending: {
    sameDayApprovals: {
      count: number
      totalApproved: number
      percentage: number
      averageLoan: number
      totalDisbursed: number
    }
    manualQueue: AdminDashboardData['manualReviewQueue']
  }
  explainability: {
    totalNarratives: number
    byStatus: {
      approved: number
      rejected: number
      manualReview: number
      processing: number
    }
    averageConfidence: number
    highConfidenceShare: number
  }
  auditTrail: Array<{
    id: string
    action: string
    createdAt: string | Date
    entity: string | null
    entityId: string | null
    details: string | null
    userId: string | null
  }>
}

const severityStyles: Record<AdminDashboardData['alerts'][number]['type'], string> = {
  critical: 'border-red-200 bg-red-50 text-red-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

const numberFormatter = new Intl.NumberFormat('en-IN')

function formatCompactCurrency(value: number) {
  if (!value) return '₹0'
  const abs = Math.abs(value)
  if (abs >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`
  if (abs >= 100000) return `₹${(value / 100000).toFixed(1)} L`
  if (abs >= 1000) return `₹${(value / 1000).toFixed(1)} K`
  return `₹${numberFormatter.format(value)}`
}

const riskColour: Record<string, string> = {
  LOW_RISK: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  MEDIUM_RISK: 'text-amber-700 bg-amber-50 border-amber-200',
  HIGH_RISK: 'text-rose-700 bg-rose-50 border-rose-200',
  REJECT: 'text-slate-700 bg-slate-100 border-slate-200'
}

const cardShell = 'rounded-3xl border border-slate-200 bg-white shadow-sm'

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'LOAN_OFFICER') {
      router.push('/dashboard')
      return
    }

    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'LOAN_OFFICER') {
      router.prefetch('/admin/analytics')
      router.prefetch('/admin/operations')
      router.prefetch('/admin/applications')
    }

    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/admin/dashboard', { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load admin dashboard')
        }

        setDashboard(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin dashboard')
      } finally {
        setIsLoading(false)
      }
    }

  fetchDashboard()
  }, [session, status, router])

  const trendBounds = useMemo(() => {
    if (!dashboard) return { maxApplications: 0, maxApprovals: 0 }
    const applications = dashboard.trends.last14Days.map((day) => day.applications)
    const approvals = dashboard.trends.last14Days.map((day) => day.approvals)
    return {
      maxApplications: Math.max(10, ...applications),
      maxApprovals: Math.max(5, ...approvals)
    }
  }, [dashboard])

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-700 shadow-sm">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h2 className="text-2xl font-semibold mb-2">Admin dashboard unavailable</h2>
          <p className="text-sm text-red-600">{error || 'Unexpected error while loading system telemetry.'}</p>
          <Button className="mt-6" variant="secondary" onClick={() => location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const { overview, risk, alerts, trends, scoringInsights, dataQuality, manualReviewQueue, incomeVerification, directLending, explainability, auditTrail } = dashboard

  const riskBands = Object.entries(risk.distribution)
  const consentTotal = Object.values(dataQuality.consentTotals).reduce((acc, val) => acc + val, 0)

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-50 p-2 border border-blue-100">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-wide text-slate-900">SafeCred Control Centre</h1>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin & Loan Officer Intelligence</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/analytics">
              <Button variant="outline" className="border-slate-200 text-slate-700 hover:border-blue-200 hover:text-blue-600">
                Analytics
              </Button>
            </Link>
            <Link href="/admin/operations">
              <Button variant="outline" className="border-slate-200 text-slate-700 hover:border-blue-200 hover:text-blue-600">
                Operations
              </Button>
            </Link>
            <Link href="/admin/applications">
              <Button variant="outline" className="border-slate-200 text-slate-700 hover:border-blue-200 hover:text-blue-600">
                Applications
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-slate-600 hover:text-blue-600">
                Borrower view
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-10 space-y-10">
        <section className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-2 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-8 shadow-sm shadow-blue-100/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-blue-500">Network overview</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">{numberFormatter.format(overview.totalBeneficiaries)} beneficiaries monitored</h2>
              </div>
              <Sparkles className="h-10 w-10 text-blue-500" />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <MetricPill label="Approval rate" value={`${overview.approvalRate}%`} helper={`${numberFormatter.format(overview.approvals)} approvals`} tone="emerald" />
              <MetricPill
                label="Total disbursed"
                value={formatCompactCurrency(overview.totalDisbursed)}
                helper="Approved till date"
                tone="sky"
              />
              <MetricPill label="Fairness score" value={`${overview.fairnessScore}/100`} helper={`${overview.disadvantagedShare}% disadvantaged served`} tone="violet" />
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-600">Same-day clearance</p>
                <h3 className="mt-2 text-2xl font-semibold text-emerald-700">{directLending.sameDayApprovals.percentage}% hit rate</h3>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <dl className="mt-5 space-y-3 text-sm text-emerald-700">
              <div className="flex items-center justify-between">
                <dt>Same-day approvals</dt>
                <dd className="font-semibold text-emerald-800">{directLending.sameDayApprovals.count}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Avg loan</dt>
                <dd className="font-semibold text-emerald-800">{formatCurrency(directLending.sameDayApprovals.averageLoan ?? 0)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Disbursed</dt>
                <dd className="font-semibold text-emerald-800">{formatCompactCurrency(directLending.sameDayApprovals.totalDisbursed ?? 0)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-rose-600">Active alerts</p>
                <h3 className="mt-2 text-2xl font-semibold text-rose-700">{overview.fraudAlerts} flagged signals</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-rose-500" />
            </div>
            <p className="mt-4 text-sm text-rose-700">{overview.manualReview} cases pending manual review, prioritise escalations.</p>
            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-rose-100">
              <div className="h-full bg-rose-400" style={{ width: `${Math.min(100, (overview.manualReview / Math.max(1, overview.totalApplications)) * 100)}%` }} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className={`${cardShell} lg:col-span-2 p-6`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Telemetry last 14 days</h3>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Applications · approvals · sci</span>
            </div>
            <div className="mt-6 grid gap-4">
              {trends.last14Days.map((day) => {
                const dateLabel = typeof day.date === 'string' ? day.date : day.date.toISOString()
                const parsedDate = new Date(dateLabel)
                const applicationsWidth = Math.round((day.applications / trendBounds.maxApplications) * 100)
                const approvalsWidth = Math.round((day.approvals / trendBounds.maxApprovals) * 100)
                return (
                  <div key={dateLabel} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-12">
                    <div className="md:col-span-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {parsedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="md:col-span-6 space-y-2">
                      <div className="text-[11px] text-slate-500">Applications {day.applications}</div>
                      <div className="h-2 rounded-full bg-blue-100">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${applicationsWidth}%` }} />
                      </div>
                      <div className="text-[11px] text-slate-500">Approvals {day.approvals}</div>
                      <div className="h-2 rounded-full bg-emerald-100">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${approvalsWidth}%` }} />
                      </div>
                    </div>
                    <div className="md:col-span-4 flex items-center justify-end">
                      <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-right shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-blue-500">Avg SCI</p>
                        <p className="text-lg font-semibold text-slate-900">{day.avgScore ? day.avgScore.toFixed(1) : '—'}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> Applications</span>
              <span className="inline-flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Approvals</span>
              <span className="inline-flex items-center gap-2"><TrendingUp className="h-3 w-3 text-blue-500" /> Avg SCI {trends.averageSci}</span>
              <span className="inline-flex items-center gap-2"><Brain className="h-3 w-3 text-indigo-500" /> ML confidence {trends.averageMlConfidence}%</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`${cardShell} p-6`}>
              <h3 className="text-lg font-semibold text-slate-900">Alerts centre</h3>
              <div className="mt-4 space-y-3">
                {alerts.map((alert, index) => (
                  <div key={`${alert.title}-${index}`} className={`rounded-2xl border px-4 py-3 ${severityStyles[alert.type]}`}>
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <p className="text-xs mt-1 opacity-80">{alert.detail}</p>
                    <p className="text-[11px] mt-2 uppercase tracking-[0.25em] opacity-70">{alert.action}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${cardShell} p-6`}>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk distribution</h3>
              <div className="space-y-3">
                {riskBands.map(([band, count]) => (
                  <div key={band} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span className="uppercase tracking-[0.2em] text-slate-500">{band.replace('_', ' ')}</span>
                      <span className="font-semibold text-slate-900">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400" style={{ width: `${Math.min(100, (count / Math.max(1, overview.totalApplications)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-700">
                <p className="font-semibold text-violet-800">Fairness monitor: {risk.fairnessScore}/100</p>
                <p className="mt-1 text-xs">{risk.disadvantagedLowRisk} disadvantaged borrowers sit in low-risk-high-need bucket.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className={`${cardShell} lg:col-span-2 p-6`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Beneficiary scoring insights</h3>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{scoringInsights.totalBeneficiaries} total</Badge>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    <th className="px-3 py-2">Application</th>
                    <th className="px-3 py-2">Beneficiary</th>
                    <th className="px-3 py-2">SCI</th>
                    <th className="px-3 py-2">ML conf</th>
                    <th className="px-3 py-2">Loan</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {scoringInsights.highlight.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3 font-semibold text-blue-600">{entry.applicationId}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{entry.beneficiary.name ?? 'Unnamed'}</div>
                        <div className="text-xs text-slate-500">{entry.beneficiary.email}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-lg font-semibold text-slate-900">{entry.finalSci.toFixed(1)}</span>
                        <p className="text-[11px] text-slate-500">{entry.incomeMismatchFlag ? 'Income check ⚠️' : 'Stable signals'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-blue-600">{Math.round(entry.mlProbability * 100)}%</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-slate-900">{formatCurrency(entry.loanAmount)}</div>
                        {entry.approvedLoanAmount && (
                          <p className="text-xs text-emerald-600">Approved {formatCurrency(entry.approvedLoanAmount)}</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${entry.riskBand ? riskColour[entry.riskBand] : 'border-slate-200 text-slate-600'}`}>
                          {entry.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`${cardShell} p-6`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Manual review queue</h3>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="mt-4 space-y-3">
                {manualReviewQueue.length === 0 ? (
                  <p className="text-xs text-slate-500">Queue is clear. Incoming applications route to auto decisions.</p>
                ) : (
                  manualReviewQueue.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between text-sm text-slate-700">
                        <span className="font-semibold text-blue-600">{item.applicationId}</span>
                        <span className="text-xs text-slate-500">{formatDate(new Date(item.updatedAt))}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{item.user.name ?? 'Unknown'} · {item.user.state ?? 'NA'}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded-full border px-2 py-1 ${item.riskBand ? riskColour[item.riskBand] : 'border-slate-200 text-slate-600'}`}>{item.riskBand ?? 'NA'}</span>
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">{item.status.replace('_', ' ')}</span>
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700">ATR {item.abilityToRepayIndex ? item.abilityToRepayIndex.toFixed(1) : '—'}</span>
                        {item.incomeMismatchFlag && <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">Income mismatch</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={`${cardShell} p-6`}>
              <h3 className="text-lg font-semibold text-slate-900">Income verification</h3>
              <dl className="mt-4 space-y-3 text-sm text-slate-700">
                <DataPoint label="Pending" value={incomeVerification.pending} tone="amber" />
                <DataPoint label="Auto-verified" value={incomeVerification.autoVerified} tone="emerald" />
                <DataPoint label="Manual review" value={incomeVerification.manualReview} tone="blue" />
                <DataPoint label="Not required" value={incomeVerification.unneeded} tone="slate" />
                <DataPoint label="Income mismatch" value={incomeVerification.mismatches} tone="rose" />
              </dl>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className={`${cardShell} p-6`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Data coverage</h3>
              <Workflow className="h-5 w-5 text-blue-500" />
            </div>
            <div className="mt-4 space-y-4">
              {Object.entries(dataQuality.coverage).map(([key, value]) => {
                const percent = overview.totalApplications > 0 ? Math.round((value / overview.totalApplications) * 100) : 0
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{label}</span>
                      <span className="font-semibold text-slate-900">{percent}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700">
              {consentTotal} active consents powering signal graph.
            </div>
          </div>

          <div className={`${cardShell} p-6`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Direct lending status</h3>
              <Gauge className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Manual queue contains {directLending.manualQueue.length} applications with officer touchpoints.</p>
              <p>Optimise for high-need segments with fairness protection engaged.</p>
            </div>
            <Link href="/admin/operations" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
              Open operations console
            </Link>
          </div>

          <div className={`${cardShell} p-6`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Explainability telemetry</h3>
              <BarChart3 className="h-5 w-5 text-violet-500" />
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Total narratives generated</span>
                <span className="font-semibold text-violet-600">{explainability.totalNarratives}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <span>Approved · {explainability.byStatus.approved}</span>
                <span>Rejected · {explainability.byStatus.rejected}</span>
                <span>Manual review · {explainability.byStatus.manualReview}</span>
                <span>Processing · {explainability.byStatus.processing}</span>
              </div>
              <p className="text-xs text-violet-600/80">Average ML confidence {explainability.averageConfidence}% · High confidence share {explainability.highConfidenceShare}%</p>
            </div>
          </div>
        </section>

        <section className={`${cardShell} p-6`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Audit trail</h3>
            <Users className="h-5 w-5 text-slate-500" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-5 text-sm text-slate-600">
            {auditTrail.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{log.action}</p>
                <p className="mt-2 text-slate-900">{log.entity ?? 'System'}</p>
                <p className="text-xs text-slate-500">{log.entityId ?? '—'}</p>
                <p className="mt-3 text-[11px] text-slate-500">{formatDate(new Date(log.createdAt))}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function MetricPill({ label, value, helper, tone }: { label: string; value: string; helper: string; tone: 'emerald' | 'sky' | 'violet' }) {
  const toneStyles: Record<typeof tone, string> = {
    emerald: 'border border-emerald-100 bg-emerald-50 text-emerald-700',
    sky: 'border border-sky-100 bg-sky-50 text-sky-700',
    violet: 'border border-violet-100 bg-violet-50 text-violet-700'
  }

  return (
    <div className={`rounded-2xl px-4 py-4 shadow-sm ${toneStyles[tone]}`}>
      <p className="text-xs uppercase tracking-[0.25em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="text-xs opacity-70">{helper}</p>
    </div>
  )
}

function DataPoint({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'emerald' | 'blue' | 'slate' | 'rose' }) {
  const toneMap: Record<typeof tone, string> = {
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    slate: 'text-slate-600',
    rose: 'text-rose-600'
  }
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</dt>
      <dd className={`text-sm font-semibold ${toneMap[tone]}`}>{value}</dd>
    </div>
  )
}
