import React from 'react';
import { 
  User, CheckCircle2, Clock, AlertTriangle, FileText, ChevronRight,
  TrendingUp, RefreshCw, XCircle, FileClock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// =========================================================================
// MOCK USER DATA (In a real app, this would be fetched based on auth)
// =========================================================================
const mockProfile = {
  name: 'Vikram Singh',
  aadhaarLast4: '9284',
  mobile: '+91 98765 43210',
  band: 'B',
  score: 685,
  joined: 'March 2026'
};

const currentLoan = {
  id: 'APP-92841',
  amount: '₹ 1,50,000',
  scheme: 'Shilp Sampada',
  status: 'PENDING', // Could be 'APPROVED', 'REJECTED', 'PENDING'
  appliedOn: '10 June 2026',
  expectedDecision: '12 June 2026',
  rejectionReason: null
};

// Alternative state to showcase rejection (uncomment to test UI)
/*
const currentLoan = {
  id: 'APP-92845',
  amount: '₹ 2,00,000',
  scheme: 'Micro Finance',
  status: 'REJECTED',
  appliedOn: '08 June 2026',
  expectedDecision: null,
  rejectionReason: 'Alternative data footprint is too low for the requested amount. Please apply for a smaller amount.'
};
*/

const pastLoans = [
  { id: 'APP-81001', amount: '₹ 50,000', status: 'PAID_OFF', date: 'Feb 2025' },
  { id: 'APP-76012', amount: '₹ 25,000', status: 'PAID_OFF', date: 'Aug 2024' },
];

export default function PortalDashboardPage() {
  const { user } = useAuthStore();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      case 'PAID_OFF': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'PENDING': return <Clock className="w-5 h-5" />;
      case 'APPROVED': return <CheckCircle2 className="w-5 h-5" />;
      case 'REJECTED': return <XCircle className="w-5 h-5" />;
      case 'PAID_OFF': return <FileClock className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
      
      {/* HEADER */}
      <div className="bg-[#0D9488] px-6 py-8 rounded-b-3xl shadow-md text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">My Dashboard</h1>
            <p className="text-teal-100 font-medium text-sm mt-1">Welcome back, {user?.username || mockProfile.name}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/40 backdrop-blur-sm">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* PROFILE CARD INSIDE HEADER */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <p className="text-teal-50 text-xs font-bold uppercase tracking-wider mb-1">Aadhaar Linked</p>
            <p className="font-mono text-lg font-bold tracking-widest">XXXX XXXX {mockProfile.aadhaarLast4}</p>
          </div>
          <div className="text-right">
            <p className="text-teal-50 text-xs font-bold uppercase tracking-wider mb-1">Risk Band</p>
            <div className="bg-white text-[#0D9488] px-3 py-1 rounded-full font-black text-sm inline-block shadow-sm">
              Band {mockProfile.band}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">

        {/* 1. CURRENT LOAN STATUS */}
        <div>
          <h2 className="text-base font-extrabold text-slate-800 mb-3 flex items-center">
            Current Application
          </h2>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative overflow-hidden">
            {/* Status indicator strip */}
            <div className={`absolute top-0 left-0 w-2 h-full ${
              currentLoan.status === 'PENDING' ? 'bg-amber-500' :
              currentLoan.status === 'REJECTED' ? 'bg-red-500' : 'bg-emerald-500'
            }`}></div>
            
            <div className="pl-3">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{currentLoan.scheme}</p>
                  <h3 className="text-2xl font-black text-slate-800">{currentLoan.amount}</h3>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 ${getStatusColor(currentLoan.status)}`}>
                  {getStatusIcon(currentLoan.status)}
                  {currentLoan.status}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Application ID</span>
                  <span className="text-slate-800 font-mono font-bold">{currentLoan.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Applied On</span>
                  <span className="text-slate-800">{currentLoan.appliedOn}</span>
                </div>
                {currentLoan.status === 'PENDING' && (
                  <div className="flex justify-between text-amber-700">
                    <span>Expected Decision</span>
                    <span className="font-bold">{currentLoan.expectedDecision}</span>
                  </div>
                )}
              </div>

              {/* REJECTION REASON ALERT */}
              {currentLoan.status === 'REJECTED' && currentLoan.rejectionReason && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start text-red-800 shadow-sm">
                  <AlertTriangle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{currentLoan.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. QUICK ACTIONS */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/portal/my-score" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <span className="font-bold text-slate-700">Check<br/>My Score</span>
          </Link>
          
          <Link to="/portal/apply-loan" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
              <RefreshCw className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="font-bold text-slate-700">Apply for<br/>New Loan</span>
          </Link>
        </div>

        {/* 3. LOAN HISTORY */}
        <div>
          <h2 className="text-base font-extrabold text-slate-800 mb-3 flex items-center justify-between">
            Loan History
            <span className="text-xs font-bold text-blue-600">View All</span>
          </h2>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {pastLoans.map((loan, i) => (
              <div key={i} className="p-4 flex items-center justify-between active:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(loan.status)}`}>
                    {getStatusIcon(loan.status)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{loan.amount}</h4>
                    <p className="text-xs font-medium text-slate-500">{loan.date} &bull; {loan.id}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
