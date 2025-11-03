'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Plus, FileText, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, LogOut, Sparkles, ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate, formatPercent, formatNumber } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'

interface Application {
  id: string
  applicationId: string
  loanAmount: number
  approvedLoanAmount: number | null
  tenureMonths: number
  status: string
  riskBand: string | null
  riskCategory: string | null
  needCategory: string | null
  finalSci: number | null
  mlProbability: number | null
  compositeScore: number | null
  decisionMessage: string | null
  scoreDetails: unknown
  consentRecharge: boolean
  consentElectricity: boolean
  consentEducation: boolean
  consentBankStatement: boolean
  createdAt: string
  processedAt: string | null
}

const normaliseScoreDetails = (raw: unknown) => {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch (err) {
      console.warn('Failed to parse scoreDetails JSON', err)
      return null
    }
  }
  return raw as Record<string, any>
}

const getScoreBreakdown = (details: Record<string, any> | null) => {
  if (!details) return null
  return (
    details.scoreBreakdown ||
    details.score_breakdown ||
    details.breakdown ||
    null
  ) as Record<string, any> | null
}

const getCombineDetails = (details: Record<string, any> | null) => {
  if (!details) return null
  return (
    details.combineDetails ||
    details.combine_details ||
    null
  ) as Record<string, any> | null
}

