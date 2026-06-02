import type { PremiumVideoWithRelations } from '@/types/premium';

const API_BASE = '/api/premium-videos';

// Global abort controller for upload cancellation
let uploadAbortController: AbortController | null = null;

export const premiumVideoService = {
  /**
   * Cancel an ongoing upload
   */
  cancelUpload() {
    if (uploadAbortController) {
      uploadAbortController.abort();
      console.log('📛 Upload cancelled by user');
    }
  },

  /**
   * Get abort signal for checking if upload was cancelled
   */
  getUploadAbortSignal(): AbortSignal | null {
    return uploadAbortController?.signal || null;
  },

  /**
   * Fetch all premium videos
   */
  async getVideos(
    limit = 20,
    offset = 0,
    categoryId?: string,
  ): Promise<PremiumVideoWithRelations[]> {
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (categoryId) params.set('category_id', categoryId);

      const res = await fetch(`${API_BASE}?${params}`);
      if (!res.ok) throw new Error('Failed to fetch premium videos');

      const data = await res.json();
      return data.videos || [];
    } catch (error) {
      console.error('premiumVideoService.getVideos error:', error);
      return [];
    }
  },

  /**
   * Get a single premium video with signed stream URL
   */
  async getVideo(
    id: string,
    quality = '720p',
    token?: string,
  ): Promise<{
    video: PremiumVideoWithRelations;
    stream_url: string;
    quality: string;
    available_qualities: string[];
  } | null> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/${id}?quality=${quality}`, { headers });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error('premiumVideoService.getVideo error:', error);
      return null;
    }
  },

  /**
   * Upload a file to R2 with automatic retry on connection failure and adaptive timeout
   * CRITICAL: Retries on connection loss, adaptive timeout resets on each progress event
   */
  async uploadToR2WithRetry(
    presignedUrl: string,
    file: File,
    onProgress?: (percent: number, status?: string) => void,
    progressOffset = 0,
    progressRange = 100,
    maxRetries = 5,
  ): Promise<void> {
    let lastUploadedBytes = 0;
    const fileSizeMB = file.size / (1024 * 1024);

    // Adaptive timeout: resets after each progress event
    const baseTimeoutSeconds = Math.max(
      300, // Minimum 5 minutes per chunk
      Math.ceil(fileSizeMB * 120), // 2 minutes per MB of total file
    );

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check if upload was cancelled
        if (uploadAbortController?.signal.aborted) {
          throw new Error('Upload cancelled by user');
        }

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          let timeoutHandle: NodeJS.Timeout | null = null;
          let lastProgressTime = Date.now();
          let lastProgressBytes = lastUploadedBytes;

          console.log(
            `📤 Upload attempt ${attempt + 1}/${maxRetries + 1} for ${file.name} (${fileSizeMB.toFixed(1)}MB)`,
          );

          // Reset timeout after each progress event (adaptive timeout)
          const resetTimeout = () => {
            if (timeoutHandle) clearTimeout(timeoutHandle);
            lastProgressTime = Date.now();

            timeoutHandle = setTimeout(() => {
              console.error(`⏱️ No data received for ${baseTimeoutSeconds}s - aborting and retrying...`);
              xhr.abort();
            }, baseTimeoutSeconds * 1000);
          };

          // Progress event: data is flowing, reset timeout
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              lastUploadedBytes = e.loaded;
              const percentComplete = (e.loaded / e.total) * 100;

              // Map to progress range (e.g., 5-88 for video)
              const displayPercent = progressOffset + (percentComplete * progressRange) / 100;

              console.log(
                `📊 Progress: ${percentComplete.toFixed(1)}% (${(e.loaded / 1024 / 1024).toFixed(1)}MB / ${(e.total / 1024 / 1024).toFixed(1)}MB)`,
              );

              onProgress?.(displayPercent, `Uploading... ${percentComplete.toFixed(0)}%`);

              // Reset timeout: data is still flowing
              resetTimeout();
            }
          });

          // Connection established and data received
          xhr.addEventListener('load', () => {
            if (timeoutHandle) clearTimeout(timeoutHandle);

            if (xhr.status >= 200 && xhr.status < 300) {
              console.log(`✅ Upload successful (HTTP ${xhr.status})`);
              resolve();
            } else {
              console.error(`❌ R2 returned HTTP ${xhr.status}`);
              reject(new Error(`HTTP ${xhr.status}`));
            }
          });

          // Network error: retry instead of immediate failure
          xhr.addEventListener('error', () => {
            if (timeoutHandle) clearTimeout(timeoutHandle);

            if (attempt < maxRetries) {
              const waitSeconds = Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s, 8s...
              console.warn(
                `⚠️ Network error (attempt ${attempt + 1}/${maxRetries + 1}) - retrying in ${waitSeconds}s...`,
              );
              onProgress?.(
                progressOffset + (lastUploadedBytes / file.size) * progressRange,
                `Connection lost... Retrying in ${waitSeconds}s (attempt ${attempt + 1}/${maxRetries + 1})`,
              );
              reject(new Error(`RETRY_${waitSeconds}`)); // Signal for retry
            } else {
              console.error(`❌ Network error - max retries exceeded`);
              reject(new Error('Network connection failed after multiple retries'));
            }
          });

          // Timeout: no data received for baseTimeoutSeconds
          xhr.addEventListener('abort', () => {
            if (timeoutHandle) clearTimeout(timeoutHandle);
            reject(new Error('Upload aborted'));
          });

          // Set up request
          xhr.open('PUT', presignedUrl);
          if (file.type && file.type.startsWith('video/')) {
            xhr.setRequestHeader('Content-Type', file.type);
          } else if (file.type && file.type.startsWith('image/')) {
            xhr.setRequestHeader('Content-Type', file.type);
          } else {
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
          }

          // Start adaptive timeout
          resetTimeout();

          console.log(`📨 Sending ${file.size} bytes to R2 (timeout: ${baseTimeoutSeconds}s per chunk)...`);
          xhr.send(file);
        });

        // Success - exit retry loop
        onProgress?.(progressOffset + progressRange, 'Upload complete');
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        // Check if it's a retry signal
        if (message.startsWith('RETRY_')) {
          const waitSeconds = parseInt(message.split('_')[1]) || 1;
          await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
          continue; // Retry
        }

        // Check if upload was cancelled
        if (message === 'Upload cancelled by user') {
          throw err;
        }

        // Last attempt failed
        if (attempt === maxRetries) {
          throw err;
        }
      }
    }
  },

  /**
   * Upload a premium video (admin only).
   * Uses presigned URLs with automatic retry and adaptive timeout.
   *
   * onProgress callback: (percent: number, status?: string) => void
   *   - percent: 0-100, tracks overall progress
   *   - status: optional status message (e.g., "Uploading... 45%", "Connection lost... Retrying in 2s")
   */
  async uploadVideo(
    formData: FormData,
    token: string,
    onProgress?: (percent: number, status?: string) => void,
  ): Promise<{ success: boolean; video?: any; error?: string }> {
    try {
      const videoFile = formData.get('video') as File | null;
      const thumbnailFile = formData.get('thumbnail') as File | null;
      const title = (formData.get('title') as string) || 'Untitled Video';
      const description = (formData.get('description') as string) || '';
      const categoryId = (formData.get('category_id') as string) || null;
      const quality = (formData.get('quality') as string) || '720p';
      const minPlan = (formData.get('min_plan') as string) || 'pro';

      if (!videoFile || !thumbnailFile) {
        return { success: false, error: 'Video and thumbnail are required' };
      }

      onProgress?.(2, 'Preparing upload...');

      // Step 1: Get presigned PUT URLs from the server
      const presignRes = await fetch('/api/admin/upload-video/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          quality,
          videoFilename: videoFile.name,
          videoContentType: videoFile.type,
          videoSize: videoFile.size,
          thumbnailFilename: thumbnailFile.name,
          thumbnailContentType: thumbnailFile.type,
          thumbnailSize: thumbnailFile.size,
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        console.error('Presign error:', err);
        return { success: false, error: (err as any).error || 'Failed to get upload URL from server' };
      }

      const { videoKey, thumbnailKey, videoUploadUrl, thumbnailUploadUrl } = await presignRes.json();

      if (!videoUploadUrl || !thumbnailUploadUrl) {
        console.error('Invalid presign response - missing upload URLs');
        return { success: false, error: 'Server returned invalid upload URLs' };
      }

      onProgress?.(5, 'Starting video upload...');

      // Initialize abort controller for this upload
      uploadAbortController = new AbortController();

      // Step 2: Upload video with retry + adaptive timeout
      try {
        await this.uploadToR2WithRetry(
          videoUploadUrl,
          videoFile,
          onProgress,
          5, // Start at 5%
          83, // Range: 5-88%
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message === 'Upload cancelled by user') {
          return { success: false, error: 'Upload cancelled by user' };
        }
        throw err;
      }

      onProgress?.(90, 'Uploading thumbnail...');

      // Step 3: Upload thumbnail with retry + adaptive timeout
      try {
        await this.uploadToR2WithRetry(
          thumbnailUploadUrl,
          thumbnailFile,
          onProgress,
          90, // Start at 90%
          8, // Range: 90-98%
          3, // Fewer retries for small thumbnail
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message === 'Upload cancelled by user') {
          return { success: false, error: 'Upload cancelled by user' };
        }
        throw err;
      }

      onProgress?.(98, 'Saving metadata...');

      // Step 4: Confirm — save metadata to DB
      const confirmRes = await fetch('/api/admin/upload-video/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoKey,
          videoSize: videoFile.size,
          thumbnailKey,
          thumbnailSize: thumbnailFile.size,
          title,
          description,
          categoryId,
          quality,
          minPlan,
        }),
      });

      const confirmData = await confirmRes.json();

      if (!confirmRes.ok) {
        return { success: false, error: confirmData.error || 'Failed to save video metadata' };
      }

      onProgress?.(100, 'Upload complete!');
      return { success: true, video: confirmData.video };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('uploadVideo error:', message);
      return { success: false, error: message || 'Unknown error during upload' };
    }
  },

  /**
   * Delete a premium video (admin only)
   */
  async deleteVideo(
    id: string,
    token: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/admin/upload-video/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data.error || 'Delete failed' };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete failed';
      return { success: false, error: message };
    }
  },
};
