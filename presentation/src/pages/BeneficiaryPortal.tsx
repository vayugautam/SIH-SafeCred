import React from 'react';
import { UploadCloud, FileText, CheckCircle } from 'lucide-react';
import { ScoreRing } from '../components/ScoreRing';

export const BeneficiaryPortal = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 animate-in zoom-in-95 duration-500">
      
      <div className="w-full max-w-3xl flex flex-col gap-8">
        
        <div className="text-center">
          <div className="w-16 h-16 bg-safecred-brand rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SafeCred Applicant Portal</h1>
          <p className="text-slate-500 mt-2">Welcome Rajesh. Build your credit profile seamlessly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Status Card */}
          <div className="card flex flex-col items-center justify-center text-center py-10 border-t-4 border-t-safecred-brand">
            <h3 className="font-bold text-slate-800 mb-6">Your Live Credit Score</h3>
            <ScoreRing score={810} band="A" size={160} strokeWidth={14} />
            <div className="mt-6 inline-flex items-center gap-2 bg-green-50 text-safecred-success px-4 py-2 rounded-full font-bold text-sm">
              <CheckCircle className="w-4 h-4" /> Eligible for Top Tier Loans
            </div>
          </div>

          {/* Action Card */}
          <div className="flex flex-col gap-6">
            <div className="card flex-1 flex flex-col justify-center">
              <h3 className="font-bold text-slate-800 mb-2">Boost Your Score</h3>
              <p className="text-sm text-slate-500 mb-4">Upload alternative data to improve your algorithmic assessment.</p>
              
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer group">
                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-safecred-brand transition mb-2" />
                <span className="text-sm font-medium text-slate-700">Upload Utility Bill</span>
                <span className="text-xs text-slate-400 mt-1">PDF, JPG up to 5MB</span>
              </div>
            </div>

            <button className="btn-primary w-full py-4 text-lg shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all">
              Apply for Loan Now
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};
