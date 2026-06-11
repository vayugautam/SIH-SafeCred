import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface SHAPFeature {
  feature: string;
  contribution: number;
  readable_label: string;
}

interface SHAPBarChartProps {
  positiveFactors: SHAPFeature[];
  negativeFactors: SHAPFeature[];
}

export const SHAPBarChart: React.FC<SHAPBarChartProps> = ({ positiveFactors, negativeFactors }) => {
  // Combine and sort by absolute contribution magnitude
  const data = [...positiveFactors, ...negativeFactors]
    .map(f => ({
      name: f.readable_label,
      value: f.contribution,
      isPositive: f.contribution > 0
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover text-popover-foreground border shadow-md p-3 rounded-md max-w-xs">
          <p className="font-semibold text-sm mb-1">{data.name}</p>
          <p className={`text-sm ${data.isPositive ? 'text-blue-500' : 'text-red-500'}`}>
            Impact: {data.value > 0 ? '+' : ''}{data.value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={150} 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isPositive ? '#3b82f6' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
