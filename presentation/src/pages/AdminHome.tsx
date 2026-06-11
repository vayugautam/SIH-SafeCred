import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Users, TrendingUp, Banknote, AlertCircle, RefreshCw, ExternalLink, ChevronRight, Download, Calendar } from 'lucide-react';
import apiClient from '../api/axios';
import useAuthStore from '../store/authStore';

export const AdminHome = () => {
  const { role } = useAuthStore();
  
  // State
  const [summary, setSummary] = useState({ total_scored: 0, avg_score: 0, disbursals_today: 0, pending_reviews: 0 });
  const [bandData, setBandData] = useState([]);
  const [histogramData, setHistogramData] = useState([]);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  
  // Band Colors
  const COLORS = {
    'Band A': '#16A34A', // Green
    'Band B': '#2563EB', // Blue
    'Band C': '#D97706', // Amber
    'Band D': '#EA580C', // Orange
    'Band E': '#DC2626'  // Red
  };

  useEffect(() => {
    // 1. Fetch KPIs
    apiClient.get('/dashboard/summary').then(res => setSummary(res.data)).catch(console.error);
    
    // 2. Fetch Charts Data
    apiClient.get('/dashboard/bands/distribution').then(res => setBandData(res.data)).catch(console.error);
    apiClient.get('/dashboard/score/histogram').then(res => setHistogramData(res.data)).catch(console.error);
    
    // 3. Fetch Recent Applications
    apiClient.get('/lending?limit=10&sort=applied_at').then(res => setRecentApps(res.data.data || [])).catch(console.error);

    // 4. WebSocket Activity Feed
    const ws = new WebSocket('ws://localhost:8000/api/v1/dashboard/ws/activity');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ACTIVITY_UPDATE') {
        setActivityFeed(data.data);
      }
    };
    
    return () => ws.close();
  }, []);

  const handleExportPDF = async () => {
    try {
      await apiClient.get('/dashboard/export');
      alert("PDF Export triggered successfully (Stub).");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans bg-[#F1F5F9] min-h-screen pb-10">
      
      {/* GREETING BAR */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">
            Good Morning, {role === 'ADMIN' ? 'Admin' : 'Officer'} — Here is today’s summary
          </h1>
          <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E] transition font-medium text-sm shadow-sm">
            <Download size={16} /> Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition font-medium text-sm shadow-sm">
            <RefreshCw size={16} /> Trigger Re-Score All
          </button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] relative overflow-hidden group">
          <div className="w-12 h-12 bg-[#EFF6FF] rounded-full flex items-center justify-center mb-4">
            <Users className="text-[#2563EB]" size={24} />
          </div>
          <h3 className="text-[32px] font-bold text-[#1E293B] leading-tight">{summary.total_scored.toLocaleString()}</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Total Beneficiaries Scored</p>
          <span className="inline-block mt-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">+12% vs yesterday</span>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] relative overflow-hidden">
          <div className="w-12 h-12 bg-[#F0FDF4] rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="text-[#16A34A]" size={24} />
          </div>
          <h3 className="text-[32px] font-bold text-[#1E293B] leading-tight">{summary.avg_score}</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Average Composite Score</p>
          <span className="inline-block mt-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">+5 pts vs last month</span>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] relative overflow-hidden">
          <div className="w-12 h-12 bg-[#FFFBEB] rounded-full flex items-center justify-center mb-4">
            <Banknote className="text-[#D97706]" size={24} />
          </div>
          <h3 className="text-[32px] font-bold text-[#1E293B] leading-tight">{summary.disbursals_today}</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Disbursals Today</p>
          <span className="inline-block mt-3 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md">80% of Band A</span>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] relative overflow-hidden border-b-4 border-[#DC2626]">
          <div className="w-12 h-12 bg-[#FEF2F2] rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="text-[#DC2626]" size={24} />
          </div>
          <h3 className="text-[32px] font-bold text-[#1E293B] leading-tight">{summary.pending_reviews}</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Pending Manual Reviews</p>
          <span className={`inline-block mt-3 px-2 py-1 text-xs font-bold rounded-md ${summary.pending_reviews > 20 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
            Requires Attention
          </span>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left 60%: Band Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] lg:w-[60%] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#1E293B]">Band Distribution</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#F1F5F9] text-[#1E293B] rounded hover:bg-slate-200 text-sm font-medium">
              <Calendar size={14} /> This Week
            </button>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {bandData.map((entry: any, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94A3B8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 40%: Score Histogram */}
        <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] lg:w-[40%] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#1E293B]">Score Histogram (0-1000)</h3>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#7C3AED" radius={[2, 2, 0, 0]} />
                <ReferenceLine x="300" stroke="#DC2626" strokeDasharray="3 3" label={{ position: 'top', value: 'Cutoff', fill: '#DC2626', fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left 50%: Recent Applications */}
        <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] lg:w-1/2 flex flex-col">
          <h3 className="text-lg font-bold text-[#1E293B] mb-4">Recent Applications</h3>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500">
                  <th className="pb-3 font-medium">Beneficiary ID</th>
                  <th className="pb-3 font-medium">Band</th>
                  <th className="pb-3 font-medium">Requested (INR)</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">No recent applications found.</td>
                  </tr>
                )}
                {recentApps.map((app) => (
                  <tr key={app._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 text-sm font-medium text-[#1E293B]">{app.beneficiary_id}</td>
                    <td className="py-3 text-sm font-bold" style={{ color: COLORS[`Band ${app.band_snapshot}` as keyof typeof COLORS] }}>{app.band_snapshot}</td>
                    <td className="py-3 text-sm text-slate-600">₹{app.requested_amount?.toLocaleString() || 'N/A'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${app.decision === 'AUTO_APPROVED' ? 'bg-green-100 text-green-700' : app.decision === 'MANUAL_REVIEW' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {app.decision}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button className="flex items-center gap-1 text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]">
              <ExternalLink size={14} /> View All Applications
            </button>
          </div>
        </div>

        {/* Right 50%: Re-scoring Activity Feed */}
        <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] lg:w-1/2 flex flex-col">
          <h3 className="text-lg font-bold text-[#1E293B] mb-4">Live Re-Scoring Activity</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {activityFeed.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                <RefreshCw size={24} className="animate-spin text-slate-300" />
                Listening for ML Engine events...
              </div>
            )}
            {activityFeed.map((event) => (
              <div key={event.id} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0 border border-slate-200">
                  {event.beneficiary_id.substring(0, 3)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#1E293B]"><span className="font-bold">{event.beneficiary_id}</span> {event.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(event.timestamp * 1000).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-[#1E293B] transition-colors">
              View Full Audit Trail <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminHome;
