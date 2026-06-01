# Cloudflare R2 Configuration Guide - Video Upload Troubleshooting

## Problem: "Network connection failed uploading to Cloudflare R2"

This guide helps you fix R2 upload issues for the premium video uploader.

---

## ✅ Step 1: Verify Environment Variables

Check your `.env.local` contains the correct Cloudflare R2 configuration:

```env
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com  # ✅ NO bucket name in URL
CLOUDFLARE_R2_VIDEO_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com  # ✅ NO bucket name in URL
```

### ⚠️ CRITICAL: Endpoint Format
- ❌ **WRONG**: `https://account-id.r2.cloudflarestorage.com/bucket-name`
- ✅ **CORRECT**: `https://account-id.r2.cloudflarestorage.com`

The AWS SDK S3 client automatically adds the bucket to the request path.

---

## ✅ Step 2: Configure CORS in Cloudflare R2 Dashboard

1. **Login to Cloudflare Dashboard** → R2 → Select your bucket
2. **Go to Settings tab** → Scroll to **CORS rules**
3. **Click "Add CORS rule"** and configure:

### Required CORS Configuration

| Setting | Value |
|---------|-------|
| **Allowed Origins** | `https://sidraprojecttvchannel-pi.vercel.app`<br/>`http://localhost:3000` (dev)<br/>`https://*.vercel.app` (all previews) |
| **Allowed Methods** | `PUT`, `POST`, `GET`, `OPTIONS` |
| **Allowed Headers** | `Content-Type`, `*` |
| **Expose Headers** | `ETag`, `x-amz-version-id` |
| **Max Age** | `3600` (1 hour) |

### Screenshot (What it should look like)
```
Allowed Origins:   https://sidraprojecttvchannel-pi.vercel.app, http://localhost:3000
Allowed Methods:   [✓] GET [✓] POST [✓] PUT [✓] OPTIONS
Allowed Headers:   Content-Type, *
Expose Headers:    ETag, x-amz-version-id
Max Age:           3600
```

---

## ✅ Step 3: Verify Credentials

Run the diagnostic endpoint:

```bash
# Get admin token and run:
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://sidraprojecttvchannel-pi.vercel.app/api/admin/r2-diagnostic
```

Expected response:
```json
{
  "success": true,
  "message": "✅ R2 connection OK. Endpoint: ..., Bucket: ...",
  "config": {
    "accountId": "...",
    "bucket": "sidratvstoragevideopremium",
    "endpoint": "https://....r2.cloudflarestorage.com",
    "credentialsConfigured": true
  }
}
```

---

## ❌ Common Issues & Fixes

### Issue 1: "Network connection failed" + CORS error in browser console

**Cause**: CORS not configured in R2

**Fix**:
1. Go to Cloudflare R2 Dashboard
2. Select your bucket → Settings → CORS
3. Add the rule above

---

### Issue 2: "Network connection failed" + 403 Forbidden

**Cause**: Invalid or expired credentials

**Fix**:
1. Verify `CLOUDFLARE_ACCESS_KEY_ID` and `CLOUDFLARE_SECRET_ACCESS_KEY` are correct
2. Check if the R2 API token hasn't expired
3. Regenerate a new API token in Cloudflare if needed

---

### Issue 3: Upload succeeds but "Endpoint: undefined"

**Cause**: `CLOUDFLARE_ACCOUNT_ID` missing or invalid

**Fix**:
1. Get your Account ID from Cloudflare Dashboard (bottom left under Account)
2. Add to `.env.local`: `CLOUDFLARE_ACCOUNT_ID=your-actual-id`
3. Restart dev server: `npm run dev`

---

### Issue 4: Endpoint includes bucket name (e.g., `.../bucket-name`)

**Cause**: Wrong endpoint format

**Fix**:
Change in `.env.local`:
```env
# ❌ WRONG
CLOUDFLARE_R2_VIDEO_ENDPOINT=https://account-id.r2.cloudflarestorage.com/sidratvstoragevideopremium

# ✅ CORRECT
CLOUDFLARE_R2_VIDEO_ENDPOINT=https://account-id.r2.cloudflarestorage.com
```

---

## 🧪 Test Upload

1. Go to **Admin Dashboard** → **Upload Video**
2. Select a small test video (~5MB)
3. Check browser console for detailed logs
4. If error, look for "CORS" or "connection failed" message

---

## 🔧 Advanced: Presigned URL Debugging

The system generates **presigned PUT URLs** with 15-minute expiry. If you see:
- ✅ URL generates successfully → Credentials OK
- ❌ URL fails to generate → R2 connection issue
- ✅ URL generated but upload fails → CORS issue

---

## 📞 Getting Help

If issues persist:

1. **Check Server Logs**: Look for `❌` symbols in console
2. **Run Diagnostic**: `/api/admin/r2-diagnostic` endpoint
3. **Browser Console**: Look for CORS error details (F12 → Console)
4. **Cloudflare R2 Logs**: Check bucket activity in R2 Dashboard

---

**Last Updated**: 2026-06-01  
**Version**: 1.0
