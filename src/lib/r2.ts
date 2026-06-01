import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'sidratvstoragevideopremium';

// Build endpoint properly - CRITICAL FOR R2
let ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
if (!ENDPOINT) {
  if (ACCOUNT_ID) {
    // Standard R2 endpoint format
    ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  } else {
    console.warn('⚠️ CLOUDFLARE_ACCOUNT_ID is not set. Cannot build R2 endpoint.');
    ENDPOINT = 'https://r2.cloudflarestorage.com';
  }
}

// Validate credentials at module load time
const CREDS_OK = !!(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY);
if (!CREDS_OK) {
  console.warn('❌ Cloudflare R2 credentials INCOMPLETE:');
  if (!ACCOUNT_ID) console.warn('   - CLOUDFLARE_ACCOUNT_ID missing');
  if (!ACCESS_KEY_ID) console.warn('   - CLOUDFLARE_ACCESS_KEY_ID missing');
  if (!SECRET_ACCESS_KEY) console.warn('   - CLOUDFLARE_SECRET_ACCESS_KEY missing');
  console.warn(`   Endpoint: ${ENDPOINT}`);
  console.warn(`   Bucket: ${BUCKET_NAME}`);
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  // Additional R2-specific config
  tls: true,
  requestHandler: undefined,
});

export const R2_BUCKET = BUCKET_NAME;

// Folder structure in the bucket
export const R2_FOLDERS = {
  videos: 'videos',           // videos/{quality}/{filename}.mp4
  thumbnails: 'Sidra Miniature', // Sidra Miniature/{filename}.jpg
} as const;

/**
 * Diagnostic function to test R2 connectivity and credentials
 */
export async function diagnosisR2(): Promise<{ ok: boolean; message: string }> {
  if (!CREDS_OK) {
    return { ok: false, message: `❌ Missing credentials. Account: ${!!ACCOUNT_ID}, AccessKey: ${!!ACCESS_KEY_ID}, Secret: ${!!SECRET_ACCESS_KEY}` };
  }

  try {
    // Try to list objects to verify credentials work
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1,
    });
    await r2Client.send(command);
    return { ok: true, message: `✅ R2 connection OK. Endpoint: ${ENDPOINT}, Bucket: ${BUCKET_NAME}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `❌ R2 connection failed: ${message}` };
  }
}

/**
 * Upload a file to R2
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<{ key: string; size: number }> {
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await r2Client.send(command);
    return { key, size: body.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`R2 upload failed for key "${key}": ${message}`);
    throw new Error(`Failed to upload to Cloudflare R2: ${message}`);
  }
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
 * Generate a presigned PUT URL for direct browser-to-R2 upload (avoids server body limit)
 * CRITICAL: ContentType must match exactly between presign generation and PUT request
 */
/**
 * Fix presigned URL to ensure proper format for path-style R2 access
 * AWS SDK may not always include bucket in path correctly
 */
function fixPresignedUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Check if bucket is already in the path
    if (urlObj.pathname.startsWith(`/${R2_BUCKET}/`)) {
      // Already correct
      return url;
    }
    
    // If bucket is missing from path, add it
    if (!urlObj.pathname.startsWith(`/${R2_BUCKET}`)) {
      // Move all path content after bucket
      const existingPath = urlObj.pathname.startsWith('/') ? urlObj.pathname : `/${urlObj.pathname}`;
      urlObj.pathname = `/${R2_BUCKET}${existingPath}`;
    }
    
    const correctedUrl = urlObj.toString();
    console.log(`🔧 Fixed presigned URL: ${url.substring(0, 80)}... → ${correctedUrl.substring(0, 80)}...`);
    return correctedUrl;
  } catch (err) {
    console.warn(`⚠️ Could not fix presigned URL format: ${err}`);
    return url; // Return original if fix fails
  }
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  try {
    if (!CREDS_OK) {
      throw new Error('R2 credentials not configured. Check CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCESS_KEY_ID, CLOUDFLARE_SECRET_ACCESS_KEY');
    }

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
      // Add metadata to track uploads
      Metadata: {
        'uploaded-by': 'admin-console',
        'upload-time': new Date().toISOString(),
      },
    });

    let url = await getSignedUrl(r2Client, command, { expiresIn });
    
    // CRITICAL: Fix the presigned URL to ensure bucket is in path for Cloudflare R2
    url = fixPresignedUrl(url);
    
    console.log(`✅ Presigned URL generated for key: ${key}, ContentType: ${contentType}`);
    console.log(`   📍 Presigned URL: ${url.substring(0, 120)}...`);
    return url;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Failed to generate presigned URL: ${message}`);
    throw new Error(`Failed to generate presigned URL: ${message}`);
  }
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
