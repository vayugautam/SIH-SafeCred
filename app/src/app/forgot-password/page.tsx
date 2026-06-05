'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Loader2, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsSubmitted(true)
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">SafeCred</span>
          </Link>
          
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Secure account recovery.
          </h2>
          <p className="text-slate-400 text-lg max-w-md">
            We&apos;ll help you get back to your account safely and quickly.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            <span className="text-slate-300">Identity verification</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            <span className="text-slate-300">Secure reset link</span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <Link href="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Reset password</h1>
            <p className="mt-2 text-slate-600">Enter your email address and we&apos;ll send you a link to reset your password.</p>
          </div>

          {isSubmitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Check your email</h3>
              <p className="text-green-700 mb-6">
                We have sent a password reset link to <strong>{email}</strong>.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                onClick={() => setIsSubmitted(false)}
              >
                Try another email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  <>
                    Send Reset Link <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
