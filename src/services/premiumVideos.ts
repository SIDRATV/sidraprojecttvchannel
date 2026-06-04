import type { PremiumVideoWithRelations } from '@/types/premium';

const API_BASE = '/api/premium-videos';
const PART_SIZE = 5 * 1024 * 1024; // 5 MB parts

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
   * Upload a single part with retry capability
   */
  async uploadPartWithRetry(
    presignedUrl: string,
    partData: Blob,
    partNumber: number,
    maxRetries = 3,
    onProgress?: (bytes: number, total: number) => void,
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (uploadAbortController?.signal.aborted) {
          throw new Error('Upload cancelled by user');
        }

        const eTag = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          let timeoutHandle: NodeJS.Timeout | null = null;

          // Use longer timeout for part 1 (often thumbnail after long video upload)
          const timeoutMs = partNumber === 1 ? 600000 : 300000; // 10 min for thumbnail, 5 min for video parts

          const resetTimeout = () => {
            if (timeoutHandle) clearTimeout(timeoutHandle);
            timeoutHandle = setTimeout(() => {
              console.error(`⏱️ Part ${partNumber} timeout (${timeoutMs}ms) - aborting`);
              xhr.abort();
            }, timeoutMs);
          };

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              onProgress?.(e.loaded, e.total);
              resetTimeout();
            }
          });

          xhr.addEventListener('load', () => {
            if (timeoutHandle) clearTimeout(timeoutHandle);
            if (xhr.status >= 200 && xhr.status < 300) {
              const eTag = xhr.getResponseHeader('ETag');
              if (!eTag) {
                reject(new Error('No ETag returned from R2'));
              } else {
                console.log(`✅ Part ${partNumber} uploaded (ETag: ${eTag})`);
                resolve(eTag);
              }
            } else {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            if (timeoutHandle) clearTimeout(timeoutHandle);
            const errorMsg = `Network error (status: ${xhr.status}, readyState: ${xhr.readyState})`;
            console.error(`❌ XHR error for part ${partNumber}: ${errorMsg}`);
            console.error(`   URL: ${presignedUrl.substring(0, 100)}...`);
            console.error(`   Part size: ${partData.size} bytes`);
            console.error(`   Content-Type: ${partData.type}`);
            reject(new Error(errorMsg));
          });

          xhr.addEventListener('abort', () => {
            if (timeoutHandle) clearTimeout(timeoutHandle);
            reject(new Error('Upload aborted'));
          });

          xhr.open('PUT', presignedUrl);
          xhr.setRequestHeader('Content-Type', partData.type || 'application/octet-stream');
          resetTimeout();
          xhr.send(partData);
        });

        return eTag;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (lastError.message === 'Upload cancelled by user') {
          throw lastError;
        }

        if (attempt < maxRetries) {
          const waitSeconds = Math.pow(2, attempt);
          console.warn(`⚠️ Part ${partNumber} error (attempt ${attempt + 1}/${maxRetries + 1}) - ${lastError.message} - retrying in ${waitSeconds}s...`);
          await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
        } else {
          console.error(`❌ Part ${partNumber} failed after ${maxRetries + 1} attempts: ${lastError.message}`);
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  },

  /**
   * Upload a premium video using native S3 multipart upload
   * Resumes on connection failure from the last successful part
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

      // Initialize abort controller
      uploadAbortController = new AbortController();

      // Step 1: Initiate multipart uploads
      const initRes = await fetch('/api/admin/upload-video/multipart/init', {
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

      if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({}));
        return { success: false, error: (err as any).error || 'Failed to initiate upload' };
      }

      const { videoKey, thumbnailKey, videoUploadId, thumbnailUploadId, partSize } = await initRes.json();

      onProgress?.(5, 'Starting video upload...');

      // Step 2: Upload video in parts
      const videoParts = Math.ceil(videoFile.size / partSize);
      const videoETags: Array<{ PartNumber: number; ETag: string }> = [];

      for (let i = 0; i < videoParts; i++) {
        if (uploadAbortController.signal.aborted) {
          // User cancelled - abort multipart uploads
          console.log('🛑 Upload cancelled by user, aborting multipart uploads...');
          await this.abortMultipartUploads(videoKey, thumbnailKey, videoUploadId, thumbnailUploadId, token);
          return { success: false, error: 'Upload cancelled by user' };
        }

        const start = i * partSize;
        const end = Math.min(start + partSize, videoFile.size);
        const partData = videoFile.slice(start, end);

        // Get presigned URL for this part
        const partUrlRes = await fetch('/api/admin/upload-video/multipart/part', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            key: videoKey,
            uploadId: videoUploadId,
            partNumber: i + 1,
            contentLength: partData.size,
          }),
        });

        if (!partUrlRes.ok) {
          console.error('Failed to get presigned part URL for video');
          await this.abortMultipartUploads(videoKey, thumbnailKey, videoUploadId, thumbnailUploadId, token);
          return { success: false, error: 'Failed to get presigned part URL' };
        }

        const { presignedUrl } = await partUrlRes.json();

        // Upload this part
        try {
          const eTag = await this.uploadPartWithRetry(
            presignedUrl,
            partData,
            i + 1,
            3,
            (bytes, total) => {
              const partPercent = (i + bytes / total) / videoParts;
              const overallPercent = 5 + partPercent * 83;
              onProgress?.(overallPercent, `Uploading video... part ${i + 1}/${videoParts} (${((bytes / total) * 100).toFixed(0)}%)`);
            },
          );

          videoETags.push({
            PartNumber: i + 1,
            ETag: eTag,
          });
        } catch (err) {
          // Part upload failed
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Failed to upload video part ${i + 1}: ${message}`);
          await this.abortMultipartUploads(videoKey, thumbnailKey, videoUploadId, thumbnailUploadId, token);
          return { success: false, error: `Failed to upload video part ${i + 1}: ${message}` };
        }
      }

      onProgress?.(90, 'Uploading thumbnail...');

      // Step 3: Upload thumbnail (single part)
      const thumbPartUrlRes = await fetch('/api/admin/upload-video/multipart/part', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: thumbnailKey,
          uploadId: thumbnailUploadId,
          partNumber: 1,
          contentLength: thumbnailFile.size,
        }),
      });

      if (!thumbPartUrlRes.ok) {
        console.error('Failed to get presigned part URL for thumbnail');
        await this.abortMultipartUploads(videoKey, thumbnailKey, videoUploadId, thumbnailUploadId, token);
        return { success: false, error: 'Failed to get thumbnail upload URL' };
      }

      const { presignedUrl: thumbPresignedUrl } = await thumbPartUrlRes.json();

      let thumbETag: string;
      try {
        thumbETag = await this.uploadPartWithRetry(
          thumbPresignedUrl,
          thumbnailFile,
          1,
          5, // 5 retries for thumbnail (more than video parts due to after-upload timing)
          (bytes, total) => {
            const thumbPercent = bytes / total;
            const overallPercent = 90 + thumbPercent * 8;
            onProgress?.(overallPercent, `Uploading thumbnail... ${((bytes / total) * 100).toFixed(0)}%`);
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`❌ Failed to upload thumbnail: ${message}`);
        console.error(`   Thumbnail key: ${thumbnailKey}`);
        console.error(`   Upload ID: ${thumbnailUploadId}`);
        console.error(`   Presigned URL: ${thumbPresignedUrl.substring(0, 100)}...`);
        await this.abortMultipartUploads(videoKey, thumbnailKey, videoUploadId, thumbnailUploadId, token);
        return { success: false, error: `Failed to upload thumbnail: ${message}` };
      }

      onProgress?.(98, 'Completing upload...');

      // Step 4: Complete multipart uploads
      const completeVideoRes = await fetch('/api/admin/upload-video/multipart/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: videoKey,
          uploadId: videoUploadId,
          parts: videoETags,
        }),
      });

      if (!completeVideoRes.ok) {
        return { success: false, error: 'Failed to complete video upload' };
      }

      const completeThumbRes = await fetch('/api/admin/upload-video/multipart/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: thumbnailKey,
          uploadId: thumbnailUploadId,
          parts: [{ PartNumber: 1, ETag: thumbETag }],
        }),
      });

      if (!completeThumbRes.ok) {
        return { success: false, error: 'Failed to complete thumbnail upload' };
      }

      onProgress?.(99, 'Saving metadata...');

      // Step 5: Confirm — save metadata to DB
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

  /**
   * Abort both video and thumbnail multipart uploads on user cancel or error
   */
  async abortMultipartUploads(
    videoKey: string,
    thumbnailKey: string,
    videoUploadId: string,
    thumbnailUploadId: string,
    token: string,
  ): Promise<void> {
    try {
      // Abort video upload
      await fetch('/api/admin/upload-video/multipart/abort', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: videoKey,
          uploadId: videoUploadId,
        }),
      }).catch((err) => console.warn('⚠️ Failed to abort video multipart upload:', err));

      // Abort thumbnail upload
      await fetch('/api/admin/upload-video/multipart/abort', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: thumbnailKey,
          uploadId: thumbnailUploadId,
        }),
      }).catch((err) => console.warn('⚠️ Failed to abort thumbnail multipart upload:', err));

      console.log('✅ Multipart uploads aborted successfully');
    } catch (err) {
      console.warn('⚠️ Error during multipart abort cleanup:', err);
    }
  },
};
