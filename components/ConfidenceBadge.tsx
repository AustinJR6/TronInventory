'use client';

import { MatchConfidence } from '@prisma/client';

interface ConfidenceBadgeProps {
  confidence: MatchConfidence;
  className?: string;
}

export default function ConfidenceBadge({ confidence, className = '' }: ConfidenceBadgeProps) {
  const config = {
    HIGH: {
      color: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
      dots: '● ● ●',
      label: 'High Confidence',
    },
    MEDIUM: {
      color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
      dots: '● ● ○',
      label: 'Medium Confidence',
    },
    LOW: {
      color: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
      dots: '● ○ ○',
      label: 'Low Confidence',
    },
    MANUAL: {
      color: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
      dots: '○ ○ ○',
      label: 'Manual Review',
    },
  };

  const { color, dots, label } = config[confidence];

  return (
    <span
      className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border ${color} ${className}`}
      title={label}
    >
      <span className="font-mono">{dots}</span>
      <span>{label}</span>
    </span>
  );
}
