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
   * Upload a premium video (admin only)
   */
  async uploadVideo(
    formData: FormData,
    token: string,
    onProgress?: (percent: number) => void,
  ): Promise<{ success: boolean; video?: any; error?: string }> {
    try {
      const xhr = new XMLHttpRequest();

      const result = await new Promise<{ success: boolean; video?: any; error?: string }>(
        (resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
              onProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener('load', () => {
            try {
              const data = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ success: true, video: data.video });
              } else {
                resolve({ success: false, error: data.error || 'Upload failed' });
              }
            } catch {
              resolve({ success: false, error: 'Invalid response' });
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          xhr.open('POST', '/api/admin/upload-video');
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.send(formData);
        },
      );

      return result;
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
