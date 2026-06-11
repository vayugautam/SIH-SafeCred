import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, ArrowRight, Phone, ShieldCheck, RefreshCw, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import apiClient from '../api/axios';

type AuthMode = 'PASSWORD' | 'OTP';

const Login: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('PASSWORD');
  const [isBeneficiary, setIsBeneficiary] = useState(false);
  
  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // OTP State
  const [mobileNumber, setMobileNumber] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // UI State
  const [error, setError] = useState<{ type: 'invalid' | 'locked' | 'expired', message: string } | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1]; // Only 1 char
    if (!/^\d*$/.test(value)) return; // Only numbers

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    // Auto-focus next
    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'PASSWORD') {
        const response = await apiClient.post('/auth/login', { employee_id: employeeId, password });
        handleSuccess(response.data.access_token, response.data.role);
      } else {
        if (!otpSent) {
          // Send OTP
          await apiClient.post('/auth/send-otp', { mobile_number: mobileNumber, aadhaar_last4: aadhaarLast4 });
          setOtpSent(true);
          setTimer(60);
        } else {
          // Verify OTP
          const otpString = otpValues.join('');
          if (otpString.length < 6) return;
          const response = await apiClient.post('/auth/verify-otp', { mobile_number: mobileNumber, otp: otpString });
          handleSuccess(response.data.access_token, response.data.role);
        }
      }
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || "Authentication Failed";
      if (status === 403) setError({ type: 'locked', message: detail });
      else if (detail.includes("expired")) setError({ type: 'expired', message: detail });
      else setError({ type: 'invalid', message: detail });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (token: string, role: string) => {
    setSuccess(true);
    loginAction(token, role);
    setTimeout(() => navigate('/'), 300); // 300ms fade transition
  };

  return (
    <div className="flex min-h-screen font-sans">
      {/* LEFT PANEL - Hidden on mobile */}
      <div className="hidden md:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-b from-[#0A1628] to-[#1A3A6B] text-white">
        <div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">SafeCred</h1>
          <p className="text-xl text-blue-200">The Multi-Layer AI Infrastructure for Inclusive Credit</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20">
            <h3 className="font-semibold text-lg mb-2">Automated Underwriting</h3>
            <p className="text-blue-100 text-sm">Real-time XGBoost decisions using 45+ socioeconomic features.</p>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20">
            <h3 className="font-semibold text-lg mb-2">Alternative Data Ingestion</h3>
            <p className="text-blue-100 text-sm">Optical Character Recognition for utility bills and unstructured financial histories.</p>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20">
            <h3 className="font-semibold text-lg mb-2">RBI Compliant Transparency</h3>
            <p className="text-blue-100 text-sm">Every automated decision is accompanied by a mathematically sound SHAP explainability report.</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={`w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative overflow-hidden transition-colors duration-300 ${success ? 'bg-[#F0FDF4]' : ''}`}>
        
        {/* Top Right Beneficiary Switch */}
        <div className="absolute top-6 right-6">
          <button 
            onClick={() => { setIsBeneficiary(!isBeneficiary); setMode('OTP'); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0A1628] text-white rounded-lg hover:bg-[#1A3A6B] transition-colors text-sm font-medium"
          >
            <User size={16} />
            {isBeneficiary ? 'Staff Login' : 'Beneficiary Login'}
          </button>
        </div>

        {/* FORM CARD */}
        <div className="w-full max-w-[420px] bg-[#EFF6FF] border border-[#BFDBFE] rounded-[16px] p-[40px] shadow-sm relative z-10">
          <h2 className="text-2xl font-bold text-[#0A1628] mb-6">
            {isBeneficiary ? 'Beneficiary Access' : 'Sign In'}
          </h2>

          {!isBeneficiary && (
            <div className="flex gap-6 mb-8 border-b border-[#BFDBFE] pb-2">
              <button 
                onClick={() => setMode('PASSWORD')}
                className={`font-medium pb-2 -mb-[9px] ${mode === 'PASSWORD' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Password Login
              </button>
              <button 
                onClick={() => setMode('OTP')}
                className={`font-medium pb-2 -mb-[9px] ${mode === 'OTP' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Aadhaar OTP
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {mode === 'PASSWORD' && !isBeneficiary ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID / NBCFDC Username</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                    placeholder="Enter your employee ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-2">
                    <a href="#" className="text-sm text-[#2563EB] font-medium hover:underline">Forgot Password?</a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    className="w-4 h-4 text-[#2563EB] rounded border-gray-300 focus:ring-[#2563EB]"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember" className="text-sm text-gray-700">Keep me signed in for 8 hours</label>
                </div>
              </>
            ) : (
              <>
                <div className={otpSent ? 'opacity-50 pointer-events-none' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </div>
                <div className={otpSent ? 'opacity-50 pointer-events-none' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar (Last 4 Digits)</label>
                  <input 
                    type="text" 
                    required
                    maxLength={4}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="XXXX"
                    value={aadhaarLast4}
                    onChange={(e) => setAadhaarLast4(e.target.value)}
                  />
                </div>

                {otpSent && (
                  <div className="pt-4 animate-in fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-Digit OTP</label>
                    <div className="flex justify-between gap-2">
                      {otpValues.map((val, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          type="text"
                          className="w-12 h-12 text-center text-xl font-semibold bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                          value={val}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        />
                      ))}
                    </div>
                    {error?.type === 'expired' && (
                      <p className="text-sm text-[#DC2626] mt-2">{error.message}</p>
                    )}
                    <div className="flex justify-end mt-4">
                      <button 
                        type="button" 
                        disabled={timer > 0 || loading}
                        onClick={() => handleLogin(new Event('submit') as any)}
                        className={`text-sm flex items-center gap-1 font-medium ${timer > 0 ? 'text-gray-400' : 'text-[#0D9488] hover:text-[#0F766E]'}`}
                      >
                        <RefreshCw size={14} className={loading && timer === 0 ? 'animate-spin' : ''} />
                        {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Error Banners */}
            {error && error.type !== 'expired' && (
              <div className={`p-3 rounded-lg border text-sm mt-4 flex items-start gap-2 ${
                error.type === 'locked' 
                  ? 'bg-[#FFFBEB] border-[#D97706] text-[#92400E]' 
                  : 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B]'
              }`}>
                <span>{error.message}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-all ${
                mode === 'PASSWORD' ? 'bg-[#2563EB] hover:bg-[#1D4ED8]' : 
                otpSent ? 'bg-[#16A34A] hover:bg-[#15803D]' : 'bg-[#0D9488] hover:bg-[#0F766E]'
              } ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : 
               mode === 'PASSWORD' ? <><ArrowRight size={20}/> Sign In</> : 
               otpSent ? <><ShieldCheck size={20}/> Verify OTP</> : <><Phone size={20}/> Send OTP</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
