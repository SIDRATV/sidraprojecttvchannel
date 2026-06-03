'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, RotateCw, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface IncompleteUpload {
  key: string;
  uploadId: string;
  initiatedAt: string;
  fileSize: string;
}

export function IncompleteUploadsManager() {
  const router = useRouter();
  const [uploads, setUploads] = useState<IncompleteUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aborting, setAborting] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchIncompleteUploads();
  }, []);

  const fetchIncompleteUploads = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/admin/upload-video/multipart/list', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch incomplete uploads');
      }

      const data = await response.json();
      setUploads(data.uploads || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching incomplete uploads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAbortUpload = async (key: string, uploadId: string) => {
    if (!confirm(`Are you sure you want to abort this upload?\n\nFile: ${key}`)) {
      return;
    }

    try {
      setAborting((prev) => new Set([...prev, uploadId]));

      // Get session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/admin/upload-video/multipart/abort', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ key, uploadId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to abort upload');
      }

      // Remove from list
      setUploads((prev) => prev.filter((u) => u.uploadId !== uploadId));
      console.log(`✅ Upload aborted: ${key}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to abort upload: ${message}`);
      console.error('Error aborting upload:', err);
    } finally {
      setAborting((prev) => {
        const next = new Set(prev);
        next.delete(uploadId);
        return next;
      });
    }
  };

  const handleResumeUpload = (key: string, uploadId: string) => {
    // Navigate to resume upload page with params
    const encoded = encodeURIComponent(uploadId);
    router.push(`/admin/upload-video/resume/${encoded}?uploadId=${encoded}&key=${encodeURIComponent(key)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
          <p className="mt-2 text-gray-600">Loading incomplete uploads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-800">
        <h3 className="font-semibold">Error loading uploads</h3>
        <p className="mt-2 text-sm">{error}</p>
        <button
          onClick={fetchIncompleteUploads}
          className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 p-6 text-center text-blue-800">
        <RefreshCw className="mx-auto h-8 w-8" />
        <p className="mt-2 font-semibold">No incomplete uploads</p>
        <p className="mt-1 text-sm">All your uploads are complete or have been cleaned up.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Incomplete Uploads</h3>
          <p className="mt-1 text-sm text-gray-600">
            {uploads.length} {uploads.length === 1 ? 'upload' : 'uploads'} pending in R2
          </p>
        </div>
        <button
          onClick={fetchIncompleteUploads}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                File
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                Upload ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                Initiated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {uploads.map((upload) => (
              <tr key={upload.uploadId} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 break-all">{upload.key}</div>
                </td>
                <td className="px-6 py-4">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                    {upload.uploadId.substring(0, 12)}...
                  </code>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {upload.initiatedAt
                    ? formatDistanceToNow(new Date(upload.initiatedAt), { addSuffix: true })
                    : 'Unknown'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleResumeUpload(upload.key, upload.uploadId)}
                      className="inline-flex items-center gap-1 rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200"
                      title="Resume upload"
                    >
                      <RotateCw className="h-4 w-4" />
                      Resume
                    </button>
                    <button
                      onClick={() => handleAbortUpload(upload.key, upload.uploadId)}
                      disabled={aborting.has(upload.uploadId)}
                      className="inline-flex items-center gap-1 rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete/abort upload"
                    >
                      <Trash2 className="h-4 w-4" />
                      {aborting.has(upload.uploadId) ? 'Aborting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-semibold mb-2">About incomplete uploads:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>These are multipart uploads that were not completed or were interrupted</li>
          <li>Click <strong>Resume</strong> to continue uploading the file</li>
          <li>Click <strong>Delete</strong> to abort and clean up the upload</li>
          <li>Abandoned uploads are charged for storage in some S3 providers</li>
        </ul>
      </div>
    </div>
  );
}
