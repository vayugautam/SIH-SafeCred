import React, { useState, useRef } from 'react';
import { 
  FileText, Clock, RefreshCw, Calendar, Image as ImageIcon,
  TrendingUp, Activity, PieChart as PieChartIcon, BarChart2, Layers
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, ReferenceLine,
  PieChart, Pie, Cell,
  Sankey
} from 'recharts';
import html2canvas from 'html2canvas';

// =========================================================================
// MOCK DATA FOR 6 RECHARTS MODULES
// =========================================================================

const scoreTrendData = [
  { month: 'Jan', national: 510, state: 505, district: 480 },
  { month: 'Feb', national: 515, state: 520, district: 490 },
  { month: 'Mar', national: 512, state: 525, district: 530 },
  { month: 'Apr', national: 520, state: 530, district: 580 },
  { month: 'May', national: 525, state: 535, district: 610 },
  { month: 'Jun', national: 530, state: 540, district: 640 },
];

const sankeyData = {
  nodes: [
    { name: 'Band A (Prev)' }, { name: 'Band B (Prev)' }, { name: 'Band C (Prev)' }, { name: 'Band D (Prev)' }, { name: 'Band E (Prev)' },
    { name: 'Band A (Now)' }, { name: 'Band B (Now)' }, { name: 'Band C (Now)' }, { name: 'Band D (Now)' }, { name: 'Band E (Now)' },
  ],
  links: [
    { source: 0, target: 5, value: 400 }, // A -> A
    { source: 1, target: 5, value: 50 },  // B -> A (Upgrade)
    { source: 1, target: 6, value: 300 }, // B -> B
    { source: 2, target: 6, value: 80 },  // C -> B (Upgrade)
    { source: 2, target: 7, value: 200 }, // C -> C
    { source: 3, target: 7, value: 120 }, // D -> C (Upgrade)
    { source: 3, target: 8, value: 150 }, // D -> D
    { source: 4, target: 8, value: 60 },  // E -> D (Upgrade)
    { source: 4, target: 9, value: 100 }, // E -> E
  ]
};

const repaymentCohortData = [
  { month: '2025-Q4', onTime: 85, grace: 10, default: 5 },
  { month: '2026-Q1', onTime: 88, grace: 9, default: 3 },
  { month: '2026-Q2', onTime: 92, grace: 6, default: 2 },
];

const incomeDonutData = [
  { name: 'EWS', value: 4500 },
  { name: 'LIG', value: 3200 },
  { name: 'MIG-I', value: 1500 },
  { name: 'MIG-II', value: 600 },
  { name: 'HIG', value: 200 },
];
const INCOME_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#8B5CF6'];

const processingTimeData = [
  { week: 'W1', hours: 48 },
  { week: 'W2', hours: 36 },
  { week: 'W3', hours: 28 },
  { week: 'W4', hours: 22 },
  { week: 'W5', hours: 18 },
];

const featureRankData = [
  { feature: 'EMI Hit Rate', shap: 0.85 },
  { feature: 'Electricity Bill', shap: 0.72 },
  { feature: 'DPD Avg', shap: 0.65 },
  { feature: 'Mobile Freq', shap: 0.58 },
  { feature: 'Account Age', shap: 0.42 },
].sort((a, b) => a.shap - b.shap);

const dataTable = [
  { month: 'June 2026', newBenes: 1240, rescores: 5430, upgrades: 850, downgrades: 120, disbursed: '₹ 4.2 Cr' },
  { month: 'May 2026', newBenes: 1100, rescores: 4800, upgrades: 620, downgrades: 150, disbursed: '₹ 3.8 Cr' },
  { month: 'April 2026', newBenes: 950, rescores: 4100, upgrades: 510, downgrades: 180, disbursed: '₹ 3.1 Cr' },
];

// =========================================================================
// ANALYTICS HUB COMPONENT
// =========================================================================

