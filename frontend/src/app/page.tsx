'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, TrendingUp, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">SafeCred</span>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Smart Loans for Everyone
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get instant loan decisions with AI-powered credit assessment. 
            Fair, transparent, and accessible financing for all.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6">
                Apply Now
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose SafeCred?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Instant Decisions</CardTitle>
              <CardDescription>
                Get loan approval in seconds, not days. Our AI processes your application instantly.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Fair & Transparent</CardTitle>
              <CardDescription>
                No hidden fees. Clear interest rates. Income-adjusted credit scoring for fairness.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Build Your Credit</CardTitle>
              <CardDescription>
                Share your data to get better rates. Every repayment builds your credit score.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-white/50 rounded-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-start space-x-4">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-xl font-bold">
              1
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Create Your Account</h3>
              <p className="text-gray-600">Sign up with basic information in less than a minute.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-xl font-bold">
              2
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Submit Your Application</h3>
              <p className="text-gray-600">Provide income details and share optional data for better rates (bank statements, utility bills, etc.)</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-xl font-bold">
              3
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Get Instant Decision</h3>
              <p className="text-gray-600">Our AI analyzes your profile and provides immediate approval with personalized loan offers.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-xl font-bold">
              4
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Receive Your Funds</h3>
              <p className="text-gray-600">Once approved, funds are transferred directly to your account within 24 hours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About/Team Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">About Our Team</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Meet the talented team behind SafeCred - passionate innovators dedicated to making credit accessible for everyone.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                DG
              </div>
              <CardTitle className="text-xl">Divya Ratna Gautam</CardTitle>
              <CardDescription className="text-primary font-semibold">Team Leader, AI/ML</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                SP
              </div>
              <CardTitle className="text-xl">Sudhanshu Pal</CardTitle>
              <CardDescription className="text-primary font-semibold">Backend Developer</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                AS
              </div>
              <CardTitle className="text-xl">Arvind Kumar Singh</CardTitle>
              <CardDescription className="text-primary font-semibold">Frontend & Backend Developer</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                AS
              </div>
              <CardTitle className="text-xl">Ayush Singh</CardTitle>
              <CardDescription className="text-primary font-semibold">Logistics, AI/ML</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                VC
              </div>
              <CardTitle className="text-xl">Vivek Chaudhary</CardTitle>
              <CardDescription className="text-primary font-semibold">Frontend Developer</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-600 to-rose-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                EY
              </div>
              <CardTitle className="text-xl">Esha Yadav</CardTitle>
              <CardDescription className="text-primary font-semibold">Research and Presentation</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers who trust SafeCred for their financing needs.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Apply for a Loan Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>&copy; 2025 SafeCred. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
