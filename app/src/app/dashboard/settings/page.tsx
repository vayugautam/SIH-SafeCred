'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Bell, Lock, Shield, Mail, Smartphone, Database, Activity, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [showPassword, setShowPassword] = useState(false)
  
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    marketing: false,
    security: true
  })

  const [dataConsent, setDataConsent] = useState({
    bankStatement: false,
    mobileRecharge: false,
    electricityBills: false,
    educationFees: false,
  })

  const [privacy, setPrivacy] = useState({
    shareWithPartners: false,
    allowAnalytics: true,
    showInLeaderboard: false,
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAuditLogs()
    }
  }, [status])

  const fetchAuditLogs = async () => {
    try {
      // This would be a real API call in production
      // const response = await fetch('/api/user/audit-logs')
      // const data = await response.json()
      // setAuditLogs(data.logs || [])
      
      // Mock data for now
      setAuditLogs([
        { id: '1', action: 'login', createdAt: new Date().toISOString(), details: 'Logged in from Chrome' },
        { id: '2', action: 'application_submitted', createdAt: new Date(Date.now() - 86400000).toISOString(), details: 'New loan application' },
        { id: '3', action: 'settings_updated', createdAt: new Date(Date.now() - 172800000).toISOString(), details: 'Updated notification preferences' },
      ])
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated successfully.',
      variant: 'success'
    })
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-slate-600">Manage your account preferences and security.</p>
            </div>
          </div>

      {/* Security Overview Banner */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-2">Your Account is Secure</h3>
              <p className="text-sm text-slate-600 mb-4">
                Last login: {formatDate(new Date().toISOString())} • 2-factor authentication: <Badge variant="success" className="ml-1">Enabled</Badge>
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Password Strength</p>
                  <div className="flex gap-1 mb-2">
                    <div className="h-1.5 flex-1 bg-green-600 rounded"></div>
                    <div className="h-1.5 flex-1 bg-green-600 rounded"></div>
                    <div className="h-1.5 flex-1 bg-green-600 rounded"></div>
                    <div className="h-1.5 flex-1 bg-slate-200 rounded"></div>
                  </div>
                  <span className="text-xs font-medium text-green-700">Strong</span>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Active Sessions</p>
                  <p className="text-2xl font-bold text-slate-900">2</p>
                  <span className="text-xs text-slate-600">devices</span>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Data Shared</p>
                  <p className="text-2xl font-bold text-slate-900">3/4</p>
                  <span className="text-xs text-slate-600">sources</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Choose how you want to be notified about updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-slate-500">Receive updates about your loan application via email.</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">SMS Alerts</Label>
                <p className="text-sm text-slate-500">Get important security alerts and OTPs via SMS.</p>
              </div>
              <Switch
                checked={notifications.sms}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sms: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Security Alerts</Label>
                <p className="text-sm text-slate-500">Get notified about new sign-ins and suspicious activity.</p>
              </div>
              <Switch
                checked={notifications.security}
                disabled
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, security: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Update your password and security settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button variant="outline" className="w-full sm:w-auto mt-2">
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Data Consent Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <CardTitle>Data Sharing & Consent</CardTitle>
            </div>
            <CardDescription>Control what data you share to improve your credit score.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Bank Statement</Label>
                <p className="text-sm text-slate-500">Share your bank statement for better loan offers. +15% score boost.</p>
              </div>
              <Switch
                checked={dataConsent.bankStatement}
                onCheckedChange={(checked) => setDataConsent(prev => ({ ...prev, bankStatement: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Mobile Recharge History</Label>
                <p className="text-sm text-slate-500">Your recharge patterns show financial consistency. +10% score boost.</p>
              </div>
              <Switch
                checked={dataConsent.mobileRecharge}
                onCheckedChange={(checked) => setDataConsent(prev => ({ ...prev, mobileRecharge: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Electricity Bills</Label>
                <p className="text-sm text-slate-500">Bill payment history demonstrates responsibility. +10% score boost.</p>
              </div>
              <Switch
                checked={dataConsent.electricityBills}
                onCheckedChange={(checked) => setDataConsent(prev => ({ ...prev, electricityBills: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Education Fee Payments</Label>
                <p className="text-sm text-slate-500">Shows commitment to education and long-term planning. +10% score boost.</p>
              </div>
              <Switch
                checked={dataConsent.educationFees}
                onCheckedChange={(checked) => setDataConsent(prev => ({ ...prev, educationFees: checked }))}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                🔒 Your data is encrypted and only used for credit scoring. You can revoke consent anytime.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>Privacy & Data Usage</CardTitle>
            </div>
            <CardDescription>Control how your data is used beyond credit scoring.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Share anonymized data with partners</Label>
                <p className="text-sm text-slate-500">Help improve financial inclusion through research.</p>
              </div>
              <Switch
                checked={privacy.shareWithPartners}
                onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, shareWithPartners: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Usage Analytics</Label>
                <p className="text-sm text-slate-500">Help us improve the platform with anonymous usage data.</p>
              </div>
              <Switch
                checked={privacy.allowAnalytics}
                onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, allowAnalytics: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
            <CardDescription>Your recent account activity and login history.</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{log.action.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-500">{log.details}</p>
                    </div>
                    <p className="text-xs text-slate-400">{formatDate(log.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </div>
            <CardDescription>Irreversible actions that will affect your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-900">Delete All Data</p>
                <p className="text-xs text-slate-500">Permanently remove all your data from our servers</p>
              </div>
              <Button variant="destructive" size="sm">
                Delete Data
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-900">Close Account</p>
                <p className="text-xs text-slate-500">Permanently close your SafeCred account</p>
              </div>
              <Button variant="destructive" size="sm">
                Close Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
        </div>

      {/* Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        {/* Quick Stats */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Account Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Security Score</span>
                <span className="text-lg font-bold text-green-700">92%</span>
              </div>
              <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 w-[92%]"></div>
              </div>
            </div>
            <div className="pt-3 border-t border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-600">2FA Enabled</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-600">Email Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-600">Strong Password</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Tips */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              Privacy Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Review regularly</p>
                <p className="text-xs text-slate-600">Check your privacy settings monthly</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Limit data sharing</p>
                <p className="text-xs text-slate-600">Only share what&apos;s necessary</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Audit permissions</p>
                <p className="text-xs text-slate-600">Review who can access your data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-slate-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="flex gap-3 pb-3 border-b border-slate-100 last:border-0">
                  <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-900 capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="p-2.5 bg-purple-100 rounded-xl shrink-0">
                <Mail className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">Need Help?</p>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Our support team is here to help you with any questions.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
  )
}
