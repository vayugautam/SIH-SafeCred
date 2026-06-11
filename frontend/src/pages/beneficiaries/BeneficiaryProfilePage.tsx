import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit, Banknote, Zap, FileDown, Flag, StickyNote, Upload, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// =========================================================================
// MOCK DATA
// =========================================================================

const mockProfile = {
  id: 'BEN-004521',
  name: 'Ramesh Kumar',
  caste: 'OBC',
  district: 'Pune',
  state: 'MH',
  mobile: 'XXXXXX4567',
  aadhaar: 'XXXX-XXXX-1234',
  status: 'ACTIVE',
  score: 680,
  band: 'B',
  dataCompleteness: 73,
  incomeBand: 'LIG',
  eligible: true
};

const shapPositive = [
  { label: 'Consistent Utility Payments', value: 85 },
  { label: 'Digital Literacy Score', value: 42 },
  { label: 'Low Debt-to-Income', value: 38 },
];

const shapNegative = [
  { label: 'High Dependency Ratio', value: -25 },
  { label: 'Short Credit History', value: -18 },
];

const loanHistoryData = [
  { month: 'Jan', emi: 5000 },
  { month: 'Feb', emi: 5000 },
  { month: 'Mar', emi: 0 }, // Missed
  { month: 'Apr', emi: 10000 }, // Caught up
  { month: 'May', emi: 5000 },
  { month: 'Jun', emi: 5000 },
];

const consumptionData = [
  { month: 'Jan', amount: 450 },
  { month: 'Feb', amount: 480 },
  { month: 'Mar', amount: 510 },
  { month: 'Apr', amount: 490 },
  { month: 'May', amount: 600 },
  { month: 'Jun', amount: 550 },
];

const auditTrail = [
  { id: 1, action: 'Score updated (680)', actor: 'SYSTEM', time: 'Today, 10:45 AM' },
  { id: 2, action: 'Electricity bill processed', actor: 'SYSTEM', time: 'Yesterday, 02:15 PM' },
  { id: 3, action: 'Manual profile review', actor: 'Officer S. Gupta', time: '12-May-2026' },
  { id: 4, action: 'Initial KYC Approved', actor: 'Officer R. Sharma', time: '10-May-2026' },
];

// =========================================================================
// CUSTOM ANIMATED SVG RING GAUGE
// =========================================================================

