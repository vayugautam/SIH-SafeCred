'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Shield, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const SAMPLE_PAYLOAD = `{
  "partnerId": "NGO-001",
  "createApplicationIfMissing": true,
  "beneficiary": {
    "name": "Rani Kumari",
    "email": "rani.kumari+ngo@safecred.com",
    "mobile": "9876543210",
    "age": 32,
    "hasChildren": true,
    "isSociallyDisadvantaged": true
  },
  "loanContext": {
    "declaredIncome": 28000,
    "loanAmount": 85000,
    "tenureMonths": 18,
    "purpose": "Working capital for tailoring",
    "consentRecharge": true,
    "consentElectricity": true,
    "consentEducation": false,
    "consentBankStatement": true
  },
  "bankStatements": [
    {
      "date": "2025-07-05",
      "description": "Salary credit",
      "credit": 32000,
      "balance": 45500
    },
    {
      "date": "2025-07-12",
      "description": "Rent payment",
      "debit": 7000,
      "balance": 38200
    }
  ],
  "rechargeData": [
    { "date": "2025-06-20", "amount": 249, "operator": "Jio", "planType": "Prepaid" }
  ],
  "electricityBills": [
    {
      "month": "2025-06",
      "billDate": "2025-06-08",
      "dueDate": "2025-06-20",
      "amount": 1240,
      "unitsConsumed": 142,
      "paidDate": "2025-06-16",
      "isPaid": true
    }
  ],
  "repaymentHistory": [
    {
      "emiNumber": 1,
      "emiAmount": 4500,
      "dueDate": "2025-05-05",
      "paidDate": "2025-05-05",
      "isPaid": true,
      "isLate": false
    }
  ]
}`

const RESCORE_STATUS_OPTIONS = [
  'PROCESSING',
  'MANUAL_REVIEW',
  'APPROVED',
  'REJECTED'
] as const

type RescoreStatusOption = typeof RESCORE_STATUS_OPTIONS[number]

interface RescoreResult {
  processed: number
  successes: Array<{ applicationId: string; status: string; finalSci: number | null }>
  failures: Array<{ applicationId: string; error: string }>
}

export default function OperationsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [ingestPayload, setIngestPayload] = useState(SAMPLE_PAYLOAD)
  const [ingestLoading, setIngestLoading] = useState(false)
  const [ingestMessage, setIngestMessage] = useState<string>('')
  const [rescoreLoading, setRescoreLoading] = useState(false)
  const [rescoreMessage, setRescoreMessage] = useState<string>('')
  const [rescoreIds, setRescoreIds] = useState('')
  const [rescoreStatuses, setRescoreStatuses] = useState<RescoreStatusOption[]>(['PROCESSING', 'MANUAL_REVIEW'])
  const [rescoreLimit, setRescoreLimit] = useState(25)
  const [staleOnly, setStaleOnly] = useState(true)
  const [rescoreResult, setRescoreResult] = useState<RescoreResult | null>(null)

  const isAdmin = useMemo(() => session?.user?.role === 'ADMIN' || session?.user?.role === 'LOAN_OFFICER', [session])

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (!isAdmin) {
      router.push('/dashboard')
    }
  }, [status, router, isAdmin])

  const handlePartnerIngest = useCallback(async () => {
    try {
      setIngestMessage('')
      setIngestLoading(true)
      const parsed = JSON.parse(ingestPayload)

      const response = await fetch('/api/admin/partner-ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsed),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to ingest partner data')
      }

      setIngestMessage(`✅ Partner data ingested for application ${data.applicationId}. Records stored: ${JSON.stringify(data.ingested)}`)
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        setIngestMessage('⚠️ Invalid JSON payload. Please verify the structure.')
      } else {
        setIngestMessage(`❌ ${error?.message || 'Failed to ingest partner data.'}`)
      }
    } finally {
      setIngestLoading(false)
    }
  }, [ingestPayload])

  const toggleStatus = useCallback((statusValue: RescoreStatusOption) => {
    setRescoreStatuses((previous) => {
      if (previous.includes(statusValue)) {
        return previous.filter((item) => item !== statusValue)
      }
      return [...previous, statusValue]
    })
  }, [])

  const handleRescore = useCallback(async () => {
    try {
      setRescoreMessage('')
      setRescoreResult(null)
      setRescoreLoading(true)

      const payload: Record<string, unknown> = {}

      const cleanedIds = rescoreIds
        .split(/[,\s\n]+/)
        .map((value) => value.trim())
        .filter(Boolean)

      if (cleanedIds.length) {
        payload.applicationIds = cleanedIds
      }

      if (rescoreStatuses.length) {
        payload.statuses = rescoreStatuses
      }

      if (rescoreLimit !== 25) {
        payload.limit = rescoreLimit
      }

      if (staleOnly) {
        payload.staleOnly = true
      }

      const response = await fetch('/api/admin/rescore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger re-score')
      }

      setRescoreResult(data as RescoreResult)
      setRescoreMessage(`✅ Processed ${data.processed} application${data.processed === 1 ? '' : 's'}.`)
    } catch (error: any) {
      setRescoreMessage(`❌ ${error?.message || 'Re-score operation failed.'}`)
    } finally {
      setRescoreLoading(false)
    }
  }, [rescoreIds, rescoreStatuses, rescoreLimit, staleOnly])

  if (status === 'loading' || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

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
              <Link href="/admin/analytics">
                <Button variant="outline">Analytics</Button>
              </Link>
              <Link href="/admin/applications">
                <Button variant="outline">Applications</Button>
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
          <h1 className="text-3xl font-bold">Operations Control</h1>
          <p className="text-gray-500 mt-1">
            On-board partner data and trigger batch scoring workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Partner Data Ingestion</CardTitle>
              <CardDescription>
                Paste payloads received from partner systems to hydrate an application before scoring.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={ingestPayload}
                onChange={(event) => setIngestPayload(event.target.value)}
                rows={18}
                className="font-mono text-xs"
              />
              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePartnerIngest}
                  disabled={ingestLoading}
                >
                  {ingestLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ingesting...
                    </>
                  ) : (
                    'Ingest Partner Payload'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIngestPayload(SAMPLE_PAYLOAD)
                    setIngestMessage('')
                  }}
                  disabled={ingestLoading}
                >
                  Reset Sample
                </Button>
              </div>
              {ingestMessage && (
                <p className="text-sm whitespace-pre-wrap break-words text-gray-700">{ingestMessage}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Batch Re-score</CardTitle>
              <CardDescription>
                Refresh ML decisions for aging applications or targeted cohorts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="applicationIds">Application IDs (optional)</Label>
                <Textarea
                  id="applicationIds"
                  placeholder="Enter application IDs separated by commas or new lines"
                  value={rescoreIds}
                  onChange={(event) => setRescoreIds(event.target.value)}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label>Status Filters</Label>
                <div className="grid grid-cols-2 gap-2">
                  {RESCORE_STATUS_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                      <Checkbox
                        checked={rescoreStatuses.includes(option)}
                        onCheckedChange={() => toggleStatus(option)}
                      />
                      <span>{option.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="limit">Batch Size</Label>
                  <Input
                    id="limit"
                    type="number"
                    min={1}
                    max={100}
                    value={rescoreLimit}
                    onChange={(event) => setRescoreLimit(Number(event.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Defaults to 25 applications per run.</p>
                </div>
                <label className="flex items-center gap-2 text-sm mt-6">
                  <Checkbox
                    checked={staleOnly}
                    onCheckedChange={() => setStaleOnly((previous) => !previous)}
                  />
                  Only re-score stale decisions (&gt; 24h old)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleRescore} disabled={rescoreLoading}>
                  {rescoreLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Triggering...
                    </>
                  ) : (
                    'Trigger Re-score'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRescoreIds('')
                    setRescoreStatuses(['PROCESSING', 'MANUAL_REVIEW'])
                    setRescoreLimit(25)
                    setStaleOnly(true)
                    setRescoreResult(null)
                    setRescoreMessage('')
                  }}
                  disabled={rescoreLoading}
                >
                  Reset Filters
                </Button>
              </div>

              {rescoreMessage && (
                <p className="text-sm text-gray-700">{rescoreMessage}</p>
              )}

              {rescoreResult && (
                <div className="space-y-3 rounded-lg border border-border bg-white p-4">
                  <div>
                    <h4 className="text-sm font-semibold">Successes</h4>
                    {rescoreResult.successes.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No applications updated.</p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-sm">
                        {rescoreResult.successes.map((item) => (
                          <li key={item.applicationId} className="flex justify-between gap-2">
                            <span className="font-medium text-blue-600">{item.applicationId}</span>
                            <span className="text-xs text-muted-foreground">{item.status}</span>
                            <span className="text-xs">SCI: {item.finalSci ?? '—'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Failures</h4>
                    {rescoreResult.failures.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No errors reported.</p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-xs text-red-600">
                        {rescoreResult.failures.map((item) => (
                          <li key={item.applicationId}>
                            {item.applicationId}: {item.error}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
