'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import BomReviewTable from '@/components/BomReviewTable';
import Link from 'next/link';

export default function BomReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const draftId = params?.id as string;

  const [draft, setDraft] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && draftId) {
      loadDraft();
      loadInventory();
    }
  }, [status, draftId]);

  const loadDraft = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai-bom/drafts/${draftId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load draft');
      }

      setDraft(data.bomDraft);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      const data = await response.json();

      if (response.ok) {
        setInventory(data.inventory);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  };

  const handleSave = async (updatedItems: any[]) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai-bom/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save changes');
      }

      setSuccessMessage('Changes saved successfully');
      loadDraft();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Submit this BOM as an order?')) {
      return;
    }

    try {
      const response = await fetch('/api/ai-bom/submit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bomDraftId: draftId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit order');
      }

      alert(`✅ ${data.message}`);
      router.push('/dashboard/my-orders');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sherbet-orange dark:border-tron-orange"></div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">Draft not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/ai-bom-builder"
          className="text-sm text-sherbet-orange dark:text-tron-orange hover:underline mb-2 inline-block font-medium"
        >
          ← Back to BOM Builder
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white drop-shadow-sm mb-2">{draft.name}</h1>
        {draft.description && (
          <p className="text-gray-700 dark:text-gray-300">{draft.description}</p>
        )}

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-700 dark:text-gray-400">
          <span>📄 {draft.pdfFileName}</span>
          <span>📦 {draft.items.length} items extracted</span>
        </div>
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

      <div className="card">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Review & Match Items
        </h2>

        <BomReviewTable
          items={draft.items}
          warehouseInventory={inventory}
          onSave={handleSave}
          onSubmit={handleSubmit}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
