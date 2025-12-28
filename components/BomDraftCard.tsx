'use client';

import { BomStatus } from '@prisma/client';
import Link from 'next/link';

interface BomDraftCardProps {
  draft: {
    id: string;
    name: string;
    description?: string | null;
    status: BomStatus;
    pdfFileName: string;
    itemCount: number;
    createdBy: string;
    createdAt: string;
    aiProcessingError?: string | null;
  };
  onDelete?: (id: string) => void;
  onReprocess?: (id: string) => void;
}

export default function BomDraftCard({ draft, onDelete, onReprocess }: BomDraftCardProps) {
  const statusConfig = {
    DRAFT: { color: 'badge bg-gray-200 dark:bg-gray-700 text-ocean-muted dark:text-ocean-muted-dark', label: 'Draft' },
    PROCESSING: { color: 'badge bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300', label: 'Processing...' },
    PROCESSED: { color: 'badge bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300', label: 'Processed' },
    SUBMITTED: { color: 'badge bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300', label: 'Submitted' },
    FAILED: { color: 'badge bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300', label: 'Failed' },
  };

  const { color, label } = statusConfig[draft.status];

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold dark:text-white">{draft.name}</h3>
            <span className={color}>{label}</span>
          </div>

          {draft.description && (
            <p className="text-sm text-ocean-muted dark:text-ocean-muted-dark mb-2">
              {draft.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>📄 {draft.pdfFileName}</span>
            <span>📦 {draft.itemCount} items</span>
            <span>👤 {draft.createdBy}</span>
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Created {new Date(draft.createdAt).toLocaleDateString()}
          </div>

          {draft.status === 'FAILED' && draft.aiProcessingError && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
              Error: {draft.aiProcessingError}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {draft.status === 'PROCESSED' && (
          <Link
            href={`/dashboard/ai-bom-builder/${draft.id}`}
            className="btn-primary text-sm"
          >
            Review & Submit
          </Link>
        )}

        {draft.status === 'DRAFT' && (
          <button
            onClick={() => onReprocess?.(draft.id)}
            className="btn-primary text-sm"
          >
            Process with AI
          </button>
        )}

        {draft.status === 'FAILED' && (
          <button
            onClick={() => onReprocess?.(draft.id)}
            className="btn-primary text-sm"
          >
            Retry Processing
          </button>
        )}

        {draft.status !== 'SUBMITTED' && draft.status !== 'PROCESSING' && (
          <button
            onClick={() => onDelete?.(draft.id)}
            className="btn-secondary text-sm"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
