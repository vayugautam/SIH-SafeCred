import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Banknote, AlertCircle, RefreshCw, Download, Calendar, ExternalLink, ChevronRight, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';

// =========================================================================
// REALISTIC MOCK DATA (NBCFDC Context)
// =========================================================================

const defaultBandData = [
  { band: 'A', count: 1250, color: '#10B981' }, // Emerald
  { band: 'B', count: 3420, color: '#3B82F6' }, // Blue
  { band: 'C', count: 2150, color: '#D97706' }, // Gold
  { band: 'D', count: 850, color: '#F97316' }, // Orange
  { band: 'E', count: 320, color: '#EF4444' },  // Red
];

const histogramData = [
  { range: '300-400', count: 120 },
  { range: '400-500', count: 450 },
  { range: '500-600', count: 1800 },
  { range: '600-700', count: 2900 },
  { range: '700-800', count: 2100 },
  { range: '800-900', count: 850 },
  { range: '900-1000', count: 150 },
];

const recentApps = [
  { id: 'APP-92841', name: 'Vikram Singh', band: 'B', score: 685, amt: '₹ 1,50,000', scheme: 'Shilp Sampada', status: 'Approved', date: '10 mins ago' },
  { id: 'APP-92842', name: 'Anjali Sharma', band: 'A', score: 812, amt: '₹ 3,00,000', scheme: 'Term Loan', status: 'Approved', date: '25 mins ago' },
  { id: 'APP-92843', name: 'Mohammed Tariq', band: 'D', score: 430, amt: '₹ 50,000', scheme: 'Micro Finance', status: 'Review', date: '1 hr ago' },
  { id: 'APP-92844', name: 'Priya Deshmukh', band: 'C', score: 560, amt: '₹ 1,00,000', scheme: 'Mahila Samriddhi', status: 'Pending', date: '2 hrs ago' },
  { id: 'APP-92845', name: 'Raju Gounder', band: 'E', score: 310, amt: '₹ 2,00,000', scheme: 'Term Loan', status: 'Rejected', date: '3 hrs ago' },
];

const activityFeed = [
  { id: 1, initials: 'SYS', text: 'Drift detected in alternative data income model. Accuracy drop 4.2%.', time: '10:45 AM', type: 'alert' },
  { id: 2, initials: 'ML', text: 'APP-92841 auto-scored: Assigned Band B (SHAP generated).', time: '10:30 AM', type: 'info' },
  { id: 3, initials: 'API', text: 'Digilocker KYC verified successfully for Anjali Sharma.', time: '09:15 AM', type: 'success' },
  { id: 4, initials: 'SYS', text: 'Nightly bulk re-score completed (12,450 records processed).', time: '04:00 AM', type: 'info' },
];

// =========================================================================
// DASHBOARD COMPONENT
// =========================================================================

