import React from 'react';

/**
 * ScoreBar — shows a percentage match score with color coding
 * high ≥ 80%, medium 60-79%, low < 60%
 */
export function ScoreBar({ score }) {
  const pct = Math.round(score);
  const colorClass =
    pct >= 80 ? 'bg-primary' :
    pct >= 60 ? 'bg-amber-500' :
    'bg-error';
  const textClass =
    pct >= 80 ? 'text-primary' :
    pct >= 60 ? 'text-amber-600' :
    'text-error';

  return (
    <div className="flex items-center space-x-3">
      <div className="w-32 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold ${textClass}`}>{pct}%</span>
    </div>
  );
}

/**
 * ScoreCircle — circular percentage display for prominent metrics
 */
export function ScoreCircle({ score, size = 80 }) {
  const pct = Math.round(score);
  const radius = (size - 8) / 2;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ - (pct / 100) * circ;
  const colorClass =
    pct >= 80 ? '#565e74' :
    pct >= 60 ? '#b45309' :
    '#9f403d';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="4"
          stroke="#e4e2e5"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="4"
          stroke={colorClass}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span
        className="absolute text-sm font-bold"
        style={{ color: colorClass }}
      >
        {pct}%
      </span>
    </div>
  );
}

/**
 * StatusBadge — maps status strings to badge styles
 */
export function StatusBadge({ status }) {
  const map = {
    active: 'badge-active',
    'on hold': 'badge-hold',
    closed: 'badge-error',
    screening: 'badge-secondary',
    shortlisted: 'px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-bold rounded-full uppercase tracking-tight',
    'technical test': 'badge-secondary',
    'final interview': 'badge-secondary',
    'review needed': 'badge-error',
    hired: 'badge-active',
    rejected: 'badge-error',
  };

  const cls = map[status?.toLowerCase()] || 'badge-secondary';
  return <span className={cls}>{status}</span>;
}
