import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Shield,
  Zap,
  Users,
  CheckCircle,
  BarChart3,
  Workflow,
  HeartPulse,
  Globe2,
  Sparkles,
  Lock,
  TrendingUp,
  Activity,
  ChevronRight,
  PlayCircle
} from 'lucide-react'

const features = [
  {
    icon: <Zap className="h-6 w-6 text-white" />,
    title: 'Instant Decisions',
    description: 'AI-driven analysis delivers credit decisions in seconds, not days.',
    className: "col-span-1 md:col-span-2 lg:col-span-1 bg-blue-600 text-white"
  },
  {
    icon: <Shield className="h-6 w-6 text-blue-600" />,
    title: 'Bias-Free Scoring',
    description: 'Algorithmic fairness guardrails ensure equitable access for all applicants.',
    className: "bg-white border border-slate-200"
  },
  {
    icon: <Users className="h-6 w-6 text-blue-600" />,
    title: 'Partner Network',
    description: 'Seamless integration with SHGs and NBFCs for verified community data.',
    className: "bg-white border border-slate-200"
  },
  {
    icon: <Activity className="h-6 w-6 text-blue-600" />,
    title: 'Real-time Monitoring',
    description: 'Continuous risk assessment and borrower health tracking.',
    className: "bg-white border border-slate-200"
  }
]

