import { Brain, CheckCircle2, ChevronRight, FileCheck, FileWarning, Flashlight, Lightbulb, Smartphone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AIDeepDive() {
  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-blue-400 tracking-wider uppercase mb-1">Beneficiary Deep Dive</p>
          <h1 className="text-3xl font-bold tracking-tight">XAI Profile Analysis</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300 rounded-full h-10 px-6">
            Request Manual Verification
          </Button>
          <Button className="bg-sky-400 hover:bg-sky-500 text-sky-950 font-bold rounded-full h-10 px-6">
            Approve Digital Loan
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#131823] p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
            <img 
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&q=80" 
              alt="Priya Sharma"
              className="h-full w-full object-cover"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-100">Priya Sharma</h2>
              <span className="inline-flex items-center rounded-sm border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-400 uppercase">
                ID Verified
              </span>
            </div>
            <div className="text-sm text-slate-400 space-y-1">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-slate-500" />
                UID: BNY-882-901A
              </div>
              <div className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-slate-500" />
                District 4, North Block
              </div>
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-2">Overall AI Score</p>
          <div className="flex items-baseline justify-end gap-1 mb-2">
            <span className="text-5xl font-bold text-sky-400">84</span>
            <span className="text-xl text-slate-500">/100</span>
          </div>
          <span className="inline-block rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-300">
            Low Risk Profile
          </span>
        </div>
      </div>

      {/* Grid: Explainable AI & Score Breakdown */}
      <div className="grid grid-cols-[3fr_2fr] gap-6">
        
        {/* Explainable AI */}
        <div className="rounded-2xl border border-slate-800 bg-[#131823] p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-slate-800 p-2">
              <Brain className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold">Explainable AI: Why this score?</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Strengths */}
            <div className="rounded-xl border border-blue-500/20 bg-[#0e1219] p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                <h4 className="font-bold text-blue-400">Key Strengths</h4>
              </div>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">▸</span>
                  Consistent mobile recharges over 12 months.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">▸</span>
                  Utility bill payments match declared local averages.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">▸</span>
                  No prior defaults in recorded micro-transactions.
                </li>
              </ul>
            </div>

            {/* Risks */}
            <div className="rounded-xl border border-rose-500/20 bg-[#0e1219] p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileWarning className="h-4 w-4 text-rose-400" />
                <h4 className="font-bold text-rose-400">Identified Risks</h4>
              </div>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 mt-0.5">▸</span>
                  Seasonal income variability detected in Q3.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 mt-0.5">▸</span>
                  Recent anomaly in electricity usage (spike in last 30 days).
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-[#131823] p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Score Breakdown</h3>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Algorithm heavily weights historical repayment behaviors against current consumption markers.
          </p>

          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-300">Repayment History</span>
                <span className="font-bold text-sky-400 text-lg">60%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-sky-400" style={{ width: '60%' }} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-300">Consumption Signals</span>
                <span className="font-bold text-slate-300 text-lg">40%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-slate-500" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Income Verification Layer */}
      <div className="rounded-2xl border border-slate-800 bg-[#131823] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-lg bg-slate-800 p-2">
            <Activity className="h-5 w-5 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold">Income Verification Layer</h3>
        </div>
        <p className="text-sm text-slate-500 ml-12 mb-6">Alternative data sources driving the consumption score.</p>

        <div className="grid grid-cols-3 gap-6 ml-12">
          
          <div className="rounded-xl border border-slate-800 bg-[#0e1219] p-5 relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <h4 className="font-bold text-slate-200">Electricity Usage (kWh)</h4>
              <Flashlight className="h-4 w-4 text-sky-400" />
            </div>
            <p className="text-xs text-slate-500">Consistent band, minor recent spike.</p>
            <div className="absolute -bottom-4 right-4 w-12 h-12 rounded-lg bg-rose-500/20" />
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0e1219] p-5 relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <h4 className="font-bold text-slate-200">Mobile Recharges</h4>
              <Smartphone className="h-4 w-4 text-sky-400" />
            </div>
            <p className="text-xs text-slate-500">Highly stable frequency pattern.</p>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-sky-400/20">
              <div className="h-full bg-sky-400 w-3/4" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0e1219] p-5 relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <h4 className="font-bold text-slate-200">Utility Consistency</h4>
              <ShieldCheck className="h-4 w-4 text-sky-400" />
            </div>
            <p className="text-xs text-slate-500">98% on-time payment rate.</p>
            <div className="absolute -bottom-6 right-6 w-16 h-16 rounded-full border-[3px] border-sky-400 border-t-transparent border-l-transparent rotate-45" />
          </div>

        </div>
      </div>

    </div>
  );
}

// Re-used icon alias just for the "Income Verification Layer" icon to match the screenshot
function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  )
}
