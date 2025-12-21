'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PdfUploadZone from '@/components/PdfUploadZone';
import BomDraftCard from '@/components/BomDraftCard';

interface BomDraft {
  id: string;
  name: string;
  description?: string | null;
  status: 'DRAFT' | 'PROCESSING' | 'PROCESSED' | 'SUBMITTED' | 'FAILED';
  pdfFileName: string;
  itemCount: number;
  createdBy: string;
  createdAt: string;
  aiProcessingError?: string | null;
}

export default function AIBomBuilderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [drafts, setDrafts] = useState<BomDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load drafts
  const loadDrafts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-bom/drafts');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load drafts');
      }

      setDrafts(data.drafts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      loadDrafts();
    }
  }, [status]);

  const handleUploadSuccess = async (draftId: string) => {
    setSuccessMessage('PDF uploaded successfully! Processing with AI...');
    setError(null);

    // Auto-process the draft
    try {
      const response = await fetch('/api/ai-bom/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bomDraftId: draftId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setSuccessMessage(`✅ ${data.message}`);
      loadDrafts();
    } catch (err: any) {
      setError(`Processing failed: ${err.message}`);
      loadDrafts();
    }
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccessMessage(null);
  };

  const handleReprocess = async (draftId: string) => {
    setSuccessMessage('Processing with AI...');
    setError(null);

    try {
      const response = await fetch('/api/ai-bom/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bomDraftId: draftId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setSuccessMessage(`✅ ${data.message}`);
      loadDrafts();
    } catch (err: any) {
      setError(`Processing failed: ${err.message}`);
      loadDrafts();
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    try {
      const response = await fetch(`/api/ai-bom/drafts/${draftId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Delete failed');
      }

      setSuccessMessage('Draft deleted successfully');
      loadDrafts();
    } catch (err: any) {
      setError(`Delete failed: ${err.message}`);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sherbet-orange dark:border-tron-orange"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white drop-shadow-sm mb-2">
          AI-Powered BOM Builder
        </h1>
        <p className="text-gray-700 dark:text-gray-300">
          Upload planset PDFs and let AI extract your materials list automatically
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Upload New Planset
            </h2>
            <PdfUploadZone
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        </div>

        {/* Drafts List Section */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            My BOM Drafts
          </h2>

          {drafts.length === 0 ? (
            <div className="card text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">
                No BOM drafts yet. Upload a planset to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <BomDraftCard
                  key={draft.id}
                  draft={draft}
                  onDelete={handleDelete}
                  onReprocess={handleReprocess}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
