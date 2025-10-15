'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { applicationAPI } from '@/lib/api';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  const statusStyles: Record<string, string> = {
    APPROVED: 'bg-green-50 border-green-200 text-green-700',
    REJECTED: 'bg-red-50 border-red-200 text-red-700',
    MANUAL_REVIEW: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    PROCESSING: 'bg-blue-50 border-blue-200 text-blue-700',
    PENDING: 'bg-gray-50 border-gray-200 text-gray-700',
    DEFAULT: 'bg-gray-50 border-gray-200 text-gray-700',
  };
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    declaredIncome: '',
    loanAmount: '',
    tenureMonths: '',
    purpose: '',
    
    // Step 2: Consumption Data (for income verification)
    // Electricity consumption
    monthlyElectricityUnits: '',
    monthlyElectricityAmount: '',
    
    // Mobile recharge patterns
    monthlyRechargeAmount: '',
    rechargeFrequency: '',
    
    // Education expenses (if applicable)
    monthlyEducationExpense: '',
    
    // Household size (for per-capita consumption)
    householdSize: '',
    
    // Optional: Upload consent
    consentDataSharing: true, // Required for consumption data
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Submitting application with data:', {
        declaredIncome: parseFloat(formData.declaredIncome),
        loanAmount: parseFloat(formData.loanAmount),
        tenureMonths: parseInt(formData.tenureMonths),
        purpose: formData.purpose,
        consumptionData: {
          monthlyElectricityUnits: parseFloat(formData.monthlyElectricityUnits) || 0,
          monthlyElectricityAmount: parseFloat(formData.monthlyElectricityAmount) || 0,
          monthlyRechargeAmount: parseFloat(formData.monthlyRechargeAmount) || 0,
          rechargeFrequency: parseInt(formData.rechargeFrequency) || 0,
          monthlyEducationExpense: parseFloat(formData.monthlyEducationExpense) || 0,
          householdSize: parseInt(formData.householdSize) || 1,
        },
        consentDataSharing: formData.consentDataSharing,
      });

      // Validate required fields
      const declaredIncome = parseFloat(formData.declaredIncome);
      const loanAmount = parseFloat(formData.loanAmount);
      const tenureMonths = parseInt(formData.tenureMonths);

      if (isNaN(declaredIncome) || declaredIncome < 0) {
        alert('Please enter a valid monthly income');
        setLoading(false);
        return;
      }

      if (isNaN(loanAmount) || loanAmount < 1000) {
        alert('Loan amount must be at least ₹1,000');
        setLoading(false);
        return;
      }

      if (isNaN(tenureMonths) || tenureMonths < 1 || tenureMonths > 60) {
        alert('Tenure must be between 1 and 60 months');
        setLoading(false);
        return;
      }

      // Create application with consumption data
      const appResponse = await applicationAPI.create({
        declaredIncome,
        loanAmount,
        tenureMonths,
        purpose: formData.purpose,
        
        // Consumption-based income verification data
        consumptionData: {
          monthlyElectricityUnits: parseFloat(formData.monthlyElectricityUnits) || 0,
          monthlyElectricityAmount: parseFloat(formData.monthlyElectricityAmount) || 0,
          monthlyRechargeAmount: parseFloat(formData.monthlyRechargeAmount) || 0,
          rechargeFrequency: parseInt(formData.rechargeFrequency) || 0,
          monthlyEducationExpense: parseFloat(formData.monthlyEducationExpense) || 0,
          householdSize: parseInt(formData.householdSize) || 1,
        },
        
        consentDataSharing: formData.consentDataSharing,
      });

      const appId = appResponse.data.application.id;

      // Submit for ML processing
  const submitResponse = await applicationAPI.submit(appId);

  setSubmissionResult(submitResponse.data);

      setApplicationId(appId);
      setStep(3);
    } catch (error: any) {
      console.error('Application error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        formData: {
          declaredIncome: parseFloat(formData.declaredIncome),
          loanAmount: parseFloat(formData.loanAmount),
          tenureMonths: parseInt(formData.tenureMonths),
          purpose: formData.purpose,
        }
      });
      
      const errorMsg = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to submit application';
      
      alert(`Application Error: ${errorMsg}\n\nCheck browser console (F12) for details.`);
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    const status = submissionResult?.application?.status ?? 'PENDING';
    const statusClass = statusStyles[status] || statusStyles.DEFAULT;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Application Submitted!</CardTitle>
            <CardDescription>
              Your application has been processed successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`rounded-lg border px-4 py-3 text-left ${statusClass}`}>
              <p className="text-sm font-semibold uppercase tracking-wide">Current Stage</p>
              <p className="text-lg font-bold">
                {status.replace('_', ' ')}
              </p>
              {submissionResult?.application?.decisionMessage && (
                <p className="mt-2 text-sm">
                  {submissionResult.application.decisionMessage}
                </p>
              )}
            </div>

            <div className="rounded-lg border bg-white p-4 text-left shadow-sm">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Credit Score (SCI)</dt>
                  <dd className="font-semibold">
                    {submissionResult?.application?.finalSci ?? submissionResult?.mlResult?.final_sci ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Risk Band</dt>
                  <dd className="font-semibold">
                    {submissionResult?.application?.riskBand ?? submissionResult?.mlResult?.risk_band ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Approved Loan Offer</dt>
                  <dd className="font-semibold text-green-600">
                    {submissionResult?.application?.loanOffer
                      ? `₹${submissionResult.application.loanOffer.toLocaleString()}`
                      : submissionResult?.mlResult?.loan_offer
                      ? `₹${Number(submissionResult.mlResult.loan_offer).toLocaleString()}`
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <p className="text-sm text-gray-600">
              Application ID: <span className="font-mono text-gray-800">{submissionResult?.application?.applicationId ?? applicationId}</span>
            </p>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => router.push('/dashboard')}>
                View Results
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">New Loan Application</CardTitle>
            <CardDescription>
              Step {step} of 2: {step === 1 ? 'Basic Information' : 'Supporting Documents'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="declaredIncome">Monthly Income (₹) *</Label>
                      <Input
                        id="declaredIncome"
                        type="number"
                        min="0"
                        value={formData.declaredIncome}
                        onChange={(e) => setFormData({ ...formData, declaredIncome: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loanAmount">Loan Amount (₹) *</Label>
                      <Input
                        id="loanAmount"
                        type="number"
                        min="1000"
                        value={formData.loanAmount}
                        onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenureMonths">Tenure (months) *</Label>
                      <Input
                        id="tenureMonths"
                        type="number"
                        min="1"
                        max="60"
                        value={formData.tenureMonths}
                        onChange={(e) => setFormData({ ...formData, tenureMonths: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purpose">Purpose</Label>
                      <Input
                        id="purpose"
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        placeholder="e.g., Business, Education, Personal"
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">
                        Consumption-Based Income Verification <span className="text-sm font-normal text-blue-600">(Optional but Recommended)</span>
                      </h3>
                      <p className="text-sm text-gray-600 mb-6">
                        Sharing your consumption details helps us verify your income and significantly improves your credit score. 
                        These fields are optional, but providing accurate information gives you the best loan terms.
                      </p>

                      {/* Electricity Consumption */}
                      <div className="space-y-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Electricity Usage
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="monthlyElectricityUnits" className="text-gray-700">
                              Monthly Units Consumed (kWh) <span className="text-blue-600">(Recommended)</span>
                            </Label>
                            <Input
                              id="monthlyElectricityUnits"
                              type="number"
                              placeholder="e.g., 250"
                              value={formData.monthlyElectricityUnits}
                              onChange={(e) => setFormData({ ...formData, monthlyElectricityUnits: e.target.value })}
                              min="0"
                              max="5000"
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Check your electricity bill for units consumed</p>
                          </div>
                          
                          <div>
                            <Label htmlFor="monthlyElectricityAmount" className="text-gray-700">
                              Monthly Electricity Bill Amount (₹) <span className="text-blue-600">(Recommended)</span>
                            </Label>
                            <Input
                              id="monthlyElectricityAmount"
                              type="number"
                              placeholder="e.g., 2500"
                              value={formData.monthlyElectricityAmount}
                              onChange={(e) => setFormData({ ...formData, monthlyElectricityAmount: e.target.value })}
                              min="0"
                              max="50000"
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Average amount you pay per month</p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Recharge Pattern */}
                      <div className="space-y-4 mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Mobile Recharge Patterns
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="monthlyRechargeAmount" className="text-gray-700">
                              Monthly Recharge Spending (₹) <span className="text-blue-600">(Recommended)</span>
                            </Label>
                            <Input
                              id="monthlyRechargeAmount"
                              type="number"
                              placeholder="e.g., 500"
                              value={formData.monthlyRechargeAmount}
                              onChange={(e) => setFormData({ ...formData, monthlyRechargeAmount: e.target.value })}
                              min="0"
                              max="10000"
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Total amount spent on mobile recharges per month</p>
                          </div>
                          
                          <div>
                            <Label htmlFor="rechargeFrequency" className="text-gray-700">
                              Recharge Frequency <span className="text-blue-600">(Recommended)</span>
                            </Label>
                            <select
                              id="rechargeFrequency"
                              value={formData.rechargeFrequency}
                              onChange={(e) => setFormData({ ...formData, rechargeFrequency: e.target.value })}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select frequency</option>
                              <option value="30">Daily (30 times/month)</option>
                              <option value="4">Weekly (4 times/month)</option>
                              <option value="2">Fortnightly (2 times/month)</option>
                              <option value="1">Monthly (1 time/month)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">How often do you recharge your mobile?</p>
                          </div>
                        </div>
                      </div>

                      {/* Household Information */}
                      <div className="space-y-4 mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Household Details
                        </h4>
                        
                        <div>
                          <Label htmlFor="householdSize" className="text-gray-700">
                            Number of People in Household <span className="text-blue-600">(Recommended)</span>
                          </Label>
                          <Input
                            id="householdSize"
                            type="number"
                            placeholder="e.g., 4"
                            value={formData.householdSize}
                            onChange={(e) => setFormData({ ...formData, householdSize: e.target.value })}
                            min="1"
                            max="20"
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">Total family members living in your household</p>
                        </div>
                      </div>

                      {/* Education Expenses (Optional) */}
                      <div className="space-y-4 mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Education Expenses (Optional)
                        </h4>
                        
                        <div>
                          <Label htmlFor="monthlyEducationExpense" className="text-gray-700">
                            Monthly Education Fees (₹)
                          </Label>
                          <Input
                            id="monthlyEducationExpense"
                            type="number"
                            placeholder="e.g., 1500 (leave blank if none)"
                            value={formData.monthlyEducationExpense}
                            onChange={(e) => setFormData({ ...formData, monthlyEducationExpense: e.target.value })}
                            min="0"
                            max="100000"
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">School/college fees if applicable</p>
                        </div>
                      </div>

                      {/* Data Sharing Consent */}
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="consentDataSharing"
                            checked={formData.consentDataSharing}
                            onChange={(e) => setFormData({ ...formData, consentDataSharing: e.target.checked })}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <Label htmlFor="consentDataSharing" className="text-sm text-gray-700 cursor-pointer">
                            <span className="font-semibold">I consent</span> to share my consumption data for income verification and credit assessment purposes. 
                            This data will be used securely and in accordance with privacy regulations.
                          </Label>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>💡 Pro Tip:</strong> Providing consumption data significantly improves your credit score! 
                          Fields marked as "Recommended" help us verify your income and offer better loan terms. 
                          You can skip them, but we encourage you to fill them for the best assessment.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-between border-t pt-4">
                {step === 2 && (
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                )}
                <Button type="submit" className="ml-auto" disabled={loading}>
                  {loading ? 'Processing...' : step === 1 ? 'Next' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
