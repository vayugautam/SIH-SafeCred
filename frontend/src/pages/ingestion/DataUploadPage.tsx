import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, CheckCircle, AlertCircle, FileDown, 
  Trash2, RefreshCw, Terminal, X, AlertTriangle, FileSpreadsheet, Download
} from 'lucide-react';

// =========================================================================
// MOCK DATA
// =========================================================================

const mockJobs = [
  { id: 'JOB-8842', file: 'MH_Repayments_May2026.csv', uploader: 'S. Gupta (Officer)', status: 'DONE', records: 12450, date: '10 mins ago' },
  { id: 'JOB-8843', file: 'UP_Utility_Priors_Q2.csv', uploader: 'System API', status: 'PROCESSING', records: 45000, date: 'Just now' },
  { id: 'JOB-8844', file: 'KA_Loan_Applicants.csv', uploader: 'R. Sharma (Partner)', status: 'FAILED', records: 820, date: '1 hr ago' },
  { id: 'JOB-8845', file: 'BR_Consumption_Data.csv', uploader: 'API Gateway', status: 'QUEUED', records: 0, date: '2 hrs ago' },
];

const mockLogs = [
  '[10:23:41] INFO: Initializing Airflow DAG for Gov Sync...',
  '[10:23:42] INFO: Connecting to UIDAI Data Vault...',
  '[10:23:44] SUCCESS: Authenticated successfully.',
  '[10:23:45] INFO: Pulling delta records since 2026-06-07...',
  '[10:23:48] WARN: PMGDISHA endpoint latency > 2000ms. Retrying...',
  '[10:23:51] INFO: Batch 1/5 downloaded (14,200 records).',
  '[10:23:55] INFO: Running schema validation via Pydantic...',
  '[10:23:59] SUCCESS: Schema validation passed. Pushing to TimescaleDB.'
];

// =========================================================================
// INGESTION COMPONENT
// =========================================================================

