# Cloudflare R2 CORS Configuration for Avatar Uploads

## Problem
Avatar uploads fail on mobile and photos don't display after upload on PC. This is due to missing CORS (Cross-Origin Resource Sharing) configuration on the R2 buckets.

## Solution: Configure CORS on R2 Buckets

### For `avatar-user-url` bucket (avatars):

1. Go to **Cloudflare Dashboard** → **R2**
2. Click on the **`avatar-user-url`** bucket
3. Click **Settings** tab
4. Scroll down to **CORS Configuration**
5. Click **Add CORS rule**
6. Paste this configuration:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposedHeaders": ["ETag", "x-amz-version-id", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

**OR** for development with localhost:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposedHeaders": ["ETag", "x-amz-version-id", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

7. Click **Save**

### For `sidratvstoragevideopremium` bucket (videos - if not already done):

Repeat the same steps for this bucket using the same CORS configuration.

## How It Works

- **AllowedOrigins**: Domains that can access the bucket. Add all domains where your app runs.
- **AllowedMethods**: HTTP methods allowed (GET for downloads, PUT for uploads)
- **AllowedHeaders**: Headers browsers can send (`*` allows all)
- **ExposedHeaders**: Headers that browsers can read from the response
- **MaxAgeSeconds**: Browser caches CORS preflight requests for this duration

## Testing

After configuring CORS:

1. Go to your profile page
2. Open DevTools (F12) → Console tab
3. Try uploading an avatar photo
4. You should see logs like:
   - `📤 Uploading avatar for user [uid]:`
   - `✅ Avatar uploaded successfully`
   - Photo should display immediately after upload

5. On mobile, the same process should work without "network connection failed" errors

## Troubleshooting

### Still getting "network connection failed"?

1. Check CORS is saved properly (refresh Cloudflare dashboard)
2. Clear browser cache (Ctrl+Shift+Del)
3. Check browser console for CORS errors
4. Verify domain in CORS AllowedOrigins matches your actual domain exactly

### Photo uploads but doesn't display?

1. Check the serve endpoint log: `GET /api/user/avatar-serve?uid=[uid]`
2. Should see: `✅ Presigned URL generated`
3. If 404, the file wasn't uploaded to R2. Check upload logs.
4. If presigned URL works, it's a cache issue. Clear browser cache.

### Still not working on mobile?

1. Ensure mobile is accessing the same domain as CORS config
2. Check if mobile uses a different network (VPN, proxy)
3. Try accessing from desktop with same domain to isolate mobile issue

## CORS Configuration Summary

| Setting | Value | Purpose |
|---------|-------|---------|
| AllowedOrigins | Your domain | Only your app can access |
| AllowedMethods | GET, PUT, POST, DELETE, HEAD | Required for uploads/downloads |
| AllowedHeaders | * | Allow all headers |
| ExposedHeaders | ETag, x-amz-version-id, Content-Type | Allow JS to read response headers |
| MaxAgeSeconds | 3600 | Cache for 1 hour |

## References

- [Cloudflare R2 CORS Documentation](https://developers.cloudflare.com/r2/buckets/cors/)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
