// app/src/app/apply/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Shield, Loader2, CheckCircle, AlertTriangle, XCircle, Clock, Sparkles } from 'lucide-react'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'

const createInitialFormState = () => ({
  declaredIncome: '',
  loanAmount: '',
  tenureMonths: '12',
  purpose: '',
  consentRecharge: false,
  consentElectricity: false,
  consentEducation: false,
  consentBankStatement: false,
  existingLoanAmount: '',
  bankStatement: {
    monthlyCredits: '',
    avgBalance: '',
  },
  rechargeHistory: {
    frequency: '',
    avgAmount: '',
  },
  electricityBills: {
    frequency: '',
    avgPayment: '',
    consistency: '',
  },
  educationFees: {
    avgFee: '',
    consistency: '',
    onTimeRatio: '',
    frequency: '',
  },
  repaymentHistory: {
    onTimeRatio: '',
    avgPaymentDelayDays: '',
    missedCount: '',
    previousLoansCount: '',
    timeSinceLastLoan: '',
  },
})

const formatRiskLabel = (value?: string | null) => {
  if (!value) return '—'
  return value
    .toString()
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const STATUS_META = {
  approved: {
    title: 'Application Approved',
    circleBg: 'bg-green-100',
    iconColor: 'text-green-600',
    banner: 'bg-green-50 text-green-700',
    icon: CheckCircle,
  },
  manual_review: {
    title: 'Application Under Manual Review',
    circleBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    banner: 'bg-yellow-50 text-yellow-700',
    icon: AlertTriangle,
  },
  rejected: {
    title: 'Application Not Approved',
    circleBg: 'bg-red-100',
    iconColor: 'text-red-600',
    banner: 'bg-red-50 text-red-700',
    icon: XCircle,
  },
  default: {
    title: 'Application Submitted',
    circleBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    banner: 'bg-blue-50 text-blue-700',
    icon: Clock,
  },
} as const

type StatusKey = keyof typeof STATUS_META

const getStatusMeta = (status?: string | null) => {
  const key = (status || 'default').toLowerCase() as StatusKey
  return STATUS_META[key] ?? STATUS_META.default
}

export default function ApplyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [incomeBarrier, setIncomeBarrier] = useState<number>(15000) // Default barrier

  const [formData, setFormData] = useState(createInitialFormState)
  const [incomeTier, setIncomeTier] = useState<'unknown' | 'low' | 'high'>('unknown')
  const [currentStep, setCurrentStep] = useState<'income' | 'low' | 'high'>('income')

  // helper to get user mobile from session (if available)
  const userMobile = session?.user?.mobile || ''

  // Determine if user qualifies for alternative proxies based on declared income
  const declaredIncomeNum = Number(formData.declaredIncome) || 0
  const isHighIncome = incomeTier === 'high'
  const showAlternativeProxies = incomeTier === 'low'

  // Load income barrier from backend on mount
  useEffect(() => {
    const loadIncomeBarrier = async () => {
      try {
        const resp = await fetch('/api/ml-metadata')
        if (resp.ok) {
          const data = await resp.json()
          if (data.incomeBarrier && Number.isFinite(data.incomeBarrier)) {
            setIncomeBarrier(data.incomeBarrier)
          }
        }
      } catch (err) {
        console.warn('Failed to load income barrier, using default:', err)
      }
    }
    loadIncomeBarrier()
  }, [])

  // Auto-disable alternative proxy consents when income becomes high
  useEffect(() => {
    if (incomeTier === 'high') {
      setFormData((prev) => ({
        ...prev,
        consentRecharge: false,
        consentElectricity: false,
        consentEducation: false,
      }))
    }
  }, [incomeTier])

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading application form...</p>
        </div>
      </div>
    )
  }

  // Verify declared income against NBCFDC "real income" (backend proxy)
  const verifyIncome = async (mobile: string | undefined, declaredIncome: number) => {
    try {
      if (!mobile) {
        // If mobile not available, we can't verify — return "no-data"
        return { status: 'no_data', realIncome: null, diffPct: null }
      }

      const resp = await fetch('/api/nbcfdc/verify-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      })

      if (!resp.ok) {
        // backend error; return as no_data so we don't block incorrectly, but log
        return { status: 'error', realIncome: null, diffPct: null }
      }

      const body = await resp.json()
      // expect { realIncome: number } or { error: string }
      const realIncome = Number(body.realIncome)
      if (!Number.isFinite(realIncome) || realIncome <= 0) {
        return { status: 'no_data', realIncome: null, diffPct: null }
      }

      const diff = Math.abs(declaredIncome - realIncome)
      const diffPct = (diff / realIncome) * 100
      const allowed = diffPct <= 10.0

      return { status: allowed ? 'ok' : 'mismatch', realIncome, diffPct }
    } catch (err) {
      return { status: 'error', realIncome: null, diffPct: null }
    }
  }

  // Report a mismatch event to backend so admin analytics can increment counters
  const reportIncomeMismatch = async (payload: { userId?: string; mobile?: string; declaredIncome: number; realIncome?: number; diffPct?: number }) => {
    try {
      await fetch('/api/report/income-mismatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      // ignore reporting errors on frontend
      console.warn('Failed to report income mismatch', err)
    }
  }

  const handleIncomeStepContinue = () => {
    setError('')

    const declaredIncomeValue = Number(formData.declaredIncome)
    const loanAmountValue = Number(formData.loanAmount)

    if (!Number.isFinite(declaredIncomeValue) || declaredIncomeValue <= 0) {
      setError('Please enter a valid declared monthly income to continue.')
      return
    }

    if (!Number.isFinite(loanAmountValue) || loanAmountValue <= 0) {
      setError('Please enter a valid loan amount to continue.')
      return
    }

    const tier = declaredIncomeValue >= incomeBarrier ? 'high' : 'low'
    setIncomeTier(tier)
    setCurrentStep(tier)
  }

  const handleBackToIncomeStep = () => {
    setCurrentStep('income')
    setIncomeTier('unknown')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (currentStep === 'income') {
        handleIncomeStepContinue()
        setIsLoading(false)
        return
      }

      const toNumber = (value: string) => {
        if (value === '' || value === null || value === undefined) return undefined
        const num = Number(value)
        return Number.isFinite(num) ? num : undefined
      }

      const declaredIncomeValue = Number(formData.declaredIncome)
      const loanAmountValue = Number(formData.loanAmount)

      if (!Number.isFinite(declaredIncomeValue) || !Number.isFinite(loanAmountValue)) {
        setError('Please provide valid numeric values for income and loan amount.')
        setIsLoading(false)
        return
      }

      const recalculatedTier = declaredIncomeValue >= incomeBarrier ? 'high' : 'low'
      if (incomeTier !== recalculatedTier) {
        setIncomeTier(recalculatedTier)
      }

      // --- Step A: Verify income with NBCFDC (defensive check before submit) ---
      const verify = await verifyIncome(userMobile, declaredIncomeValue)

      if (verify.status === 'mismatch') {
        // If mismatch > 10%: block application and report
        setError(
          `Your declared monthly income (₹${declaredIncomeValue.toLocaleString('en-IN')}) differs from registered income (₹${verify.realIncome?.toLocaleString('en-IN')}) by ${verify.diffPct?.toFixed(1)}%. Applications with >10% mismatch are not allowed. If this is incorrect, contact support.`
        )

        // Report to backend so admin analytics increments fraudIncome counter
        await reportIncomeMismatch({
          userId: session?.user?.id,
          mobile: userMobile,
          declaredIncome: declaredIncomeValue,
          realIncome: verify.realIncome ?? undefined,
          diffPct: Number(verify.diffPct?.toFixed(2) || 0)
        })

        setIsLoading(false)
        return
      }

      // If verify.status is 'error' or 'no_data' => proceed, but backend will run server-side verification too.
      // (This choice is conservative: don't block when no external data, but backend will still check.)
      const payload: Record<string, any> = {
        declaredIncome: declaredIncomeValue,
        loanAmount: loanAmountValue,
        tenureMonths: parseInt(formData.tenureMonths),
        purpose: formData.purpose,
        consentRecharge: formData.consentRecharge,
        consentElectricity: formData.consentElectricity,
        consentEducation: formData.consentEducation,
        consentBankStatement: formData.consentBankStatement,
      }

      const existingLoanAmountValue = toNumber(formData.existingLoanAmount)
      if (existingLoanAmountValue !== undefined) {
        payload.existingLoanAmount = existingLoanAmountValue
      }

      const bankStatementPayload = {
        monthlyCredits: toNumber(formData.bankStatement.monthlyCredits),
        avgBalance: toNumber(formData.bankStatement.avgBalance),
      }
      if (Object.values(bankStatementPayload).some((val) => val !== undefined)) {
        payload.bankStatement = bankStatementPayload
      }

      const rechargeHistoryPayload = {
        frequency: toNumber(formData.rechargeHistory.frequency),
        avgAmount: toNumber(formData.rechargeHistory.avgAmount),
      }
      if (Object.values(rechargeHistoryPayload).some((val) => val !== undefined)) {
        payload.rechargeHistory = rechargeHistoryPayload
      }

      const electricityBillsPayload = {
        frequency: toNumber(formData.electricityBills.frequency),
        avgPayment: toNumber(formData.electricityBills.avgPayment),
        consistency: toNumber(formData.electricityBills.consistency),
      }
      if (Object.values(electricityBillsPayload).some((val) => val !== undefined)) {
        payload.electricityBills = electricityBillsPayload
      }

      const educationFeesPayload = {
        avgFee: toNumber(formData.educationFees.avgFee),
        consistency: toNumber(formData.educationFees.consistency),
        onTimeRatio: toNumber(formData.educationFees.onTimeRatio),
        frequency: toNumber(formData.educationFees.frequency),
      }
      if (Object.values(educationFeesPayload).some((val) => val !== undefined)) {
        payload.educationFees = educationFeesPayload
      }

      const repaymentHistoryPayload = {
        onTimeRatio: toNumber(formData.repaymentHistory.onTimeRatio),
        avgPaymentDelayDays: toNumber(formData.repaymentHistory.avgPaymentDelayDays),
        missedCount: toNumber(formData.repaymentHistory.missedCount),
        previousLoansCount: toNumber(formData.repaymentHistory.previousLoansCount),
        timeSinceLastLoan: toNumber(formData.repaymentHistory.timeSinceLastLoan),
      }
      if (Object.values(repaymentHistoryPayload).some((val) => val !== undefined)) {
        payload.repaymentHistory = repaymentHistoryPayload
      }

      // attach mobile for server-side cross-check (backend uses this to fetch NBCFDC record)
      if (userMobile) payload.mobile = userMobile

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.status === 401) {
        setIsLoading(false)
        router.push('/login?callbackUrl=/apply')
        return
      }

      if (!response.ok) {
        setError(
          data?.message ||
          data?.error ||
          'We could not process your application right now. Please try again shortly.'
        )

        // If backend returns an applicationId even on error, show it
        if (data?.applicationId && !success) {
          setResult({ application: { applicationId: data.applicationId }, mlResult: null })
        }
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setResult(data)
      setIsLoading(false)
    } catch (error) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSuccess(false)
    setResult(null)
    setFormData(createInitialFormState())
    setIncomeTier('unknown')
    setCurrentStep('income')
    setError('')
  }

  if (success && result) {
    const mlResult = result.mlResult || {}
    const application = result.application || {}

    const statusMeta = getStatusMeta(mlResult.status || application.status)
    const StatusIcon = statusMeta.icon

    const details = mlResult.details || {}
    const breakdown = details.scoreBreakdown || details.score_breakdown || {}
    const combine = details.combineDetails || details.combine_details || {}
    const components = breakdown.components || {}

    const toNumber = (value: any): number | null =>
      typeof value === 'number' && Number.isFinite(value) ? value : null

    const consentDepth = toNumber(breakdown.consent_depth) ?? toNumber(components.consent_depth) ?? 0
    const fairnessBonus = toNumber(breakdown.fair_lending_bonus) ?? 0
    const incomeRelief = toNumber(breakdown.income_volatility_relief) ?? 0
    const loanToIncome = toNumber(breakdown.loan_to_income_ratio) ??
      toNumber(details.loan_to_income_ratio) ?? null
    const consentBonus = toNumber(details.consent_bonus)
    const featuresExtracted = toNumber(details.features_extracted)

    const pillarScores = (breakdown.pillar_scores || {}) as Record<string, number>
    const mlProbability = mlResult.mlProbability ?? mlResult.ml_probability ?? toNumber(combine.ml_probability)
    const compositeScore = mlResult.compositeScore ?? mlResult.composite_score ?? toNumber(combine.composite_score)
    const finalSci = mlResult.finalSci ?? mlResult.final_sci ?? toNumber(combine.final_sci)
    const loanOffer = mlResult.loanOffer ?? mlResult.loan_offer ?? application.approvedLoanAmount ?? null
    const riskBand = mlResult.riskBand || formatRiskLabel(application.riskBand)
    const riskCategory = mlResult.riskCategory || application.riskCategory
    const needCategory = mlResult.needCategory || application.needCategory
    const message = mlResult.message || application.decisionMessage || 'We have received your application.'

    const combineDetails = combine || {}
    const finalFloor = combineDetails.final_floor_adjustment
    const qualifiesAuto = Boolean(details.meets_low_risk_automatic || details.qualifies_high_confidence)

    const declaredIncomeValue = Number(application.declaredIncome ?? mlResult.declaredIncome ?? 0)
    const incomeBarrierUsed = Number(breakdown.income_barrier ?? details.income_barrier ?? incomeBarrier) || incomeBarrier
    const alternativeProxiesBlocked = Boolean(breakdown.alternative_proxies_blocked ?? details.alternative_proxies_blocked ?? false) ||
      (incomeBarrierUsed > 0 && declaredIncomeValue >= incomeBarrierUsed)

    const consentBase = [
      { label: 'Bank Statement', value: application.consentBankStatement, key: 'bank' },
      { label: 'Mobile Recharge', value: application.consentRecharge, key: 'recharge' },
      { label: 'Electricity Bills', value: application.consentElectricity, key: 'electricity' },
      { label: 'Education Fees', value: application.consentEducation, key: 'education' },
    ]

    const consentBadges = alternativeProxiesBlocked
      ? consentBase.filter((item) => item.key === 'bank')
      : consentBase

    const grantedConsents = consentBadges.filter((consent) => consent.value).length
    const totalConsentSlots = consentBadges.length > 0 ? consentBadges.length : 1
    const consentDepthDisplay = totalConsentSlots > 0 ? grantedConsents / totalConsentSlots : 0

    const fairnessInsights: string[] = []
    if (alternativeProxiesBlocked) {
      fairnessInsights.push('High-income track relies on repayment history; alternative proxies stay locked to prevent misuse.')
      if (fairnessBonus === 0) {
        fairnessInsights.push('Fair lending bonus is reserved for the inclusive track, so a value of 0 is expected for this decision.')
      }
      if (!application.consentBankStatement) {
        fairnessInsights.push('Upload your latest bank statement to avoid delays during manual review.')
      }
  } else if (consentDepth >= 0.5) {
      fairnessInsights.push('High consent depth unlocked fairness boosts for your profile.')
    } else {
      fairnessInsights.push('Share one more consent to unlock a stronger fairness boost and faster decisioning.')
    }
    if (fairnessBonus > 0) {
      fairnessInsights.push(`Fair lending bonus added ${(fairnessBonus * 100).toFixed(0)} points to your composite score.`)
    }
    if (incomeRelief > 0) {
      fairnessInsights.push('Income volatility relief supported your score despite irregular earnings.')
    }
    if (loanToIncome !== null && loanToIncome > 0.6) {
      fairnessInsights.push('Loan-to-income ratio is high; a loan officer will double-check repayment comfort.')
    }
    if (qualifiesAuto) {
      fairnessInsights.push('Your profile satisfied SafeCred’s automatic approval safeguards.')
    }
    if (finalFloor) {
      fairnessInsights.push('Final SCI was floored to protect high-confidence borrowers during fairness review.')
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
        <header className="bg-white/80 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-blue-700">
              <Shield className="h-6 w-6" />
              SafeCred
            </Link>
            <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
              View dashboard
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-10 max-w-5xl">
          <Card className="border-2">
            <CardHeader className="text-center pb-8">
              <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${statusMeta.circleBg}`}>
                <StatusIcon className={`h-10 w-10 ${statusMeta.iconColor}`} />
              </div>
              <CardTitle className="text-3xl mb-2">{statusMeta.title}</CardTitle>
              <CardDescription className="text-base text-gray-600 max-w-2xl mx-auto">
                {message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-gray-50 px-4 py-3 text-left">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Application ID</p>
                  <p className="mt-1 font-semibold text-gray-800">{mlResult.applicationId || application.applicationId}</p>
                </div>
                <div className="rounded-lg border bg-gray-50 px-4 py-3 text-left">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Loan offer</p>
                  <p className="mt-1 font-semibold text-green-600">{loanOffer ? formatCurrency(loanOffer) : 'Pending'}</p>
                </div>
                <div className="rounded-lg border bg-gray-50 px-4 py-3 text-left">
                  <p className="text-xs uppercase tracking-wide text-gray-500">SafeCred Index</p>
                  <p className="mt-1 font-semibold text-blue-700">{finalSci !== null ? `${finalSci.toFixed(1)}/100` : 'Awaiting'}</p>
                </div>
                <div className="rounded-lg border bg-gray-50 px-4 py-3 text-left">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Risk band</p>
                  <p className="mt-1 font-semibold text-gray-800">{riskBand}</p>
                  {riskCategory && (
                    <p className="text-xs text-gray-500">{riskCategory}</p>
                  )}
                </div>
                <div className="rounded-lg border bg-gray-50 px-4 py-3 text-left">
                  <p className="text-xs uppercase tracking-wide text-gray-500">ML confidence</p>
                  <p className="mt-1 font-semibold text-gray-800">{mlProbability !== null ? formatPercent(mlProbability, 1) : '—'}</p>
                </div>
                <div className="rounded-lg border bg-gray-50 px-4 py-3 text-left">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Composite score</p>
                  <p className="mt-1 font-semibold text-gray-800">{compositeScore !== null ? formatNumber(compositeScore, 1) : '—'}</p>
                </div>
                {loanToIncome !== null && (
                  <div className="rounded-lg border bg-gray-50 px-4 py-3 text-left">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Loan-to-income</p>
                    <p className="mt-1 font-semibold text-gray-800">{loanToIncome.toFixed(2)}x</p>
                  </div>
                )}
                {needCategory && (
                  <div className="rounded-lg border bg-gray-50 px-4 py-3 text-left">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Need category</p>
                    <p className="mt-1 font-semibold text-gray-800">{needCategory}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {consentBadges.map((consent) => (
                  <Badge
                    key={consent.label}
                    variant={consent.value ? 'success' : 'outline'}
                    className={consent.value ? '' : 'text-gray-500'}
                  >
                    {consent.value ? 'Granted' : 'Pending'} · {consent.label}
                  </Badge>
                ))}
                {alternativeProxiesBlocked && (
                  <Badge variant="info" className="bg-blue-100 text-blue-700">
                    Alternative proxies locked for this track
                  </Badge>
                )}
                {consentBonus !== null && consentBonus > 0 && (
                  <Badge variant="secondary" className="text-green-700">
                    Consent bonus: +₹{consentBonus.toLocaleString('en-IN')}
                  </Badge>
                )}
              </div>

              <div className={`rounded-lg border px-5 py-4 text-sm ${statusMeta.banner}`}>
                {message}
              </div>

              <div className="rounded-xl border bg-white/70 p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Fairness insights</h3>
                    <p className="text-sm text-gray-500">
                      {alternativeProxiesBlocked
                        ? 'Repayment performance drove this decision; alternative proxies are intentionally disabled for high-income tracks.'
                        : 'Composite scoring balanced ML confidence with consent depth and income relief.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Sparkles className="h-4 w-4" />
                    Inclusive lending safeguards applied
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Consent depth</p>
                    <p className="mt-1 font-semibold text-gray-800">{formatPercent(consentDepthDisplay, 0)}</p>
                    <div className="mt-2 h-2 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${Math.min(100, Math.max(0, consentDepthDisplay * 100))}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Fair lending bonus</p>
                    <p className="mt-1 font-semibold text-gray-800">{(fairnessBonus * 100).toFixed(0)} pts</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Income relief applied</p>
                    <p className="mt-1 font-semibold text-gray-800">{(incomeRelief * 100).toFixed(0)} pts</p>
                  </div>
                  {featuresExtracted !== null && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Signals analysed</p>
                      <p className="mt-1 font-semibold text-gray-800">{featuresExtracted}</p>
                    </div>
                  )}
                </div>

                {Object.keys(pillarScores).length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Pillar contribution</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(pillarScores).map(([pillar, value]) => (
                        <div key={pillar} className="rounded-md border bg-gray-50 px-3 py-2">
                          <p className="text-xs uppercase text-gray-400">{pillar}</p>
                          <p className="font-semibold text-gray-700">{formatPercent(value, 0)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-md border bg-gray-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Score blend</p>
                    <p className="text-sm text-gray-600 mt-2">
                      ML weight {formatPercent(combineDetails.ml_weight ?? 0, 0)} &middot; Composite weight {formatPercent(combineDetails.composite_weight ?? 0, 0)}
                    </p>
                  </div>
                  {loanToIncome !== null && (
                    <div className="rounded-md border bg-gray-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Loan affordability</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Loan-to-income ratio {loanToIncome.toFixed(2)}x {loanToIncome <= 0.6 ? '(within comfort range)' : '(requires officer review)'}
                      </p>
                    </div>
                  )}
                </div>

                {fairnessInsights.length > 0 && (
                  <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                    {fairnessInsights.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-2">
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full" size="lg">Go to dashboard</Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={resetForm}
                >
                  Submit another application
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-xs text-gray-500 text-center">
            Income is re-verified with NBCFDC. A mismatch greater than 10% will pause disbursal until rectified.
          </p>
        </main>
      </div>
    )
  }

  const consentsSelected = [
    formData.consentRecharge,
    formData.consentElectricity,
    formData.consentEducation,
    formData.consentBankStatement,
  ].filter(Boolean).length

  const totalConsentSlots = incomeTier === 'high' ? 1 : 4
  const consentDepthPreview = consentsSelected / totalConsentSlots

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <header className="bg-white/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-blue-700">
            <Shield className="h-6 w-6" />
            SafeCred
          </Link>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Submit loan application</CardTitle>
              <CardDescription>
                Share your income details and choose which data sources you consent to share. More consents unlock higher fairness bonuses and faster decisions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {currentStep === 'income' && (
                  <>
                    <section>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Loan request</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="declaredIncome">Monthly income (₹)</Label>
                          <Input
                            id="declaredIncome"
                            type="number"
                            min="0"
                            placeholder="e.g. 12000"
                            value={formData.declaredIncome}
                            onChange={(e) => setFormData((prev) => ({ ...prev, declaredIncome: e.target.value }))}
                            disabled={isLoading}
                            required
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            We cross-verify this with NBCFDC. Accurate declarations route you to the correct evaluation pathway.
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="loanAmount">Loan amount (₹)</Label>
                          <Input
                            id="loanAmount"
                            type="number"
                            min="1000"
                            max="100000"
                            placeholder="e.g. 20000"
                            value={formData.loanAmount}
                            onChange={(e) => setFormData((prev) => ({ ...prev, loanAmount: e.target.value }))}
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="tenureMonths">Requested tenure (months)</Label>
                          <Input
                            id="tenureMonths"
                            type="number"
                            min="3"
                            max="36"
                            value={formData.tenureMonths}
                            onChange={(e) => setFormData((prev) => ({ ...prev, tenureMonths: e.target.value }))}
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="existingLoanAmount">Existing active loan (₹)</Label>
                          <Input
                            id="existingLoanAmount"
                            type="number"
                            min="0"
                            placeholder="Optional"
                            value={formData.existingLoanAmount}
                            onChange={(e) => setFormData((prev) => ({ ...prev, existingLoanAmount: e.target.value }))}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="purpose">Purpose of loan (optional)</Label>
                        <Textarea
                          id="purpose"
                          placeholder="Tell us how this loan will be used"
                          value={formData.purpose}
                          onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
                          disabled={isLoading}
                          rows={3}
                        />
                      </div>
                    </section>

                    <section className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Why we ask for income first</h3>
                      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                        <p className="font-medium">Income barrier: ₹{incomeBarrier.toLocaleString('en-IN')}</p>
                        <p className="mt-1">
                          Applicants below the barrier unlock fairness boosts and alternative proxies. Applicants above the barrier are evaluated strictly on
                          repayment history and bank evidence. Continue to proceed to your tailored experience.
                        </p>
                      </div>
                    </section>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        type="button"
                        size="lg"
                        className="flex-1"
                        disabled={isLoading}
                        onClick={handleIncomeStepContinue}
                      >
                        Continue
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="flex-1"
                        disabled={isLoading}
                        onClick={resetForm}
                      >
                        Clear form
                      </Button>
                    </div>
                  </>
                )}

                {currentStep !== 'income' && (
                  <>
                    <section>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Eligibility summary</h3>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-800">Declared monthly income: ₹{declaredIncomeNum.toLocaleString('en-IN')}</p>
                            <p>Loan requested: ₹{Number(formData.loanAmount || 0).toLocaleString('en-IN')} · Tenure: {formData.tenureMonths || '—'} months</p>
                          </div>
                          <Badge variant={isHighIncome ? 'secondary' : 'outline'}>
                            {isHighIncome ? 'High-income track' : 'Inclusive fairness track'}
                          </Badge>
                        </div>
                        <p className="mt-3">
                          {isHighIncome
                            ? 'As your income is above the barrier, alternative proxies are disabled. Please share strong bank and repayment proof to maximise approval chances.'
                            : 'You qualify for alternative proxies. Share recharge, electricity, and education data to boost fairness weights and unlock higher offers.'}
                        </p>
                      </div>
                    </section>

                    <section className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Data sharing consents</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        SafeCred only pulls data you authorise. Each consent raises your consent depth and can increase fairness bonuses and offers.
                      </p>
                      {isHighIncome && (
                        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                          <strong>High-income notice:</strong> Alternative proxy options (recharge, electricity, education) are locked for fairness reasons.
                          We evaluate you based on bank statements and repayment history only.
                        </div>
                      )}
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="consentBankStatement"
                            checked={formData.consentBankStatement}
                            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, consentBankStatement: checked as boolean }))}
                            disabled={isLoading}
                          />
                          <div>
                            <Label htmlFor="consentBankStatement" className="font-medium">Bank statement</Label>
                            <p className="text-xs text-gray-500">Provides strongest evidence of income stability. Highly recommended.</p>
                          </div>
                        </div>
                        {showAlternativeProxies && (
                          <>
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id="consentRecharge"
                                checked={formData.consentRecharge}
                                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, consentRecharge: checked as boolean }))}
                                disabled={isLoading}
                              />
                              <div>
                                <Label htmlFor="consentRecharge" className="font-medium">Mobile recharge</Label>
                                <p className="text-xs text-gray-500">Shows spending cadence and boosts the consumption pillar.</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id="consentElectricity"
                                checked={formData.consentElectricity}
                                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, consentElectricity: checked as boolean }))}
                                disabled={isLoading}
                              />
                              <div>
                                <Label htmlFor="consentElectricity" className="font-medium">Electricity bills</Label>
                                <p className="text-xs text-gray-500">Regular payments reduce volatility risk and help inclusive scoring.</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id="consentEducation"
                                checked={formData.consentEducation}
                                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, consentEducation: checked as boolean }))}
                                disabled={isLoading}
                              />
                              <div>
                                <Label htmlFor="consentEducation" className="font-medium">Education fees</Label>
                                <p className="text-xs text-gray-500">Helps reward on-time payments for families with children.</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </section>

                    <section className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Optional financial signals</h3>
                      <p className="text-sm text-gray-600 mb-4">Share whatever data you have on hand. Even partial inputs improve scoring and manual review speed.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-700">Bank statement snapshot</h4>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Monthly credits (₹)"
                            value={formData.bankStatement.monthlyCredits}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              bankStatement: { ...prev.bankStatement, monthlyCredits: e.target.value },
                            }))}
                            disabled={isLoading}
                          />
                          <Input
                            type="number"
                            min="0"
                            placeholder="Average balance (₹)"
                            value={formData.bankStatement.avgBalance}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              bankStatement: { ...prev.bankStatement, avgBalance: e.target.value },
                            }))}
                            disabled={isLoading}
                          />
                        </div>
                        {showAlternativeProxies && (
                          <>
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-gray-700">Mobile recharge history</h4>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Recharges per month"
                                value={formData.rechargeHistory.frequency}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  rechargeHistory: { ...prev.rechargeHistory, frequency: e.target.value },
                                }))}
                                disabled={isLoading}
                              />
                              <Input
                                type="number"
                                min="0"
                                placeholder="Avg recharge amount (₹)"
                                value={formData.rechargeHistory.avgAmount}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  rechargeHistory: { ...prev.rechargeHistory, avgAmount: e.target.value },
                                }))}
                                disabled={isLoading}
                              />
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-gray-700">Electricity bills</h4>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Bills paid (6 months)"
                                value={formData.electricityBills.frequency}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  electricityBills: { ...prev.electricityBills, frequency: e.target.value },
                                }))}
                                disabled={isLoading}
                              />
                              <Input
                                type="number"
                                min="0"
                                placeholder="Avg payment (₹)"
                                value={formData.electricityBills.avgPayment}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  electricityBills: { ...prev.electricityBills, avgPayment: e.target.value },
                                }))}
                                disabled={isLoading}
                              />
                              <Input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                placeholder="Consistency score (0-1)"
                                value={formData.electricityBills.consistency}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  electricityBills: { ...prev.electricityBills, consistency: e.target.value },
                                }))}
                                disabled={isLoading}
                              />
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-gray-700">Education fee payments</h4>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Avg fee amount (₹)"
                                value={formData.educationFees.avgFee}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  educationFees: { ...prev.educationFees, avgFee: e.target.value },
                                }))}
                                disabled={isLoading}
                              />
                              <Input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                placeholder="Consistency score (0-1)"
                                value={formData.educationFees.consistency}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  educationFees: { ...prev.educationFees, consistency: e.target.value },
                                }))}
                                disabled={isLoading}
                              />
                              <Input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                placeholder="On-time ratio (0-1)"
                                value={formData.educationFees.onTimeRatio}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  educationFees: { ...prev.educationFees, onTimeRatio: e.target.value },
                                }))}
                                disabled={isLoading}
                              />
                              <Input
                                type="number"
                                min="0"
                                placeholder="Records shared"
                                value={formData.educationFees.frequency}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  educationFees: { ...prev.educationFees, frequency: e.target.value },
                                }))}
                                disabled={isLoading}
                              />
                            </div>
                          </>
                        )}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-700">Repayment history</h4>
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            placeholder="On-time ratio (0-1)"
                            value={formData.repaymentHistory.onTimeRatio}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              repaymentHistory: { ...prev.repaymentHistory, onTimeRatio: e.target.value },
                            }))}
                            disabled={isLoading}
                          />
                          <Input
                            type="number"
                            min="0"
                            placeholder="Avg delay (days)"
                            value={formData.repaymentHistory.avgPaymentDelayDays}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              repaymentHistory: { ...prev.repaymentHistory, avgPaymentDelayDays: e.target.value },
                            }))}
                            disabled={isLoading}
                          />
                          <Input
                            type="number"
                            min="0"
                            placeholder="Missed payments"
                            value={formData.repaymentHistory.missedCount}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              repaymentHistory: { ...prev.repaymentHistory, missedCount: e.target.value },
                            }))}
                            disabled={isLoading}
                          />
                          <Input
                            type="number"
                            min="0"
                            placeholder="Previous loans"
                            value={formData.repaymentHistory.previousLoansCount}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              repaymentHistory: { ...prev.repaymentHistory, previousLoansCount: e.target.value },
                            }))}
                            disabled={isLoading}
                          />
                          <Input
                            type="number"
                            min="0"
                            placeholder="Months since last loan"
                            value={formData.repaymentHistory.timeSinceLastLoan}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              repaymentHistory: { ...prev.repaymentHistory, timeSinceLastLoan: e.target.value },
                            }))}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </section>

                    <div className="flex flex-col md:flex-row gap-3 pt-4">
                      <Button type="submit" size="lg" className="flex-1" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Submit for scoring
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="flex-1"
                        disabled={isLoading}
                        onClick={handleBackToIncomeStep}
                      >
                        Edit income details
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        className="flex-1"
                        disabled={isLoading}
                        onClick={resetForm}
                      >
                        Clear everything
                      </Button>
                    </div>
                  </>
                )}
              </form>

              <p className="mt-6 text-xs text-gray-500">
                Income is verified via NBCFDC. A mismatch above 10% will pause your application until clarified.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-white/80">
              <CardHeader>
                <CardTitle className="text-base">How fairness works</CardTitle>
                <CardDescription>SafeCred blends ML with alternative data to keep decisions inclusive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>• ML confidence measures repayment behaviour from similar borrowers.</p>
                <p>• Composite score rewards responsible bill payments, mobile cadence, and partner attestations.</p>
                <p>• Fair lending bonus boosts underserved segments when consent depth and loan sizing look healthy.</p>
                <p>• Loan-to-income ratio keeps repayment realistic and may trigger manual review above 0.6×.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Consent depth preview</CardTitle>
                <CardDescription>Consents selected: {consentsSelected} of {totalConsentSlots}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-3 w-full rounded-full bg-gray-200">
                  <div
                    className="h-3 rounded-full bg-blue-500"
                    style={{ width: `${Math.min(100, consentDepthPreview * 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  {incomeTier === 'high'
                    ? 'Provide the latest bank statement or repayment receipts to move through manual review faster.'
                    : `Consent depth ${formatPercent(consentDepthPreview, 0)}. Sharing at least 2 sources typically unlocks fairness bonuses for low-income applicants.`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tips for faster approvals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• Keep loan amount below 60% of monthly income for auto-approval consideration.</p>
                <p>• Upload partner attestations or repayment receipts if you lack formal documents.</p>
                <p>• Refresh recharge and electricity data before submitting for the best signal strength.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
