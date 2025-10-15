'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { applicationAPI } from '@/lib/api';
import { CreditCard, LogOut, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadApplications();
  }, [isAuthenticated]);

  const loadApplications = async () => {
    try {
      const response = await applicationAPI.getAll();
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MANUAL_REVIEW':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">SafeCred</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Dashboard</h1>
          <p className="text-gray-600">Manage your loan applications and track your credit journey</p>
        </div>

        {/* New Application Button */}
        <div className="mb-8">
          <Link href="/dashboard/apply">
            <Button size="lg" className="text-lg px-8">
              <Plus className="h-5 w-5 mr-2" />
              New Loan Application
            </Button>
          </Link>
        </div>

        {/* Applications List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Applications</h2>
          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 mb-4">You haven't submitted any applications yet.</p>
                <Link href="/dashboard/apply">
                  <Button>Apply for Your First Loan</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {applications.map((app) => (
                <Card key={app.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>₹{app.loanAmount.toLocaleString()} Loan</CardTitle>
                        <CardDescription>
                          Applied on {new Date(app.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(
                          app.status
                        )}`}
                      >
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Declared Income</p>
                        <p className="font-semibold">₹{app.declaredIncome.toLocaleString()}/mo</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tenure</p>
                        <p className="font-semibold">{app.tenureMonths} months</p>
                      </div>
                      {app.loanOffer && (
                        <div>
                          <p className="text-sm text-gray-600">Loan Offer</p>
                          <p className="font-semibold text-green-600">
                            ₹{app.loanOffer.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {app.status === 'APPROVED' && app.finalSci && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Credit Score (SCI)</p>
                            <p className="text-2xl font-bold text-green-600">{app.finalSci}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Interest Rate</p>
                            <p className="text-2xl font-bold">{app.interestRate}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Risk Band</p>
                            <p className="text-sm font-semibold">{app.riskBand}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {app.decisionMessage && (
                      <p className="text-sm text-gray-700 italic mb-4">{app.decisionMessage}</p>
                    )}

                    <Link href={`/dashboard/application/${app.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
