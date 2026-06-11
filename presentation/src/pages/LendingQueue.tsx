import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { BandBadge } from '../components/BandBadge';

const queueData = [
  { id: 'LN-9921', name: 'Amit Singh', amount: '₹50,000', purpose: 'Education', score: 680, band: 'B', daysWaiting: 2 },
  { id: 'LN-9922', name: 'Priya Sharma', amount: '₹1,20,000', purpose: 'Business', score: 480, band: 'C', daysWaiting: 5 },
  { id: 'LN-9923', name: 'Vikram Patel', amount: '₹25,000', purpose: 'Agriculture', score: 310, band: 'D', daysWaiting: 1 },
  { id: 'LN-9924', name: 'Sunita Devi', amount: '₹75,000', purpose: 'Business', score: 590, band: 'C', daysWaiting: 4 },
];

export const LendingQueue = () => {
  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manual Decision Queue</h1>
        <p className="text-slate-500 mt-1">Review loan applications that require human intervention.</p>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-4 px-6 text-sm font-semibold text-slate-600">App ID</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-600">Applicant</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-600">Loan Details</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-600">Risk Profile</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-600">Wait Time</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queueData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-6 text-sm font-mono text-slate-500">{item.id}</td>
                  <td className="py-4 px-6 text-sm font-medium text-slate-900">{item.name}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className="font-bold text-slate-800 block">{item.amount}</span>
                    <span className="text-xs text-slate-500">{item.purpose}</span>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <div className="flex items-center gap-2">
                      <BandBadge band={item.band as any} />
                      <span className="font-bold text-slate-700">{item.score}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <div className={`flex items-center gap-1 ${item.daysWaiting > 3 ? 'text-safecred-danger font-bold' : 'text-slate-500'}`}>
                      <Clock className="w-4 h-4" /> {item.daysWaiting} Days
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-right flex justify-end gap-2">
                    <button className="p-2 text-safecred-success hover:bg-green-50 rounded-full transition-colors" title="Approve">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-safecred-danger hover:bg-red-50 rounded-full transition-colors" title="Reject">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
