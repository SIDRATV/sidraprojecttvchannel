'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ResumeUploadPageProps {
  params: {
    uploadId: string;
    key: string;
  };
}

export default function ResumeUploadPage({
  params,
}: {
  params: Promise<{ uploadId: string; key: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const [uploadId, setUploadId] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [parts, setParts] = useState<{ PartNumber: number; ETag: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Get upload ID and key from URL params
    const id = searchParams.get('uploadId');
    const k = searchParams.get('key');

    if (!id || !k) {
      setError('Missing uploadId or key parameters');
      setLoading(false);
      return;
    }

    if (!session?.access_token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    setUploadId(id);
    setKey(k);
    setLoading(false);
  }, [searchParams, session]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    abortControllerRef.current = new AbortController();
    setError(null);
    setProgress(0);
    setStatus('Initializing upload...');

    try {
      // Calculate part size (5MB)
      const PART_SIZE = 5 * 1024 * 1024;
      const totalParts = Math.ceil(file.size / PART_SIZE);
      const uploadedParts: { PartNumber: number; ETag: string }[] = [];

      setStatus(`Uploading ${totalParts} parts...`);

      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Upload cancelled by user');
        }

        const start = (partNumber - 1) * PART_SIZE;
        const end = Math.min(start + PART_SIZE, file.size);
        const partData = file.slice(start, end);

        // Get presigned URL for this part
        const presignRes = await fetch('/api/admin/upload-video/multipart/part', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            key,
            uploadId,
            partNumber,
            contentLength: partData.size,
          }),
        });

        if (!presignRes.ok) {
          const errorData = await presignRes.json();
          throw new Error(`Failed to get presigned URL: ${errorData.error}`);
        }

        const { presignedUrl } = await presignRes.json();

        // Upload part
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          body: partData,
          headers: { 'Content-Type': 'application/octet-stream' },
          signal: abortControllerRef.current.signal,
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload part ${partNumber}`);
        }

        const etag = uploadRes.headers.get('etag') || '';
        uploadedParts.push({
          PartNumber: partNumber,
          ETag: etag.replace(/"/g, ''),
        });

        setProgress((partNumber / totalParts) * 100);
        setStatus(`Uploaded part ${partNumber}/${totalParts}`);
      }

      // Complete upload
      setParts(uploadedParts);
      setStatus('Completing upload...');

      const completeRes = await fetch('/api/admin/upload-video/multipart/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          key,
          uploadId,
          parts: uploadedParts,
        }),
      });

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(`Failed to complete upload: ${errorData.error}`);
      }

      setProgress(100);
      setStatus('Upload completed successfully! ✅');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message !== 'Upload cancelled by user') {
        setError(message);
      }
      setStatus('');
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatus('');
      setProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-bold text-white">Resume Upload</h1>
              <p className="text-xs text-slate-400">Continue uploading your file</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 space-y-6">
          {/* File Info */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
            <p className="text-sm text-slate-400">
              <strong>File Key:</strong> <code className="text-slate-300">{key}</code>
            </p>
            <p className="text-sm text-slate-400 mt-2">
              <strong>Upload ID:</strong>{' '}
              <code className="text-slate-300">{uploadId.substring(0, 20)}...</code>
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {progress === 100 && !error && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-400 flex gap-3">
              <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Success!</p>
                <p className="text-sm">Your file has been uploaded successfully.</p>
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              Select file to upload
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-lg p-8 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                disabled={progress > 0 && progress < 100}
                className="hidden"
              />
              <Upload className="h-12 w-12 mx-auto text-slate-500 mb-3" />
              <p className="text-slate-300 font-medium">Click to select file</p>
              <p className="text-xs text-slate-500 mt-1">
                or drag and drop your file here
              </p>
            </div>
          </div>

          {/* Progress */}
          {progress > 0 && progress < 100 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">{status}</span>
                <span className="text-sm text-slate-400">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <button
                onClick={handleCancel}
                className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Cancel Upload
              </button>
            </div>
          )}

          {progress === 100 && !error && (
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Back to Uploads
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
          <p className="font-medium mb-2">How to resume upload:</p>
          <ul className="space-y-1 list-disc list-inside text-xs">
            <li>
              Select the same file you were previously uploading (or a continuation)
            </li>
            <li>The upload will resume from where it left off</li>
            <li>Do not close this page or the browser during upload</li>
            <li>You can pause and resume by closing/reopening this page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