function ScoreRingGauge({ score, band }: { score: number, band: string }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const size = 200;
  const strokeWidth = 20;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Animate score from 0 to final on mount
  useEffect(() => {
    const duration = 1200; // 1.2s ease-out
    const frames = 60;
    const stepTime = duration / frames;
    let currentFrame = 0;
    
    const timer = setInterval(() => {
      currentFrame++;
      const progress = 1 - Math.pow(1 - currentFrame / frames, 3); // ease-out cubic
      setAnimatedScore(Math.round(score * progress));
      if (currentFrame === frames) clearInterval(timer);
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [score]);

  // Determine color based on final score range
  const getColor = (s: number) => {
    if (s < 300) return '#DC2626'; // Red
    if (s < 450) return '#EA580C'; // Orange
    if (s < 600) return '#D97706'; // Amber
    if (s < 750) return '#2563EB'; // Blue
    return '#16A34A'; // Green
  };

  const color = getColor(score);
  const fillPercentage = animatedScore / 1000;
  const strokeDashoffset = circumference - (fillPercentage * circumference);

  return (
    <div className="relative w-[200px] h-[200px] flex items-center justify-center mx-auto">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Ring */}
        <circle
          cx={center} cy={center} r={radius}
          fill="transparent"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        {/* Animated Score Ring */}
        <circle
          cx={center} cy={center} r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-75"
        />
      </svg>
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
        <span className="text-[48px] font-bold leading-none text-slate-800" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
          {animatedScore}
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-[16px] font-bold" style={{ color }}>Band {band}</span>
          <span className="text-[10px] text-slate-500 font-medium">out of 1000</span>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export default function BeneficiaryProfilePage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('electricity');

  return (
    <div className="space-y-6 pb-12">
      
      {/* BREADCRUMBS */}
      <div className="flex items-center">
        <Link to="/beneficiaries" className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
        </Link>
      </div>

      {/* TOP 3-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: PROFILE CARD (30% -> ~4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative">
          <button className="absolute top-4 right-4 flex items-center text-sm font-medium text-blue-600 bg-white border border-blue-600 px-3 py-1.5 rounded hover:bg-blue-50 transition">
            <Edit className="w-4 h-4 mr-1.5" /> Edit Profile
          </button>
          
          <div className="flex items-center gap-4 mb-6 mt-2">
            <div className="w-[60px] h-[60px] rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
              {mockProfile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">{mockProfile.name}</h2>
              <p className="font-mono text-sm text-blue-700 font-medium">{mockProfile.id}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Status</span>
              <span className="text-sm font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">{mockProfile.status}</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Caste Category</span>
              <span className="text-sm font-semibold text-slate-800">{mockProfile.caste}</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Location</span>
              <span className="text-sm font-semibold text-slate-800">{mockProfile.district}, {mockProfile.state}</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Mobile</span>
              <span className="text-sm font-mono text-slate-800">{mockProfile.mobile}</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Aadhaar</span>
              <span className="text-sm font-mono text-slate-800">{mockProfile.aadhaar}</span>
            </div>
          </div>
        </div>

        {/* CENTER: SCORE PANEL (45% -> ~5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Risk Profile Engine</h3>
            <span className="text-xs font-semibold text-slate-500 flex items-center bg-slate-100 px-2 py-1 rounded">
              <CheckCircle className="w-3 h-3 mr-1 text-green-600" /> Bayesian Updated
            </span>
          </div>

          <ScoreRingGauge score={mockProfile.score} band={mockProfile.band} />

          <div className="mt-8 space-y-6">
            {/* Imputed Note */}
            <div className="bg-[#FFFBEB] border border-yellow-200 rounded-lg p-3 flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800 font-medium leading-relaxed">
                Note: 4 features estimated from district data. Upload consumption documents below to increase accuracy.
              </p>
            </div>

            {/* Data Completeness */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Data Completeness</span>
                <span>{mockProfile.dataCompleteness}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${mockProfile.dataCompleteness}%` }}></div>
              </div>
            </div>

            {/* SHAP Values */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Top Positive Factors</h4>
                <div className="space-y-2">
                  {shapPositive.map((f, i) => (
                    <div key={i} className="bg-green-50 p-2 rounded text-xs border-l-4 border-green-500 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 h-full bg-green-200/50 z-0" style={{ width: `${f.value}%` }}></div>
                      <div className="relative z-10 flex justify-between font-medium">
                        <span className="text-green-800 truncate pr-2" title={f.label}>{f.label}</span>
                        <span className="text-green-700">+{f.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Top Negative Factors</h4>
                <div className="space-y-2">
                  {shapNegative.map((f, i) => (
                    <div key={i} className="bg-red-50 p-2 rounded text-xs border-l-4 border-red-500 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 h-full bg-red-200/50 z-0" style={{ width: `${Math.abs(f.value)}%` }}></div>
                      <div className="relative z-10 flex justify-between font-medium">
                        <span className="text-red-800 truncate pr-2" title={f.label}>{f.label}</span>
                        <span className="text-red-700">{f.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
              <p className="text-xs text-blue-800 font-medium">
                Estimated income band: <strong>{mockProfile.incomeBand} (INR 1–3 Lakh/yr)</strong> based on electricity consumption priors.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: ACTIONS PANEL (25% -> ~3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Quick Actions</h3>
          
          <div className="flex flex-col space-y-3">
            {mockProfile.eligible && (
              <button className="w-full flex items-center justify-center text-sm font-bold text-white bg-green-600 px-4 py-3 rounded-lg hover:bg-green-700 transition shadow-sm">
                <Banknote className="w-4 h-4 mr-2" /> Apply for Loan
              </button>
            )}
            
            <button className="w-full flex items-center justify-center text-sm font-bold text-white bg-blue-600 px-4 py-3 rounded-lg hover:bg-blue-700 transition shadow-sm">
              <Zap className="w-4 h-4 mr-2" /> Re-Score Now
            </button>
            
            <button className="w-full flex items-center justify-center text-sm font-bold text-white bg-teal-600 px-4 py-3 rounded-lg hover:bg-teal-700 transition shadow-sm">
              <FileDown className="w-4 h-4 mr-2" /> Download SHAP PDF
            </button>
            
            <hr className="my-4 border-slate-100" />
            
            <button className="w-full flex items-center justify-center text-sm font-bold text-white bg-orange-500 px-4 py-3 rounded-lg hover:bg-orange-600 transition shadow-sm">
              <Flag className="w-4 h-4 mr-2" /> Flag for Review
            </button>
            
            <button className="w-full flex items-center justify-center text-sm font-bold text-white bg-purple-600 px-4 py-3 rounded-lg hover:bg-purple-700 transition shadow-sm">
              <StickyNote className="w-4 h-4 mr-2" /> Add Officer Note
            </button>
          </div>
        </div>
      </div>

      {/* FULL WIDTH: LOAN HISTORY */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Loan & Repayment History</h3>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={loanHistoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEmi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5'}} />
                <Area type="monotone" dataKey="emi" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorEmi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full lg:w-1/2 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Loan ID</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Tenure</th>
                  <th className="px-4 py-3">DPD</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-blue-700">L-9021</td>
                  <td className="px-4 py-3 font-medium text-slate-800">₹60,000</td>
                  <td className="px-4 py-3 text-slate-600">12 Months</td>
                  <td className="px-4 py-3 text-slate-600">0</td>
                  <td className="px-4 py-3"><span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">Active</span></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-blue-700">L-5432</td>
                  <td className="px-4 py-3 font-medium text-slate-800">₹25,000</td>
                  <td className="px-4 py-3 text-slate-600">6 Months</td>
                  <td className="px-4 py-3 text-slate-600">0</td>
                  <td className="px-4 py-3"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold border border-slate-200">Closed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FULL WIDTH: CONSUMPTION DATA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button 
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'electricity' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('electricity')}
          >
            Electricity Records
          </button>
          <button 
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'mobile' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('mobile')}
          >
            Mobile Recharges
          </button>
          <button 
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'utility' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('utility')}
          >
            Utility / Other
          </button>
          <div className="ml-auto flex items-center pr-2">
            <button className="flex items-center text-xs font-medium text-white bg-slate-700 px-3 py-1.5 rounded hover:bg-slate-800 transition shadow-sm">
              <Upload className="w-3 h-3 mr-1.5" /> Upload Document
            </button>
          </div>
        </div>
        <div className="p-6 flex flex-col lg:flex-row gap-8 bg-white">
          <div className="w-full lg:w-1/2 h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: '#F8FAFC'}} />
                <Bar dataKey="amount" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full lg:w-1/2 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">OCR Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800">June 2026</td>
                  <td className="px-4 py-3 font-medium">₹550</td>
                  <td className="px-4 py-3 text-slate-600">PDF Upload</td>
                  <td className="px-4 py-3"><span className="text-green-600 font-medium">0.98</span></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800">May 2026</td>
                  <td className="px-4 py-3 font-medium">₹600</td>
                  <td className="px-4 py-3 text-slate-600">SMS Extraction</td>
                  <td className="px-4 py-3"><span className="text-green-600 font-medium">0.95</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FULL WIDTH: AUDIT TRAIL */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Entity Audit Trail</h3>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center transition">
            View Full Audit <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
          </button>
        </div>
        <div className="p-6">
          <div className="relative border-l-2 border-slate-100 ml-2 space-y-6">
            {auditTrail.map((item) => (
              <div key={item.id} className="relative pl-6">
                <div className="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.action}</p>
                  <p className="text-xs text-slate-500 mt-0.5">by {item.actor} • {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
