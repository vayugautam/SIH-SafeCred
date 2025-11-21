'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlayCircle, ArrowLeft, CheckCircle } from 'lucide-react'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-100">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 md:py-24">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            See SafeCred in Action
          </h1>
          <p className="text-xl text-slate-600">
            Watch how our AI-driven platform transforms credit assessment for the underserved.
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-slate-900 rounded-2xl overflow-hidden shadow-2xl aspect-video relative group cursor-pointer">
          {/* Placeholder for video player */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 group-hover:bg-slate-900/40 transition-colors">
            <div className="text-center">
              <PlayCircle className="h-20 w-20 text-white opacity-90 group-hover:scale-110 transition-transform duration-300 mx-auto mb-4" />
              <p className="text-white font-medium text-lg">Watch Product Tour (2:30)</p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
            <div className="h-full bg-blue-600 w-1/3"></div>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Connect Data</h3>
            <p className="text-slate-600">
              See how easily applicants can link their alternative data sources securely.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-blue-600">2</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Analysis</h3>
            <p className="text-slate-600">
              Watch our engine process thousands of data points in real-time.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-blue-600">3</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Decision</h3>
            <p className="text-slate-600">
              Get a comprehensive credit score and risk assessment instantly.
            </p>
          </div>
        </div>

        <div className="mt-24 bg-blue-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Ready to try it yourself?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Create a free account and start exploring the platform with our synthetic data sandbox.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 h-14 px-8 rounded-full text-lg font-bold">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
