import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, CheckCircle, Clock, Shield, Users } from 'lucide-react';

const metrics = [
  { label: 'Average review time', value: '42m' },
  { label: 'Applications processed', value: '21k+' },
  { label: 'Institution partners', value: '85+' },
];

const features = [
  {
    icon: Shield,
    title: 'Clear risk signals',
    description: 'Combine alternative data and standard credit checks into one simple view.',
  },
  {
    icon: Users,
    title: 'Built for lenders and SHGs',
    description: 'Keep the workflow familiar for teams that already verify applicants manually.',
  },
  {
    icon: BarChart3,
    title: 'Easy to understand outputs',
    description: 'Show the score, reason codes, and next step without a crowded dashboard.',
  },
];

const steps = [
  {
    icon: 1,
    title: 'Collect a few inputs',
    description: 'Start with the essentials instead of long forms and dense screens.',
  },
  {
    icon: 2,
    title: 'Review the score',
    description: 'Show a concise scorecard with the key reasons behind the outcome.',
  },
  {
    icon: 3,
    title: 'Move to approval',
    description: 'Send the application forward once the risk picture is clear.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SafeCred</span>
          </div>

          <div className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <a href="#features" className="transition-colors hover:text-blue-600">Features</a>
            <a href="#workflow" className="transition-colors hover:text-blue-600">Workflow</a>
            <a href="#contact" className="transition-colors hover:text-blue-600">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 sm:block">
              Sign in
            </Link>
            <Link to="/register">
              <Button className="rounded-full bg-slate-900 px-5 text-white hover:bg-slate-800">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Simpler lending workflows
              </div>

              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Credit scoring that stays focused on the decision.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                SafeCred gives lenders a clean view of applicant risk using the minimum structure needed to move faster, explain results clearly, and avoid cluttered dashboards.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/register">
                  <Button size="lg" className="h-12 rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700">
                    Start lending <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button size="lg" variant="outline" className="h-12 rounded-full border-slate-300 px-6 text-slate-700 hover:bg-slate-100">
                    View demo
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-2xl font-semibold text-slate-950">{metric.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Application summary</p>
                  <p className="text-lg font-semibold text-slate-950">One card, one decision</p>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Ready to review
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  'Alternative data is grouped into a single score.',
                  'Reason codes stay visible for quick manual checks.',
                  'The interface avoids extra panels and decorative charts.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
                    <div className="mt-0.5 rounded-full bg-blue-50 p-1.5 text-blue-600">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Clock className="h-4 w-4 text-slate-500" />
                  Average turnaround: 42 minutes
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-slate-200 bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Features</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                A smaller interface is easier to trust.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                The goal is not to show everything at once. It is to make the important parts obvious.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-slate-950">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-slate-50 py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Workflow</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Three steps, no extra ceremony.
              </h2>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {steps.map((step) => (
                <article key={step.title} className="rounded-3xl border border-slate-200 bg-white p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-base font-semibold text-white">
                    {step.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-3xl bg-slate-950 px-8 py-12 text-white md:px-12 md:py-14">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">Contact</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Keep the product simple, then scale the workflow.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                    If you want a cleaner lender experience, start with this layout and add only the screens your users actually need.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link to="/register">
                    <Button size="lg" className="h-12 rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100">
                      Get started
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button size="lg" variant="outline" className="h-12 rounded-full border-slate-700 px-6 text-white hover:bg-white hover:text-slate-950">
                      Talk to sales
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SafeCred</p>
          <div className="flex items-center gap-4">
            <a href="#features" className="transition-colors hover:text-slate-900">Features</a>
            <a href="#workflow" className="transition-colors hover:text-slate-900">Workflow</a>
            <a href="#contact" className="transition-colors hover:text-slate-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
