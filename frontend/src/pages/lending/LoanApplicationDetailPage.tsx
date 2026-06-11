import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle, XCircle, AlertCircle, RefreshCw, 
  Banknote, X, Edit, FileText, Link2, Clock, Check
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

// =========================================================================
// MOCK DATA
// =========================================================================

const mockApplication = {
  id: 'APP-9904',
  status: 'MANUAL_REVIEW',
  appliedAt: '2026-06-08 09:15 AM',
  officer: 'System (Auto-Routed)',
  beneficiary: {
    id: 'BEN-004524',
    name: 'Priya Verma',
    district: 'Varanasi',
    state: 'UP',
    caste: 'SC',
    aadhaar: 'XXXX-XXXX-8921',
  },
  scoreSnapshot: {
    band: 'C',
    score: 550,
    computedOn: '2026-06-08 09:16 AM',
    eligible: true
  },
  kycStatus: 'VERIFIED',
  bankStatus: 'FAILED',
  loanTerms: {
    requested: 250000,
    approved: 200000,
    tenureMonths: 36,
    interestRateAnnual: 6.0 // 6% pa
  },
  timeline: [
    { step: 'APPLIED', status: 'COMPLETED', time: '09:15 AM', actor: 'Beneficiary Portal' },
    { step: 'SCORE VERIFIED', status: 'COMPLETED', time: '09:16 AM', actor: 'ML Inference Service' },
    { step: 'KYC', status: 'COMPLETED', time: '09:17 AM', actor: 'UIDAI API Gateway' },
    { step: 'BANK VERIFIED', status: 'FAILED', time: '09:18 AM', actor: 'Penny Drop Service' },
    { step: 'APPROVED', status: 'PENDING', time: '', actor: '' },
    { step: 'DISBURSED', status: 'PENDING', time: '', actor: '' },
  ]
};

// =========================================================================
// HELPER FOR EMI CALCULATION
// =========================================================================

