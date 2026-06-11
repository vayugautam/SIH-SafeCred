import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ScoreRing } from '../components/ScoreRing';
import { ShapBarChart } from '../components/ShapBarChart';
import { BandBadge } from '../components/BandBadge';
import { ArrowLeft, FileText, CheckCircle, XCircle } from 'lucide-react';

const mockShapData = [
  { feature: 'Days Past Due', contribution: -45.2, label: 'Max DPD', value: '30 Days' },
  { feature: 'Repayment Ratio', contribution: 62.4, label: 'On-time Repayment %', value: '85%' },
  { feature: 'Income Category', contribution: 25.1, label: 'Income Band Proxy', value: 'Band 2' },
  { feature: 'Missing Data Penalty', contribution: -15.0, label: 'Data Completeness', value: '80%' },
  { feature: 'Socioeconomic Index', contribution: 12.8, label: 'District SEI', value: '620' },
];

export const BeneficiaryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500 pb-12">
      
      {/* Header Actions */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Beneficiary Profile</h1>
          <p className="text-slate-500 text-sm">{id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Identity & Actions */}
        <div className="flex flex-col gap-6">
          <div className="card text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full mb-4 border-4 border-white shadow-sm flex items-center justify-center">
              <span className="text-3xl font-bold text-slate-400">RK</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Rajesh Kumar</h2>
            <p className="text-slate-500 text-sm mb-4">Delhi (Code: DEL01)</p>
            <BandBadge band="A" />
            
            <div className="w-full h-px bg-slate-100 my-6"></div>
            
            <div className="w-full flex flex-col gap-3">
              <button className="btn-primary w-full flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Approve Loan
              </button>
              <button className="btn-secondary w-full flex items-center justify-center gap-2 text-safecred-danger hover:bg-red-50 hover:text-safecred-danger hover:border-red-200">
                <XCircle className="w-4 h-4" /> Reject Profile
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Ingested Documents
            </h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-600">Electricity Bill</span>
                <span className="text-safecred-success font-medium">Verified</span>
              </li>
              <li className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-600">Aadhaar KYC</span>
                <span className="text-safecred-success font-medium">Verified</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Bank Statement</span>
                <span className="text-safecred-warning font-medium">Processing...</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Middle/Right Column: ML Insights */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card flex flex-col items-center justify-center py-10">
              <h3 className="font-bold text-slate-800 mb-6 w-full text-left">Current CCS Score</h3>
              <ScoreRing score={810} band="A" size={180} strokeWidth={16} />
              <p className="text-slate-500 text-sm mt-6 text-center">Score calculated automatically on Oct 12, 2023</p>
            </div>
            
            <div className="card">
              <h3 className="font-bold text-slate-800 mb-4">Risk Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Data Completeness</span>
                    <span className="font-bold text-slate-800">85%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-safecred-brand h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Repayment Probability</span>
                    <span className="font-bold text-safecred-success">High</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-safecred-success h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card flex-1">
            <div className="mb-6">
              <h3 className="font-bold text-slate-800">SHAP Explanation (Algorithmic Insight)</h3>
              <p className="text-sm text-slate-500">Visual breakdown of the mathematical factors contributing to this beneficiary's score.</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <ShapBarChart data={mockShapData} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
