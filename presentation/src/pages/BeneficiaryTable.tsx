import React, { useState, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search, Filter } from 'lucide-react';
import { BandBadge } from '../components/BandBadge';
import { useNavigate } from 'react-router-dom';

type Beneficiary = {
  id: string;
  name: string;
  district: string;
  score: number;
  band: 'A' | 'B' | 'C' | 'D' | 'E';
  loanStatus: string;
  lastUpdated: string;
};

const mockData: Beneficiary[] = [
  { id: 'BEN-001', name: 'Rajesh Kumar', district: 'Delhi', score: 810, band: 'A', loanStatus: 'Approved', lastUpdated: '2023-10-12' },
  { id: 'BEN-002', name: 'Sunita Devi', district: 'Mumbai', score: 620, band: 'B', loanStatus: 'Pending', lastUpdated: '2023-10-14' },
  { id: 'BEN-003', name: 'Amit Singh', district: 'Pune', score: 480, band: 'C', loanStatus: 'Manual Review', lastUpdated: '2023-10-15' },
  { id: 'BEN-004', name: 'Priya Sharma', district: 'Delhi', score: 310, band: 'D', loanStatus: 'Rejected', lastUpdated: '2023-10-16' },
  { id: 'BEN-005', name: 'Vikram Patel', district: 'Ahmedabad', score: 150, band: 'E', loanStatus: 'Rejected', lastUpdated: '2023-10-16' },
];

const columnHelper = createColumnHelper<Beneficiary>();

export const BeneficiaryTable = () => {
  const navigate = useNavigate();
  const [data] = useState(() => [...mockData]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(() => [
    columnHelper.accessor('id', {
      header: 'Beneficiary ID',
      cell: info => <span className="font-mono text-sm text-slate-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => <span className="font-medium text-slate-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor('district', {
      header: 'District',
    }),
    columnHelper.accessor('score', {
      header: 'CCS Score',
      cell: info => <span className="font-bold text-slate-800">{info.getValue()}</span>,
    }),
    columnHelper.accessor('band', {
      header: 'Risk Band',
      cell: info => <BandBadge band={info.getValue()} />,
    }),
    columnHelper.accessor('loanStatus', {
      header: 'Status',
      cell: info => {
        const val = info.getValue();
        return (
          <span className={`text-sm ${val === 'Approved' ? 'text-safecred-success font-semibold' : 'text-slate-500'}`}>
            {val}
          </span>
        );
      }
    }),
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Beneficiaries Directory</h1>
          <p className="text-slate-500 mt-1">Manage and audit individual credit profiles.</p>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ID or Name..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-safecred-brand focus:border-transparent"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-slate-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="py-4 px-6 text-sm font-semibold text-slate-600">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                  <th className="py-4 px-6 text-sm font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="py-4 px-6 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  <td className="py-4 px-6 text-sm text-right">
                    <button 
                      onClick={() => navigate(`/beneficiary/${row.original.id}`)}
                      className="text-safecred-brand hover:text-blue-800 font-medium transition"
                    >
                      View Profile &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Stub */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center text-sm text-slate-600">
          <span>Showing 1 to 5 of 24,592 entries</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
