'use client';

import { useState, useRef } from 'react';

interface PdfUploadZoneProps {
  onUploadSuccess: (draftId: string) => void;
  onUploadError: (error: string) => void;
}

export default function PdfUploadZone({ onUploadSuccess, onUploadError }: PdfUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bomName, setBomName] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      onUploadError('Only PDF files are accepted');
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      onUploadError('PDF must be under 50MB');
      return;
    }

    // Auto-generate name if not provided
    const finalName = bomName.trim() || file.name.replace('.pdf', '');

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', finalName);
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const response = await fetch('/api/ai-bom/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Reset form
      setBomName('');
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess(data.bomDraft.id);
    } catch (error: any) {
      onUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 dark:text-white">
          BOM Name
        </label>
        <input
          type="text"
          value={bomName}
          onChange={(e) => setBomName(e.target.value)}
          placeholder="e.g., Main Street Solar - Phase 1"
          className="input-field"
          disabled={isUploading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 dark:text-white">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add any notes about this project..."
          rows={2}
          className="input-field"
          disabled={isUploading}
        />
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging
            ? 'border-sherbet-orange dark:border-tron-orange bg-sherbet-orange/10 dark:bg-tron-orange/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-sherbet-orange dark:hover:border-tron-orange'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sherbet-orange dark:border-tron-orange mx-auto"></div>
            <p className="text-sm dark:text-gray-300">Uploading PDF...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm dark:text-gray-300">
              <span className="font-semibold text-sherbet-orange dark:text-tron-orange">
                Click to upload
              </span>{' '}
              or drag and drop
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PDF files only, up to 10MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