const formatRiskLabel = (riskBand: string | null) => {
  if (!riskBand) return null
  return riskBand
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchApplications = useCallback(async () => {
    try {
      const response = await fetch('/api/applications')

      if (response.status === 401) {
        setIsLoading(false)
        router.push('/login?callbackUrl=/dashboard')
        return
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = await response.json()
      setApplications(data.applications || [])
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      setError('We could not load your applications. Please try again in a moment.')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      if (session?.user?.role === 'ADMIN' || session?.user?.role === 'LOAN_OFFICER') {
        router.replace('/admin')
        return
      }
      fetchApplications()
    }
  }, [status, router, fetchApplications, session])

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="text-center relative z-10">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl">
              <Shield className="h-16 w-16 text-white animate-pulse" />
            </div>
          </div>
          <Loading size="lg" text="Loading your dashboard..." />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="glass border-b border-white/50 sticky top-0 z-10 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">SafeCred</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">{session?.user?.name}</p>
                <p className="text-xs text-slate-500">{session?.user?.email}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/api/auth/signout')}
                className="border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-300 rounded-xl"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 fade-in-up">
          <h1 className="text-4xl font-bold gradient-text mb-3 flex items-center gap-3">
            Welcome back, {session?.user?.name?.split(' ')[0]}! 
            <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
          </h1>
          <p className="text-slate-600 text-lg">Manage your loan applications and track your credit score</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-gradient hover-lift glow-hover fade-in-up">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-600 font-medium">Total Applications</CardDescription>
              <CardTitle className="text-4xl font-bold gradient-text">{applications.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass border-gradient hover-lift glow-hover fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-600 font-medium">Approved</CardDescription>
              <CardTitle className="text-4xl font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text flex items-center gap-2">
                {applications.filter(a => a.status === 'APPROVED').length}
                <CheckCircle className="h-6 w-6 text-green-500" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass border-gradient hover-lift glow-hover fade-in-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-600 font-medium">Pending</CardDescription>
              <CardTitle className="text-4xl font-bold text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text flex items-center gap-2">
                {applications.filter(a => a.status === 'PENDING' || a.status === 'PROCESSING').length}
                <Clock className="h-6 w-6 text-yellow-500" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass border-gradient hover-lift glow-hover fade-in-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-600 font-medium">Total Approved Amount</CardDescription>
              <CardTitle className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text flex items-center gap-2">
                {formatCurrency(
                  applications
                    .filter(a => a.status === 'APPROVED')
                    .reduce((sum, a) => sum + (a.approvedLoanAmount || 0), 0)
                )}
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Action Button */}
        <div className="mb-8 fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Link href="/apply">
            <Button size="lg" className="gap-2 h-14 px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
              <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
              Apply for New Loan
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Applications List */}
        <Card className="glass border-gradient shadow-xl fade-in-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <CardTitle className="text-2xl gradient-text">Your Applications</CardTitle>
            <CardDescription className="text-base">Track the status of your loan applications</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 text-sm text-red-700 shadow-md slide-in-from-top">
                <strong className="font-semibold">Error:</strong> {error}
              </div>
            )}
            {applications.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl">
                    <FileText className="h-16 w-16 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold gradient-text mb-3">No applications yet</h3>
                <p className="text-slate-600 mb-6 text-lg">Start your loan application process today</p>
                <Link href="/apply">
                  <Button className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
                    Apply for Loan
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const scoreDetails = normaliseScoreDetails(app.scoreDetails)
                  const breakdown = getScoreBreakdown(scoreDetails)
                  const combine = getCombineDetails(scoreDetails)
                  const components = (breakdown?.components || {}) as Record<string, any>

                  const consentDepth = typeof breakdown?.consent_depth === 'number'
                    ? breakdown.consent_depth
                    : typeof components?.consent_depth === 'number'
                      ? components.consent_depth
                      : null

                  const fairnessBonus = typeof breakdown?.fair_lending_bonus === 'number' ? breakdown.fair_lending_bonus : 0
                  const incomeRelief = typeof breakdown?.income_volatility_relief === 'number' ? breakdown.income_volatility_relief : 0

                  const loanToIncome = typeof breakdown?.loan_to_income_ratio === 'number'
                    ? breakdown.loan_to_income_ratio
                    : typeof scoreDetails?.loan_to_income_ratio === 'number'
                      ? scoreDetails.loan_to_income_ratio
                      : null

                  const consentBonus = typeof scoreDetails?.consent_bonus === 'number' ? scoreDetails.consent_bonus : null
                  const featuresExtracted = typeof scoreDetails?.features_extracted === 'number' ? scoreDetails.features_extracted : null
                  const pillarScores = (breakdown?.pillar_scores || {}) as Record<string, number>

                  const mlProbability = app.mlProbability ?? combine?.ml_probability ?? null
                  const compositeScore = app.compositeScore ?? combine?.composite_score ?? null
                  const finalSci = app.finalSci ?? combine?.final_sci ?? null

                  const consentFlags = [
                    { label: 'Bank Statement', value: app.consentBankStatement },
                    { label: 'Mobile Recharge', value: app.consentRecharge },
                    { label: 'Electricity Bills', value: app.consentElectricity },
                    { label: 'Education Fees', value: app.consentEducation },
                  ]

                  const fairnessInsights: string[] = []
                  if (consentDepth !== null) {
                    fairnessInsights.push(`Consent depth recorded at ${formatPercent(consentDepth, 0)}.`)
                    if (consentDepth < 0.5) {
                      fairnessInsights.push('Share one more data source to unlock a bigger fairness boost.')
                    }
                  }
                  if (fairnessBonus > 0) {
                    fairnessInsights.push(`Fair lending bonus added ${(fairnessBonus * 100).toFixed(0)} pts to your composite score.`)
                  }
                  if (incomeRelief > 0) {
                    fairnessInsights.push('Income volatility relief supported your score despite irregular cashflows.')
                  }
                  if (loanToIncome !== null && loanToIncome > 0.6) {
                    fairnessInsights.push('Loan-to-income ratio is high; a loan officer will confirm affordability before approval.')
                  }

                  const statusMessage = app.decisionMessage ||
                    (app.status === 'APPROVED'
                      ? 'Your loan has been approved! Disbursement will be processed within 24 hours.'
                      : app.status === 'MANUAL_REVIEW'
                        ? 'Your application is under manual review. You will be notified of the decision soon.'
                        : app.status === 'REJECTED'
                          ? 'This application did not meet our lending criteria.'
                          : null)

                  const statusTone = app.status === 'APPROVED'
                    ? 'success'
                    : app.status === 'REJECTED'
                      ? 'destructive'
                      : 'warning'

                  return (
                    <div key={app.id} className="border-2 border-slate-200 rounded-xl p-6 hover-lift bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-blue-300">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl gradient-text">Application #{app.applicationId}</h3>
                            {getStatusBadge(app.status)}
                            {app.riskBand && getRiskBadge(app.riskBand)}
                            {app.needCategory && (
                              <Badge variant="info">{app.needCategory}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 font-medium">
                            Applied on {formatDate(app.createdAt)}
                          </p>
                          {app.riskCategory && (
                            <p className="text-xs text-slate-500 mt-1">
                              Risk category: {app.riskCategory}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500 font-medium">Requested Amount</p>
                          <p className="text-2xl font-bold gradient-text">
                            {formatCurrency(app.loanAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Tenure</p>
                          <p className="font-medium">{app.tenureMonths} months</p>
                        </div>
                        {app.approvedLoanAmount && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Loan Offer</p>
                            <p className="font-medium text-green-600">
                              {formatCurrency(app.approvedLoanAmount)}
                            </p>
                          </div>
                        )}
                        {finalSci !== null && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">SafeCred Index</p>
                            <p className={`font-semibold ${
                              finalSci >= 80 ? 'text-green-600' :
                              finalSci >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {finalSci.toFixed(0)}/100
                            </p>
                          </div>
                        )}
                        {mlProbability !== null && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">ML Confidence</p>
                            <p className="font-medium">{formatPercent(mlProbability, 1)}</p>
                          </div>
                        )}
                        {compositeScore !== null && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Composite Score</p>
                            <p className="font-medium">{formatNumber(compositeScore, 1)}</p>
                          </div>
                        )}
                        {loanToIncome !== null && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Loan-to-Income</p>
                            <p className="font-medium">{loanToIncome.toFixed(2)}x</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {consentFlags.map((consent) => (
                          <Badge
                            key={consent.label}
                            variant={consent.value ? 'success' : 'outline'}
                            className={consent.value ? '' : 'text-gray-500'}
                          >
                            {consent.value ? 'Granted' : 'Missing'} · {consent.label}
                          </Badge>
                        ))}
                        {consentBonus !== null && consentBonus > 0 && (
                          <Badge variant="secondary" className="text-green-700">
                            +₹{consentBonus.toLocaleString('en-IN')} consent bonus
                          </Badge>
                        )}
                      </div>

                      {breakdown && (
                        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-gray-700">Fairness insights</h4>
                            {app.riskBand && (
                              <Badge variant="outline" className="text-gray-600">
                                {formatRiskLabel(app.riskBand)}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Consent depth</p>
                              <p className="font-medium">{formatPercent(consentDepth ?? 0, 0)}</p>
                              <div className="mt-1 h-2 rounded-full bg-white">
                                <div
                                  className="h-2 rounded-full bg-blue-500"
                                  style={{ width: `${Math.min(100, Math.max(0, (consentDepth ?? 0) * 100))}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Fair lending bonus</p>
                              <p className="font-medium">{(fairnessBonus * 100).toFixed(0)} pts</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Income relief applied</p>
                              <p className="font-medium">{(incomeRelief * 100).toFixed(0)} pts</p>
                            </div>
                            {featuresExtracted !== null && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Signals analysed</p>
                                <p className="font-medium">{featuresExtracted}</p>
                              </div>
                            )}
                          </div>

                          {Object.keys(pillarScores).length > 0 && (
                            <div className="mt-4">
                              <p className="text-xs text-gray-500 mb-2">Pillar contribution</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(pillarScores).map(([pillar, value]) => (
                                  <div key={pillar} className="rounded-md bg-white px-3 py-2 text-sm">
                                    <p className="text-xs uppercase text-gray-400">{pillar}</p>
                                    <p className="font-semibold text-gray-700">{formatPercent(value, 0)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {fairnessInsights.length > 0 && (
                            <ul className="mt-4 space-y-2 text-sm text-gray-600 list-disc list-inside">
                              {fairnessInsights.map((note) => (
                                <li key={note}>{note}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {statusMessage && (
                        <div className="mt-4 pt-4 border-t">
                          <div
                            className={`flex items-center gap-2 text-sm px-4 py-2 rounded ${
                              statusTone === 'success'
                                ? 'text-green-700 bg-green-50'
                                : statusTone === 'destructive'
                                  ? 'text-red-700 bg-red-50'
                                  : 'text-yellow-700 bg-yellow-50'
                            }`}
                          >
                            {statusTone === 'success' && <CheckCircle className="h-4 w-4" />}
                            {statusTone === 'warning' && <AlertCircle className="h-4 w-4" />}
                            {statusTone === 'destructive' && <XCircle className="h-4 w-4" />}
                            <span>{statusMessage}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
