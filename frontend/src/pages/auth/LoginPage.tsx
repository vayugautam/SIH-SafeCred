import { useState, useRef } from 'react';
import { ArrowRight, Phone, ShieldCheck, RefreshCw, User, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/auth/login', { username, password });
      setAuth(res.data.data.token, res.data.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message;
      setError(`Login failed: ${detail}`);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/auth/send-otp', { username });
      setOtpSent(true);
    } catch (err: any) {
      console.error('Send OTP error:', err);
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message;
      setError(`Failed to send OTP: ${detail}`);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const code = otp.join('');
      const res = await api.post('/auth/verify-otp', { username, code });
      setAuth(res.data.data.token, res.data.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message;
      setError(`Invalid OTP: ${detail}`);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-b from-[#0A1628] to-[#1A3A6B] text-white flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute top-12 left-16 flex items-center gap-3">
          <ShieldCheck className="w-10 h-10 text-blue-400" />
          <h1 className="text-3xl font-bold tracking-wider">SafeCred</h1>
        </div>
        <div className="max-w-md mt-16">
          <h2 className="text-4xl font-extrabold mb-6 leading-tight">
            Secure, Explainable <br/> Financial Inclusion.
          </h2>
          <p className="text-[#CBD5E1] text-lg mb-12">
            AI-driven credit scoring specifically tailored for the undocumented missing middle.
          </p>
          <div className="space-y-6">
            {['SHA-256 Audit Trails', 'Bayesian ML Inference', 'Automated KYC Workflows'].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="bg-blue-500/20 p-2 rounded-lg"><ActivityIcon className="text-blue-300 w-5 h-5"/></div>
                <span className="font-medium text-blue-50">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 drop-shadow-2xl">
        <div className="w-[420px] bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-10">
          
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-[#0A1628]">Sign In</h2>
            <button 
              onClick={() => navigate('/portal/login')}
              className="flex items-center text-sm font-medium text-white bg-[#0A1628] px-3 py-1.5 rounded hover:bg-[#1A3A6B] transition"
            >
              <User className="w-4 h-4 mr-2" /> Beneficiary Login
            </button>
          </div>

          {/* TOGGLE */}
          <div className="flex mb-8 bg-white rounded-lg p-1 border border-[#BFDBFE]">
            <button
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${authMode === 'password' ? 'bg-[#2563EB] text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setAuthMode('password')}
            >
              Password Login
            </button>
            <button
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${authMode === 'otp' ? 'bg-[#2563EB] text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setAuthMode('otp')}
            >
              Aadhaar OTP
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-[#FEF2F2] border border-[#DC2626] text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={authMode === 'password' ? handlePasswordLogin : (otpSent ? handleVerifyOtp : handleSendOtp)}>
            
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Employee ID / NBCFDC Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your employee ID" 
                className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
                required
              />
            </div>

            {authMode === 'password' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                  </button>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <label className="flex items-center text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-[#2563EB] border-slate-300 rounded focus:ring-[#2563EB] mr-2" />
                    Keep me signed in
                  </label>
                  <a href="#" className="text-sm font-medium text-[#2563EB] hover:underline">Forgot Password?</a>
                </div>
              </div>
            )}

            {authMode === 'otp' && otpSent && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Enter 6-digit OTP</label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => otpRefs.current[idx] = el}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-12 h-12 text-center text-xl font-bold bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition"
                      required
                    />
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <button type="button" className="text-sm font-medium text-[#0D9488] hover:underline inline-flex items-center">
                    <RefreshCw className="w-4 h-4 mr-1" /> Resend OTP (59s)
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-blue-500/30"
            >
              {authMode === 'password' ? (
                <>Sign In <ArrowRight className="w-5 h-5 ml-2" /></>
              ) : otpSent ? (
                <>Verify OTP <ShieldCheck className="w-5 h-5 ml-2" /></>
              ) : (
                <>Send OTP <Phone className="w-5 h-5 ml-2" /></>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

function ActivityIcon(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
}
