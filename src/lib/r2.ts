import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY!;
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'sidratvstoragevideopremium';
const ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT || `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET = BUCKET_NAME;

// Folder structure in the bucket
export const R2_FOLDERS = {
  videos: 'videos',           // videos/{quality}/{filename}.mp4
  thumbnails: 'Sidra Miniature', // Sidra Miniature/{filename}.jpg
} as const;

/**
 * Upload a file to R2
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<{ key: string; size: number }> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await r2Client.send(command);
  return { key, size: body.length };
}

/**
 * Generate a pre-signed URL for private video access (expires in seconds)
 */
export async function getSignedVideoUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate a signed URL for thumbnail access (expires in 24 hours by default)
 */
export async function getSignedThumbnailUrl(
  key: string,
  expiresIn = 86400,
): Promise<string> {
  const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (publicDomain) {
    // If a public custom domain is configured, use it directly (no expiry)
    return `${publicDomain}/${key}`;
  }
  // Fall back to a signed URL (24h expiry)
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * @deprecated Use getSignedThumbnailUrl instead
 */
export function getThumbnailPublicUrl(key: string): string {
  const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (publicDomain) return `${publicDomain}/${key}`;
  // Return storage endpoint as fallback (may not be accessible without auth)
  return `${ENDPOINT}/${R2_BUCKET}/${key}`;
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * List objects in a folder
 */
export async function listR2Objects(prefix: string, maxKeys = 100) {
  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await r2Client.send(command);
  return response.Contents || [];
}

/**
 * Build the R2 key for a video file
 */
export function buildVideoKey(
  filename: string,
  quality: string,
): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${R2_FOLDERS.videos}/${quality}/${sanitized}`;
}

/**
 * Build the R2 key for a thumbnail
 */
export function buildThumbnailKey(filename: string): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${R2_FOLDERS.thumbnails}/${sanitized}`;
}
