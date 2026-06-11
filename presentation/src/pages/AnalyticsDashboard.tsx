import React from 'react';
import { 
  BarChart, Bar, 
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const scoreHistogram = [
  { range: '0-299 (E)', count: 420 },
  { range: '300-449 (D)', count: 850 },
  { range: '450-599 (C)', count: 1200 },
  { range: '600-749 (B)', count: 3100 },
  { range: '750-900 (A)', count: 1800 },
];

const bandDistribution = [
  { name: 'Band A', value: 1800, color: '#22c55e' }, // Green
  { name: 'Band B', value: 3100, color: '#3b82f6' }, // Blue
  { name: 'Band C', value: 1200, color: '#f59e0b' }, // Yellow
  { name: 'Band D', value: 850, color: '#f97316' },  // Orange
  { name: 'Band E', value: 420, color: '#ef4444' },  // Red
];

const driftTrend = [
  { month: 'Jan', psi: 0.02 },
  { month: 'Feb', psi: 0.03 },
  { month: 'Mar', psi: 0.05 },
  { month: 'Apr', psi: 0.04 },
  { month: 'May', psi: 0.08 },
  { month: 'Jun', psi: 0.09 },
];

export const AnalyticsDashboard = () => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics & Model Performance</h1>
        <p className="text-slate-500 mt-1">Deep-dive into population distributions and AI scoring metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Band Distribution */}
        <div className="card h-96 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Population by Risk Band</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={bandDistribution}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {bandDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Score Histogram */}
        <div className="card h-96 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Credit Score Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreHistogram} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Model Drift Tracking */}
        <div className="card lg:col-span-2 h-80 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Population Stability Index (PSI)</h3>
              <p className="text-sm text-slate-500">Tracking data drift over time. Alert triggers at &gt; 0.10</p>
            </div>
            <div className="bg-safecred-success/10 text-safecred-success px-3 py-1 rounded-full text-sm font-bold">
              Model Stable
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={driftTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} domain={[0, 0.15]} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="step" dataKey="psi" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};
