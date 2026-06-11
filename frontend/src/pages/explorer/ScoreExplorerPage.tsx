import React, { useState } from 'react';
import { 
  Search, Zap, FileText, ChevronDown, RotateCcw, 
  Activity, Users, Calculator
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';

// =========================================================================
// MOCK DATA
// =========================================================================

const historyData = [
  { date: '2025-10', score: 420 },
  { date: '2025-11', score: 450 },
  { date: '2025-12', score: 480 },
  { date: '2026-01', score: 550 },
  { date: '2026-02', score: 600 },
  { date: '2026-03', score: 620 },
  { date: '2026-04', score: 680 }, // Current
];

const featureImportanceData = [
  { feature: 'EMI Hit Rate', shap: 120 },
  { feature: 'Electricity Bill Amt', shap: 85 },
  { feature: 'Days Past Due (Avg)', shap: 75 },
  { feature: 'Mobile Recharge Freq', shap: 62 },
  { feature: 'Credit Utilization', shap: 45 },
  { feature: 'Account Age (Months)', shap: 38 },
  { feature: 'Digital Literacy Score', shap: 32 },
  { feature: 'Dependency Ratio', shap: 28 },
  { feature: 'Recent Inquiries', shap: 22 },
  { feature: 'Repayment Consistency', shap: 18 },
  { feature: 'Savings Balance', shap: 15 },
  { feature: 'Utility Bounce Rate', shap: 12 },
  { feature: 'Location Risk Proxy', shap: 10 },
  { feature: 'Job Stability Proxy', shap: 8 },
  { feature: 'Loan to Income Est', shap: 5 },
].sort((a, b) => a.shap - b.shap); // Recharts horizontal needs bottom-up sorting

const radarData = [
  { subject: 'Repayment', beneficiary: 80, peerGroup: 60 },
  { subject: 'Income', beneficiary: 45, peerGroup: 55 },
  { subject: 'SEI', beneficiary: 70, peerGroup: 40 },
  { subject: 'Regularity', beneficiary: 90, peerGroup: 65 },
  { subject: 'Utilisation', beneficiary: 30, peerGroup: 75 },
  { subject: 'Profile', beneficiary: 85, peerGroup: 50 },
];

const breakdownTable = [
  { group: 'Repayment History', subScore: '320 / 400', weight: '40%', contribution: '+85 pts', status: 'Excellent' },
  { group: 'Income Proxy (Bayesian)', subScore: '150 / 300', weight: '30%', contribution: '+12 pts', status: 'Average' },
  { group: 'Socioeconomic Indices', subScore: '160 / 200', weight: '20%', contribution: '+45 pts', status: 'Good' },
  { group: 'Credit Utilization', subScore: '50 / 100', weight: '10%', contribution: '-10 pts', status: 'Warning' },
];

// =========================================================================
// SCORE EXPLORER COMPONENT
// =========================================================================

export default function ScoreExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('BEN-004521');
  const [emiSlider, setEmiSlider] = useState(85);
  const [dpdSlider, setDpdSlider] = useState(5);
  const [elecSlider, setElecSlider] = useState(450);

  const resetSimulator = () => {
    setEmiSlider(85);
    setDpdSlider(5);
    setElecSlider(450);
  };

  // Simulating score change visually based on sliders
  const simulatedScoreOffset = Math.round(((emiSlider - 85) * 2) - ((dpdSlider - 5) * 5) + ((elecSlider - 450) * 0.1));
  const currentScore = 680;
  const simulatedScore = Math.min(1000, Math.max(0, currentScore + simulatedScoreOffset));

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. HEADER & SEARCH BAR */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center w-full md:w-1/2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by NBCFDC ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-l-lg font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <button className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-r-lg border border-[#2563EB] transition shadow-sm flex items-center">
            Load Score
          </button>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center text-sm font-bold text-white bg-[#EA580C] px-5 py-3 rounded-lg hover:bg-orange-700 transition shadow-sm">
            <Zap className="w-4 h-4 mr-2" /> Run Full Re-Score
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center text-sm font-bold text-white bg-[#0D9488] px-5 py-3 rounded-lg hover:bg-teal-700 transition shadow-sm">
            <FileText className="w-4 h-4 mr-2" /> Export PDF
          </button>
        </div>
      </div>

      {/* 2. TOP GRID: HISTORY & SIMULATOR */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Score History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" /> Score Trajectory
            </h3>
            <span className="text-sm font-semibold text-slate-500">Current: <span className="text-blue-600 font-bold text-lg">{currentScore}</span></span>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis domain={[0, 1000]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <RechartsTooltip cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5'}} />
                <ReferenceLine y={450} stroke="#DC2626" strokeDasharray="3 3" label={{ position: 'top', value: 'Approval Cutoff', fill: '#DC2626', fontSize: 10 }} />
                <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={4} dot={{r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Simulator */}
        <div className="bg-[#EFF6FF] rounded-xl shadow-sm border border-blue-200 p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 rounded-full -translate-y-10 translate-x-10"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-blue-600" /> Interactive Simulator
            </h3>
            <button onClick={resetSimulator} className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center transition bg-white px-3 py-1.5 rounded shadow-sm border border-red-100">
              <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
            </button>
          </div>

          <div className="flex-1 space-y-6 relative z-10">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-slate-700">EMI Hit Rate (%)</label>
                <span className="text-sm font-mono font-bold text-blue-700">{emiSlider}%</span>
              </div>
              <input type="range" min="0" max="100" value={emiSlider} onChange={(e) => setEmiSlider(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-slate-700">Days Past Due (DPD Avg)</label>
                <span className="text-sm font-mono font-bold text-blue-700">{dpdSlider} days</span>
              </div>
              <input type="range" min="0" max="90" value={dpdSlider} onChange={(e) => setDpdSlider(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-slate-700">Electricity Bill (Monthly ₹)</label>
                <span className="text-sm font-mono font-bold text-blue-700">₹{elecSlider}</span>
              </div>
              <input type="range" min="0" max="2000" step="50" value={elecSlider} onChange={(e) => setElecSlider(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-blue-200 flex justify-between items-end relative z-10">
            <div>
              <p className="text-sm text-slate-600 font-medium">Simulated Outcome</p>
              <p className="text-xs text-slate-500 mt-0.5">If behaviors improve to this level</p>
            </div>
            <div className="text-right">
              <span className={`text-4xl font-extrabold ${simulatedScore >= currentScore ? 'text-green-600' : 'text-red-600'}`}>
                {simulatedScore}
              </span>
              <span className="text-sm font-bold text-slate-500 ml-1">/ 1000</span>
              <div className={`text-xs font-bold mt-1 ${simulatedScore >= currentScore ? 'text-green-600' : 'text-red-600'}`}>
                {simulatedScore - currentScore >= 0 ? '+' : ''}{simulatedScore - currentScore} pts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE GRID: FEATURE IMPORTANCE & RADAR */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Top 15 Feature Importance */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Global Feature Importance (SHAP)</h3>
            <button className="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition flex items-center">
              Top 15 <ChevronDown className="w-3 h-3 ml-1" />
            </button>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={featureImportanceData} margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#475569'}} width={130} />
                <RechartsTooltip cursor={{fill: '#F8FAFC'}} />
                <Bar dataKey="shap" fill="#7C3AED" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button className="mt-4 w-full flex items-center justify-center text-sm font-medium text-slate-600 hover:bg-slate-50 py-2 rounded transition">
            Show All 45 Features <ChevronDown className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Peer Comparison Radar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" /> Peer Comparison
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">Benchmarked against Band B median profiles</p>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#475569', fontSize: 12, fontWeight: 600}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="This Beneficiary" dataKey="beneficiary" stroke="#2563EB" fill="#2563EB" fillOpacity={0.5} />
                <Radar name="Peer Average (Band B)" dataKey="peerGroup" stroke="#0D9488" fill="#0D9488" fillOpacity={0.3} />
                <Legend wrapperStyle={{fontSize: '12px', marginTop: '10px'}} />
                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM: SCORE BREAKDOWN TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h3 className="text-lg font-bold text-slate-800">Mathematical Score Breakdown</h3>
          <p className="text-sm text-slate-500 mt-1">Detailed weights and module-level contributions to the final CCS.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Feature Group</th>
                <th className="px-6 py-4">Sub-Score</th>
                <th className="px-6 py-4">Engine Weight</th>
                <th className="px-6 py-4">Net Contribution</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {breakdownTable.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">{row.group}</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-600">{row.subScore}</td>
                  <td className="px-6 py-4 text-blue-600 font-bold">{row.weight}</td>
                  <td className="px-6 py-4 font-mono text-slate-700">{row.contribution}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      row.status === 'Excellent' ? 'bg-green-50 text-green-700 border-green-200' :
                      row.status === 'Good' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      row.status === 'Average' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td className="px-6 py-4 font-extrabold text-slate-900 uppercase">Total Composite Score</td>
                <td className="px-6 py-4 font-mono font-extrabold text-slate-900">680 / 1000</td>
                <td className="px-6 py-4 text-slate-400 font-bold">100%</td>
                <td className="px-6 py-4 font-mono text-slate-900 font-bold">+132 pts total</td>
                <td className="px-6 py-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