const stats = [
  { label: 'Approval Time', value: '42m', desc: 'Median processing speed' },
  { label: 'Fair Scores', value: '21k+', desc: 'Applicants evaluated' },
  { label: 'Uplift', value: '+18%', desc: 'In approval rates' },
  { label: 'Partners', value: '85+', desc: 'NBFCs & SHGs' }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">SafeCred</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-blue-600 transition-colors">Platform</Link>
            <Link href="#solutions" className="hover:text-blue-600 transition-colors">Solutions</Link>
            <Link href="#impact" className="hover:text-blue-600 transition-colors">Impact</Link>
            <Link href="#resources" className="hover:text-blue-600 transition-colors">Resources</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link href="/register">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8 fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              New: Real-time SHG Integration
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-tight">
              Credit scoring for the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                modern economy
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              SafeCred empowers financial institutions to lend with confidence using AI-driven insights, alternative data, and fairness-first algorithms.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-lg shadow-xl shadow-blue-200 hover:shadow-2xl hover:shadow-blue-200 transition-all duration-300 w-full sm:w-auto">
                  Start Lending <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-slate-200 hover:bg-slate-50 text-slate-700 text-lg w-full sm:w-auto">
                  <PlayCircle className="mr-2 h-5 w-5" /> Watch Demo
                </Button>
              </Link>
            </div>

            {/* Hero Visual */}
            <div className="mt-20 relative mx-auto max-w-5xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-slate-500 font-medium">Approval Rate</p>
                        <p className="text-2xl font-bold text-slate-900">84.2%</p>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[84%]"></div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-slate-500 font-medium">Active Borrowers</p>
                        <p className="text-2xl font-bold text-slate-900">12,450</p>
                      </div>
                    </div>
                    <div className="flex -space-x-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white"></div>
                      ))}
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <Shield className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-slate-500 font-medium">Risk Score</p>
                        <p className="text-2xl font-bold text-slate-900">Low</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="h-2 w-full bg-green-500 rounded-full"></div>
                      <div className="h-2 w-full bg-green-500 rounded-full"></div>
                      <div className="h-2 w-full bg-green-500 rounded-full"></div>
                      <div className="h-2 w-full bg-slate-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">Trusted by industry leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {['NBCFDC', 'Digital India', 'SHG Bharat', 'FinTech Association', 'Global Alliance'].map((brand) => (
              <span key={brand} className="text-xl font-bold text-slate-800">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Everything you need to scale <br />
              <span className="text-blue-600">inclusive lending</span>
            </h2>
            <p className="text-lg text-slate-600">
              Our platform combines traditional credit metrics with alternative data points to build a complete financial identity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className={`p-8 rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${feature.className}`}
              >
                <div className="mb-6">{feature.icon}</div>
                <h3 className={`text-xl font-bold mb-3 ${feature.className.includes('text-white') ? 'text-white' : 'text-slate-900'}`}>
                  {feature.title}
                </h3>
                <p className={`leading-relaxed ${feature.className.includes('text-white') ? 'text-blue-100' : 'text-slate-600'}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold tracking-tight">{stat.value}</div>
                <div className="text-lg font-medium text-blue-200">{stat.label}</div>
                <div className="text-sm text-slate-400">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration/Workflow Section */}
      <section id="solutions" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Seamless integration with your existing workflow
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Connect SafeCred to your core banking system or use our dashboard as a standalone solution. We support all major protocols.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: 'API-First Design', desc: 'RESTful endpoints for instant credit checks.' },
                  { title: 'Bank-Grade Security', desc: 'AES-256 encryption and SOC2 compliance.' },
                  { title: 'Custom Models', desc: 'Train scoring models on your specific population data.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="mt-1 bg-blue-100 p-2 rounded-lg h-fit">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                      <p className="text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl transform rotate-3 opacity-10"></div>
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 relative">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="font-mono text-sm text-slate-500">POST /api/v1/score</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">200 OK</span>
                  </div>
                  <div className="font-mono text-sm text-slate-600 space-y-2">
                    <div className="text-purple-600">{`{`}</div>
                    <div className="pl-4">
                      <span className="text-blue-600">"applicant_id"</span>: <span className="text-orange-600">"usr_8923"</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-blue-600">"credit_score"</span>: <span className="text-green-600">785</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-blue-600">"risk_level"</span>: <span className="text-orange-600">"low"</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-blue-600">"recommended_limit"</span>: <span className="text-green-600">50000</span>
                    </div>
                    <div className="text-purple-600">{`}`}</div>
                  </div>
                  <div className="pt-4">
                    <Button variant="outline" className="w-full">View Documentation</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="impact" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              How SafeCred Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Get approved in minutes with our AI-powered credit assessment process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector Lines */}
            <div className="hidden md:block absolute top-16 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-1 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 -z-10"></div>
            
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl font-bold text-2xl mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Apply in Minutes</h3>
              <p className="text-slate-600 leading-relaxed">
                Fill out a simple form and share alternative data sources like utility bills and mobile recharges.
              </p>
            </div>
            
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl font-bold text-2xl mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Analysis</h3>
              <p className="text-slate-600 leading-relaxed">
                Our machine learning models analyze 100+ data points to calculate your SafeCred Index (SCI) score.
              </p>
            </div>
            
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl font-bold text-2xl mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Decision</h3>
              <p className="text-slate-600 leading-relaxed">
                Receive approval within 42 minutes on average. Funds disbursed within 24 hours of approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="resources" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-slate-600">
                Everything you need to know about SafeCred
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold text-slate-900 mb-3">What is the SafeCred Index (SCI)?</h3>
                <p className="text-slate-600 leading-relaxed">
                  SCI is our proprietary credit score (0-100) that evaluates your creditworthiness using alternative data. Unlike traditional CIBIL scores, we analyze utility payments, mobile recharges, and social indicators to give you a fair assessment.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold text-slate-900 mb-3">How fast can I get approved?</h3>
                <p className="text-slate-600 leading-relaxed">
                  Most applications are processed within 42 minutes. If approved, funds are typically disbursed within 24 hours. Applications requiring manual review may take 2-3 business days.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold text-slate-900 mb-3">What data do you analyze?</h3>
                <p className="text-slate-600 leading-relaxed">
                  We look at bank statements, mobile recharge history, electricity bill payments, education fee payments, SHG membership, and repayment history. The more data you share, the better your chances of approval with favorable terms.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Is my data secure?</h3>
                <p className="text-slate-600 leading-relaxed">
                  Absolutely. We use bank-grade AES-256 encryption and are SOC2 compliant. Your data is never sold to third parties and is only used for credit assessment with your explicit consent.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold text-slate-900 mb-3">What if I have no credit history?</h3>
                <p className="text-slate-600 leading-relaxed">
                  That's our specialty! SafeCred is designed for credit-invisible individuals. We evaluate alternative data to build your credit profile from scratch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-blue-600 rounded-[2.5rem] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full z-0">
               <div className="absolute top-[-50%] left-[-10%] w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl"></div>
               <div className="absolute bottom-[-50%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                Ready to transform your lending process?
              </h2>
              <p className="text-xl text-blue-100 mb-12">
                Join forward-thinking institutions using SafeCred to reach the next billion borrowers.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-14 px-8 rounded-full bg-white text-blue-600 hover:bg-blue-50 text-lg font-bold shadow-lg w-full sm:w-auto">
                    Get Started Now
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button 
                    size="lg"
                    className="h-14 px-8 rounded-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg font-semibold w-full sm:w-auto transition-all duration-200"
                  >
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">SafeCred</span>
              </div>
              <p className="text-slate-500 leading-relaxed max-w-xs">
                Making credit accessible, fair, and transparent for everyone through the power of artificial intelligence.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Platform</h4>
              <ul className="space-y-4 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-blue-600">Features</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Security</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Enterprise</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-blue-600">About Us</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Careers</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Blog</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-blue-600">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">© {new Date().getFullYear()} SafeCred Inc. All rights reserved.</p>
            <div className="flex gap-6">
              {/* Social icons would go here */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
