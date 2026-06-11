import React, { useState } from 'react';
import { 
  Globe, Phone, ShieldCheck, Star, Banknote, Upload, 
  ChevronRight, Lock, CheckCircle2, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function PortalLoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loginStep, setLoginStep] = useState<1 | 2>(1);
  const [aadhaar, setAadhaar] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaar.length === 4 && mobile.length === 10) {
      setLoginStep(2);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length === 6) {
      // Set the auth state so ProtectedRoute doesn't redirect
      setAuth('fake_portal_jwt_token', {
        id: 'BEN-92841',
        username: 'Vikram Singh',
        role: 'BENEFICIARY'
      });
      // Route to dashboard
      navigate('/portal/dashboard');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple chars
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      
      {/* 1. TOP BANNER */}
      <div className="bg-[#0D9488] px-4 py-3 flex justify-between items-center text-white shrink-0 shadow-md relative z-10">
        <div>
          <h1 className="font-black text-xl tracking-tight leading-none">SafeCred</h1>
          <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest mt-0.5">NBCFDC Portal</p>
        </div>
        <button className="flex items-center text-xs font-bold bg-teal-800/50 px-3 py-1.5 rounded-full border border-teal-600/50">
          <Globe className="w-3.5 h-3.5 mr-1.5" /> हिन्दी | EN
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        
        {/* DESKTOP CONTAINER WRAPPER */}
        <div className="max-w-xl mx-auto w-full">
          {/* 2. HERO SECTION */}
          <div className="bg-[#EFF6FF] px-6 py-8 flex flex-col items-center text-center rounded-b-3xl shadow-sm">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
              <Lock className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 leading-tight mb-2">
              Check your Credit Score<br/>& Apply for a Loan
            </h2>
            <p className="text-slate-600 font-medium px-4">
              Instant Aadhaar OTP Login.<br/>No Password Needed.
            </p>
          </div>

          {/* 3. LOGIN CARD (Absolute overlap) */}
          <div className="px-4 -mt-6 relative z-10 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
              
              {loginStep === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-800 text-lg">Secure Login</h3>
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">Step 1 of 2</span>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Aadhaar (Last 4 digits)</label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        maxLength={4}
                        placeholder="XXXX"
                        value={aadhaar}
                        onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-14 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 text-xl font-mono tracking-widest text-slate-800 focus:border-teal-500 focus:outline-none transition"
                        required
                      />
                      <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Mobile Number</label>
                    <div className="relative flex">
                      <div className="h-14 bg-slate-100 border-2 border-slate-200 border-r-0 rounded-l-xl px-3 flex items-center justify-center font-bold text-slate-600">
                        +91
                      </div>
                      <input 
                        type="tel" 
                        maxLength={10}
                        placeholder="98765 43210"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-14 bg-slate-50 border-2 border-slate-200 rounded-r-xl px-4 text-lg font-bold tracking-wide text-slate-800 focus:border-teal-500 focus:outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={aadhaar.length !== 4 || mobile.length !== 10}
                    className="w-full h-14 bg-[#0D9488] text-white font-bold text-lg rounded-xl shadow-lg shadow-teal-500/30 flex items-center justify-center hover:bg-teal-700 active:scale-95 transition disabled:opacity-50 disabled:active:scale-100 mt-2"
                  >
                    <Phone className="w-5 h-5 mr-2" /> Send OTP
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right-8 fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-800 text-lg">Verify OTP</h3>
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md">Step 2 of 2</span>
                  </div>

                  <p className="text-sm font-medium text-slate-600 text-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                    We've sent a 6-digit code to <br/><strong className="text-slate-800 tracking-wide">+91 {mobile}</strong>
                  </p>

                  <div className="flex justify-between gap-2 px-1">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="tel"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        className="w-12 h-14 bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-2xl font-bold text-slate-800 focus:border-green-500 focus:outline-none transition"
                        required
                      />
                    ))}
                  </div>

                  <button 
                    type="submit"
                    disabled={otp.join('').length !== 6}
                    className="w-full h-14 bg-[#16A34A] text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/30 flex items-center justify-center hover:bg-green-700 active:scale-95 transition disabled:opacity-50 disabled:active:scale-100"
                  >
                    <CheckCircle2 className="w-6 h-6 mr-2" /> Verify & Login
                  </button>

                  <div className="text-center pt-2">
                    <button type="button" onClick={() => setLoginStep(1)} className="text-sm font-bold text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-4">
                      Change Mobile Number
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>

          {/* 4. FEATURES ROW */}
          <div className="px-4 mb-10">
            <h4 className="font-bold text-slate-400 text-xs uppercase tracking-widest text-center mb-4">Self-Service Actions</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 h-28 opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-slate-600 leading-tight">Check<br/>Score</span>
              </div>
              
              <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 h-28 opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5 text-teal-600" />
                </div>
                <span className="text-xs font-bold text-slate-600 leading-tight">Upload<br/>Docs</span>
              </div>
              
              <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 h-28 opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-2">
                  <Banknote className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-bold text-slate-600 leading-tight">Apply<br/>Loan</span>
              </div>
            </div>
            <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-wider">Login to unlock features</p>
          </div>
        </div>
      </div>

      {/* 5. FOOTER */}
      <div className="bg-[#0A1628] px-6 py-8 text-center shrink-0">
        <h4 className="text-white font-black text-lg mb-2">NBCFDC SafeCred</h4>
        <p className="text-slate-400 text-xs font-medium mb-6">Empowering communities with fair and transparent digital lending.</p>
        
        <div className="flex flex-col items-center space-y-3">
          <div className="bg-slate-800/50 border border-slate-700 rounded-full px-4 py-2 flex items-center">
            <Phone className="w-4 h-4 text-teal-400 mr-2" />
            <span className="text-sm font-bold text-slate-200">Helpline: 1800-123-4567</span>
          </div>
          <a href="#" className="text-xs font-medium text-slate-500 hover:text-white transition flex items-center">
            <FileText className="w-3 h-3 mr-1" /> Privacy Policy & Terms
          </a>
        </div>
      </div>

    </div>
  );
}
