import React, { useState } from 'react';
import { 
  AlertTriangle, CheckCircle, XCircle, Eye, ArrowUp, Users, 
  CheckSquare, XSquare, Download, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

// =========================================================================
// MOCK DATA
// =========================================================================

const mockApplications = [
  { id: 'APP-92841', name: 'Vikram Singh', band: 'B', score: 685, amount: '₹ 1,50,000', status: 'AUTO_APPROVED', hoursPending: 0, highValue: false },
  { id: 'APP-92842', name: 'Anjali Sharma', band: 'A', score: 812, amount: '₹ 3,00,000', status: 'AUTO_APPROVED', hoursPending: 0, highValue: true },
  { id: 'APP-92843', name: 'Mohammed Tariq', band: 'D', score: 430, amount: '₹ 50,000', status: 'MANUAL_REVIEW', hoursPending: 5, highValue: false },
  { id: 'APP-92844', name: 'Priya Deshmukh', band: 'C', score: 560, amount: '₹ 1,00,000', status: 'PENDING', hoursPending: 9, highValue: false },
  { id: 'APP-92845', name: 'Raju Gounder', band: 'E', score: 310, amount: '₹ 2,00,000', status: 'REJECTED', hoursPending: 0, highValue: true },
  { id: 'APP-92846', name: 'Sunita Patel', band: 'A', score: 760, amount: '₹ 80,000', status: 'PENDING', hoursPending: 3, highValue: false },
];

export default function LendingQueuePage() {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter based on active tab
  const filteredApps = mockApplications.filter(app => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'MANUAL REVIEW' && app.status === 'MANUAL_REVIEW') return true;
    if (activeTab === 'AUTO-APPROVED' && app.status === 'AUTO_APPROVED') return true;
    return app.status === activeTab;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApps.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredApps.map(a => a.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const hasHighValuePending = mockApplications.some(a => a.highValue && a.status === 'PENDING');

  return (
    <div className="flex flex-col h-full space-y-6 pb-12">
      
      {/* 1. HEADER & DUAL APPROVAL ALERT */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Digital Lending Queue</h2>
          <button className="flex items-center text-sm font-medium text-white bg-slate-600 px-4 py-2 rounded-lg hover:bg-slate-700 transition shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Export Queue CSV
          </button>
        </div>
        
        {hasHighValuePending && (
          <div className="bg-[#FEF2F2] border border-red-200 rounded-lg p-3 flex items-start shadow-sm mb-4 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium">
              <strong>Action Required:</strong> High-value applications (&gt; INR 2L) are currently pending in the queue. These require dual Officer approval before disbursal.
            </p>
          </div>
        )}
      </div>

      {/* 2. QUICK STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Auto-Approved Today', value: '142', color: 'text-green-600' },
          { label: 'Manually Approved', value: '38', color: 'text-blue-600' },
          { label: 'Rejected Today', value: '12', color: 'text-red-600' },
          { label: 'Avg Processing Time', value: '1.2 hrs', color: 'text-slate-700' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 rounded-t-xl pt-2 px-4 flex gap-6 overflow-x-auto">
        {[
          { id: 'PENDING', label: 'PENDING', count: 12, bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]' },
          { id: 'AUTO-APPROVED', label: 'AUTO-APPROVED', count: 5, bg: 'bg-[#F0FDF4]', text: 'text-[#16A34A]' },
          { id: 'MANUAL REVIEW', label: 'MANUAL REVIEW', count: 8, bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]' },
          { id: 'ALL', label: 'ALL', count: 234, bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedIds(new Set()); }}
            className={`pb-3 pt-2 px-2 flex items-center whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-[#2563EB] text-slate-900 font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${tab.bg} ${tab.text}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 4. BULK ACTIONS BAR */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 mx-4">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} applications selected
          </span>
          <div className="flex gap-3">
            <button className="flex items-center text-sm font-bold text-white bg-[#16A34A] px-3 py-1.5 rounded hover:bg-green-700 transition">
              <CheckSquare className="w-4 h-4 mr-2" /> Bulk Approve
            </button>
            <button className="flex items-center text-sm font-bold text-white bg-[#DC2626] px-3 py-1.5 rounded hover:bg-red-700 transition">
              <XSquare className="w-4 h-4 mr-2" /> Bulk Reject
            </button>
          </div>
        </div>
      )}

      {/* 5. DATA GRID */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden -mt-6 rounded-t-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4 w-[50px]">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    checked={selectedIds.size === filteredApps.length && filteredApps.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4">App ID</th>
                <th className="px-6 py-4">Beneficiary Name</th>
                <th className="px-6 py-4">Band & CCS</th>
                <th className="px-6 py-4">Amount Requested</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Time Pending</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No applications found in {activeTab} queue.
                  </td>
                </tr>
              ) : filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      checked={selectedIds.has(app.id)}
                      onChange={() => toggleSelect(app.id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-blue-700">{app.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{app.name}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <span className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold text-white shadow-sm ${getBandBgColor(app.band)}`}>
                      {app.band}
                    </span>
                    <span className="font-bold text-slate-700">{app.score}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {app.amount}
                    {app.highValue && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">High Value</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(app.status)}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {app.status.includes('PENDING') || app.status === 'MANUAL_REVIEW' ? (
                      <div className={`flex items-center text-sm ${getTimePendingStyle(app.hoursPending)}`}>
                        <Clock className="w-4 h-4 mr-1.5" /> {app.hoursPending} hrs
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {/* Only show Approve/Reject if pending or manual review */}
                      {(app.status === 'PENDING' || app.status === 'MANUAL_REVIEW') && (
                        <>
                          <button className="p-1.5 text-[#16A34A] hover:bg-green-50 rounded transition" title="Approve">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button className="p-1.5 text-[#DC2626] hover:bg-red-50 rounded transition" title="Reject">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      
                      <button className="p-1.5 text-[#2563EB] hover:bg-blue-50 rounded transition" title="View Details">
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      {(app.status === 'PENDING' || app.status === 'MANUAL_REVIEW') && (
                        <button className="p-1.5 text-[#D97706] hover:bg-orange-50 rounded transition" title="Escalate to Manager">
                          <ArrowUp className="w-5 h-5" />
                        </button>
                      )}

                      {app.highValue && app.status === 'PENDING' && (
                        <button className="p-1.5 text-[#7C3AED] hover:bg-purple-50 rounded transition" title="Request 2nd Approval">
                          <Users className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

function getBandBgColor(band: string) {
  switch(band) {
    case 'A': return 'bg-[#16A34A]';
    case 'B': return 'bg-[#2563EB]';
    case 'C': return 'bg-[#D97706]';
    case 'D': return 'bg-[#EA580C]';
    case 'E': return 'bg-[#DC2626]';
    default: return 'bg-slate-500';
  }
}

function getStatusStyle(status: string) {
  switch(status) {
    case 'PENDING': return 'bg-[#FFFBEB] text-[#D97706] border-yellow-200';
    case 'AUTO_APPROVED': return 'bg-[#F0FDF4] text-[#16A34A] border-green-200';
    case 'MANUAL_REVIEW': return 'bg-[#FEF2F2] text-[#DC2626] border-red-200';
    case 'REJECTED': return 'bg-slate-100 text-slate-600 border-slate-300';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function getTimePendingStyle(hours: number) {
  if (hours < 4) return 'text-[#64748B] font-medium';
  if (hours <= 8) return 'text-[#D97706] font-bold';
  return 'text-[#DC2626] font-extrabold'; // SLA breach indicator
}
