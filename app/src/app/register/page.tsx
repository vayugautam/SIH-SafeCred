'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, Loader2, CheckCircle, User, Mail, Phone, Lock, MapPin, Home, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Profile Info
    age: '',
    hasChildren: false,
    isSociallyDisadvantaged: false,
    address: '',
    state: '',
    district: '',
    pincode: '',
  })

  const validateStep1 = () => {
    if (!formData.name || formData.name.length < 2) {
      setError('Name must be at least 2 characters')
      return false
    }
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email')
      return false
    }
    if (!formData.mobile || !/^[0-9]{10}$/.test(formData.mobile)) {
      setError('Please enter a valid 10-digit mobile number')
      return false
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    setError('')
    return true
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
          age: formData.age ? parseInt(formData.age) : undefined,
          hasChildren: formData.hasChildren,
          isSociallyDisadvantaged: formData.isSociallyDisadvantaged,
          address: formData.address || undefined,
          state: formData.state || undefined,
          district: formData.district || undefined,
          pincode: formData.pincode || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/30 to-emerald-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-400/30 to-cyan-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <Card className="w-full max-w-md text-center glass border-gradient shadow-2xl bounce-in relative">
          <CardHeader className="space-y-4">
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle className="h-12 w-12 text-white" />
              <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-yellow-400" />
            </div>
            <CardTitle className="text-3xl gradient-text">Registration Successful!</CardTitle>
            <CardDescription className="text-lg">
              Your account has been created. Redirecting to login...
            </CardDescription>
            <div className="w-full h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full shimmer" />
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4 py-12 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8 fade-in-up">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4 group">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <span className="text-4xl font-bold gradient-text">SafeCred</span>
          </Link>
          <p className="text-slate-600 text-lg">Create your account to get started</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-center space-x-4 fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className={`flex items-center transition-all duration-300 ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg transition-all duration-300 ${
              step >= 1 ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white scale-110' : 'bg-slate-200'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-semibold">Basic Info</span>
          </div>
          <div className={`w-20 h-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-200'}`} />
          <div className={`flex items-center transition-all duration-300 ${step >= 2 ? 'text-purple-600' : 'text-slate-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg transition-all duration-300 ${
              step >= 2 ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white scale-110' : 'bg-slate-200'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-semibold">Profile Details</span>
          </div>
        </div>

        <Card className="glass border-gradient shadow-2xl fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="text-2xl gradient-text">
              {step === 1 ? '🔐 Account Information' : '👤 Profile Information'}
            </CardTitle>
            <CardDescription className="text-base">
              {step === 1 
                ? 'Please provide your basic account details'
                : 'Complete your profile for better loan assessment'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-md slide-in-from-top">
                  <strong className="font-semibold">Error:</strong> {error}
                </div>
              )}

              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-semibold">Full Name *</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        className="pl-10 h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700 font-semibold">Email *</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10 h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-slate-700 font-semibold">Mobile Number *</Label>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          id="mobile"
                          placeholder="10-digit number"
                          className="pl-10 h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                          value={formData.mobile}
                          onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                          maxLength={10}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-700 font-semibold">Password *</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Minimum 6 characters"
                          className="pl-10 h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold">Confirm Password *</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Re-enter password"
                          className="pl-10 h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-slate-700 font-semibold">Age (Optional)</Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                        <Input
                          id="age"
                          type="number"
                          placeholder="Your age"
                          className="pl-10 h-12 border-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 rounded-xl"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                          min="18"
                          max="100"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-slate-700 font-semibold">Pincode (Optional)</Label>
                      <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                        <Input
                          id="pincode"
                          placeholder="6-digit pincode"
                          className="pl-10 h-12 border-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 rounded-xl"
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                          maxLength={6}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-slate-700 font-semibold">Address (Optional)</Label>
                    <div className="relative group">
                      <Home className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                      <Input
                        id="address"
                        placeholder="Your address"
                        className="pl-10 h-12 border-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 rounded-xl"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-slate-700 font-semibold">State (Optional)</Label>
                      <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                        <Input
                          id="state"
                          placeholder="Your state"
                          className="pl-10 h-12 border-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 rounded-xl"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="district" className="text-slate-700 font-semibold">District (Optional)</Label>
                      <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                        <Input
                          id="district"
                          placeholder="Your district"
                          className="pl-10 h-12 border-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 rounded-xl"
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t-2 border-slate-200">
                    <div className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-colors duration-300 group">
                      <Checkbox
                        id="hasChildren"
                        checked={formData.hasChildren}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, hasChildren: checked as boolean })
                        }
                        disabled={isLoading}
                        className="mt-1"
                      />
                      <Label htmlFor="hasChildren" className="font-normal cursor-pointer text-slate-700 group-hover:text-slate-900">
                        I have children (helps in education fee assessment)
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors duration-300 group">
                      <Checkbox
                        id="isSociallyDisadvantaged"
                        checked={formData.isSociallyDisadvantaged}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, isSociallyDisadvantaged: checked as boolean })
                        }
                        disabled={isLoading}
                        className="mt-1"
                      />
                      <Label htmlFor="isSociallyDisadvantaged" className="font-normal cursor-pointer text-slate-700 group-hover:text-slate-900">
                        I belong to socially disadvantaged group (SC/ST/OBC)
                      </Label>
                    </div>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="flex w-full gap-4">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="w-full h-12 border-2 hover:bg-slate-50 rounded-xl font-semibold group"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-12 ${
                    step === 1 
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700' 
                      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700'
                  } text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : step === 1 ? (
                    <>
                      Next Step
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      Create Account
                      <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link href="/login" className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text hover:from-blue-700 hover:to-purple-700 font-semibold transition-all">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
