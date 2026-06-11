import React, { useState } from 'react';
import { 
  Search, Filter, Calendar, X, CheckCircle, XCircle, 
  Eye, Zap, FileText, UserPlus, Download, RefreshCw, Package, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

// =========================================================================
// MOCK DATA
// =========================================================================

const MOCK_BENEFICIARIES = [
  { id: 'BEN-004521', name: 'Ramesh Kumar', band: 'B', score: 680, incomeBand: 'LIG', lastScored: '3 days ago', eligible: true },
  { id: 'BEN-004522', name: 'Sita Devi', band: 'A', score: 810, incomeBand: 'EWS', lastScored: '10 hrs ago', eligible: true },
  { id: 'BEN-004523', name: 'Arjun Singh', band: 'D', score: 420, incomeBand: 'MIG-I', lastScored: '45 days ago', eligible: false },
  { id: 'BEN-004524', name: 'Priya Verma', band: 'C', score: 550, incomeBand: 'LIG', lastScored: '2 days ago', eligible: true },
  { id: 'BEN-004525', name: 'Anil Das', band: 'E', score: 290, incomeBand: 'EWS', lastScored: '5 hrs ago', eligible: false },
  { id: 'BEN-004526', name: 'Sunita Patel', band: 'A', score: 760, incomeBand: 'MIG-II', lastScored: '1 week ago', eligible: true },
];

export default function BeneficiaryDirectory() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibleOnly, setEligibleOnly] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === MOCK_BENEFICIARIES.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(MOCK_BENEFICIARIES.map(b => b.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* HEADER & TOP BUTTONS */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Beneficiary Directory</h2>
          <p className="text-sm text-slate-500 mt-1">Manage and re-score applicant risk profiles</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center text-sm font-medium text-teal-700 bg-white border border-teal-600 px-4 py-2 rounded-lg hover:bg-teal-50 transition">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </button>
          <button className="flex items-center text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
            <UserPlus className="w-4 h-4 mr-2" /> Add Beneficiary
          </button>
        </div>
      </div>

      {/* STICKY FILTER BAR */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-0 z-10 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Name, NBCFDC ID, Aadhaar last-4..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 min-w-[120px]">
          <option value="">All Bands</option>
          <option value="A">Band A (Lowest Risk)</option>
          <option value="B">Band B</option>
          <option value="C">Band C</option>
          <option value="D">Band D</option>
          <option value="E">Band E (Highest Risk)</option>
        </select>

        <select className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 min-w-[140px]">
          <option value="">All States</option>
          <option value="MH">Maharashtra</option>
          <option value="UP">Uttar Pradesh</option>
          <option value="MP">Madhya Pradesh</option>
        </select>

        <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white cursor-pointer">
          <Calendar className="w-4 h-4 text-slate-500 mr-2" />
          <span className="text-sm text-slate-700">Date Range</span>
        </div>

        {/* ELIGIBLE TOGGLE */}
        <label className="flex items-center cursor-pointer ml-2">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={eligibleOnly}
              onChange={() => setEligibleOnly(!eligibleOnly)}
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${eligibleOnly ? 'bg-green-600' : 'bg-slate-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${eligibleOnly ? 'transform translate-x-4' : ''}`}></div>
          </div>
          <span className="ml-3 text-sm font-medium text-slate-700">Eligible Only</span>
        </label>

        <button className="text-sm text-red-600 font-medium hover:underline ml-auto flex items-center">
          <X className="w-4 h-4 mr-1" /> Clear Filters
        </button>
      </div>

      {/* BULK ACTIONS BAR (Appears when items are selected) */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} beneficiaries selected
          </span>
          <div className="flex gap-3">
            <button className="flex items-center text-sm font-medium text-white bg-purple-600 px-3 py-1.5 rounded hover:bg-purple-700 transition">
              <RefreshCw className="w-4 h-4 mr-2" /> Bulk Re-Score
            </button>
            <button className="flex items-center text-sm font-medium text-white bg-slate-600 px-3 py-1.5 rounded hover:bg-slate-700 transition">
              <Package className="w-4 h-4 mr-2" /> Bulk Export CSV
            </button>
          </div>
        </div>
      )}

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold sticky top-0 z-0">
              <tr>
                <th className="px-6 py-4 w-[50px]">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    checked={selectedIds.size === MOCK_BENEFICIARIES.length && MOCK_BENEFICIARIES.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4">NBCFDC ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Risk Band</th>
                <th className="px-6 py-4">Composite Score</th>
                <th className="px-6 py-4">Income Band</th>
                <th className="px-6 py-4">Last Scored</th>
                <th className="px-6 py-4 text-center">Eligible</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_BENEFICIARIES.map((b) => (
                <tr key={b.id} className="hover:bg-[#EFF6FF] transition-colors group">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      checked={selectedIds.has(b.id)}
                      onChange={() => toggleSelect(b.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/beneficiaries/${b.id}`} className="font-mono font-medium text-[#1A3A6B] hover:text-blue-600 hover:underline">
                      {b.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    <div className="truncate max-w-[150px]" title={b.name}>{b.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm ${getBandBgColor(b.band)}`}>
                      Band {b.band}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 w-32">
                      <span className="font-bold text-slate-700">{b.score} / 1000</span>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getScoreBarColor(b.score)}`} 
                          style={{ width: `${(b.score / 1000) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold border border-slate-200">
                      {b.incomeBand}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${b.lastScored.includes('days') && parseInt(b.lastScored) > 30 ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                      {b.lastScored}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      {b.eligible ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded" title="Re-Score Now">
                        <Zap className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded" title="SHAP Report">
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
          <span className="text-sm text-slate-600 font-medium">
            Showing 1-50 of 12,430 beneficiaries
          </span>
          <div className="flex gap-2">
            <button className="p-2 border border-slate-300 rounded-md bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 border border-slate-300 rounded-md bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

function getBandBgColor(band: string) {
  switch(band) {
    case 'A': return 'bg-[#16A34A]';
    case 'B': return 'bg-[#2563EB]';
    case 'C': return 'bg-[#D97706]';
    case 'D': return 'bg-[#EA580C]';
    case 'E': return 'bg-[#DC2626]';
    default: return 'bg-slate-500';
  }
}

function getScoreBarColor(score: number) {
  if (score < 300) return 'bg-[#DC2626]';       // Red
  if (score < 450) return 'bg-[#EA580C]';       // Orange
  if (score < 600) return 'bg-[#D97706]';       // Amber/Yellow
  if (score < 750) return 'bg-[#16A34A]';       // Green
  return 'bg-[#2563EB]';                        // Blue for highest scores
}