export default function DataUploadPage() {
  const [fileStatus, setFileStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid' | 'uploading' | 'complete'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>(mockLogs.slice(0, 3));

  // Simulate terminal logs streaming in
  useEffect(() => {
    const timer = setInterval(() => {
      setTerminalLogs(prev => {
        if (prev.length >= mockLogs.length) {
          clearInterval(timer);
          return prev;
        }
        // safely get the next log
        const nextLog = mockLogs[prev.length];
        if (!nextLog) return prev;
        return [...prev, nextLog];
      });
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    simulateUploadFlow();
  };

  const handleFileInput = (e: React.ChangeEvent) => {
    simulateUploadFlow();
  };

  const simulateUploadFlow = () => {
    setFileStatus('validating');
    // Simulate validation
    setTimeout(() => {
      setFileStatus('valid');
      // Automatically start upload after validation success
      setTimeout(() => {
        setFileStatus('uploading');
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            setFileStatus('complete');
            setTimeout(() => {
              setFileStatus('idle');
              setUploadProgress(0);
            }, 3000);
          }
        }, 200);
      }, 1000);
    }, 800);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Data Upload & Ingestion Center</h2>
          <p className="text-sm text-slate-500 mt-1">ETL pipeline management, bulk CSV ingestion, and Gov API synchronization.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLS: UPLOAD & JOBS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Drag & Drop Zone */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Bulk Data Ingestion</h3>
            
            {/* Inline Validator Alerts */}
            {fileStatus === 'valid' && (
              <div className="bg-[#F0FDF4] border border-green-200 rounded-lg p-3 flex items-center mb-4 text-green-800 text-sm font-bold">
                <CheckCircle className="w-5 h-5 mr-2" /> Valid format detected. Schema perfectly matches expected headers.
              </div>
            )}
            {fileStatus === 'invalid' && (
              <div className="bg-[#FEF2F2] border border-red-200 rounded-lg p-3 flex items-center mb-4 text-red-800 text-sm font-bold">
                <AlertCircle className="w-5 h-5 mr-2" /> Schema mismatch! Missing required column: `loan_amount_paise`.
              </div>
            )}

            {/* Dropzone */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="bg-[#EFF6FF] border-2 border-dashed border-[#2563EB] rounded-xl h-[280px] flex flex-col items-center justify-center transition hover:bg-blue-50 cursor-pointer relative"
            >
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handleFileInput}
                disabled={fileStatus === 'uploading' || fileStatus === 'validating'}
              />
              
              <UploadCloud className={`w-16 h-16 text-[#2563EB] mb-4 ${fileStatus === 'uploading' ? 'animate-bounce' : ''}`} />
              <p className="text-lg font-bold text-slate-800">Drag & Drop CSV files here</p>
              <p className="text-sm text-slate-500 mt-2">or click to browse from your computer</p>
              <p className="text-xs font-bold text-blue-600 mt-4 bg-blue-100 px-3 py-1 rounded-full">Max filesize: 500MB via Multer chunking</p>
            </div>

            {/* Progress Bar */}
            {fileStatus === 'uploading' && (
              <div className="mt-6">
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Uploading to S3 / MinIO...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#2563EB] h-full rounded-full transition-all duration-200 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
            {fileStatus === 'complete' && (
              <div className="mt-6 text-sm font-bold text-green-600 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" /> Upload Complete! Job queued for processing.
              </div>
            )}
          </div>

          {/* Job Status Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-slate-800">Recent ETL Jobs</h3>
              <button className="flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded transition">
                <Trash2 className="w-4 h-4 mr-1.5" /> Clear Completed
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Job ID</th>
                    <th className="px-4 py-3">File Name</th>
                    <th className="px-4 py-3">Uploaded By</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Records</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockJobs.map((job) => (
                    <tr 
                      key={job.id} 
                      className={`hover:bg-slate-50 transition ${job.status === 'FAILED' ? 'cursor-pointer' : ''}`}
                      onClick={() => job.status === 'FAILED' ? setShowErrorModal(true) : null}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-600">{job.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{job.file}</td>
                      <td className="px-4 py-3 text-slate-600">{job.uploader}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${
                          job.status === 'DONE' ? 'bg-green-100 text-green-800 border border-green-200' :
                          job.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse' :
                          job.status === 'FAILED' ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{job.records.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{job.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TERMINAL & TEMPLATES */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Real-time Log Stream */}
          <div className="bg-[#0A1628] rounded-xl shadow-sm border border-slate-800 p-0 flex flex-col overflow-hidden h-[350px]">
            <div className="bg-slate-900 px-4 py-2 flex items-center border-b border-slate-800">
              <Terminal className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live ETL Telemetry</span>
              <div className="ml-auto flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs leading-relaxed">
              {terminalLogs.map((log, i) => (
                <div key={i} className={`mb-1 ${
                  log?.includes('SUCCESS') ? 'text-green-400' : 
                  log?.includes('WARN') ? 'text-yellow-400' : 
                  log?.includes('ERROR') ? 'text-red-400' : 
                  'text-slate-300'
                }`}>
                  {log}
                </div>
              ))}
              <div className="text-slate-500 mt-2 animate-pulse">_</div>
            </div>
          </div>

          {/* Gov Dataset Sync */}
          <div className="bg-[#F0FDF4] rounded-xl shadow-sm border border-green-200 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-green-900 mb-2">Gov Dataset Sync</h3>
            <p className="text-sm text-green-800 mb-4">SECC, NSS, PMGDISHA APIs</p>
            <div className="bg-white rounded-lg p-3 mb-4 text-xs font-bold text-slate-600 border border-green-100">
              Last Sync: Today, 02:00 AM IST<br/>
              Next Scheduled: Tomorrow, 02:00 AM IST
            </div>
            <button className="mt-auto w-full flex items-center justify-center text-sm font-bold text-white bg-[#16A34A] px-4 py-2.5 rounded-lg hover:bg-green-700 transition shadow-sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Sync Datasets Now
            </button>
          </div>

          {/* Templates */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Schema Templates</h3>
            <div className="space-y-3">
              {[
                { title: 'Loan Applicants CSV', type: 'loan' },
                { title: 'Historic Repayments CSV', type: 'repayment' },
                { title: 'Consumption/Utility CSV', type: 'consumption' },
              ].map((tmpl, i) => (
                <button key={i} className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-teal-300 transition group">
                  <div className="flex items-center">
                    <FileSpreadsheet className="w-5 h-5 text-teal-600 mr-3" />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-teal-700 transition">{tmpl.title}</span>
                  </div>
                  <FileDown className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ERROR MODAL (Absolute Overlay) */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[80vh]">
            <div className="p-4 bg-[#FEF2F2] border-b border-red-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-red-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" /> Ingestion Failure Report
              </h3>
              <button onClick={() => setShowErrorModal(false)} className="text-red-500 hover:text-red-700 transition p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-sm font-bold text-slate-700 mb-4">Job ID: <span className="font-mono text-blue-600">JOB-8844</span></p>
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-xs">
                  <span className="text-red-600 font-bold">Row 45:</span> Validation Error - `loan_amount_paise` must be an integer. Found: "50,000"
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-xs">
                  <span className="text-red-600 font-bold">Row 112:</span> Format Error - Date `2026/05/12` does not match ISO8601 YYYY-MM-DD.
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-xs">
                  <span className="text-red-600 font-bold">Row 389:</span> Logic Error - Disbursal date cannot be in the future.
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowErrorModal(false)} className="px-4 py-2 rounded font-bold text-slate-600 hover:bg-slate-200 transition">
                Close
              </button>
              <button className="flex items-center px-4 py-2 rounded-lg font-bold text-white bg-[#DC2626] hover:bg-red-700 transition shadow-sm">
                <Download className="w-4 h-4 mr-2" /> Download Error CSV
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
