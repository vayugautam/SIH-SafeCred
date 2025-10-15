'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ApplyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState<any>(null)

  const [formData, setFormData] = useState({
    declaredIncome: '',
    loanAmount: '',
    tenureMonths: '12',
    purpose: '',
    consentRecharge: false,
    consentElectricity: false,
    consentEducation: false,
    consentBankStatement: false,
  })

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          declaredIncome: parseFloat(formData.declaredIncome),
          loanAmount: parseFloat(formData.loanAmount),
          tenureMonths: parseInt(formData.tenureMonths),
          purpose: formData.purpose,
          consentRecharge: formData.consentRecharge,
          consentElectricity: formData.consentElectricity,
          consentEducation: formData.consentEducation,
          consentBankStatement: formData.consentBankStatement,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit application')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setResult(data)
    } catch (error) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  if (success && result) {
    const mlResult = result.mlResult || {}
    const application = result.application || {}
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="border-2">
            <CardHeader className="text-center pb-8">
              <div className={`mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center ${
                mlResult.status === 'approved' ? 'bg-green-100' :
                mlResult.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                <CheckCircle className={`h-10 w-10 ${
                  mlResult.status === 'approved' ? 'text-green-600' :
                  mlResult.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                }`} />
              </div>
              <CardTitle className="text-3xl mb-2">
                {mlResult.status === 'approved' ? 'Application Approved!' :
                 mlResult.status === 'rejected' ? 'Application Not Approved' :
                 'Application Under Review'}
              </CardTitle>
              <CardDescription className="text-base">
                {mlResult.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Application ID</p>
                  <p className="text-2xl font-bold text-blue-600">{mlResult.applicationId}</p>
                </div>
                {mlResult.loanOffer > 0 && (
                  <div className="bg-green-50 p-6 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Loan Offer</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{mlResult.loanOffer?.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </div>

              {mlResult.status !== 'rejected' && (
                <div className="grid grid-cols-2 gap-4">
                  {mlResult.finalSci && (
                    <div className="text-center p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600 mb-1">Credit Score</p>
                      <p className={`text-xl font-semibold ${
                        mlResult.finalSci >= 80 ? 'text-green-600' :
                        mlResult.finalSci >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {mlResult.finalSci.toFixed(0)}/100
                      </p>
                    </div>
                  )}
                  {mlResult.riskBand && (
                    <div className="text-center p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600 mb-1">Risk Band</p>
                      <p className="text-lg font-semibold">{mlResult.riskBand}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full" size="lg">
                    View Dashboard
                  </Button>
                </Link>
                <Link href="/apply" className="flex-1">
                  <Button variant="outline" className="w-full" size="lg" onClick={() => {
                    setSuccess(false)
                    setResult(null)
                    setFormData({
                      declaredIncome: '',
                      loanAmount: '',
                      tenureMonths: '12',
                      purpose: '',
                      consentRecharge: false,
                      consentElectricity: false,
                      consentEducation: false,
                      consentBankStatement: false,
                    })
                  }}>
                    Apply Again
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">SafeCred</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Apply for Loan</h1>
          <p className="text-gray-600">Complete the form below to submit your loan application</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Loan Application Form</CardTitle>
            <CardDescription>
              All fields marked with * are required. Providing consents helps us assess your application better.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="declaredIncome">Monthly Income (₹) *</Label>
                  <Input
                    id="declaredIncome"
                    type="number"
                    placeholder="25000"
                    value={formData.declaredIncome}
                    onChange={(e) => setFormData({ ...formData, declaredIncome: e.target.value })}
                    required
                    disabled={isLoading}
                    min="0"
                  />
                  <p className="text-xs text-gray-500">Your monthly income in INR</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loanAmount">Loan Amount (₹) *</Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    placeholder="50000"
                    value={formData.loanAmount}
                    onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                    required
                    disabled={isLoading}
                    min="1000"
                    max="100000"
                  />
                  <p className="text-xs text-gray-500">Amount between ₹1,000 - ₹1,00,000</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenureMonths">Loan Tenure (Months) *</Label>
                <select
                  id="tenureMonths"
                  value={formData.tenureMonths}
                  onChange={(e) => setFormData({ ...formData, tenureMonths: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                  disabled={isLoading}
                >
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="18">18 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Loan *</Label>
                <Textarea
                  id="purpose"
                  placeholder="Business expansion, working capital, education, etc."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Data Sharing Consents</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Providing these consents allows us to verify your income and repayment capacity, 
                  which may improve your loan offer.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="consentRecharge"
                      checked={formData.consentRecharge}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, consentRecharge: checked as boolean })
                      }
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <Label htmlFor="consentRecharge" className="font-normal cursor-pointer">
                        Mobile Recharge Data
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Access to your mobile recharge history helps assess spending patterns
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="consentElectricity"
                      checked={formData.consentElectricity}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, consentElectricity: checked as boolean })
                      }
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <Label htmlFor="consentElectricity" className="font-normal cursor-pointer">
                        Electricity Bill Data
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Electricity usage patterns help verify residence and stability
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="consentEducation"
                      checked={formData.consentEducation}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, consentEducation: checked as boolean })
                      }
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <Label htmlFor="consentEducation" className="font-normal cursor-pointer">
                        Education Fee Data
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Education fee payment history demonstrates financial responsibility
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="consentBankStatement"
                      checked={formData.consentBankStatement}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, consentBankStatement: checked as boolean })
                      }
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <Label htmlFor="consentBankStatement" className="font-normal cursor-pointer">
                        Bank Statement Data
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Bank transaction history provides comprehensive income verification
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Providing more consents may result in better loan offers. 
                  Your data is encrypted and used only for credit assessment.
                </p>
              </div>
            </CardContent>

            <div className="px-6 pb-6">
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Application...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
