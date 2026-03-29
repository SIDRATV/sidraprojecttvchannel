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
  ): Promise<{
    video: PremiumVideoWithRelations;
    stream_url: string;
    quality: string;
    available_qualities: string[];
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/${id}?quality=${quality}`);
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
        return { success: false, error: (err as any).error || 'Failed to get upload URL' };
      }

      const { videoKey, thumbnailKey, videoUploadUrl, thumbnailUploadUrl } = await presignRes.json();

      onProgress?.(5);

      // Step 2: Upload video directly to R2 with XHR (progress tracking)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            // Map 5% → 88% during video upload
            onProgress(5 + Math.round((e.loaded / e.total) * 83));
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`R2 video upload failed: ${xhr.status}`));
        });
        xhr.addEventListener('error', () => reject(new Error('Network error uploading video')));
        xhr.open('PUT', videoUploadUrl);
        xhr.setRequestHeader('Content-Type', videoFile.type);
        xhr.send(videoFile);
      });

      onProgress?.(90);

      // Step 3: Upload thumbnail directly to R2
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`R2 thumbnail upload failed: ${xhr.status}`));
        });
        xhr.addEventListener('error', () => reject(new Error('Network error uploading thumbnail')));
        xhr.open('PUT', thumbnailUploadUrl);
        xhr.setRequestHeader('Content-Type', thumbnailFile.type);
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
