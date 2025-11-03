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
  Sparkles
} from 'lucide-react'

const headlineStats = [
  { label: 'Median approval time', value: '42 mins', helper: 'From application to decision' },
  { label: 'Applicants scored fairly', value: '21k+', helper: 'Across 8 partner states' },
  { label: 'Average SCI uplift', value: '+18 pts', helper: 'For low-income applicants' }
]

const features = [
  {
    icon: <Zap className="h-6 w-6 text-blue-600" />,
    title: 'Instant, Explainable Decisions',
    description: 'SafeCred blends ML with behavioural signals and renders a shareable decision narrative in seconds.'
  },
  {
    icon: <Shield className="h-6 w-6 text-blue-600" />,
    title: 'Bias-Aware Scoring',
    description: 'Fairness guardrails boost underserved borrowers by rewarding consent depth, repayment intent, and effort.'
  },
  {
    icon: <Users className="h-6 w-6 text-blue-600" />,
    title: 'Partner-Ready Data Mesh',
    description: 'Auto-ingest cooperative, SHG, and NBFC partner ledgers to enrich eligibility scoring with community insight.'
  }
]

const intelligenceSignals = [
  {
    title: 'Income Stability Index',
    description: 'Cross-checks bank flows, recharge cadence, and electricity spend to estimate reliable monthly income.',
    icon: <BarChart3 className="h-5 w-5 text-indigo-500" />
  },
  {
    title: 'Repayment Intent Score',
    description: 'Learns from past loans, dues cleared, and partner attestations to nudge high-intent borrowers forward.',
    icon: <HeartPulse className="h-5 w-5 text-rose-500" />
  },
  {
    title: 'Community Resilience Signal',
    description: 'Quantifies support networks from SHG savings, co-op strength, and mutual aid contributions.',
    icon: <Users className="h-5 w-5 text-emerald-500" />
  },
  {
    title: 'Purpose-fit Recommendations',
    description: 'Matches loan plans with repayment calendars, reminding borrowers before installments to cut slip-ups.',
    icon: <Workflow className="h-5 w-5 text-sky-500" />
  }
]

const journeySteps = [
  {
    title: 'Profile & Consent',
    detail: 'Fill a 3-minute form, share the data sources you are comfortable with, and upload optional partner attestations.'
  },
  {
    title: 'Signal Enrichment',
    detail: 'SafeCred fuses bank trends, utility proofs, telco top-ups, and partner feeds into a transparent signal graph.'
  },
  {
    title: 'Fairness Boost',
    detail: 'Our fairness rig adjusts for income volatility, seasonal work patterns, and social disadvantage markers.'
  },
  {
    title: 'Decision & Coaching',
    detail: 'Receive your SafeCred Index, loan quantum, and a simple action plan to reduce risk and grow eligibility.'
  }
]

const testimonials = [
  {
    name: 'Rajni Devi',
    meta: 'Self Help Group Lead, Bihar',
    quote:
      'SafeCred finally reads the reality of irregular income. My group got approvals without pledging gold for the first time.'
  },
  {
    name: 'Mahesh Chatterjee',
    meta: 'Village Level Entrepreneur, Odisha',
    quote:
      'The AI narrative clearly showed how electricity bill consistency improved our SCI. Officers trusted it instantly.'
  },
  {
    name: 'Ananya Rao',
    meta: 'Credit Officer, NBCFDC Partner',
    quote:
      'I rely on SafeCred dashboards to triage manual reviews. Bias alerts and partner signals save hours every week.'
  }
]

