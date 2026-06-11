import { AlertTriangle, BarChart3, ChevronDown, Filter, Search, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RiskRegistry() {
  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Top Section: Header & Quick Stats */}
      <div className="grid grid-cols-[2fr_1fr_1fr] gap-6">
        
        {/* Title Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#131823] p-8 shadow-sm flex flex-col justify-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Beneficiary Risk Registry</h1>
          <p className="text-slate-400 text-sm max-w-md">
            Comprehensive monitoring of lending health and repayment probabilities.
          </p>
        </div>

        {/* Stat Card 1 */}
        <div className="rounded-2xl border border-slate-800 bg-[#131823] p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-bold text-slate-300">High Risk<br/>Exposures</p>
            <AlertTriangle className="h-5 w-5 text-rose-500" />
          </div>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-5xl font-bold text-rose-500">142</span>
            <span className="text-sm text-slate-400 leading-tight">Needs<br/>immediate action</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="rounded-2xl border border-slate-800 bg-[#131823] p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-bold text-slate-300">Average Composite<br/>Score</p>
            <div className="rounded-md border border-sky-500/20 bg-sky-500/10 p-1">
              <BarChart3 className="h-4 w-4 text-sky-400" />
            </div>
          </div>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-5xl font-bold text-slate-100">78.4</span>
            <span className="text-sm font-bold text-sky-400">+2.1%</span>
          </div>
          <p className="mt-1 text-xs font-medium text-sky-400/80">this quarter</p>
        </div>

      </div>

      {/* Filters Section */}
      <div className="rounded-2xl border border-slate-800 bg-[#131823] p-6 shadow-sm">
        <div className="flex items-end gap-4">
          
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-400 mb-2 block">Search Beneficiary</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="ID, Name, or PAN..." 
                className="h-10 w-full rounded-full border border-slate-800 bg-[#0e1219] px-9 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="text-xs font-medium text-slate-400 mb-2 block">State</label>
            <div className="relative">
              <select className="h-10 w-full appearance-none rounded-full border border-slate-800 bg-[#0e1219] px-4 pr-10 text-sm text-slate-300 focus:outline-none focus:border-slate-600 cursor-pointer">
                <option>All States</option>
                <option>Maharashtra</option>
                <option>Tamil Nadu</option>
                <option>Uttar Pradesh</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="w-48">
            <label className="text-xs font-medium text-slate-400 mb-2 block">Caste Category</label>
            <div className="relative">
              <select className="h-10 w-full appearance-none rounded-full border border-slate-800 bg-[#0e1219] px-4 pr-10 text-sm text-slate-300 focus:outline-none focus:border-slate-600 cursor-pointer">
                <option>All Categories</option>
                <option>SC</option>
                <option>ST</option>
                <option>OBC</option>
                <option>Gen</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="w-48">
            <label className="text-xs font-medium text-slate-400 mb-2 block">Income Bracket</label>
            <div className="relative">
              <select className="h-10 w-full appearance-none rounded-full border border-slate-800 bg-[#0e1219] px-4 pr-10 text-sm text-slate-300 focus:outline-none focus:border-slate-600 cursor-pointer">
                <option>All Brackets</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <Button variant="outline" className="h-10 rounded-full border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 gap-2 px-6">
            <Filter className="h-4 w-4" /> More Filters
          </Button>

        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#131823] shadow-sm overflow-hidden flex flex-col">
        <div className="w-full overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-[10px] font-bold tracking-wider text-slate-500 uppercase border-b border-slate-800 bg-[#0e1219]">
                <th className="px-6 py-4 pl-8">Beneficiary ID</th>
                <th className="px-6 py-4">Name & Details</th>
                <th className="px-6 py-4">Composite Score</th>
                <th className="px-6 py-4">Risk Band</th>
                <th className="px-6 py-4">Repayment History</th>
                <th className="px-6 py-4 pr-8 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              
              {/* Row 1 */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-5 pl-8 font-bold text-sky-400 tracking-wide">BEN-8842-MH</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full border border-rose-500/30 bg-rose-500/10 flex items-center justify-center text-rose-400 font-bold text-xs">
                      RK
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 text-base">Rajesh Kumar</div>
                      <div className="text-xs text-slate-500 mt-0.5">Maharashtra • SC</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-lg">
                    42 <TrendingDownIcon className="h-4 w-4" />
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400">
                    High Risk - High Need
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-1.5 rounded-full bg-emerald-500" />
                    <div className="h-4 w-1.5 rounded-full bg-emerald-500" />
                    <div className="h-2 w-1.5 rounded-full bg-rose-500" />
                    <div className="h-2 w-1.5 rounded-full bg-rose-500" />
                    <div className="h-2 w-1.5 rounded-full bg-rose-500" />
                  </div>
                </td>
                <td className="px-6 py-5 pr-8 text-right text-slate-400 text-xs">
                  2 hrs ago
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-5 pl-8 font-bold text-sky-400 tracking-wide">BEN-1093-TN</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      SP
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 text-base">Sita Patel</div>
                      <div className="text-xs text-slate-500 mt-0.5">Tamil Nadu • OBC</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                    88 <TrendingUpIcon className="h-4 w-4" />
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    Low Risk - Target
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-1.5 rounded-full bg-emerald-500" />
                    <div className="h-4 w-1.5 rounded-full bg-emerald-500" />
                    <div className="h-4 w-1.5 rounded-full bg-emerald-500" />
                    <div className="h-4 w-1.5 rounded-full bg-emerald-500" />
                    <div className="h-4 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                </td>
                <td className="px-6 py-5 pr-8 text-right text-slate-400 text-xs">
                  1 day ago
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-5 pl-8 font-bold text-sky-400 tracking-wide">BEN-5521-UP</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-xs">
                      AM
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 text-base">Amit Mishra</div>
                      <div className="text-xs text-slate-500 mt-0.5">Uttar Pradesh • Gen</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-lg">
                    65 <span className="text-amber-500">—</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500">
                    Moderate Risk
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-1.5 rounded-full bg-emerald-500" />
                    <div className="h-2 w-1.5 rounded-full bg-amber-500" />
                    <div className="h-4 w-1.5 rounded-full bg-emerald-500" />
                    <div className="h-2 w-1.5 rounded-full bg-amber-500" />
                    <div className="h-4 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                </td>
                <td className="px-6 py-5 pr-8 text-right text-slate-400 text-xs">
                  3 days ago
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-800">
          <p className="text-xs text-slate-400">Showing 1-3 of 1,248 beneficiaries</p>
          <div className="flex items-center gap-1">
            <button className="h-8 w-8 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-800 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 rounded-full bg-sky-500/20 text-sky-400 font-medium text-xs flex items-center justify-center border border-sky-500/30">
              1
            </button>
            <button className="h-8 w-8 rounded-full border border-slate-800 flex items-center justify-center text-slate-400 font-medium text-xs hover:bg-slate-800 transition-colors">
              2
            </button>
            <button className="h-8 w-8 rounded-full border border-slate-800 flex items-center justify-center text-slate-400 font-medium text-xs hover:bg-slate-800 transition-colors">
              3
            </button>
            <div className="px-2 text-slate-600">...</div>
            <button className="h-8 w-8 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-800 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

function TrendingDownIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  )
}

function TrendingUpIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}
