import React from 'react';
import { Database, Lock, UserCheck, Cpu, CheckCircle } from 'lucide-react';

const auditEvents = [
  { id: 1, time: '10:42:05 AM', user: 'System (ML)', action: 'Calculated updated CCS Score (810)', hash: '0x8f4a...9b2c', icon: <Cpu className="w-4 h-4" /> },
  { id: 2, time: '10:41:12 AM', user: 'Data Pipeline', action: 'Ingested 24 months electricity bill history', hash: '0x2c1d...4a7e', icon: <Database className="w-4 h-4" /> },
  { id: 3, time: '10:35:00 AM', user: 'Vault Integration', action: 'Decrypted Aadhaar PII for matching', hash: '0x99fe...11ab', icon: <Lock className="w-4 h-4" /> },
  { id: 4, time: '10:30:15 AM', user: 'Beneficiary', action: 'Submitted KYC Consent (OTP Verified)', hash: '0x44aa...88cc', icon: <UserCheck className="w-4 h-4" /> },
  { id: 5, time: '10:25:00 AM', user: 'Beneficiary', action: 'Profile Created', hash: '0x11bb...22dd', icon: <CheckCircle className="w-4 h-4" /> },
];

export const AuditViewer = () => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cryptographic Audit Trail</h1>
        <p className="text-slate-500 mt-1">Immutable ledger of all system actions, ML inferences, and data access.</p>
      </div>

      <div className="card relative">
        {/* Timeline Line */}
        <div className="absolute left-10 top-8 bottom-8 w-px bg-slate-200"></div>

        <div className="space-y-8 relative z-10">
          {auditEvents.map((event, i) => (
            <div key={event.id} className="flex gap-6 items-start">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0 ${i === 0 ? 'bg-safecred-brand text-white' : 'bg-slate-100 text-slate-500'}`}>
                {event.icon}
              </div>
              <div className="flex-1 pb-8 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-slate-800">{event.action}</h4>
                  <span className="text-xs text-slate-400 font-mono">{event.time}</span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">Actor: {event.user}</span>
                  <span className="text-xs font-mono text-slate-400">Block Hash: {event.hash}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
