import React, { useState } from 'react';
import { 
  Search, Filter, Calendar, FileText, Download, ShieldCheck, 
  ChevronDown, ChevronUp, Link as LinkIcon, CheckCircle, XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

// =========================================================================
// MOCK DATA
// =========================================================================

const mockEvents = [
  {
    id: 'EVT-9001',
    action: 'LOAN_APPROVED',
    entityId: 'APP-92841',
    entityType: 'APPLICATION',
    actor: 'M. Desai',
    role: 'Credit Manager',
    time: '2026-06-10 14:32:01 IST',
    chainVerified: true,
    hasDiff: true,
    diff: {
      field: 'status',
      oldValue: '"MANUAL_REVIEW"',
      newValue: '"APPROVED"'
    }
  },
  {
    id: 'EVT-9002',
    action: 'SCORE_COMPUTED',
    entityId: 'APP-92841',
    entityType: 'APPLICATION',
    actor: 'System (ML Pipeline)',
    role: 'Inference Service',
    time: '2026-06-10 09:16:45 IST',
    chainVerified: true,
    hasDiff: true,
    diff: {
      field: 'composite_score',
      oldValue: 'null',
      newValue: '685'
    }
  },
  {
    id: 'EVT-9003',
    action: 'KYC_VERIFIED',
    entityId: 'APP-92842',
    entityType: 'BENEFICIARY',
    actor: 'Digilocker API',
    role: 'External Service',
    time: '2026-06-09 18:20:11 IST',
    chainVerified: true,
    hasDiff: true,
    diff: {
      field: 'kyc_status',
      oldValue: '"PENDING"',
      newValue: '"VERIFIED"'
    }
  },
  {
    id: 'EVT-9004',
    action: 'DATA_INGESTED',
    entityId: 'JOB-8842',
    entityType: 'ETL_JOB',
    actor: 'State Channel API',
    role: 'SCA Integration',
    time: '2026-06-08 10:00:00 IST',
    chainVerified: true,
    hasDiff: false
  }
];

// =========================================================================
// HELPER LOGIC
// =========================================================================

function getActionColor(action: string) {
  if (action === 'SCORE_COMPUTED') return 'bg-[#2563EB] border-[#2563EB]';
  if (action === 'LOAN_APPROVED') return 'bg-[#16A34A] border-[#16A34A]';
  if (action === 'LOAN_REJECTED') return 'bg-[#DC2626] border-[#DC2626]';
  if (action === 'DATA_INGESTED') return 'bg-[#D97706] border-[#D97706]';
  return 'bg-slate-500 border-slate-500';
}

function getEntityLink(type: string, id: string) {
  if (type === 'BENEFICIARY') return `/beneficiaries/${id}`;
  if (type === 'APPLICATION') return `/lending/${id}`;
  if (type === 'SCORE') return `/score-explorer?id=${id}`;
  return '#'; // Fallback for ETL jobs etc
}

// =========================================================================
// COMPONENT
// =========================================================================

export default function AuditTrailPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chainVerifyStatus, setChainVerifyStatus] = useState<'idle' | 'verifying' | 'verified'>('idle');

  const handleVerifyChain = () => {
    setChainVerifyStatus('verifying');
    setTimeout(() => {
      setChainVerifyStatus('verified');
      setTimeout(() => setChainVerifyStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. HEADER & ACTIONS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Immutable Audit Trail</h2>
          <p className="text-sm text-slate-500 mt-1">Cryptographically hashed ledger of all state changes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleVerifyChain}
            disabled={chainVerifyStatus === 'verifying'}
            className="flex items-center text-sm font-bold text-white bg-[#16A34A] px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-sm disabled:opacity-70"
          >
            {chainVerifyStatus === 'verifying' ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> 
            ) : (
              <ShieldCheck className="w-4 h-4 mr-2" /> 
            )}
            {chainVerifyStatus === 'verifying' ? 'Verifying SHA-256...' : chainVerifyStatus === 'verified' ? 'Chain Verified!' : 'Verify Chain Integrity'}
          </button>
          <button className="flex items-center text-sm font-bold text-white bg-[#0D9488] px-4 py-2 rounded-lg hover:bg-teal-700 transition shadow-sm">
            <FileText className="w-4 h-4 mr-2" /> Export PDF
          </button>
          <button className="flex items-center text-sm font-bold text-white bg-[#475569] px-4 py-2 rounded-lg hover:bg-slate-700 transition shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </button>
        </div>
      </div>

      {/* 2. SEARCH & FILTERS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Entity ID or Actor..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 appearance-none text-slate-700">
              <option>All Action Types</option>
              <option>SCORE_COMPUTED</option>
              <option>LOAN_APPROVED</option>
              <option>LOAN_REJECTED</option>
            </select>
          </div>
          <button className="flex items-center text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-100 transition">
            <Calendar className="w-4 h-4 mr-2" /> Filter by Date
          </button>
        </div>
      </div>

      {/* 3. VERTICAL TIMELINE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:p-8">
        
        <div className="relative border-l-2 border-slate-200 ml-4 lg:ml-6 space-y-10 pb-4">
          {mockEvents.map((event, i) => {
            const isExpanded = expandedId === event.id;

            return (
              <div key={event.id} className="relative pl-8 lg:pl-10">
                {/* Timeline Dot */}
                <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm ${getActionColor(event.action)}`}></div>

                {/* Event Card */}
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-500 tracking-widest">{event.time}</span>
                      {event.chainVerified ? (
                        <span className="flex items-center text-[10px] font-bold bg-[#F0FDF4] text-[#16A34A] px-2 py-0.5 rounded-full border border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" /> SHA-256 VERIFIED
                        </span>
                      ) : (
                        <span className="flex items-center text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626] px-2 py-0.5 rounded-full border border-red-200">
                          <XCircle className="w-3 h-3 mr-1" /> CHAIN BROKEN
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{event.action.replace('_', ' ')}</h3>
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-sm font-medium text-slate-600">
                      Actor: <strong className="text-slate-800">{event.actor}</strong>
                    </p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{event.role}</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase mr-2 w-20">Entity</span>
                    <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded mr-2">{event.entityType}</span>
                    <Link to={getEntityLink(event.entityType, event.entityId)} className="text-sm font-mono font-bold text-[#2563EB] hover:underline flex items-center">
                      {event.entityId} <LinkIcon className="w-3 h-3 ml-1" />
                    </Link>
                  </div>

                  {event.hasDiff && (
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      className="flex items-center text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-100 transition shadow-sm"
                    >
                      {isExpanded ? 'Hide Details' : 'Show Details'} {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                    </button>
                  )}
                </div>

                {/* Diff Panel */}
                {isExpanded && event.diff && (
                  <div className="mt-3 bg-[#F1F5F9] border border-slate-200 rounded-lg overflow-hidden animate-in slide-in-from-top-2 fade-in">
                    <div className="bg-slate-200/50 px-4 py-2 border-b border-slate-200 flex justify-between text-xs font-bold text-slate-600">
                      <span>Field Modified: <span className="font-mono text-slate-800">{event.diff.field}</span></span>
                      <span>JSON Payload Diff</span>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-slate-200">
                      <div className="p-4 font-mono text-xs overflow-x-auto">
                        <div className="text-red-700 bg-red-100/50 px-2 py-1 rounded inline-block whitespace-pre">
                          - {event.diff.field}: {event.diff.oldValue}
                        </div>
                      </div>
                      <div className="p-4 font-mono text-xs overflow-x-auto">
                        <div className="text-green-700 bg-green-100/50 px-2 py-1 rounded inline-block whitespace-pre">
                          + {event.diff.field}: {event.diff.newValue}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
