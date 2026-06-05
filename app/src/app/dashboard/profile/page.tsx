'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, TrendingUp, Award, Shield, Database, CheckCircle2, XCircle, User, MapPin, Phone, Mail, Calendar, Users, Home, ArrowLeft, Save, Sparkles, Target, Clock, BadgeCheck } from 'lucide-react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'

interface UserProfile {
  name: string
  email: string
  mobile: string
  address: string
  age: number
  pincode: string
  state: string
  district: string
  hasChildren: boolean
  isSociallyDisadvantaged: boolean
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
]

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userStats, setUserStats] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    mobile: '',
    address: '',
    age: 18,
    pincode: '',
    state: '',
    district: '',
    hasChildren: false,
    isSociallyDisadvantaged: false
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status !== 'authenticated') {
      return
    }

    // Load user profile data
    const loadProfile = async () => {
      try {
        const [profileResponse, statsResponse] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/user/stats'),
        ])

        if (!profileResponse.ok) throw new Error('Failed to load profile')

        const profileData = await profileResponse.json()
        const userData = profileData.user || {}
        
        setProfile({
          name: userData.name || '',
          email: userData.email || '',
          mobile: userData.mobile || '',
          address: userData.address || '',
          age: userData.age || 18,
          pincode: userData.pincode || '',
          state: userData.state || '',
          district: userData.district || '',
          hasChildren: userData.hasChildren || false,
          isSociallyDisadvantaged: userData.isSociallyDisadvantaged || false
        })

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setUserStats(statsData.stats || null)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [status, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      const data = await response.json()
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'success'
      })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Calculate profile completion
  const calculateCompletion = () => {
    let completed = 0
    let total = 10
    if (profile.name) completed++
    if (profile.email) completed++
    if (profile.mobile) completed++
    if (profile.address) completed++
    if (profile.age >= 18) completed++
    if (profile.pincode) completed++
    if (profile.state) completed++
    if (profile.district) completed++
    completed += 2 // hasChildren and isSociallyDisadvantaged always counted
    return Math.round((completed / total) * 100)
  }

  const completionPercentage = calculateCompletion()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      {/* Animated Hero Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className="container max-w-6xl mx-auto px-6 py-8 relative z-10">
          <div className="flex items-start justify-between mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md shadow-2xl flex items-center justify-center border-4 border-white/50 group-hover:scale-105 transition-transform duration-300">
                <User className="h-12 w-12 text-blue-600" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3" style={{textShadow: '0 2px 10px rgba(0,0,0,0.3)'}}>
                {profile.name || 'Your Profile'}
              </h1>
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start flex-wrap">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
                  <Mail className="h-4 w-4 text-blue-100" />
                  <span className="text-white text-sm font-medium">{profile.email || 'email@example.com'}</span>
                </div>
                {profile.mobile && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
                    <Phone className="h-4 w-4 text-blue-100" />
                    <span className="text-white text-sm font-medium">{profile.mobile}</span>
                  </div>
                )}
              </div>
              
              {/* Achievement Badges */}
              <div className="flex gap-2 justify-center md:justify-start flex-wrap">
                <div className="px-4 py-2 bg-white rounded-full text-blue-700 text-xs font-bold border-2 border-white shadow-lg flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <BadgeCheck className="h-4 w-4" />
                  Verified User
                </div>
                {userStats && userStats.totalApplications > 0 && (
                  <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full text-white text-xs font-bold border-2 border-blue-300 shadow-lg flex items-center gap-1.5 hover:scale-105 transition-transform">
                    <Award className="h-4 w-4" />
                    {userStats.totalApplications} Application{userStats.totalApplications > 1 ? 's' : ''}
                  </div>
                )}
                {completionPercentage === 100 && (
                  <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-full text-white text-xs font-black border-2 border-yellow-300 shadow-xl flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="h-4 w-4" />
                    100% COMPLETE
                  </div>
                )}
              </div>
            </div>

            {/* Profile Completion Circle */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl hover:bg-white/20 transition-colors">
              <div className="text-center mb-3">
                <p className="text-blue-100 text-xs font-medium mb-1">Profile Strength</p>
                <div className="w-24 h-24 relative mx-auto">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-white/20"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionPercentage / 100)}`}
                      className="text-yellow-300 transition-all duration-1000 drop-shadow-lg"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white drop-shadow-lg">{completionPercentage}%</span>
                  </div>
                </div>
              </div>
              <p className="text-white/80 text-xs text-center">
                {completionPercentage === 100 ? '🎉 Perfect!' : completionPercentage >= 75 ? 'Almost there!' : 'Keep building'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Form */}
          <div className="lg:col-span-2 space-y-6">
        {/* Credit Score & Financial Health */}
        {userStats && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Your Financial Overview
          </h2>
          <div className="grid grid-cols-3 gap-4">
          <Card className="relative overflow-hidden border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <CardHeader className="pb-2 pt-4 px-4 relative">
              <CardDescription className="flex items-center gap-1.5 text-green-700 mb-1.5">
                <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                  <Award className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-semibold text-xs">Health Score</span>
              </CardDescription>
              <CardTitle className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-emerald-700 my-2">
                {userStats.healthScore}
              </CardTitle>
              <div className="space-y-2">
                <div className="relative">
                  <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-1000"
                      style={{width: `${userStats.healthScore}%`}}
                    ></div>
                  </div>
                </div>
                <p className="text-xs font-bold text-green-700 flex items-center gap-1">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {userStats.healthScore >= 75 ? 'Excellent' :
                   userStats.healthScore >= 50 ? 'Good' : 'Building'}
                </p>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="relative overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <CardHeader className="pb-2 pt-4 px-4 relative">
              <CardDescription className="flex items-center gap-1.5 text-blue-700 mb-1.5">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                  <TrendingUp className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-semibold text-xs">Avg SCI Score</span>
              </CardDescription>
              <CardTitle className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-700 my-2">
                {userStats.averageSci ? userStats.averageSci.toFixed(0) : '--'}
              </CardTitle>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000"
                  style={{width: userStats.averageSci ? `${Math.min(100, userStats.averageSci)}%` : '0%'}}
                ></div>
              </div>
              <p className="text-xs font-bold text-blue-700 flex items-center gap-1">
                {userStats.averageSci ? (
                  <>
                    <Target className="h-3.5 w-3.5" />
                    {userStats.totalApplications} app{userStats.totalApplications > 1 ? 's' : ''}
                  </>
                ) : (
                  <>
                    <Target className="h-3.5 w-3.5" />
                    Apply to see
                  </>
                )}
              </p>
            </CardHeader>
          </Card>
          
          <Card className="relative overflow-hidden border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <CardHeader className="pb-2 pt-4 px-4 relative">
              <CardDescription className="flex items-center gap-1.5 text-purple-700 mb-1.5">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md">
                  <Shield className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-semibold text-xs">Repayment</span>
              </CardDescription>
              <CardTitle className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-pink-700 my-2">
                {userStats.repaymentRate ? userStats.repaymentRate.toFixed(1) : '0'}<span className="text-2xl">%</span>
              </CardTitle>
              <div className="h-2 bg-purple-100 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-1000"
                  style={{width: `${userStats.repaymentRate || 0}%`}}
                ></div>
              </div>
              <p className="text-xs font-bold text-purple-700 flex items-center gap-1">
                {userStats.totalPayments > 0 ? (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    {userStats.onTimePayments}/{userStats.totalPayments} on-time
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    No history yet
                  </>
                )}
              </p>
            </CardHeader>
          </Card>
        </div>
        </div>
      )}

      {/* Data Sharing Overview */}
      {userStats && userStats.totalApplications > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Data Sharing Overview
              </h2>
              <p className="text-sm text-slate-600">
                Sharing more data helps us provide better loan offers tailored to your needs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Connected Card 1 */}
            <div className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative p-5 rounded-2xl bg-white border-2 border-green-300 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-green-100 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="px-2.5 py-1 bg-green-100 rounded-full">
                    <span className="text-xs font-bold text-green-700">+15%</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bank Statement</p>
                <p className="text-lg font-black text-green-700 mb-1">Connected</p>
                <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 w-full"></div>
                </div>
              </div>
            </div>

            {/* Connected Card 2 */}
            <div className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative p-5 rounded-2xl bg-white border-2 border-green-300 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-green-100 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="px-2.5 py-1 bg-green-100 rounded-full">
                    <span className="text-xs font-bold text-green-700">+10%</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile Recharge</p>
                <p className="text-lg font-black text-green-700 mb-1">Connected</p>
                <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 w-full"></div>
                </div>
              </div>
            </div>

            {/* Not Connected Card 1 */}
            <div className="relative overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-md hover:shadow-xl hover:border-blue-400 transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-slate-100 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <XCircle className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div className="px-2.5 py-1 bg-slate-100 rounded-full group-hover:bg-blue-100 transition-colors">
                    <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">+10%</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Electricity Bills</p>
                <p className="text-lg font-black text-slate-500 group-hover:text-blue-600 mb-1 transition-colors">Not Connected</p>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-300 w-0 group-hover:w-full transition-all duration-500"></div>
                </div>
              </div>
            </div>

            {/* Not Connected Card 2 */}
            <div className="relative overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-md hover:shadow-xl hover:border-blue-400 transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-slate-100 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <XCircle className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div className="px-2.5 py-1 bg-slate-100 rounded-full group-hover:bg-blue-100 transition-colors">
                    <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">+10%</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Education Fees</p>
                <p className="text-lg font-black text-slate-500 group-hover:text-blue-600 mb-1 transition-colors">Not Connected</p>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-300 w-0 group-hover:w-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Tip Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-6 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative flex items-start gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 shrink-0">
                <Sparkles className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <p className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  💡 Pro Tip
                </p>
                <p className="text-blue-50 leading-relaxed">
                  Connect all your data sources to unlock <span className="font-bold text-yellow-300">better interest rates</span>, <span className="font-bold text-yellow-300">higher loan amounts</span>, and <span className="font-bold text-yellow-300">faster approvals</span>!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="shadow-md border-slate-200">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription className="mt-1">
                Update your personal information and preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-slate-700">
                    <User className="h-4 w-4 text-slate-500" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-slate-700">
                    <Mail className="h-4 w-4 text-slate-500" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile" className="flex items-center gap-2 text-slate-700">
                    <Phone className="h-4 w-4 text-slate-500" />
                    Mobile Number
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={profile.mobile}
                    onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                    required
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-2 text-slate-700">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="100"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
                    required
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Your age"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Address Information</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2 text-slate-700">
                  <Home className="h-4 w-4 text-slate-500" />
                  Street Address
                </Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  required
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="House/Flat No., Street, Area"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pincode" className="text-slate-700">Pincode</Label>
                  <Input
                    id="pincode"
                    value={profile.pincode}
                    onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                    maxLength={6}
                    required
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="400001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-slate-700">State</Label>
                  <Select
                    value={profile.state}
                    onValueChange={(value) => setProfile({ ...profile, state: value })}
                  >
                    <SelectTrigger id="state" className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district" className="text-slate-700">District</Label>
                  <Input
                    id="district"
                    value={profile.district}
                    onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                    required
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter district"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Additional Information</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer">
                  <Checkbox
                    id="hasChildren"
                    checked={profile.hasChildren}
                    onCheckedChange={(checked) => 
                      setProfile({ ...profile, hasChildren: checked as boolean })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="hasChildren" className="cursor-pointer font-medium text-slate-900">
                      I have children
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      This information helps us understand your financial responsibilities better
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer">
                  <Checkbox
                    id="isSociallyDisadvantaged"
                    checked={profile.isSociallyDisadvantaged}
                    onCheckedChange={(checked) => 
                      setProfile({ ...profile, isSociallyDisadvantaged: checked as boolean })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="isSociallyDisadvantaged" className="cursor-pointer font-medium text-slate-900">
                      I belong to a socially disadvantaged group
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      Helps us provide fair access to credit for underserved communities
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <Button 
                type="submit" 
                disabled={saving} 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-semibold">Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span className="font-semibold">Save Changes</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                size="lg"
                className="gap-2 hover:bg-slate-50 border-2 px-8"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>

    {/* Sidebar - Tips & Progress */}
    <div className="lg:col-span-1 space-y-6">
      {/* Profile Completion Checklist */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 sticky top-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Completion Checklist
          </CardTitle>
          <CardDescription>Complete your profile to boost your score</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-blue-100">
            {profile.name ? (
              <div className="p-1.5 bg-green-100 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="p-1.5 bg-slate-100 rounded-full">
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${profile.name ? 'text-green-700' : 'text-slate-600'}`}>
                Full Name
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-blue-100">
            {profile.mobile ? (
              <div className="p-1.5 bg-green-100 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="p-1.5 bg-slate-100 rounded-full">
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${profile.mobile ? 'text-green-700' : 'text-slate-600'}`}>
                Mobile Number
              </p>
              {!profile.mobile && <p className="text-xs text-slate-500">+10% score boost</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-blue-100">
            {profile.address && profile.pincode && profile.state ? (
              <div className="p-1.5 bg-green-100 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="p-1.5 bg-slate-100 rounded-full">
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${profile.address && profile.pincode && profile.state ? 'text-green-700' : 'text-slate-600'}`}>
                Complete Address
              </p>
              {!(profile.address && profile.pincode && profile.state) && (
                <p className="text-xs text-slate-500">Required for verification</p>
              )}
            </div>
          </div>

          {completionPercentage === 100 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl text-white text-center">
              <Sparkles className="h-6 w-6 mx-auto mb-2" />
              <p className="font-bold">Perfect Profile!</p>
              <p className="text-xs text-green-50 mt-1">You’re all set for the best rates</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Keep it accurate</p>
              <p className="text-xs text-slate-600">Incorrect info can delay approvals</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Update regularly</p>
              <p className="text-xs text-slate-600">Changes in address or contact info</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Verify your email</p>
              <p className="text-xs text-slate-600">Important notifications sent here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl shrink-0">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 mb-1">Your data is secure</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                We use bank-grade encryption to protect your information. Your data is never shared without consent.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
        </div>
      </div>
    </div>
  )
}
