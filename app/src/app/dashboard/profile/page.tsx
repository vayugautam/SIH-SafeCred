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
import { Loader2, TrendingUp, Award, Shield, Database, CheckCircle2, XCircle } from 'lucide-react'

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

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Credit Score & Financial Health */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardDescription className="flex items-center gap-1 text-green-700">
                <Award className="h-4 w-4" />
                Financial Health Score
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-green-700">
                {userStats.healthScore}/100
              </CardTitle>
              <p className="text-sm text-green-600">
                {userStats.healthScore >= 75 ? 'Excellent Standing' :
                 userStats.healthScore >= 50 ? 'Good Standing' : 'Building Credit'}
              </p>
            </CardHeader>
          </Card>
          
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardDescription className="flex items-center gap-1 text-blue-700">
                <TrendingUp className="h-4 w-4" />
                Average SCI Score
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-blue-700">
                {userStats.averageSci ? userStats.averageSci.toFixed(0) : '--'}
              </CardTitle>
              <p className="text-sm text-blue-600">
                {userStats.averageSci ? 'Based on ' + userStats.totalApplications + ' applications' : 'No applications yet'}
              </p>
            </CardHeader>
          </Card>
          
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardDescription className="flex items-center gap-1 text-purple-700">
                <Shield className="h-4 w-4" />
                Repayment Rate
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-purple-700">
                {userStats.repaymentRate ? userStats.repaymentRate.toFixed(1) : '0'}%
              </CardTitle>
              <p className="text-sm text-purple-600">
                {userStats.totalPayments > 0 ? `${userStats.onTimePayments}/${userStats.totalPayments} on-time` : 'No payment history'}
              </p>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Data Sharing Overview */}
      {userStats && userStats.totalApplications > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <CardTitle>Data Sharing Overview</CardTitle>
            </div>
            <CardDescription>
              Sharing more data helps us provide better loan offers tailored to your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-slate-500">Bank Statement</p>
                  <p className="text-sm font-medium text-slate-900">Connected</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-slate-500">Mobile Recharge</p>
                  <p className="text-sm font-medium text-slate-900">Connected</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <XCircle className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Electricity Bills</p>
                  <p className="text-sm font-medium text-slate-600">Not Connected</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <XCircle className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Education Fees</p>
                  <p className="text-sm font-medium text-slate-600">Not Connected</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
              💡 Tip: Connect all your data sources to unlock better interest rates and higher loan amounts
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Update your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={profile.mobile}
                    onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="100"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Address</h3>
              
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={profile.pincode}
                    onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                    maxLength={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={profile.state}
                    onValueChange={(value) => setProfile({ ...profile, state: value })}
                  >
                    <SelectTrigger id="state">
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
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={profile.district}
                    onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasChildren"
                    checked={profile.hasChildren}
                    onCheckedChange={(checked) => 
                      setProfile({ ...profile, hasChildren: checked as boolean })
                    }
                  />
                  <Label htmlFor="hasChildren" className="cursor-pointer">
                    I have children
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isSociallyDisadvantaged"
                    checked={profile.isSociallyDisadvantaged}
                    onCheckedChange={(checked) => 
                      setProfile({ ...profile, isSociallyDisadvantaged: checked as boolean })
                    }
                  />
                  <Label htmlFor="isSociallyDisadvantaged" className="cursor-pointer">
                    I belong to a socially disadvantaged group
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