function calculateEMI(principal: number, annualRate: number, months: number) {
  if (annualRate === 0) return principal / months;
  const r = (annualRate / 12) / 100; // monthly interest rate
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi);
}

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export default function LoanApplicationDetailPage() {
  const { appId } = useParams();
  
  // Local state for editing loan amount
  const [approvedAmount, setApprovedAmount] = useState(mockApplication.loanTerms.approved);
  const [isEditingAmount, setIsEditingAmount] = useState(false);

  const emi = calculateEMI(approvedAmount, mockApplication.loanTerms.interestRateAnnual, mockApplication.loanTerms.tenureMonths);

  return (
    <div className="space-y-6 pb-24 relative min-h-screen">
      
      {/* BREADCRUMBS */}
      <div className="flex items-center">
        <Link to="/lending" className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Queue
        </Link>
      </div>

      {/* 1. APPLICATION HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-mono font-bold text-slate-800">{mockApplication.id}</h1>
            <span className="bg-[#FEF2F2] text-[#DC2626] border border-red-200 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
              {mockApplication.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
            <span>Applied: {mockApplication.appliedAt}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>Assigned: {mockApplication.officer}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center text-sm font-bold text-white bg-[#0D9488] px-4 py-2 rounded-lg hover:bg-teal-700 transition shadow-sm">
            <FileText className="w-4 h-4 mr-2" /> Sanction Ltr
          </button>
          <button className="flex items-center text-sm font-bold text-white bg-[#7C3AED] px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-sm">
            <Link2 className="w-4 h-4 mr-2" /> NACH Mandate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Data Summaries */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Score Snapshot */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-teal-500">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
              Time-of-Application Score
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Computed on {mockApplication.scoreSnapshot.computedOn}</span>
            </h3>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 flex items-center justify-center rounded-lg text-xl font-bold text-white shadow-sm bg-[#D97706]">
                  {mockApplication.scoreSnapshot.band}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Band</p>
                  <p className="text-lg font-bold text-slate-800">Medium Risk</p>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Composite Score</p>
                <p className="text-2xl font-black text-slate-800">{mockApplication.scoreSnapshot.score} <span className="text-sm font-bold text-slate-400">/ 1000</span></p>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Algorithmic Decision</p>
                <p className="text-lg font-bold text-green-600 flex items-center"><CheckCircle className="w-5 h-5 mr-1" /> Eligible</p>
              </div>
            </div>
          </div>

          {/* Beneficiary Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Beneficiary Identity</h3>
              <Link to={`/beneficiaries/${mockApplication.beneficiary.id}`} className="text-sm font-bold text-blue-600 hover:underline">
                View Full Profile &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Name</p>
                <p className="text-sm font-bold text-slate-800">{mockApplication.beneficiary.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">NBCFDC ID</p>
                <p className="text-sm font-mono font-bold text-blue-700">{mockApplication.beneficiary.id}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Location</p>
                <p className="text-sm font-bold text-slate-800">{mockApplication.beneficiary.district}, {mockApplication.beneficiary.state}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Aadhaar</p>
                <p className="text-sm font-mono font-bold text-slate-800">{mockApplication.beneficiary.aadhaar}</p>
              </div>
            </div>
          </div>

          {/* KYC & Bank Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aadhaar */}
            <div className={`rounded-xl shadow-sm border p-5 flex flex-col ${mockApplication.kycStatus === 'VERIFIED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-800">Aadhaar e-KYC</h4>
                {mockApplication.kycStatus === 'VERIFIED' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
              </div>
              <p className={`text-sm font-bold mb-4 ${mockApplication.kycStatus === 'VERIFIED' ? 'text-green-700' : 'text-red-700'}`}>
                {mockApplication.kycStatus}
              </p>
              {mockApplication.kycStatus === 'FAILED' && (
                <button className="mt-auto self-start flex items-center text-xs font-bold text-white bg-[#D97706] px-3 py-1.5 rounded hover:bg-orange-700 transition">
                  <RefreshCw className="w-3 h-3 mr-1.5" /> Retry KYC
                </button>
              )}
            </div>
            
            {/* Bank */}
            <div className={`rounded-xl shadow-sm border p-5 flex flex-col ${mockApplication.bankStatus === 'VERIFIED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-800">Bank Penny Drop</h4>
                {mockApplication.bankStatus === 'VERIFIED' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
              </div>
              <p className={`text-sm font-bold mb-4 ${mockApplication.bankStatus === 'VERIFIED' ? 'text-green-700' : 'text-red-700'}`}>
                {mockApplication.bankStatus} (Name Mismatch)
              </p>
              {mockApplication.bankStatus === 'FAILED' && (
                <button className="mt-auto self-start flex items-center text-xs font-bold text-white bg-[#D97706] px-3 py-1.5 rounded hover:bg-orange-700 transition">
                  <RefreshCw className="w-3 h-3 mr-1.5" /> Retry Verify
                </button>
              )}
            </div>
          </div>

          {/* Loan Terms */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <Banknote className="w-5 h-5 mr-2 text-green-600" /> Loan Terms & Amortization
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Requested</p>
                <p className="text-lg font-bold text-slate-800">₹ {mockApplication.loanTerms.requested.toLocaleString('en-IN')}</p>
              </div>
              <div className="relative">
                <p className="text-xs font-bold text-slate-500 uppercase flex items-center">
                  Approved <button onClick={() => setIsEditingAmount(!isEditingAmount)} className="ml-2 text-orange-600 hover:bg-orange-50 p-1 rounded"><Edit className="w-3 h-3" /></button>
                </p>
                {isEditingAmount ? (
                  <input 
                    type="number" 
                    value={approvedAmount} 
                    onChange={(e) => setApprovedAmount(Number(e.target.value))}
                    className="w-full mt-1 border-b-2 border-orange-500 focus:outline-none font-bold text-lg text-slate-800 bg-orange-50 px-1"
                  />
                ) : (
                  <p className="text-lg font-bold text-green-700 bg-green-50 inline-block px-2 rounded">₹ {approvedAmount.toLocaleString('en-IN')}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Tenure</p>
                <p className="text-lg font-bold text-slate-800">{mockApplication.loanTerms.tenureMonths} Months</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Interest (p.a.)</p>
                <p className="text-lg font-bold text-slate-800">{mockApplication.loanTerms.interestRateAnnual}%</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-slate-600">Calculated Monthly EMI</p>
                <p className="text-xs text-slate-500">Auto-computed via standard amortisation</p>
              </div>
              <p className="text-2xl font-black text-blue-700">₹ {emi.toLocaleString('en-IN')}</p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Timeline & Approval */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Approval Timeline</h3>
            
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-4">
              {mockApplication.timeline.map((item, i) => {
                const isCurrent = item.status === 'FAILED' || (item.status === 'PENDING' && i > 0 && mockApplication.timeline[i-1].status === 'COMPLETED');
                const isCompleted = item.status === 'COMPLETED';
                const isFailed = item.status === 'FAILED';

                let iconBg = 'bg-slate-100';
                let iconColor = 'text-slate-400';
                if (isCompleted) { iconBg = 'bg-green-100'; iconColor = 'text-green-600'; }
                if (isFailed) { iconBg = 'bg-red-100'; iconColor = 'text-red-600'; }
                if (isCurrent && !isFailed) { iconBg = 'bg-blue-100'; iconColor = 'text-blue-600'; }

                return (
                  <div key={i} className="relative pl-8">
                    <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${iconBg}`}>
                      {isCompleted ? <Check className={`w-4 h-4 ${iconColor}`} /> : 
                       isFailed ? <X className={`w-4 h-4 ${iconColor}`} /> :
                       <Clock className={`w-4 h-4 ${iconColor}`} />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isCurrent ? 'text-blue-700' : isFailed ? 'text-red-700' : 'text-slate-700'}`}>
                        {item.step}
                      </p>
                      {item.time && <p className="text-xs font-mono text-slate-500 mt-1">{item.time}</p>}
                      {item.actor && <p className="text-xs text-slate-500 mt-0.5">{item.actor}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* FULL WIDTH BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 flex justify-between items-center px-8">
        <p className="text-sm font-bold text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1.5" /> Cannot disburse: Bank Penny Drop Failed
        </p>
        <div className="flex gap-4">
          <button className="flex items-center text-sm font-bold text-white bg-[#DC2626] px-6 py-3 rounded-lg hover:bg-red-700 transition shadow-sm">
            <X className="w-5 h-5 mr-2" /> Reject Application
          </button>
          <button className="flex items-center text-sm font-bold text-white bg-slate-300 cursor-not-allowed px-8 py-3 rounded-lg shadow-sm" disabled>
            <Banknote className="w-5 h-5 mr-2" /> Approve & Disburse
          </button>
        </div>
      </div>

    </div>
  );
}
