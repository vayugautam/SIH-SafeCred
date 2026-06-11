import React from 'react';

interface ScoreRingChartProps {
  score: number; // 0 to 1000
  size?: number;
  band: 'A' | 'B' | 'C' | 'D' | 'E' | 'UNKNOWN';
}

export const ScoreRingChart: React.FC<ScoreRingChartProps> = ({ score, size = 120, band }) => {
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Score is out of 1000
  const percent = Math.max(0, Math.min(100, (score / 1000) * 100));
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const getBandColor = (b: string) => {
    switch (b) {
      case 'A': return 'text-emerald-500';
      case 'B': return 'text-blue-500';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      case 'E': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${getBandColor(band)} transition-all duration-1000 ease-in-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-outfit text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
};