const trustedBy = ['NBCFDC', 'SHG Bharat', 'Sakhi Co-ops', 'Jan Dhan Initiative', 'Digital India Mission']

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50/40 text-slate-900 overflow-hidden">
      <div className="relative">
        {/* Animated background orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl floating" />
        </div>

        {/* Header */}
        <header className="glass border-b border-white/40 sticky top-0 z-50 shadow-lg">
          <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">SafeCred</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-700">
              <Link className="hover:text-blue-600 transition-all duration-300 hover:scale-110" href="#features">Features</Link>
              <Link className="hover:text-blue-600 transition-all duration-300 hover:scale-110" href="#signals">Signals</Link>
              <Link className="hover:text-blue-600 transition-all duration-300 hover:scale-110" href="#journey">Journey</Link>
              <Link className="hover:text-blue-600 transition-all duration-300 hover:scale-110" href="#stories">Stories</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:inline-flex hover:bg-blue-50 transition-all">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Get Started <Sparkles className="h-4 w-4 animate-pulse" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 lg:px-8 pt-16 pb-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full glass border-gradient px-4 py-2.5 text-xs font-semibold text-blue-700 mb-6 hover:scale-105 transition-transform duration-300">
                <CheckCircle className="h-4 w-4 text-green-600" /> 
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Certified by partner NBFCs & SHGs
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold leading-tight text-slate-900 mb-8">
                Smart Loans for{' '}
                <span className="gradient-text relative inline-block">
                  Underserved
                  <div className="absolute -bottom-3 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full shimmer shadow-lg" />
                  <div className="absolute -bottom-3 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full blur-sm opacity-70" />
                </span>{' '}
                Communities
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed mb-10">
                SafeCred measures creditworthiness beyond payslips by weaving together consent-led data, partner ledgers,
                and fairness-aware AI. Every borrower receives a transparent{' '}
                <span className="font-semibold text-blue-600">SafeCred Index</span> and actionable guidance.
              </p>
              <div className="flex flex-wrap gap-4 mb-14">
                <Link href="/register">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-base px-8 py-6 rounded-xl">
                    Apply for a Loan <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-base px-8 py-6 rounded-xl">
                    Track my application
                  </Button>
                </Link>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {headlineStats.map(({ label, value, helper }, idx) => (
                  <div 
                    key={label} 
                    className="glass rounded-2xl p-6 shadow-xl hover-lift glow-hover"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <dt className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</dt>
                    <dd className="mt-3 text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {value}
                    </dd>
                    <p className="mt-2 text-xs text-slate-600">{helper}</p>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative fade-in floating">
              <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 blur-3xl opacity-30 animate-pulse" />
              <div className="relative glass rounded-[2.5rem] p-8 shadow-2xl border-gradient">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Live SafeCred Index</p>
                    <div className="text-5xl font-black gradient-text">82.4</div>
                    <div className="flex gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`h-1.5 w-8 rounded-full ${i < 4 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 shadow-lg pulse-glow">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <div className="space-y-5 mb-8">
                  {[
                    { label: 'Consent depth', value: 'High', color: 'text-green-600' },
                    { label: 'Repayment intent', value: 'Verified', color: 'text-blue-600' },
                    { label: 'Partner confidence', value: '92%', color: 'text-purple-600' }
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/50 transition-colors duration-300">
                      <span className="text-sm text-slate-600 font-medium">{label}</span>
                      <span className={`font-bold ${color} text-base`}>{value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-100 via-blue-100 to-purple-100 p-6 shadow-inner">
                  <div className="absolute inset-0 shimmer" />
                  <p className="relative text-sm text-slate-700 italic leading-relaxed">
                    &quot;Explainable AI pulled our SHG repayment logs automatically and highlighted loyalty bonuses.&quot;
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Verified User</p>
                      <p className="text-xs text-slate-500">SHG Member</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Banner */}
        <section className="border-y border-blue-200/50 glass py-8 relative overflow-hidden">
          <div className="absolute inset-0 shimmer opacity-20" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between text-sm font-medium">
              <span className="uppercase tracking-[0.3em] gradient-text font-bold text-sm">
                Trusted by inclusive finance leaders
              </span>
              <div className="flex flex-wrap items-center gap-8 text-slate-500">
                {trustedBy.map(org => (
                  <span 
                    key={org} 
                    className="hover:text-blue-600 transition-all duration-300 hover:scale-110 font-medium cursor-pointer"
                  >
                    {org}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16 fade-in-up">
              <div className="inline-block px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-semibold text-sm mb-4">
                Platform Capabilities
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
                Designed for fair, fast,{' '}
                <span className="gradient-text">community-first</span> lending
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                SafeCred brings underwriting, fairness analytics, and borrower coaching onto a single collaborative workspace.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature, idx) => (
                <div 
                  key={feature.title} 
                  className="group glass rounded-3xl p-8 shadow-xl hover-lift glow-hover cursor-pointer border-gradient"
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <h3 className="mt-6 text-2xl font-bold text-slate-900 group-hover:gradient-text transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-base text-slate-600 leading-relaxed">{feature.description}</p>
                  <div className="mt-6 inline-flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all duration-300">
                    Learn more
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Intelligence Signals */}
        <section id="signals" className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/50 to-indigo-50/50" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mb-16 fade-in-up">
              <div className="inline-block px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 font-semibold text-sm mb-4">
                AI-Powered Intelligence
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
                Signals that see <span className="gradient-text">beyond paperwork</span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Traditional credit reports miss the resilience of informal workers. SafeCred reconstructs the borrower story using
                consents they control and data they trust.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {intelligenceSignals.map((signal, idx) => (
                <div 
                  key={signal.title} 
                  className="group glass rounded-3xl p-8 shadow-lg hover-lift relative overflow-hidden"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-transparent rounded-bl-full" />
                  <div className="relative z-10">
                    <div className="mb-5 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2.5 border border-blue-200/50 shadow-sm">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">{signal.icon}</div>
                      <span className="text-sm font-bold text-blue-700">Insight</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      {signal.title}
                    </h3>
                    <p className="text-base text-slate-600 leading-relaxed">{signal.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Journey */}
        <section id="journey" className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-16">
              <div className="lg:col-span-4 fade-in-up">
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2.5 text-sm font-bold text-blue-700 shadow-sm">
                  <Globe2 className="h-5 w-5" /> Borrower-First Flow
                </span>
                <h2 className="mt-6 text-4xl font-extrabold text-slate-900 leading-tight">
                  From application to disbursal in{' '}
                  <span className="gradient-text">four guided steps</span>
                </h2>
                <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                  Each decision is backed by audit trails, human overrides, and a fairness reviewer tab for loan officers.
                </p>
              </div>
              <div className="lg:col-span-8 space-y-6">
                {journeySteps.map((step, index) => (
                  <div 
                    key={step.title} 
                    className="group relative flex gap-6 glass rounded-3xl p-8 shadow-lg hover-lift"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {index < journeySteps.length - 1 && (
                      <div className="absolute -left-6 top-20 hidden h-full border-l-2 border-dashed border-blue-300 lg:block" />
                    )}
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 group-hover:gradient-text transition-all duration-300">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-base text-slate-600 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="stories" className="bg-white py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-slate-900">Stories of progress powered by SafeCred</h2>
              <p className="mt-4 text-slate-600">
                Borrowers, collectives, and officers share how fairness-aware scoring unlocked access to credit, faster.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map(testimonial => (
                <div key={testimonial.name} className="rounded-2xl border border-blue-100 bg-gradient-to-b from-white to-blue-50/40 p-6 shadow-sm">
                  <p className="text-sm leading-relaxed text-slate-600">“{testimonial.quote}”</p>
                  <div className="mt-6 font-semibold text-slate-900">{testimonial.name}</div>
                  <div className="text-xs uppercase tracking-wide text-blue-600">{testimonial.meta}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900" />
          <div className="container mx-auto px-4 lg:px-8 text-center text-white">
            <h2 className="text-3xl font-semibold">Ready to unlock responsible credit for your community?</h2>
            <p className="mt-4 text-blue-100 max-w-2xl mx-auto">
              Collaborate with SafeCred to run targeted outreach, manage manual reviews, and build a transparent credit ladder for informal workers.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="gap-2 h-14 px-8 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Join the movement <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" className="border-2 border-white bg-white/10 text-white hover:bg-white hover:text-slate-900 backdrop-blur-sm h-14 px-8 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Continue as credit officer
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-950 text-slate-300 py-14">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid gap-10 md:grid-cols-4">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-blue-400" />
                  <span className="text-lg font-semibold text-white">SafeCred</span>
                </div>
                <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                  AI-assisted credit scoring built with fairness constraints and explainability for inclusive finance.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Product</h4>
                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                  <li><Link href="#features">Platform Overview</Link></li>
                  <li><Link href="#signals">Data Signals</Link></li>
                  <li><Link href="#journey">Borrower Journey</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Company</h4>
                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                  <li><Link href="#stories">Impact Stories</Link></li>
                  <li><Link href="#">Partners</Link></li>
                  <li><Link href="#">Governance</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Contact</h4>
                <p className="mt-4 text-sm text-slate-400">
                  Email: support@safecred.com<br />
                  Phone: 1800-XXX-XXXX<br />
                  Digital India Mission, New Delhi
                </p>
              </div>
            </div>
            <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
              &copy; {new Date().getFullYear()} SafeCred. Built with empathy for Smart India Hackathon.
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
