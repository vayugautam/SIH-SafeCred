import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Plus, FileText, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, LogOut, Sparkles, ArrowRight, LayoutDashboard, Settings, User, Heart, Zap, Target, Award, TrendingDown, Activity } from 'lucide-react'
import { formatCurrency, formatDate, formatPercent, formatNumber } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'
import { NotificationBell } from '@/components/NotificationBell'

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

interface UserStats {
  totalApplications: number
  approvedApplications: number
  rejectedApplications: number
  pendingApplications: number
  totalApprovedAmount: number
  totalRequestedAmount: number
  averageSci: number | null
  repaymentRate: number | null
  healthScore: number
  totalPayments: number
  onTimePayments: number
  latePayments: number
  missedPayments: number
}

interface CoachingTip {
  category: string
  tip: string
  impact: string
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

export default function Dashboard() {
  const { user, token, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchApplications = useCallback(async () => {
    try {
      const [appsResponse, statsResponse] = await Promise.all([
        axios.get('/api/applications', { validateStatus: () => true }),
        axios.get('/api/user/stats', { validateStatus: () => true }),
      ])

      if (appsResponse.status === 401) {
        setIsLoading(false)
        navigate('/login?callbackUrl=/dashboard')
        return
      }

      if (appsResponse.status >= 400) {
        throw new Error(`Request failed with status ${appsResponse.status}`)
      }

      const appsData = appsResponse.data
      setApplications(appsData.applications || [])

      if (statsResponse.status >= 200 && statsResponse.status < 300) {
        const statsData = statsResponse.data
        setUserStats(statsData.stats || null)
        setRecommendations(statsData.recommendations || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setError('We could not load your data. Please try again in a moment.')
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login')
    } else if (user) {
      if (user.role === 'ADMIN' || user.role === 'LOAN_OFFICER') {
        navigate('/admin', { replace: true })
        return
      }
      fetchApplications()
    }
  }, [user, authLoading, navigate, fetchApplications])

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
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">SafeCred</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link to="/dashboard" className="text-sm font-medium text-blue-600 flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link to="/dashboard/profile" className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link to="/dashboard/settings" className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/api/auth/signout')}
                className="text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">Welcome back, {user?.name?.split(' ')[0]}</p>
          </div>
          <Link to="/apply">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <Link to="/apply" className="text-lg font-bold text-slate-900 hover:text-blue-600">New Application</Link>
                  <p className="text-sm text-slate-600">Apply for instant credit</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-600 rounded-xl">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <Link to="/dashboard/profile" className="text-lg font-bold text-slate-900 hover:text-green-600">Boost Score</Link>
                  <p className="text-sm text-slate-600">Share more data sources</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600 rounded-xl">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-slate-900">Track Progress</span>
                  <p className="text-sm text-slate-600">View detailed analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Total Applications
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-slate-900">
                {userStats?.totalApplications || applications.length}
              </CardTitle>
              {userStats && userStats.totalApplications > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Approved: {((userStats.approvedApplications / userStats.totalApplications) * 100).toFixed(0)}%
                </p>
              )}
            </CardHeader>
          </Card>
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Approved Loans
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-green-600 flex items-center gap-2">
                {userStats?.approvedApplications || applications.filter(a => a.status === 'APPROVED').length}
              </CardTitle>
              {userStats && userStats.totalApprovedAmount > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {formatCurrency(userStats.totalApprovedAmount)}
                </p>
              )}
            </CardHeader>
          </Card>
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Financial Health
              </CardDescription>
              <CardTitle className={`text-3xl font-bold flex items-center gap-2 ${
                (userStats?.healthScore || 50) >= 75 ? 'text-green-600' :
                (userStats?.healthScore || 50) >= 50 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {userStats?.healthScore || 50}
                <Award className="h-5 w-5" />
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                {(userStats?.healthScore || 50) >= 75 ? 'Excellent' :
                 (userStats?.healthScore || 50) >= 50 ? 'Good' : 'Needs Improvement'}
              </p>
            </CardHeader>
          </Card>
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Average SCI Score
              </CardDescription>
              <CardTitle className={`text-3xl font-bold ${
                (userStats?.averageSci || 0) >= 70 ? 'text-green-600' :
                (userStats?.averageSci || 0) >= 50 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {userStats?.averageSci ? userStats.averageSci.toFixed(0) : '--'}
              </CardTitle>
              {userStats?.averageSci && (
                <p className="text-xs text-slate-500 mt-1">
                  Out of 100
                </p>
              )}
            </CardHeader>
          </Card>
        </div>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">AI-Powered Recommendations</CardTitle>
              </div>
              <CardDescription>Personalized tips to improve your creditworthiness</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <Zap className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <span className="text-slate-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Repayment Stats */}
        {userStats && userStats.totalPayments > 0 && (
          <Card className="mb-8 border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-600" />
                Repayment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">On-Time Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {userStats.repaymentRate ? userStats.repaymentRate.toFixed(1) : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total Payments</p>
                  <p className="text-2xl font-bold text-slate-900">{userStats.totalPayments}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">On-Time</p>
                  <p className="text-2xl font-bold text-green-600">{userStats.onTimePayments}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Late/Missed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {userStats.latePayments + userStats.missedPayments}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-600" />
                Financial Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium text-sm text-slate-900">Maintain consistent income</p>
                  <p className="text-xs text-slate-600">Regular deposits improve creditworthiness by 15-20%</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-green-50 rounded-lg">
                <div className="shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium text-sm text-slate-900">Share utility bill data</p>
                  <p className="text-xs text-slate-600">On-time payments boost your SCI score by up to 25 points</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium text-sm text-slate-900">Keep loan utilization low</p>
                  <p className="text-xs text-slate-600">Borrowing less than 50% of approved limit is ideal</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <p className="font-medium text-sm text-slate-900">Complete your profile</p>
                  <p className="text-xs text-slate-600">100% profile completion increases approval odds by 30%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Your Credit Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-900">Profile Completion</span>
                  <span className="text-sm font-bold text-blue-600">85%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{width: '85%'}}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Add mobile number to reach 100%</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-900">Data Sharing Level</span>
                  <span className="text-sm font-bold text-green-600">Good</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-2 bg-green-600 rounded-full"></div>
                  <div className="flex-1 h-2 bg-green-600 rounded-full"></div>
                  <div className="flex-1 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full"></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Share education data for +10% bonus</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-slate-900 mb-3">Next Milestones</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-slate-600">First application submitted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-600">Complete 3 on-time payments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-600">Reach SCI score of 750+</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Applications</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {applications.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No applications yet</h3>
                <p className="text-slate-500 mb-6 max-w-sm">
                  Start your journey by applying for a loan. We use alternative data to give you the best rates.
                </p>
                <Link to="/apply">
                  <Button variant="outline" className="gap-2">
                    Start Application
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
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
                  <Card key={app.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg text-slate-900">Application #{app.applicationId}</h3>
                            {getStatusBadge(app.status)}
                          </div>
                          <p className="text-sm text-slate-500">
                            Applied on {formatDate(app.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Requested Amount</p>
                          <p className="text-xl font-bold text-slate-900">
                            {formatCurrency(app.loanAmount)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-6">
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Tenure</p>
                          <p className="font-medium text-slate-900">{app.tenureMonths} months</p>
                        </div>
                        {app.approvedLoanAmount && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Loan Offer</p>
                            <p className="font-medium text-green-600">
                              {formatCurrency(app.approvedLoanAmount)}
                            </p>
                          </div>
                        )}
                        {finalSci !== null && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">SafeCred Index</p>
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
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">ML Confidence</p>
                            <p className="font-medium text-slate-900">{formatPercent(mlProbability, 1)}</p>
                          </div>
                        )}
                        {compositeScore !== null && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Composite Score</p>
                            <p className="font-medium text-slate-900">{formatNumber(compositeScore, 1)}</p>
                          </div>
                        )}
                        {loanToIncome !== null && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Loan-to-Income</p>
                            <p className="font-medium text-slate-900">{loanToIncome.toFixed(2)}x</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {consentFlags.map((consent) => (
                          <Badge
                            key={consent.label}
                            variant={consent.value ? 'success' : 'outline'}
                            className={consent.value ? '' : 'text-slate-400 border-slate-200'}
                          >
                            {consent.value ? 'Granted' : 'Missing'} · {consent.label}
                          </Badge>
                        ))}
                        {consentBonus !== null && consentBonus > 0 && (
                          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                            +₹{consentBonus.toLocaleString('en-IN')} consent bonus
                          </Badge>
                        )}
                      </div>

                      {breakdown && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-blue-600" />
                              Fairness Insights
                            </h4>
                            {app.riskBand && (
                              <Badge variant="outline" className="bg-white">
                                {formatRiskLabel(app.riskBand)}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Consent depth</p>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900">{formatPercent(consentDepth ?? 0, 0)}</p>
                                <div className="h-1.5 flex-1 rounded-full bg-slate-200 max-w-[100px]">
                                  <div
                                    className="h-1.5 rounded-full bg-blue-600"
                                    style={{ width: `${Math.min(100, Math.max(0, (consentDepth ?? 0) * 100))}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Fair lending bonus</p>
                              <p className="font-medium text-slate-900">{(fairnessBonus * 100).toFixed(0)} pts</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Income relief applied</p>
                              <p className="font-medium text-slate-900">{(incomeRelief * 100).toFixed(0)} pts</p>
                            </div>
                            {featuresExtracted !== null && (
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Signals analysed</p>
                                <p className="font-medium text-slate-900">{featuresExtracted}</p>
                              </div>
                            )}
                          </div>

                          {Object.keys(pillarScores).length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs text-slate-500 mb-2">Pillar contribution</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(pillarScores).map(([pillar, value]) => (
                                  <div key={pillar} className="rounded border border-slate-200 bg-white px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{pillar}</p>
                                    <p className="font-semibold text-slate-700">{formatPercent(value, 0)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {fairnessInsights.length > 0 && (
                            <div className="bg-blue-50/50 rounded p-3">
                              <ul className="space-y-1 text-sm text-slate-600 list-disc list-inside">
                                {fairnessInsights.map((note) => (
                                  <li key={note}>{note}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {statusMessage && (
                        <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                          statusTone === 'success'
                            ? 'bg-green-50 border-green-100 text-green-800'
                            : statusTone === 'destructive'
                              ? 'bg-red-50 border-red-100 text-red-800'
                              : 'bg-yellow-50 border-yellow-100 text-yellow-800'
                        }`}>
                          {statusTone === 'success' && <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                          {statusTone === 'warning' && <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                          {statusTone === 'destructive' && <XCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                          <p className="text-sm font-medium">{statusMessage}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
