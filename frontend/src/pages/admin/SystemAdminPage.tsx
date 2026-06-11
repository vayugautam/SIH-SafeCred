import React, { useState } from 'react';
import { 
  Users, ShieldCheck, Activity, Settings, Plus, X, Server, AlertTriangle, Database
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

// =========================================================================
// MOCK DATA
// =========================================================================

const mockUsers = [
  { name: 'Aditi Desai', empId: 'EMP-001', role: 'SUPER_ADMIN', email: 'aditi@safec.in', login: '10 mins ago', status: 'ACTIVE' },
  { name: 'Rajesh Sharma', empId: 'EMP-042', role: 'ADMIN', email: 'rajesh@safec.in', login: '1 hr ago', status: 'ACTIVE' },
  { name: 'Vikram Singh', empId: 'EMP-112', role: 'MANAGER', email: 'vikram@safec.in', login: 'Yesterday', status: 'ACTIVE' },
  { name: 'Priya Verma', empId: 'EMP-304', role: 'OFFICER', email: 'priya@safec.in', login: '3 days ago', status: 'INACTIVE' },
];

const aucData = [
  { month: 'Jan', auc: 0.82 },
  { month: 'Feb', auc: 0.81 },
  { month: 'Mar', auc: 0.83 },
  { month: 'Apr', auc: 0.79 },
  { month: 'May', auc: 0.76 },
  { month: 'Jun', auc: 0.72 },
];

const psiData = [
  { feature: 'avg_monthly_electricity_bill', m1: 0.05, m2: 0.08, m3: 0.22 },
  { feature: 'upi_transaction_count', m1: 0.02, m2: 0.03, m3: 0.04 },
  { feature: 'loan_repayment_rate', m1: 0.01, m2: 0.09, m3: 0.15 },
  { feature: 'agricultural_income_est', m1: 0.12, m2: 0.18, m3: 0.28 },
];

const fairnessData = [
  { category: 'SC', bandA: '18%', avgCcs: 610, disbursal: '42%' },
  { category: 'ST', bandA: '15%', avgCcs: 590, disbursal: '38%' },
  { category: 'OBC', bandA: '22%', avgCcs: 630, disbursal: '48%' },
  { category: 'General', bandA: '25%', avgCcs: 650, disbursal: '55%' },
];

// =========================================================================
// HELPERS
// =========================================================================

function getRoleBadge(role: string) {
  if (role === 'SUPER_ADMIN') return 'bg-[#0A1628] text-white';
  if (role === 'ADMIN') return 'bg-[#2563EB] text-white';
  if (role === 'MANAGER') return 'bg-[#7C3AED] text-white';
  if (role === 'OFFICER') return 'bg-[#0D9488] text-white';
  return 'bg-slate-200 text-slate-700';
}

function getPsiColor(val: number) {
  if (val < 0.1) return 'bg-[#F0FDF4] text-green-800'; // Green
  if (val <= 0.2) return 'bg-[#FFFBEB] text-amber-800'; // Amber
  return 'bg-[#FEF2F2] text-red-800 font-bold border-red-200 border'; // Red
}

// =========================================================================
// COMPONENT
// =========================================================================

export default function SystemAdminPage() {
  const [activeTab, setActiveTab] = useState<'rbac' | 'model' | 'config'>('rbac');
  const [showAddUser, setShowAddUser] = useState(false);

  // Config State
  const [wRepay, setWRepay] = useState(0.55);
  const [wInc, setWInc] = useState(0.35);
  const [wSei, setWSei] = useState(0.10);

  const weightSum = Number((wRepay + wInc + wSei).toFixed(2));

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center">
          <Server className="w-6 h-6 mr-3 text-slate-500" /> System Admin & Model Health Monitor
        </h2>
        <p className="text-sm text-slate-500 mt-1 ml-9">Super Admin dashboard for RBAC, ML drift monitoring, and core configuration.</p>
      </div>

      {/* 2. TAB NAVIGATION */}
      <div className="bg-white rounded-t-xl border-b border-slate-200 flex overflow-x-auto">
        <button 
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center px-6 py-4 text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'rbac' ? 'border-b-3 border-[#2563EB] text-[#2563EB] font-bold bg-blue-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          style={{ borderBottomWidth: activeTab === 'rbac' ? '3px' : '0px' }}
        >
          <Users className="w-4 h-4 mr-2" /> User Management (RBAC)
        </button>
        <button 
          onClick={() => setActiveTab('model')}
          className={`flex items-center px-6 py-4 text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'model' ? 'border-b-3 border-[#2563EB] text-[#2563EB] font-bold bg-blue-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          style={{ borderBottomWidth: activeTab === 'model' ? '3px' : '0px' }}
        >
          <Activity className="w-4 h-4 mr-2" /> Model Health Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('config')}
          className={`flex items-center px-6 py-4 text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'config' ? 'border-b-3 border-[#2563EB] text-[#2563EB] font-bold bg-blue-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          style={{ borderBottomWidth: activeTab === 'config' ? '3px' : '0px' }}
        >
          <Settings className="w-4 h-4 mr-2" /> System Configuration
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USER MANAGEMENT (RBAC) */}
      {/* ========================================================================= */}
      {activeTab === 'rbac' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-slate-800">Platform Users</h3>
              <button 
                onClick={() => setShowAddUser(true)}
                className="flex items-center text-sm font-bold text-white bg-[#2563EB] px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Add User
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Last Login</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockUsers.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-bold text-slate-800">{u.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{u.empId}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{u.login}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider border ${
                          u.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="flex items-center justify-end w-full text-[10px] font-bold text-red-600 hover:text-red-800 transition">
                          <X className="w-3 h-3 mr-1" /> Lock Account
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Permission Matrix</h3>
            </div>
            <div className="overflow-x-auto p-4 bg-[#F1F5F9]">
              <table className="w-full text-left text-sm whitespace-nowrap bg-white border border-slate-200">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200">Role</th>
                    <th className="px-4 py-3 text-center border-r border-slate-200">view_scores</th>
                    <th className="px-4 py-3 text-center border-r border-slate-200">approve_loans</th>
                    <th className="px-4 py-3 text-center border-r border-slate-200">reject_loans</th>
                    <th className="px-4 py-3 text-center border-r border-slate-200">trigger_rescore</th>
                    <th className="px-4 py-3 text-center">manage_users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OFFICER'].map((role) => (
                    <tr key={role}>
                      <td className="px-4 py-3 font-bold text-slate-700 border-r border-slate-200">{role}</td>
                      <td className="px-4 py-3 text-center border-r border-slate-200"><input type="checkbox" checked disabled className="accent-blue-600" /></td>
                      <td className="px-4 py-3 text-center border-r border-slate-200"><input type="checkbox" checked={role !== 'OFFICER'} disabled className="accent-blue-600" /></td>
                      <td className="px-4 py-3 text-center border-r border-slate-200"><input type="checkbox" checked={role !== 'OFFICER'} disabled className="accent-blue-600" /></td>
                      <td className="px-4 py-3 text-center border-r border-slate-200"><input type="checkbox" checked={['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role)} disabled className="accent-blue-600" /></td>
                      <td className="px-4 py-3 text-center"><input type="checkbox" checked={role === 'SUPER_ADMIN'} disabled className="accent-blue-600" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MODEL HEALTH DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'model' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="bg-[#FEF2F2] border border-red-200 rounded-xl p-4 flex items-center text-red-800 shadow-sm">
            <AlertTriangle className="w-6 h-6 mr-3 text-red-600" />
            <div>
              <p className="font-bold">Model drift detected in 2 features!</p>
              <p className="text-sm text-red-700">`agricultural_income_est` and `avg_monthly_electricity_bill` PSI &gt; 0.20. Retraining recommended.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Version & Retrain */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Production Model</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Registry Version</span><span className="font-mono font-bold text-slate-800">v2.4.1 (XGBoost)</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Trained Date</span><span className="font-medium text-slate-800">12 Apr 2026</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Training Set Size</span><span className="font-medium text-slate-800">4.2M Rows</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Baseline AUC-ROC</span><span className="font-bold text-green-600">0.82</span></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 text-red-600 flex items-center">
                  <Database className="w-5 h-5 mr-2" /> Pipeline Controls
                </h3>
                <div className="space-y-3">
                  <button className="w-full bg-[#DC2626] text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition shadow-sm">
                    Trigger Retrain DAG
                  </button>
                  <button className="w-full bg-[#D97706] text-white font-bold py-2.5 rounded-lg hover:bg-orange-700 transition shadow-sm">
                    Canary Deploy 10%
                  </button>
                  <button className="w-full bg-[#0D9488] text-white font-bold py-2.5 rounded-lg hover:bg-teal-700 transition shadow-sm">
                    Promote to Prod (100%)
                  </button>
                </div>
              </div>
            </div>

            {/* AUC & PSI */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Performance Decay (AUC-ROC)</h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={aucData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} />
                      <YAxis domain={[0.5, 1.0]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} />
                      <Tooltip />
                      <ReferenceLine y={0.75} stroke="#DC2626" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'Min Threshold 0.75', fill: '#DC2626', fontSize: 10 }} />
                      <Line type="monotone" dataKey="auc" stroke="#2563EB" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                  <h3 className="text-lg font-bold text-slate-800">Population Stability Index (PSI) Heatmap</h3>
                  <span className="text-xs font-bold text-slate-400">Drift &gt; 0.20 requires attention</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="px-4 py-3">Feature Name</th>
                        <th className="px-4 py-3 text-center">Month -2</th>
                        <th className="px-4 py-3 text-center">Month -1</th>
                        <th className="px-4 py-3 text-center">Current Month</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {psiData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.feature}</td>
                          <td className="px-4 py-3 text-center"><div className={`w-12 mx-auto py-1 rounded text-xs ${getPsiColor(row.m1)}`}>{row.m1.toFixed(2)}</div></td>
                          <td className="px-4 py-3 text-center"><div className={`w-12 mx-auto py-1 rounded text-xs ${getPsiColor(row.m2)}`}>{row.m2.toFixed(2)}</div></td>
                          <td className="px-4 py-3 text-center"><div className={`w-12 mx-auto py-1 rounded text-xs ${getPsiColor(row.m3)}`}>{row.m3.toFixed(2)}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Fairness */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                  <h3 className="text-lg font-bold text-slate-800">Demographic Fairness Grid (Compliance)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="px-4 py-3">Caste Category</th>
                        <th className="px-4 py-3">Band A Allocation Rate</th>
                        <th className="px-4 py-3">Average CCS Score</th>
                        <th className="px-4 py-3">Disbursal Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fairnessData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-bold text-slate-800">{row.category}</td>
                          <td className="px-4 py-3 text-slate-600">{row.bandA}</td>
                          <td className="px-4 py-3 text-slate-600">{row.avgCcs}</td>
                          <td className="px-4 py-3 text-slate-600">{row.disbursal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SYSTEM CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'config' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Scoring Weights</h3>
              <p className="text-xs text-slate-500 mb-4">Adjust the macro-weights of the final CCS equation. Must sum to exactly 1.0.</p>
              
              <div>
                <label className="flex justify-between text-sm font-bold text-slate-700 mb-1.5">
                  <span>Repayment Weight</span>
                  <span className="text-[#2563EB]">{wRepay.toFixed(2)}</span>
                </label>
                <input type="range" min={0} max={1} step={0.05} value={wRepay} onChange={e=>setWRepay(Number(e.target.value))} className="w-full accent-[#2563EB]" />
              </div>
              <div>
                <label className="flex justify-between text-sm font-bold text-slate-700 mb-1.5">
                  <span>Income Weight</span>
                  <span className="text-[#0D9488]">{wInc.toFixed(2)}</span>
                </label>
                <input type="range" min={0} max={1} step={0.05} value={wInc} onChange={e=>setWInc(Number(e.target.value))} className="w-full accent-[#0D9488]" />
              </div>
              <div>
                <label className="flex justify-between text-sm font-bold text-slate-700 mb-1.5">
                  <span>Socio-Economic Index (SEI) Weight</span>
                  <span className="text-[#7C3AED]">{wSei.toFixed(2)}</span>
                </label>
                <input type="range" min={0} max={1} step={0.05} value={wSei} onChange={e=>setWSei(Number(e.target.value))} className="w-full accent-[#7C3AED]" />
              </div>
              
              <div className={`p-3 rounded border font-mono text-sm font-bold flex justify-between ${weightSum === 1.0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <span>Total Sum:</span>
                <span>{weightSum.toFixed(2)} {weightSum !== 1.0 && '(Must be 1.0)'}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Rate Limiting</h3>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Max auto-approvals / day / officer</label>
                <input type="number" defaultValue={50} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Max score requests / minute (API)</label>
                <input type="number" defaultValue={100} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
            </div>

            <div className="lg:col-span-2 bg-[#F1F5F9] rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Notification Templates</h3>
              <p className="text-xs text-slate-500">Edit the raw SMS/Email text sent via fast2sms and Nodemailer. Use `{'{variables}'}`.</p>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Loan Approved (SMS)</label>
                <textarea 
                  defaultValue="Dear {beneficiary_name}, your loan request of Rs. {amount} has been APPROVED by NBCFDC. Money will be transferred to your account ending in {account_last4} shortly." 
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-mono focus:border-blue-500 focus:outline-none min-h-[80px]"
                />
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200">
                <button className="bg-[#2563EB] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-blue-700 transition">Save Configurations</button>
                <button className="text-[#DC2626] bg-red-50 px-6 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition border border-red-100">Restore Defaults</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADD USER MODAL (Hidden by default) */}
      {showAddUser && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Create New User</h3>
              <button onClick={() => setShowAddUser(false)} className="text-slate-500 hover:text-slate-700"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded p-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID</label>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded p-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                <select className="w-full bg-white border border-slate-200 rounded p-2 text-sm focus:border-blue-500 focus:outline-none">
                  <option>ADMIN</option>
                  <option>MANAGER</option>
                  <option>OFFICER</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-white border border-slate-200 rounded p-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setShowAddUser(false)} className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition">Cancel</button>
              <button onClick={() => setShowAddUser(false)} className="px-4 py-2 font-bold text-white bg-[#2563EB] rounded shadow-sm hover:bg-blue-700 transition">Save User</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
