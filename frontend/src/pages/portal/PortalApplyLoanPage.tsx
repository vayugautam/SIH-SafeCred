import React, { useState } from 'react';
import { 
  ArrowLeft, ArrowRight, ShieldCheck, Check, Send, 
  Save, AlertCircle, CheckCircle, FileText, Banknote
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// =========================================================================
// MOCK DATA & HELPERS
// =========================================================================

const MAX_ELIGIBLE_AMOUNT = 500000;
const INTEREST_RATE_PA = 6.0;

function calculateEMI(principal: number, annualRate: number, months: number) {
  if (annualRate === 0) return principal / months;
  const r = (annualRate / 12) / 100;
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi);
}

const STEPS = [
  { id: 1, label: 'Loan Details' },
  { id: 2, label: 'Purpose & Plan' },
  { id: 3, label: 'Bank Details' },
  { id: 4, label: 'Review & Agree' }
];

// =========================================================================
// COMPONENT
// =========================================================================

export default function PortalApplyLoanPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Form State
  const [amount, setAmount] = useState(100000);
  const [tenure, setTenure] = useState(36);
  
  const [purpose, setPurpose] = useState('');
  const [desc, setDesc] = useState('');
  const [income, setIncome] = useState('');

  const [account, setAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankVerified, setBankVerified] = useState(false);

  const [agreeTc, setAgreeTc] = useState(false);
  const [eSignConsent, setEsignConsent] = useState(false);

  const emi = calculateEMI(amount, INTEREST_RATE_PA, tenure);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission and route back
    navigate('/portal/my-score');
  };

  const handlePennyDrop = () => {
    // Simulate penny drop API call
    setTimeout(() => setBankVerified(true), 1500);
  };

  const isStepValid = () => {
    if (step === 1) return amount >= 10000 && amount <= MAX_ELIGIBLE_AMOUNT && tenure > 0;
    if (step === 2) return purpose !== '' && desc.length >= 20 && income !== '';
    if (step === 3) return account.length > 5 && ifsc.length > 4 && bankVerified;
    if (step === 4) return agreeTc && eSignConsent;
    return false;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative pb-28">
      
      {/* 1. TOP HEADER */}
      <div className="bg-[#0D9488] px-4 py-4 shadow-md text-white flex items-center sticky top-0 z-20">
        <Link to="/portal/my-score" className="mr-4 text-teal-100 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="font-black text-xl tracking-tight leading-none">Apply for Loan</h1>
          <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest mt-0.5">Secure Application</p>
        </div>
      </div>

      {/* 2. WIZARD STEP INDICATOR */}
      <div className="bg-white px-4 py-6 shadow-sm border-b border-slate-200">
        <div className="flex justify-between items-center relative z-10 max-w-[320px] mx-auto">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-[#2563EB] -z-10 -translate-y-1/2 rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>

          {STEPS.map((s) => {
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isActive ? 'bg-[#2563EB] text-white shadow-md ring-4 ring-blue-100' :
                  isDone ? 'bg-[#16A34A] text-white shadow-sm' :
                  'bg-white border-2 border-slate-300 text-slate-400'
                }`}>
                  {isDone ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span className={`text-[10px] font-bold mt-1.5 absolute -bottom-5 w-20 text-center ${
                  isActive ? 'text-[#2563EB]' : isDone ? 'text-[#16A34A]' : 'text-slate-400'
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. WIZARD CONTENT */}
      <div className="px-4 py-8 flex-1">
        
        {/* STEP 1: LOAN DETAILS */}
        {step === 1 && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">How much do you need?</h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex justify-between items-end mb-4">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loan Amount</p>
                <p className="text-3xl font-black text-[#2563EB]">₹ {amount.toLocaleString('en-IN')}</p>
              </div>
              <input 
                type="range" 
                min={10000} 
                max={MAX_ELIGIBLE_AMOUNT} 
                step={10000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
              />
              <div className="flex justify-between text-xs font-bold text-slate-400 mt-2">
                <span>₹ 10,000</span>
                <span>₹ {(MAX_ELIGIBLE_AMOUNT/100000).toFixed(1)}L Max</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Repayment Tenure</p>
              <div className="grid grid-cols-5 gap-2">
                {[12, 24, 36, 48, 60].map(m => (
                  <button 
                    key={m}
                    onClick={() => setTenure(m)}
                    className={`h-12 rounded-xl text-sm font-bold flex flex-col items-center justify-center border-2 transition ${
                      tenure === m ? 'border-[#2563EB] bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {m}<span className="text-[10px] font-medium leading-none mt-0.5">Mo</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-4 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1.5 text-blue-500" />
                Interest Rate: <strong className="ml-1 text-slate-800">{INTEREST_RATE_PA}% p.a.</strong>
              </p>
            </div>

            <div className="bg-[#FFFBEB] rounded-2xl p-5 border border-yellow-200 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-sm font-bold text-[#D97706] mb-1">Estimated EMI</p>
                <p className="text-xs text-yellow-700 font-medium max-w-[150px]">Calculated based on {INTEREST_RATE_PA}% standard rate.</p>
              </div>
              <p className="text-3xl font-black text-slate-800">₹ {emi.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}

        {/* STEP 2: PURPOSE */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Business Purpose</h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Primary Purpose</label>
                <select 
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full h-14 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 text-base font-bold text-slate-800 focus:border-blue-500 focus:outline-none transition appearance-none"
                >
                  <option value="" disabled>Select a category...</option>
                  <option value="Agriculture">Agriculture & Farming</option>
                  <option value="Animal Husbandry">Animal Husbandry</option>
                  <option value="Handicrafts">Handicrafts & Artisan</option>
                  <option value="Small Business">Small Business / Shop</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Business Description</label>
                <textarea 
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Briefly describe what you will do with this loan money (min 20 characters)."
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none transition min-h-[120px] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Expected Monthly Income</label>
                <div className="relative flex">
                  <div className="h-14 bg-slate-100 border-2 border-slate-200 border-r-0 rounded-l-xl px-4 flex items-center justify-center font-bold text-slate-600">₹</div>
                  <input 
                    type="number" 
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="25000"
                    className="w-full h-14 bg-slate-50 border-2 border-slate-200 rounded-r-xl px-4 text-lg font-bold tracking-wide text-slate-800 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: BANK DETAILS */}
        {step === 3 && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Bank Verification</h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Bank Account Number</label>
                <input 
                  type="password" 
                  value={account}
                  onChange={(e) => setAccount(e.target.value.replace(/\D/g, ''))}
                  placeholder="•••• •••• ••••"
                  className="w-full h-14 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 text-xl font-mono tracking-widest text-slate-800 focus:border-blue-500 focus:outline-none transition"
                  disabled={bankVerified}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">IFSC Code</label>
                <input 
                  type="text" 
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="SBIN0001234"
                  className="w-full h-14 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 text-lg font-mono font-bold text-slate-800 focus:border-blue-500 focus:outline-none transition uppercase"
                  disabled={bankVerified}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Account Holder Name (From KYC)</label>
                <input 
                  type="text" 
                  value="PRIYA VERMA"
                  disabled
                  className="w-full h-14 bg-slate-100 border-2 border-slate-200 rounded-xl px-4 text-base font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              {!bankVerified ? (
                <button 
                  type="button"
                  onClick={handlePennyDrop}
                  disabled={account.length < 5 || ifsc.length < 5}
                  className="w-full h-14 bg-[#0D9488] text-white font-bold text-lg rounded-xl shadow-lg shadow-teal-500/30 flex items-center justify-center hover:bg-teal-700 active:scale-95 transition disabled:opacity-50 disabled:active:scale-100"
                >
                  <ShieldCheck className="w-5 h-5 mr-2" /> Verify Account (Penny Drop)
                </button>
              ) : (
                <div className="bg-[#F0FDF4] border border-green-200 rounded-xl p-4 flex items-center text-green-800">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Bank Account Verified</p>
                    <p className="text-xs font-medium text-green-700">₹1.00 successfully deposited via IMPS.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 4 && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Review & Submit</h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800">Application Summary</span>
                <span className="text-xs font-bold text-[#2563EB] bg-blue-100 px-2 py-1 rounded-md">Draft</span>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Principal Amount</span>
                  <span className="font-bold text-slate-800">₹ {amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Tenure & Rate</span>
                  <span className="font-bold text-slate-800">{tenure} Months @ {INTEREST_RATE_PA}%</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Monthly EMI</span>
                  <span className="font-bold text-[#2563EB]">₹ {emi.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Purpose</span>
                  <span className="font-bold text-slate-800">{purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Disbursal Account</span>
                  <span className="font-bold text-slate-800 flex items-center">
                    <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> Ends in {account.slice(-4) || 'XXXX'}
                  </span>
                </div>
              </div>
            </div>

            <a href="#" className="flex items-center text-sm font-bold text-[#2563EB] hover:underline px-2">
              <FileText className="w-4 h-4 mr-2" /> Download Loan Agreement Draft
            </a>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
              <label className="flex items-start cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input type="checkbox" checked={agreeTc} onChange={(e) => setAgreeTc(e.target.checked)} className="peer sr-only" />
                  <div className="w-6 h-6 border-2 border-slate-300 rounded peer-checked:bg-[#2563EB] peer-checked:border-[#2563EB] transition"></div>
                  <Check className="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 transition" />
                </div>
                <span className="ml-3 text-sm font-medium text-slate-700 leading-snug">
                  I have read and agree to the <strong className="text-[#2563EB]">Terms & Conditions</strong> of the NBCFDC loan agreement.
                </span>
              </label>

              <label className="flex items-start cursor-pointer group pt-2 border-t border-slate-100">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input type="checkbox" checked={eSignConsent} onChange={(e) => setEsignConsent(e.target.checked)} className="peer sr-only" />
                  <div className="w-6 h-6 border-2 border-slate-300 rounded peer-checked:bg-[#16A34A] peer-checked:border-[#16A34A] transition"></div>
                  <Check className="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 transition" />
                </div>
                <span className="ml-3 text-sm font-medium text-slate-700 leading-snug">
                  I agree to securely e-Sign this digital application using my <strong className="text-[#16A34A]">Aadhaar OTP</strong>.
                </span>
              </label>
            </div>
          </div>
        )}

      </div>

      {/* 4. BOTTOM ACTION BAR (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] p-4 flex flex-col gap-3 z-30 lg:absolute lg:rounded-b-[inherit]">
        <div className="flex gap-3 w-full">
          {step > 1 && (
            <button 
              onClick={handlePrev}
              className="w-14 h-14 shrink-0 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition active:scale-95 bg-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}

          {step < 4 ? (
            <button 
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1 h-14 bg-[#2563EB] text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition disabled:opacity-50 disabled:active:scale-100"
            >
              Next Step <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={!isStepValid()}
              className="flex-1 h-14 bg-[#16A34A] text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/30 flex items-center justify-center hover:bg-green-700 active:scale-95 transition disabled:opacity-50 disabled:active:scale-100 animate-in fade-in"
            >
              <Send className="w-5 h-5 mr-2" /> Submit Application
            </button>
          )}
        </div>

        <button className="flex items-center justify-center w-full py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition">
          <Save className="w-4 h-4 mr-2" /> Save & Continue Later
        </button>
      </div>

    </div>
  );
}
