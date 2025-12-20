'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  itemName: string;
  sku: string | null;
  category: string;
  qrCodeData: string | null;
  branch?: {
    id: string;
    name: string;
  };
}

export default function BulkQRPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchBranches();
    fetchInventory();
  }, [filterCategory, filterBranch]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      const data = await response.json();
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterBranch) params.append('branchId', filterBranch);

      const url = params.toString() ? `/api/inventory?${params}` : '/api/inventory';
      const response = await fetch(url);
      const data = await response.json();

      // Only show items with SKUs
      const itemsWithSku = data.inventory.filter((item: InventoryItem) => item.sku);
      setInventory(itemsWithSku);
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleAll = () => {
    if (selectedItems.size === inventory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(inventory.map((item) => item.id)));
    }
  };

  const handlePrint = () => {
    const selectedInventory = inventory.filter((item) => selectedItems.has(item.id));

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print QR codes');
      return;
    }

    // Build HTML for printing
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Codes</title>
          <style>
            @media print {
              @page {
                size: letter;
                margin: 0.5in;
              }
              .page-break {
                page-break-after: always;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin: 20px 0;
            }
            .qr-item {
              border: 2px solid #333;
              padding: 15px;
              text-align: center;
              page-break-inside: avoid;
            }
            .qr-item img {
              width: 150px;
              height: 150px;
              margin: 10px 0;
            }
            .item-name {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
            }
            .item-sku {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .item-branch {
              font-size: 11px;
              color: #999;
            }
            .no-qr {
              color: red;
              font-size: 12px;
            }
            @media screen {
              .qr-grid {
                max-width: 1200px;
                margin: 0 auto;
              }
            }
          </style>
        </head>
        <body>
          <h1>QR Code Labels</h1>
          <div class="qr-grid">
            ${selectedInventory
              .map(
                (item) => `
              <div class="qr-item">
                <div class="item-name">${item.itemName}</div>
                <div class="item-sku">SKU: ${item.sku}</div>
                ${item.branch ? `<div class="item-branch">${item.branch.name}</div>` : ''}
                ${
                  item.qrCodeData
                    ? `<img src="${item.qrCodeData}" alt="QR Code for ${item.sku}" />`
                    : '<div class="no-qr">QR Code not generated</div>'
                }
              </div>
            `
              )
              .join('')}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleGenerateSelected = async () => {
    const itemsNeedingQR = inventory.filter(
      (item) => selectedItems.has(item.id) && !item.qrCodeData
    );

    if (itemsNeedingQR.length === 0) {
      alert('All selected items already have QR codes');
      return;
    }

    const confirmed = confirm(
      `Generate QR codes for ${itemsNeedingQR.length} item(s)? This may take a moment.`
    );
    if (!confirmed) return;

    let successCount = 0;
    let failCount = 0;

    for (const item of itemsNeedingQR) {
      try {
        const response = await fetch('/api/qr-code/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: item.id }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Error generating QR for ${item.itemName}:`, error);
        failCount++;
      }
    }

    alert(`Generated ${successCount} QR codes. ${failCount} failed.`);
    fetchInventory();
  };

  if (loading) {
    return <div className="text-center py-8 text-white">Loading inventory...</div>;
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Bulk QR Code Management</h1>
          <p className="mt-2 text-gray-300">
            Generate and print QR codes for multiple items (SKU required)
          </p>
        </div>
        <Link href="/dashboard/warehouse" className="btn-secondary">
          Back to Warehouse
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input w-full"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Branch
            </label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="input w-full"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      {selectedItems.size > 0 && (
        <div className="card mb-6 bg-tron-orange/10 border border-tron-orange">
          <div className="flex justify-between items-center">
            <span className="text-white font-medium">
              {selectedItems.size} item(s) selected
            </span>
            <div className="flex gap-3">
              <button onClick={handleGenerateSelected} className="btn-secondary">
                Generate Missing QR Codes
              </button>
              <button onClick={handlePrint} className="btn-primary">
                Print Selected QR Codes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      {inventory.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">
            No items with SKUs found. Add SKUs to items to generate QR codes.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === inventory.length && inventory.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-600 text-tron-orange focus:ring-tron-orange"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tron-orange uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tron-orange uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tron-orange uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tron-orange uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tron-orange uppercase tracking-wider">
                  QR Code
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="rounded border-gray-600 text-tron-orange focus:ring-tron-orange"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {item.itemName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.branch?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.qrCodeData ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-900/50 text-green-300 border border-green-700">
                        Generated
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-900/50 text-yellow-300 border border-yellow-700">
                        Not Generated
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