export default function DashboardPage() {
  const { user } = useAuthStore();
  const today = format(new Date(), 'EEEE, MMMM do yyyy');

  // Server state
  const [summary, setSummary] = useState({ total_loans: 12540, total_disbursed_paise: 8400000000 }); // ₹8.4 Cr default mock
  const [bandData, setBandData] = useState(defaultBandData);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumRes, bandRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/bands/distribution')
        ]);
        
        if (sumRes.data?.data) {
          setSummary(sumRes.data.data);
        }

        if (bandRes.data?.data?.bands) {
          const apiBands = bandRes.data.data.bands;
          const mappedBands = [
            { band: 'A', count: apiBands.A || 0, color: '#10B981' },
            { band: 'B', count: apiBands.B || 0, color: '#3B82F6' },
            { band: 'C', count: apiBands.C || 0, color: '#D97706' },
            { band: 'D', count: apiBands.D || 0, color: '#F97316' },
            { band: 'E', count: apiBands.E || 0, color: '#EF4444' },
          ];
          setBandData(mappedBands);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. GREETING BAR */}
      <div className="glass rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#D97706]/10 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Welcome back, <span className="text-gradient">{user?.username || 'Officer'}</span>
          </h2>
          <p className="text-slate-500 mt-2 font-medium">{today} — NBCFDC SafeCred Admin Panel</p>
        </div>
        <div className="flex gap-4 mt-6 md:mt-0 relative z-10">
          <button className="flex items-center text-sm font-semibold text-slate-700 bg-white/80 px-5 py-2.5 rounded-xl hover:bg-white transition border border-slate-200 shadow-sm">
            <Download className="w-4 h-4 mr-2 text-slate-500" /> Export Report
          </button>
          <button className="flex items-center text-sm font-semibold text-white bg-gradient-to-r from-[#0A192F] to-[#1E3A5F] px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-900/20 transition-all">
            <RefreshCw className="w-4 h-4 mr-2" /> Sync Data
          </button>
        </div>
      </div>

      {/* 2. KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Applications Scored" 
          value={summary.total_loans.toLocaleString()} 
          bg="bg-white" 
          iconBg="bg-blue-50" 
          iconColor="text-blue-600" 
          Icon={Users} 
          badge="+12% from last month" 
          badgeColor="text-blue-600" 
        />
        <KPICard 
          title="Disbursed (Lakhs)" 
          value={`₹ ${(summary.total_disbursed_paise / 10000000).toFixed(2)}`} 
          bg="bg-white" 
          iconBg="bg-emerald-50" 
          iconColor="text-emerald-600" 
          Icon={TrendingUp} 
          badge="Live from API" 
          badgeColor="text-emerald-600" 
        />
        <KPICard 
          title="Disbursals Today" 
          value="142" 
          bg="bg-white" 
          iconBg="bg-amber-50" 
          iconColor="text-amber-600" 
          Icon={Banknote} 
          badge="85% in Band A & B" 
          badgeColor="text-amber-600" 
        />
        <KPICard 
          title="Pending Manual Reviews" 
          value="38" 
          bg="bg-white" 
          iconBg="bg-red-50" 
          iconColor="text-red-600" 
          Icon={AlertCircle} 
          badge="Requires Officer Action" 
          badgeColor="text-red-500" 
        />
      </div>

      {/* 3. CHARTS ROW */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Band Distribution */}
        <div className="w-full lg:w-[60%] glass p-8 rounded-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Risk Band Distribution</h3>
              <p className="text-sm text-slate-500 font-medium">Real-time classification by ML Pipeline</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-600 rounded-lg px-3 py-1.5 focus:outline-none">
              <option>All Schemes</option>
              <option>Term Loan</option>
              <option>Mahila Samriddhi</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="band" axisLine={false} tickLine={false} tick={{fontWeight: 600, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontWeight: 500, fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}/>
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {bandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Score Histogram */}
        <div className="w-full lg:w-[40%] glass p-8 rounded-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Score Histogram</h3>
              <p className="text-sm text-slate-500 font-medium">Population density</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="range" tick={{fontSize: 11, fontWeight: 500, fill: '#94a3b8'}} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 500, fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0'}}/>
                <ReferenceLine x="400-500" stroke="#DC2626" strokeDasharray="3 3" label={{ position: 'top', value: '450 Cutoff', fill: '#DC2626', fontSize: 12, fontWeight: 600 }} />
                <Bar dataKey="count" fill="#0A192F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: TABLES & ACTIVITY */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Recent Applications */}
        <div className="w-full lg:w-3/5 glass rounded-2xl overflow-hidden flex flex-col border border-slate-200">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
            <h3 className="text-lg font-bold text-slate-800">Recent Applications</h3>
            <Link to="/lending" className="text-sm font-semibold text-[#D97706] hover:text-[#B45309] flex items-center transition-colors">
              View Lending Queue <ExternalLink className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Applicant</th>
                  <th className="px-6 py-4">Scheme</th>
                  <th className="px-6 py-4">Risk Band</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/40">
                {recentApps.map((app, i) => (
                  <tr key={i} className="hover:bg-white/80 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{app.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{app.id}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">{app.scheme}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${getBandColor(app.band)}`}>
                          {app.band}
                        </span>
                        <span className="text-slate-600 font-semibold">{app.score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{app.amt}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="w-full lg:w-2/5 glass rounded-2xl flex flex-col border border-slate-200">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-slate-500" /> System Events
            </h3>
            <Link to="/audit" className="text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center transition">
              View Audit Log <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="p-6 flex-1 bg-white/40">
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
              {activityFeed.map((item, i) => (
                <div key={i} className="relative pl-6">
                  <div className={`absolute -left-3 top-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold shadow-sm ${getEventIconColor(item.type)}`}>
                    {item.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{item.text}</p>
                    <p className="text-xs font-medium text-slate-400 mt-1.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// =========================================================================
// HELPER COMPONENTS & UTILS
// =========================================================================

function KPICard({ title, value, bg, iconBg, iconColor, Icon, badge, badgeColor }: any) {
  return (
    <div className={`glass rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`${iconBg} p-3 rounded-xl shadow-inner`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</h3>
        <p className="text-sm font-semibold text-slate-500 mt-1">{title}</p>
        <p className={`text-xs mt-3 font-bold ${badgeColor}`}>{badge}</p>
      </div>
    </div>
  );
}

function getBandColor(band: string) {
  switch(band) {
    case 'A': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'B': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'C': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'D': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'E': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function getStatusColor(status: string) {
  switch(status) {
    case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'Review': return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'Pending': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'Rejected': return 'bg-red-50 text-red-600 border-red-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

function getEventIconColor(type: string) {
  switch(type) {
    case 'alert': return 'bg-red-100 text-red-600';
    case 'success': return 'bg-emerald-100 text-emerald-600';
    case 'info': return 'bg-blue-100 text-blue-600';
    default: return 'bg-slate-100 text-slate-600';
  }
}
