'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Shield, Loader2, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Application {
  id: string
  applicationId: string
  status: string
  riskBand: string | null
  loanAmount: number
  approvedLoanAmount: number | null
  tenureMonths: number
  finalSci: number | null
  mlProbability: number | null
  createdAt: string
  user: {
    name: string
    email: string
    mobile: string
    age: number | null
    hasChildren: boolean | null
    isSociallyDisadvantaged: boolean | null
  }
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AdminApplicationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    riskBand: '',
    search: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'LOAN_OFFICER') {
      router.push('/dashboard')
      return
    }

    fetchApplications()
  }, [session, status, router, pagination.page, filters])

  const fetchApplications = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filters.status) params.append('status', filters.status)
      if (filters.riskBand) params.append('riskBand', filters.riskBand)

      const response = await fetch(`/api/admin/applications?${params}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load applications')
        setIsLoading(false)
        return
      }

      setApplications(data.applications)
      setPagination(data.pagination)
    } catch (error) {
      setError('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
    setPagination({ ...pagination, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage })
    setIsLoading(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'REJECTED': return 'destructive'
      case 'MANUAL_REVIEW': return 'warning'
      case 'PENDING': return 'warning'
      case 'PROCESSING': return 'info'
      default: return 'default'
    }
  }

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'LOW_RISK': return 'success'
      case 'MEDIUM_RISK': return 'warning'
      case 'HIGH_RISK': return 'destructive'
      case 'REJECT': return 'destructive'
      default: return 'default'
    }
  }

  const filteredApplications = filters.search
    ? applications.filter(
        (app) =>
          app.applicationId.toLowerCase().includes(filters.search.toLowerCase()) ||
          app.user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          app.user.email.toLowerCase().includes(filters.search.toLowerCase())
      )
    : applications

  if (isLoading && applications.length === 0) {
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
              <Link href="/dashboard">
                <Button variant="ghost">User View</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Applications</h1>
          <p className="text-gray-600">
            Showing {filteredApplications.length} of {pagination.total} applications
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ID, name, email..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="MANUAL_REVIEW">Manual Review</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Risk Band</label>
                <select
                  value={filters.riskBand}
                  onChange={(e) => handleFilterChange('riskBand', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Risk Bands</option>
                  <option value="LOW_RISK">Low Risk</option>
                  <option value="MEDIUM_RISK">Medium Risk</option>
                  <option value="HIGH_RISK">High Risk</option>
                  <option value="REJECT">Reject</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium invisible">Actions</label>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFilters({ status: '', riskBand: '', search: '' })
                    setPagination({ ...pagination, page: 1 })
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        {error ? (
          <Card>
            <CardContent className="py-8 text-center text-red-600">
              {error}
            </CardContent>
          </Card>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p className="text-lg font-medium mb-2">No applications found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Section - Application Info */}
                    <div className="md:col-span-5">
                      <div className="flex items-center gap-3 mb-3">
                        <p className="font-bold text-lg text-blue-600">{app.applicationId}</p>
                        <Badge variant={getStatusBadgeVariant(app.status)}>
                          {app.status.replace(/_/g, ' ')}
                        </Badge>
                        {app.riskBand && (
                          <Badge variant={getRiskBadgeVariant(app.riskBand)}>
                            {app.riskBand.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold">{app.user.name}</p>
                        <p className="text-sm text-gray-600">{app.user.email}</p>
                        <p className="text-sm text-gray-600">{app.user.mobile}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Applied on {formatDate(new Date(app.createdAt))}
                        </p>
                      </div>
                    </div>

                    {/* Middle Section - User Details */}
                    <div className="md:col-span-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">User Profile</h4>
                      <div className="space-y-1 text-sm">
                        {app.user.age && (
                          <p className="text-gray-600">Age: {app.user.age} years</p>
                        )}
                        {app.user.hasChildren !== null && (
                          <p className="text-gray-600">
                            Children: {app.user.hasChildren ? 'Yes' : 'No'}
                          </p>
                        )}
                        {app.user.isSociallyDisadvantaged !== null && (
                          <p className="text-gray-600">
                            Socially Disadvantaged: {app.user.isSociallyDisadvantaged ? 'Yes' : 'No'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Section - Loan Details */}
                    <div className="md:col-span-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Requested Amount</p>
                          <p className="font-semibold">{formatCurrency(app.loanAmount)}</p>
                        </div>
                        {app.approvedLoanAmount !== null && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Approved Amount</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(app.approvedLoanAmount)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Tenure</p>
                          <p className="font-semibold">{app.tenureMonths} months</p>
                        </div>
                        {app.finalSci !== null && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Credit Score</p>
                            <p className={`font-semibold ${
                              app.finalSci >= 80 ? 'text-green-600' :
                              app.finalSci >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {app.finalSci.toFixed(0)}/100
                            </p>
                          </div>
                        )}
                        {app.mlProbability !== null && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">ML Probability</p>
                            <p className="font-semibold">{(app.mlProbability * 100).toFixed(1)}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
