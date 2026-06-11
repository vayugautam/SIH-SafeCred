import React from 'react';

type RiskBand = 'A' | 'B' | 'C' | 'D' | 'E';

interface BandBadgeProps {
  band: RiskBand;
}

const colors: Record<RiskBand, string> = {
  A: 'bg-risk-A text-white',
  B: 'bg-risk-B text-white',
  C: 'bg-risk-C text-white',
  D: 'bg-risk-D text-white',
  E: 'bg-risk-E text-white',
};

const labels: Record<RiskBand, string> = {
  A: 'Band A (Low Risk)',
  B: 'Band B (Low-Med Risk)',
  C: 'Band C (Med Risk)',
  D: 'Band D (High Risk)',
  E: 'Band E (Reject)',
};

export const BandBadge: React.FC<BandBadgeProps> = ({ band }) => {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm ${colors[band]}`}>
      {labels[band]}
    </span>
  );
};
