import { Building2, Download, Gauge, PieChart, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Overview</h1>
          <p className="text-slate-400 mt-1">Real-time metrics and geographic distribution of the lending portfolio.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-slate-700/50 bg-[#131823] px-4 py-2 text-sm font-medium text-slate-300">
            <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            Live Data
          </div>
          <Button variant="outline" className="border-slate-700/50 bg-[#131823] hover:bg-slate-800 text-slate-300 rounded-full h-10 px-6 gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="rounded-2xl border border-slate-800 bg-[#131823] p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-400">Total Sanctioned</p>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold">₹4,250</span>
            <span className="text-lg text-slate-400">Cr</span>
          </div>
          <div className="mt-4 inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
            ↗ +12.5% vs last month
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-slate-800 bg-[#131823] p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-400">Avg Composite<br/>Score</p>
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300">
              <Gauge className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold">82</span>
            <span className="text-lg text-slate-500">/100</span>
          </div>
          <div className="mt-4 inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
            ↗ +2 pts improvement
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-slate-800 bg-[#131823] p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-400">Total Beneficiaries</p>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold">124,592</span>
          </div>
          <div className="mt-4 text-xs font-medium text-slate-500">
            Across 28 states
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-slate-800 bg-[#131823] p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-400">Risk Distribution</p>
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-8 flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="bg-blue-400" style={{ width: '70%' }} />
            <div className="bg-slate-700" style={{ width: '20%' }} />
            <div className="bg-rose-500" style={{ width: '10%' }} />
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="h-2 w-2 rounded-full bg-blue-400" /> 70% Low
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <div className="h-2 w-2 rounded-full bg-rose-500" /> 10% High
            </div>
          </div>
        </div>

      </div>

      {/* Middle Section: Charts */}
      <div className="grid grid-cols-[2fr_1fr] gap-6">
        
        {/* Map Placeholder */}
        <div className="rounded-2xl border border-slate-800 bg-[#131823] p-6 shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold">Risk Distribution Map</h3>
          
          <div className="mt-6 flex-1 rounded-xl border border-slate-800/50 bg-[#0e1219] p-4 relative overflow-hidden flex items-center justify-center">
            <span className="text-slate-500 text-sm">Geographical map showing risk density across states</span>
            
            <div className="absolute bottom-6 left-6 rounded-xl border border-slate-800 bg-[#131823]/90 backdrop-blur p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Risk Density</p>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-sm bg-rose-500" /> High Risk
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-sm bg-slate-600" /> Medium Risk
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-sm bg-blue-400" /> Low Risk
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scoring Trends */}
        <div className="rounded-2xl border border-slate-800 bg-[#131823] p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold">Scoring Trends</h3>
          
          <div className="mt-8 flex-1 flex items-end gap-4 relative">
            {/* Chart Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-600 pb-8 border-l border-b border-slate-800">
              <span className="absolute top-0 -left-6">100</span>
              <span className="absolute top-[48%] -left-4">50</span>
              <span className="absolute bottom-6 -left-3">0</span>
            </div>

            {/* Bars */}
            <div className="flex-1 flex justify-around items-end h-[85%] pb-8 pl-4 z-10 gap-2">
              <div className="w-10 rounded-t-lg bg-slate-800/80 border border-slate-700 border-b-0 h-[45%] relative">
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-slate-500">Q1</span>
              </div>
              <div className="w-10 rounded-t-lg bg-slate-800/80 border border-slate-700 border-b-0 h-[48%] relative">
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-slate-500">Q2</span>
              </div>
              <div className="w-10 rounded-t-lg bg-slate-800/80 border border-slate-700 border-b-0 h-[55%] relative">
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-slate-500">Q3</span>
              </div>
              <div className="w-10 rounded-t-lg bg-slate-800/80 border border-slate-700 border-b-0 h-[65%] relative">
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-slate-500">Q4</span>
              </div>
              <div className="w-10 rounded-t-lg bg-gradient-to-t from-blue-500 to-sky-400 h-[75%] relative">
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-bold text-blue-400">Now</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#131823] shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold">Recent Digital Approvals</h3>
          <button className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-[10px] font-bold tracking-wider text-slate-500 uppercase border-b border-slate-800 bg-[#0e1219]">
                <th className="px-6 py-4">Application ID</th>
                <th className="px-6 py-4">Beneficiary</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">AI Score</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-5 text-blue-400 font-medium">APP-8829-X</td>
                <td className="px-6 py-5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-400">
                    RK
                  </div>
                  <span className="font-medium text-slate-200">Ramesh Kumar</span>
                </td>
                <td className="px-6 py-5 font-medium text-slate-200">₹50,000</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-400">92</span>
                    <div className="h-1 w-16 rounded-full bg-slate-800">
                      <div className="h-1 rounded-full bg-blue-400" style={{ width: '92%' }} />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-300">
                    Approved
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
