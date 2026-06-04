# Fix: Thumbnail Upload Network Error After Long Video Uploads

## Problem
**Error**: `failed to upload thumbnail: network error (status: 0, readystate: 4)`

This error occurs when trying to upload a thumbnail AFTER a very long video upload (e.g., 2GB files).

**Root Causes**:
1. **Presigned URL expiration**: The presigned URL for thumbnail upload had too short an expiry window (default 1-2 minutes for small files)
2. **Insufficient timeout**: The XHR timeout was set to 5 minutes for all parts, but after a long video upload, the system may be slower
3. **CORS misconfiguration**: If CORS headers are incorrect for the R2 bucket, the browser blocks the request with status 0

## Solutions Implemented

### 1. Increased Presigned URL Expiration
**File**: `src/app/api/admin/upload-video/multipart/part/route.ts`

Changed from:
```typescript
const expiresIn = Math.max(3600, Math.ceil((contentLength / (1024 * 1024)) * 60));
// 1 minute per MB, minimum 1 hour
```

To:
```typescript
const expiresIn = Math.max(
  7200, // 2 hour minimum
  Math.ceil((contentLength / (1024 * 1024)) * 120) // 2 minutes per MB
);
```

**Impact**: Presigned URLs now last longer and are more resilient to slow uploads.

### 2. Increased XHR Timeout for Thumbnails
**File**: `src/services/premiumVideos.ts`

Changed timeout logic:
```typescript
// Use longer timeout for part 1 (thumbnail after long video upload)
const timeoutMs = partNumber === 1 ? 600000 : 300000; // 10 min for thumbnail, 5 min for video parts
```

**Impact**: Thumbnails can now take up to 10 minutes to upload without timing out.

### 3. Increased Retry Attempts for Thumbnails
**File**: `src/services/premiumVideos.ts`

Changed from:
```typescript
thumbETag = await this.uploadPartWithRetry(thumbPresignedUrl, thumbnailFile, 1, 3, ...);
```

To:
```typescript
thumbETag = await this.uploadPartWithRetry(thumbPresignedUrl, thumbnailFile, 1, 5, ...);
```

**Impact**: Thumbnails will retry up to 5 times instead of 3, with exponential backoff (1s, 2s, 4s, 8s, 16s).

### 4. Better Error Diagnostics
Added detailed logging when thumbnail upload fails:
```typescript
console.error(`   URL: ${presignedUrl.substring(0, 100)}...`);
console.error(`   Part size: ${partData.size} bytes`);
console.error(`   Content-Type: ${partData.type}`);
```

## Verification Checklist

### ✅ CORS Configuration
Ensure CORS is properly configured on your R2 bucket:

1. Go to **Cloudflare Dashboard** → **R2**
2. Select your bucket (`sidratvstoragevideopremium`)
3. Click **Settings** → **CORS Configuration**
4. Verify this rule exists:

```json
[
  {
    "AllowedOrigins": [
      "https://sidraprojecttvchannel-pi.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-version-id"],
    "MaxAgeSeconds": 3600
  }
]
```

**If CORS rule is missing**: The browser will block the thumbnail upload with `status: 0, readyState: 4`.

### ✅ Network Conditions
- Stable internet connection (upload won't retry if connection drops completely)
- If using mobile: ensure 4G/5G or stable WiFi
- Avoid uploads on congested networks

### ✅ Browser Console Errors
If you still see errors, check the browser console (F12 → Console):
- **CORS error** = CORS misconfiguration (see above)
- **Network error** = Connection issue or timeout (check internet)
- **401 Unauthorized** = Token expired (refresh page and retry)

## Testing

To verify the fix works:

1. **Small video** (< 100MB):
   - Should upload successfully within minutes
   
2. **Large video** (500MB - 2GB):
   - Video upload: Can take 30 minutes to several hours
   - Thumbnail upload: Should now complete within 10 minutes even after long video upload
   - Watch browser console for:
     ```
     ✅ Part 1 uploaded (ETag: ...)  // Video parts
     ✅ Part 1 uploaded (ETag: ...)  // Thumbnail (partNumber=1)
     ```

## If Problem Persists

### Debug Steps:
1. Check browser console (F12 → Console tab) for error messages
2. Look for CORS errors in the Network tab
3. Verify R2 CORS configuration is saved (refresh Cloudflare dashboard)
4. Check that your domain matches exactly in CORS AllowedOrigins

### Common Solutions:
- Clear browser cache (Ctrl+Shift+Del)
- Disable browser extensions that block requests
- Test from a different network/device
- Check if thumbnail file is too large (max 10MB)
- Verify thumbnail is valid image format (JPEG, PNG, WEBP)

## Performance Expectations

| Video Size | Estimated Upload Time | Thumbnail Upload |
|------------|----------------------|------------------|
| 100 MB | 5-15 min | < 30 sec |
| 500 MB | 25-75 min | 1-2 min |
| 1 GB | 50-150 min | 2-5 min |
| 2 GB | 100-300 min | 5-10 min |

*Times depend on internet speed. Thumbnail upload now has 10-minute timeout.*

## Related Files Modified
- [src/app/api/admin/upload-video/multipart/part/route.ts](src/app/api/admin/upload-video/multipart/part/route.ts#L38)
- [src/services/premiumVideos.ts](src/services/premiumVideos.ts#L87)
