import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ShapFactor {
  feature: string;
  contribution: number;
  label: string;
  value: string;
}

interface ShapBarChartProps {
  data: ShapFactor[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 shadow-md p-3 rounded-lg text-sm">
        <p className="font-bold text-slate-800 mb-1">{data.label}</p>
        <p className="text-slate-600">Actual Value: <span className="font-medium">{data.value}</span></p>
        <p className={data.contribution >= 0 ? 'text-safecred-success' : 'text-safecred-danger'}>
          Impact: {data.contribution > 0 ? '+' : ''}{data.contribution.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export const ShapBarChart: React.FC<ShapBarChartProps> = ({ data }) => {
  // Sort data so largest positive impacts are at top, largest negative at bottom
  const sortedData = [...data].sort((a, b) => b.contribution - a.contribution);

  return (
    <div className="h-80 w-full font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" stroke="#64748b" />
          <YAxis 
            dataKey="label" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#475569', fontSize: 12 }} 
            width={120} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
          <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
            {sortedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.contribution >= 0 ? '#2563eb' : '#ef4444'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
