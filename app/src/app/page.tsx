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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50/40 text-slate-900">
      <div className="relative">
        <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_55%)]" />

        {/* Header */}
        <header className="border-b border-blue-100/60 bg-white/70 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-semibold">SafeCred</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
              <Link className="hover:text-blue-600 transition" href="#features">Features</Link>
              <Link className="hover:text-blue-600 transition" href="#signals">Signals</Link>
              <Link className="hover:text-blue-600 transition" href="#journey">Journey</Link>
              <Link className="hover:text-blue-600 transition" href="#stories">Stories</Link>
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:inline-flex">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="gap-2">Get Started <Sparkles className="h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 lg:px-8 pt-12 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700">
                <CheckCircle className="h-4 w-4" /> Certified by partner NBFCs & SHGs
              </div>
              <h1 className="mt-6 text-4xl md:text-5xl xl:text-6xl font-bold leading-tight text-slate-900">
                Smart Loans for <span className="text-blue-600">Underserved</span> Communities
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                SafeCred measures creditworthiness beyond payslips by weaving together consent-led data, partner ledgers,
                and fairness-aware AI. Every borrower receives a transparent SafeCred Index and actionable guidance.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register">
                  <Button size="lg" className="gap-2 shadow-sm shadow-blue-200">
                    Apply for a Loan <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-blue-200 text-blue-600">
                    Track my application
                  </Button>
                </Link>
              </div>

              <dl className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {headlineStats.map(({ label, value, helper }) => (
                  <div key={label} className="rounded-2xl border border-blue-100 bg-white/70 p-5 shadow-sm">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
                    <dd className="mt-2 text-2xl font-semibold text-slate-900">{value}</dd>
                    <p className="mt-1 text-xs text-slate-500">{helper}</p>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-blue-100 via-white to-indigo-100 blur-2xl" />
              <div className="relative rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/40">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-slate-500">Live safecred index</p>
                    <div className="text-3xl font-bold text-blue-600">82.4</div>
                  </div>
                  <div className="rounded-full bg-blue-50 p-3">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Consent depth</span>
                    <span className="font-semibold text-slate-900">High</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Repayment intent</span>
                    <span className="font-semibold text-slate-900">Verified</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Partner confidence</span>
                    <span className="font-semibold text-slate-900">92%</span>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-100 via-white to-blue-100 p-4 text-sm text-slate-600">
                  &quot;Explainable AI pulled our SHG repayment logs automatically and highlighted loyalty bonuses.&quot;
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Banner */}
        <section className="border-y border-blue-100 bg-white/80 py-6">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between text-sm font-medium text-slate-500">
              <span className="uppercase tracking-[0.3em] text-blue-600">Trusted by inclusive finance leaders</span>
              <div className="flex flex-wrap items-center gap-6 text-slate-400">
                {trustedBy.map(org => (
                  <span key={org} className="hover:text-blue-600 transition">{org}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-slate-900">Designed for fair, fast, community-first lending</h2>
              <p className="mt-4 text-slate-600">
                SafeCred brings underwriting, fairness analytics, and borrower coaching onto a single collaborative workspace.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {features.map(feature => (
                <div key={feature.title} className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    {feature.icon}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Intelligence Signals */}
        <section id="signals" className="bg-gradient-to-b from-white to-blue-50 py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-slate-900">Signals that see beyond paperwork</h2>
              <p className="mt-4 text-slate-600">
                Traditional credit reports miss the resilience of informal workers. SafeCred reconstructs the borrower story using
                consents they control and data they trust.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {intelligenceSignals.map(signal => (
                <div key={signal.title} className="rounded-2xl border border-blue-100 bg-white/80 p-6 shadow-sm">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    {signal.icon}
                    Insight
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{signal.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{signal.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Journey */}
        <section id="journey" className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  <Globe2 className="h-4 w-4" /> borrower-first flow
                </span>
                <h2 className="mt-4 text-3xl font-bold text-slate-900">From application to disbursal in four guided steps</h2>
                <p className="mt-4 text-slate-600">
                  Each decision is backed by audit trails, human overrides, and a fairness reviewer tab for loan officers.
                </p>
              </div>
              <div className="lg:col-span-8 space-y-6">
                {journeySteps.map((step, index) => (
                  <div key={step.title} className="relative flex gap-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                    <div className="absolute -left-6 top-6 hidden h-full border-l-2 border-dashed border-blue-100 lg:block" />
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{step.detail}</p>
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
                <Button size="lg" variant="secondary" className="gap-2">
                  Join the movement <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white text-white">
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