export default function AnalyticsHubPage() {
  const [dateRange, setDateRange] = useState('Last 90 Days');
  
  // Refs for PNG Export
  const trendRef = useRef(null);
  const sankeyRef = useRef(null);
  const cohortRef = useRef(null);
  const incomeRef = useRef(null);
  const processRef = useRef(null);
  const featureRef = useRef(null);

  const exportChart = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref.current) return;
    try {
      const canvas = await html2canvas(ref.current, { backgroundColor: '#FFFFFF' });
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const ChartHeader = ({ title, icon: Icon, chartRef, filename }: any) => (
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-bold text-slate-800 flex items-center">
        <Icon className="w-5 h-5 mr-2 text-blue-600" /> {title}
      </h3>
      <button 
        onClick={() => exportChart(chartRef, filename)}
        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition flex items-center text-xs font-bold"
        title="Export Chart as PNG"
      >
        <ImageIcon className="w-4 h-4 mr-1" /> Export
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. TOP HEADER & GLOBAL FILTERS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Analytics & Reports Hub</h2>
          <p className="text-sm text-slate-500 mt-1">Platform-wide algorithmic lending performance and demographic intelligence.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-slate-500 mr-2" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>Last 12 Months</option>
            </select>
          </div>
          
          <button className="flex items-center text-sm font-bold text-slate-700 bg-white border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
          
          <button className="flex items-center text-sm font-bold text-white bg-[#0D9488] px-4 py-2 rounded-lg hover:bg-teal-700 transition shadow-sm">
            <Clock className="w-4 h-4 mr-2" /> Schedule
          </button>
          
          <button className="flex items-center text-sm font-bold text-white bg-[#2563EB] px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
            <FileText className="w-4 h-4 mr-2" /> Generate Report PDF
          </button>
        </div>
      </div>

      {/* 2. MAIN CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Score Trend Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" ref={trendRef}>
          <ChartHeader title="CCS Trend Analysis" icon={TrendingUp} chartRef={trendRef} filename="score_trend" />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis domain={[400, 700]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <RechartsTooltip cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                <Line name="National Avg" type="monotone" dataKey="national" stroke="#2563EB" strokeWidth={3} dot={false} />
                <Line name="State Avg" type="monotone" dataKey="state" stroke="#0D9488" strokeWidth={3} dot={false} />
                <Line name="District Avg" type="monotone" dataKey="district" stroke="#D97706" strokeWidth={3} dot={{r:4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Processing Time Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" ref={processRef}>
          <ChartHeader title="App Processing SLA (Hours)" icon={Activity} chartRef={processRef} filename="processing_time" />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processingTimeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <RechartsTooltip cursor={{fill: '#F8FAFC'}} />
                <ReferenceLine y={24} stroke="#DC2626" strokeDasharray="5 5" label={{ position: 'top', value: '24h Target', fill: '#DC2626', fontSize: 10, fontWeight: 'bold' }} />
                <Bar dataKey="hours" fill="#16A34A" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Band Migration Sankey */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" ref={sankeyRef}>
          <ChartHeader title="Risk Band Migration (MoM)" icon={Layers} chartRef={sankeyRef} filename="band_migration" />
          <p className="text-xs text-slate-500 mb-4 -mt-4">Visualizing beneficiaries transitioning out of High-Risk bands.</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={sankeyData}
                node={{ stroke: '#fff', strokeWidth: 2 }}
                nodePadding={20}
                margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
                link={{ stroke: '#cbd5e1' }}
              >
                <RechartsTooltip />
              </Sankey>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income Distribution Donut */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" ref={incomeRef}>
          <ChartHeader title="Demographic: Income Proxy" icon={PieChartIcon} chartRef={incomeRef} filename="income_dist" />
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeDonutData}
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {incomeDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
            {/* Donut Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-2xl font-black text-slate-800">10k</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total</span>
            </div>
          </div>
        </div>

        {/* Repayment Cohort Stacked Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" ref={cohortRef}>
          <ChartHeader title="Repayment Quality Cohorts" icon={BarChart2} chartRef={cohortRef} filename="repayment_cohort" />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repaymentCohortData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <RechartsTooltip cursor={{fill: '#F8FAFC'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                <Bar name="On-Time (%)" dataKey="onTime" stackId="a" fill="#16A34A" />
                <Bar name="Grace Period (%)" dataKey="grace" stackId="a" fill="#D97706" />
                <Bar name="Default (%)" dataKey="default" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Feature Importance */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" ref={featureRef}>
          <ChartHeader title="Global SHAP Importance" icon={Activity} chartRef={featureRef} filename="feature_importance" />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={featureRankData} margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#475569'}} width={100} />
                <RechartsTooltip cursor={{fill: '#F8FAFC'}} />
                <Bar name="Mean |SHAP|" dataKey="shap" fill="#7C3AED" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. EXPORTABLE DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Monthly Operational Grid</h3>
            <p className="text-sm text-slate-500 mt-1">Detailed breakdown of platform activity.</p>
          </div>
          <button className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition">
            Export Complete Grid <FileText className="w-4 h-4 ml-1.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4">New Beneficiaries</th>
                <th className="px-6 py-4">Total Re-Scored</th>
                <th className="px-6 py-4 text-green-700">Band Upgrades</th>
                <th className="px-6 py-4 text-red-700">Band Downgrades</th>
                <th className="px-6 py-4">Capital Disbursed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataTable.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">{row.month}</td>
                  <td className="px-6 py-4 font-mono text-slate-600">{row.newBenes.toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono text-slate-600">{row.rescores.toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono font-bold text-green-600 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> {row.upgrades}</td>
                  <td className="px-6 py-4 font-mono font-bold text-red-600">{row.downgrades}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{row.disbursed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
