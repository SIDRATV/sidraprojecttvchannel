import type { PremiumVideoWithRelations } from '@/types/premium';

const API_BASE = '/api/premium-videos';

export const premiumVideoService = {
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
   * Upload a premium video (admin only).
   * Uses a presigned URL so the browser uploads directly to R2,
   * bypassing the Next.js server's body-size limit and Vercel's 4.5 MB limit.
   *
   * Flow:
   *   1. POST /api/admin/upload-video/presign  → get presigned PUT URLs + R2 keys
   *   2. PUT {presignedUrl}                    → upload video directly to R2 (tracked)
   *   3. PUT {thumbnailPresignedUrl}           → upload thumbnail directly to R2
   *   4. POST /api/admin/upload-video/confirm  → save metadata to DB
   */
  async uploadVideo(
    formData: FormData,
    token: string,
    onProgress?: (percent: number) => void,
  ): Promise<{ success: boolean; video?: any; error?: string }> {
    try {
      const videoFile = formData.get('video') as File | null;
      const thumbnailFile = formData.get('thumbnail') as File | null;
      const title = (formData.get('title') as string) || 'Untitled Video';
      const description = (formData.get('description') as string) || '';
      const categoryId = formData.get('category_id') as string | null;
      const quality = (formData.get('quality') as string) || '720p';
      const minPlan = (formData.get('min_plan') as string) || 'pro';

      if (!videoFile || !thumbnailFile) {
        return { success: false, error: 'Video and thumbnail are required' };
      }

      onProgress?.(2);

      // Step 1: Get presigned PUT URLs from the server (tiny JSON request)
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

      onProgress?.(5);

      // Step 2: Upload video directly to R2 with XHR (progress tracking)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let uploadedBytes = 0; // Track progress for error reporting

        // Log for debugging
        console.log(`🎬 Starting video upload to R2...`);
        console.log(`📍 Presigned URL domain: ${new URL(videoUploadUrl).host}`);

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            uploadedBytes = e.loaded; // Track for timeout error
            // Map 5% → 88% during video upload
            onProgress(5 + Math.round((e.loaded / e.total) * 83));
          }
        });

        xhr.addEventListener('load', () => {
          console.log(`📡 XHR load event: status=${xhr.status}`);
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log(`✅ Video uploaded successfully (status: ${xhr.status})`);
            resolve();
          } else {
            const responseText = xhr.responseText?.substring(0, 200) || '(empty)';
            console.error(`❌ R2 video upload HTTP error - Status: ${xhr.status}`);
            console.error(`📄 Response: ${responseText}`);
            reject(new Error(`R2 video upload failed: HTTP ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          console.error(`❌ XHR error event fired`);
          console.error(`   - Upload URL: ${videoUploadUrl.substring(0, 100)}...`);
          console.error(`   - Video size: ${(videoFile.size / 1024 / 1024 / 1024).toFixed(2)} GB`);
          console.error(`   - Content-Type: ${videoFile.type}`);
          console.error(`   - Timeout was set to: ${(xhr.timeout / 1000).toFixed(0)}s`);
          
          // Check if it's a CORS issue
          const corsMessage = videoUploadUrl.includes('r2.cloudflarestorage.com')
            ? ' (Check CORS settings in Cloudflare R2 Dashboard > Settings > CORS rules)'
            : '';
          
          reject(new Error(`Network connection failed uploading to Cloudflare R2${corsMessage}. Verify: 1) Endpoint format (no bucket name in URL), 2) CORS configured in R2, 3) Credentials valid`));
        });

        xhr.addEventListener('abort', () => {
          console.warn(`⚠️ Upload aborted by user`);
          reject(new Error('Upload aborted'));
        });

        // Timeout depends on file size (estimated at 1MB per 5 seconds over average connection)
        // For 2GB: ~10240 seconds + 120s buffer ≈ 2.8 hours max
        const fileSizeMB = videoFile.size / (1024 * 1024);
        const estimatedTimeSeconds = Math.max(
          1800, // Minimum 30 minutes for reliability
          Math.ceil(fileSizeMB * 5) + 120 // 5s per MB + 2min buffer (supports up to 2GB files)
        );
        xhr.timeout = Math.min(estimatedTimeSeconds * 1000, 3600000); // Cap at 1 hour for browser safety
        console.log(`⏱️ Set XHR timeout to ${(xhr.timeout / 1000).toFixed(0)}s (${(xhr.timeout / 60000).toFixed(1)}min) for ${fileSizeMB.toFixed(1)}MB file`);
        
        xhr.ontimeout = () => {
          console.error(`⏱️ Upload timeout after ${xhr.timeout}ms (${estimatedTimeSeconds}s)`);
          console.error(`   File size: ${(videoFile.size / 1024 / 1024).toFixed(1)}MB`);
          console.error(`   Uploaded so far: ${(uploadedBytes / 1024 / 1024).toFixed(1)}MB`);
          reject(new Error(`Upload timeout - connection took too long. Try uploading a smaller video or from a faster connection.`));
        };

        // Set up XHR
        xhr.open('PUT', videoUploadUrl);

        // CRITICAL: Content-Type must match the presigned URL signature
        // Only set if the file type is recognized by browser
        if (videoFile.type && videoFile.type.startsWith('video/')) {
          xhr.setRequestHeader('Content-Type', videoFile.type);
          console.log(`📤 Set Content-Type: ${videoFile.type}`);
        } else {
          // If no type detected, use default video/mp4
          xhr.setRequestHeader('Content-Type', 'video/mp4');
          console.warn(`⚠️ No video type detected, using default: video/mp4`);
        }

        // Send the file
        console.log(`📨 Sending ${videoFile.size} bytes to R2...`);
        xhr.send(videoFile);
      });

      onProgress?.(90);

      // Step 3: Upload thumbnail directly to R2
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        console.log(`🖼️  Starting thumbnail upload to R2...`);

        xhr.addEventListener('load', () => {
          console.log(`📡 Thumbnail XHR load event: status=${xhr.status}`);
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log(`✅ Thumbnail uploaded successfully (status: ${xhr.status})`);
            resolve();
          } else {
            const responseText = xhr.responseText?.substring(0, 200) || '(empty)';
            console.error(`❌ R2 thumbnail upload HTTP error - Status: ${xhr.status}`);
            console.error(`📄 Response: ${responseText}`);
            reject(new Error(`R2 thumbnail upload failed: HTTP ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          console.error(`❌ Thumbnail XHR error event fired`);
          console.error(`   - Upload URL: ${thumbnailUploadUrl.substring(0, 100)}...`);
          console.error(`   - Thumbnail size: ${thumbnailFile.size} bytes`);
          console.error(`   - Content-Type: ${thumbnailFile.type}`);
          
          // Check if it's a CORS issue
          const corsMessage = thumbnailUploadUrl.includes('r2.cloudflarestorage.com')
            ? ' (Check CORS settings in Cloudflare R2 Dashboard > Settings > CORS rules)'
            : '';
          
          reject(new Error(`Network connection failed uploading thumbnail to Cloudflare R2${corsMessage}. Verify: 1) Endpoint format (no bucket name in URL), 2) CORS configured in R2, 3) Credentials valid`));
        });

        xhr.addEventListener('abort', () => {
          console.warn(`⚠️ Thumbnail upload aborted by user`);
          reject(new Error('Thumbnail upload aborted'));
        });

        xhr.timeout = 300000; // 5 minutes timeout
        xhr.ontimeout = () => {
          console.error(`⏱️ Thumbnail upload timeout after ${xhr.timeout}ms`);
          reject(new Error('Thumbnail upload timeout'));
        };

        xhr.open('PUT', thumbnailUploadUrl);

        // CRITICAL: Content-Type must match the presigned URL signature
        if (thumbnailFile.type && (thumbnailFile.type.startsWith('image/') || thumbnailFile.type === 'image/jpeg')) {
          xhr.setRequestHeader('Content-Type', thumbnailFile.type);
          console.log(`📤 Set Thumbnail Content-Type: ${thumbnailFile.type}`);
        } else {
          // If no type detected, use default image/jpeg
          xhr.setRequestHeader('Content-Type', 'image/jpeg');
          console.warn(`⚠️ No image type detected, using default: image/jpeg`);
        }

        console.log(`📨 Sending ${thumbnailFile.size} bytes thumbnail to R2...`);
        xhr.send(thumbnailFile);
      });

      onProgress?.(95);

      // Step 4: Confirm — save metadata to DB (tiny JSON request)
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

      onProgress?.(100);
      return { success: true, video: confirmData.video };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      return { success: false, error: message };
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
