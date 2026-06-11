import React, { useState } from 'react';
import { 
  Banknote, FileDown, RefreshCw, Upload, Trash2, ChevronDown, 
  ChevronUp, CheckCircle, Clock, AlertCircle, Lightbulb, Link2, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

// =========================================================================
// MOCK DATA
// =========================================================================

const mockScore = {
  score: 680,
  band: 'B',
  eligible: true,
  maxLoanAmount: 500000,
  lastUpdated: '10 June 2026',
};

const mockTips = [
  "Upload your last 3 electricity bills to improve your score by ~40 points.",
  "Link a valid UPI account to prove your digital transaction history.",
  "Maintain a minimum balance of ₹1,000 in your linked bank account."
];

const mockDocs = {
  'Electricity': [
    { id: 'DOC-01', name: 'MSEDCL_Bill_May.pdf', status: 'VERIFIED', date: '05 Jun 2026' },
    { id: 'DOC-02', name: 'MSEDCL_Bill_Apr.jpg', status: 'PROCESSING', date: '08 Jun 2026' }
  ],
  'Mobile': [
    { id: 'DOC-03', name: 'Jio_Recharge_Receipt.pdf', status: 'REJECTED', date: '01 Jun 2026' }
  ],
  'Gov ID': [
    { id: 'DOC-04', name: 'Aadhaar_Card.pdf', status: 'VERIFIED', date: '01 Jan 2026' }
  ]
};

// =========================================================================
// COMPONENT
// =========================================================================

export default function PortalScorePage() {
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState('Electricity');

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
      
      {/* 1. TOP HEADER */}
      <div className="bg-[#0D9488] px-4 py-4 shadow-md text-white flex justify-between items-center sticky top-0 z-20">
        <div>
          <h1 className="font-black text-xl tracking-tight leading-none">SafeCred</h1>
          <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest mt-0.5">My Profile</p>
        </div>
        <button className="w-10 h-10 rounded-full bg-teal-700 border-2 border-teal-500 flex items-center justify-center font-bold">
          RV
        </button>
      </div>

      {/* 2. ELIGIBILITY BANNER */}
      <div className="p-4">
        {mockScore.eligible ? (
          <div className="bg-[#F0FDF4] border border-green-200 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-4">
            <h3 className="text-green-800 font-bold text-lg mb-1">Great news! 🎉</h3>
            <p className="text-green-700 text-sm font-medium mb-3">You are eligible for a loan of up to <strong className="text-xl">₹{(mockScore.maxLoanAmount/100000).toFixed(1)} Lakhs</strong>.</p>
            <Link to="/portal" className="w-full h-12 bg-[#16A34A] text-white font-bold rounded-xl flex items-center justify-center hover:bg-green-700 transition shadow-md shadow-green-500/20 active:scale-95">
              <Banknote className="w-5 h-5 mr-2" /> Apply for Loan Now
            </Link>
          </div>
        ) : (
          <div className="bg-[#FEF2F2] border border-red-200 rounded-2xl p-4 shadow-sm">
            <h3 className="text-red-800 font-bold text-lg mb-1">Score Too Low</h3>
            <p className="text-red-700 text-sm font-medium">You need a minimum score of 450 to apply for a loan. Please follow the tips below to improve your score.</p>
          </div>
        )}
      </div>

      {/* 3. SCORE HERO CARD */}
      <div className="px-4 mb-6">
        <div className="bg-[#EFF6FF] rounded-3xl p-6 shadow-sm border border-blue-100 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-200 rounded-full opacity-50 blur-2xl"></div>
          
          <div className="text-center relative z-10">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Your Credit Score</p>
            <div className="flex items-end justify-center mb-1">
              <span className="text-6xl font-black text-blue-900 leading-none">{mockScore.score}</span>
              <span className="text-xl font-bold text-blue-400 mb-1 ml-1">/ 1000</span>
            </div>
            <div className="flex justify-center items-center mt-3">
              <span className="bg-[#2563EB] text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">Band {mockScore.band}</span>
            </div>
            <p className="text-xs text-blue-500 font-medium mt-4">Last checked: {mockScore.lastUpdated}</p>
          </div>

          <div className="mt-6 flex gap-3 relative z-10">
            <button className="flex-1 h-12 bg-[#0D9488] text-white font-bold rounded-xl flex flex-col items-center justify-center hover:bg-teal-700 transition shadow-md active:scale-95">
              <span className="flex items-center text-sm"><FileDown className="w-4 h-4 mr-1.5" /> Report</span>
            </button>
            <button className="flex-1 h-12 bg-[#7C3AED] text-white font-bold rounded-xl flex flex-col items-center justify-center hover:bg-purple-700 transition shadow-md active:scale-95">
              <span className="flex items-center text-sm"><RefreshCw className="w-4 h-4 mr-1.5" /> Re-check</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. IMPROVEMENT TIPS */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-3 px-1">How to boost your score</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x pr-4">
          {mockTips.map((tip, i) => (
            <div key={i} className="min-w-[260px] bg-[#EFF6FF] border border-blue-100 rounded-2xl p-4 snap-center shrink-0 shadow-sm">
              <Lightbulb className="w-6 h-6 text-[#D97706] mb-2" />
              <p className="text-sm font-bold text-slate-700 leading-snug">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. WHAT AFFECTS MY SCORE (Accordion) */}
      <div className="px-4 mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-3 px-1">What affects my score?</h2>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {[
            { title: 'Loan Repayment History', desc: 'Any past loans taken from SHGs or MFIs and your repayment timing.' },
            { title: 'Electricity Usage', desc: 'Consistent electricity bill payments show financial stability.' },
            { title: 'Mobile Recharges', desc: 'Regular mobile top-ups serve as a proxy for active economic behavior.' }
          ].map((item, i) => (
            <div key={i} className="border-b border-slate-100 last:border-0">
              <button 
                onClick={() => setOpenAccordion(openAccordion === i ? null : i)}
                className="w-full flex items-center justify-between p-4 bg-white active:bg-slate-50 transition"
              >
                <span className="font-bold text-slate-700 text-left">{item.title}</span>
                {openAccordion === i ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              {openAccordion === i && (
                <div className="px-4 pb-4 text-sm text-slate-600 bg-slate-50 animate-in slide-in-from-top-2">
                  {item.desc}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. DOCUMENT UPLOAD SECTION */}
      <div className="px-4 mb-8" id="upload">
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="text-lg font-bold text-slate-800">My Documents</h2>
          <span className="text-xs font-bold text-[#2563EB] bg-blue-100 px-2 py-1 rounded-full">Secure</span>
        </div>

        {/* Custom Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 mb-2 no-scrollbar">
          {['Electricity', 'Mobile', 'Utility', 'Gov ID'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                activeTab === tab ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <button className="w-full h-14 bg-[#2563EB] text-white font-bold rounded-xl flex items-center justify-center hover:bg-blue-700 transition shadow-md shadow-blue-500/20 active:scale-95">
              <Upload className="w-5 h-5 mr-2" /> Upload New {activeTab}
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {/* @ts-ignore */}
            {(mockDocs[activeTab] || []).length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium text-sm">
                No documents uploaded yet.
              </div>
            ) : (
              /* @ts-ignore */
              mockDocs[activeTab].map((doc: any) => (
                <div key={doc.id} className="p-4 flex items-center justify-between group">
                  <div className="flex items-center overflow-hidden">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mr-3 ${
                      doc.status === 'VERIFIED' ? 'bg-green-100 text-green-600' :
                      doc.status === 'PROCESSING' ? 'bg-orange-100 text-orange-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{doc.name}</p>
                      <div className="flex items-center mt-0.5">
                        <span className={`text-[10px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded ${
                          doc.status === 'VERIFIED' ? 'bg-[#F0FDF4] text-[#16A34A]' :
                          doc.status === 'PROCESSING' ? 'bg-[#FFFBEB] text-[#D97706] animate-pulse' :
                          'bg-[#FEF2F2] text-[#DC2626]'
                        }`}>
                          {doc.status}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2 font-medium">{doc.date}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition shrink-0 ml-2">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
