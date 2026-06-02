# Upload Direct Cloudflare R2 - Implémentation Complète

## Variables d'Environnement Requises

```
CLOUDFLARE_ACCOUNT_ID=fe43883b0d1afc152b313e6e387da755
CLOUDFLARE_ACCESS_KEY_ID=xxx
CLOUDFLARE_SECRET_ACCESS_KEY=xxx
CLOUDFLARE_R2_ENDPOINT=https://fe43883b0d1afc152b313e6e387da755.r2.cloudflarestorage.com
CLOUDFLARE_R2_BUCKET_NAME=sidratvstoragevideopremium
CLOUDFLARE_R2_AVATAR_BUCKET=avatar-user-url
NEXT_PUBLIC_API_URL=https://sidraprojecttvchannel-pi.vercel.app
```

## Fichiers Modifiés

### 1. src/lib/r2.ts
- **S3Client config**: `forcePathStyle: true` (CRITICAL pour Cloudflare R2)
- `fixPresignedUrl()`: Corrige format presigned URLs pour path-style access
- `getPresignedUploadUrl()`: Génère URLs pré-signées sans Metadata

### 2. src/app/api/admin/upload-video/presign/route.ts
- Reçoit: `{ videoSize, thumbnailSize, videoContentType, thumbnailContentType, ... }`
- Retourne: `{ videoUploadUrl, thumbnailUploadUrl, videoKey, thumbnailKey }`
- Expiry dynamique: 1 min/2MB + 1h min + 10min buffer
- Pour 258MB: ~2.3h d'expiry

### 3. src/services/premiumVideos.ts
- `uploadToR2WithRetry()`: Upload direct avec retry automatique (5 tentatives)
- Timeout adaptatif: remet à zéro à chaque progress event
- Minimum 5 min/chunk, 2 min/MB
- Backoff exponentiel: 1s, 2s, 4s, 8s, 16s entre retries
- `uploadVideo()`: Orchestration video + thumbnail + confirm

### 4. src/app/admin/upload-video/page.tsx
- Appelle `premiumVideoService.uploadVideo()`
- Reçoit callback: `(percent, status) => void`
- Affiche: pourcentage + messages d'état
- Bouton "Annuler": appelle `premiumVideoService.cancelUpload()`

### 5. src/middleware.ts
- CSP headers: `connect-src`, `media-src`, `img-src` permettent `*.r2.cloudflarestorage.com`

### 6. src/app/api/user/avatar/route.ts
- Upload direct R2 avec `forcePathStyle: true`
- Max 500KB, formats: JPEG, PNG, WEBP, GIF

### 7. src/app/api/user/avatar-serve/route.ts
- Cache presigned URLs (23.5h TTL)
- Génère URL 24h avec `forcePathStyle: true`

## Configuration Cloudflare R2

### CORS pour 2 buckets:
- `sidratvstoragevideopremium`
- `avatar-user-url`

JSON à coller dans R2 Dashboard > Settings > CORS Configuration:

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

## Flux Upload Video (258MB exemple)

1. Frontend envoie FormData
2. API `/api/admin/upload-video/presign` génère URLs (2.3h expiry)
3. XHR PUT direct à R2 (5-88% progress)
4. Si erreur: retry avec backoff (1s, 2s, 4s, 8s, 16s)
5. Si timeout > 5min inactivité: retry
6. XHR PUT thumbnail à R2 (90-98% progress)
7. POST `/api/admin/upload-video/confirm` sauvegarde metadata
8. 100% = Upload complet

## Tests Validés

✅ 100MB upload
✅ 258.6MB upload
✅ Retry automatique sur interruption
✅ Timeout adaptatif
✅ Bouton Annuler
✅ CORS validé
✅ Presigned URL format correct
✅ TypeScript sans erreurs

## Endpoints API

### POST /api/admin/upload-video/presign
Request: `{ videoSize, thumbnailSize, videoContentType, thumbnailContentType, ... }`
Response: `{ videoUploadUrl, thumbnailUploadUrl, videoKey, thumbnailKey }`

### PUT {videoUploadUrl}
Direct R2 upload (XHR from browser)

### PUT {thumbnailUploadUrl}
Direct R2 upload (XHR from browser)

### POST /api/admin/upload-video/confirm
Request: `{ videoKey, thumbnailKey, videoSize, ... }`
Response: `{ success, video }`

## Commandes Git Associées

```
fix: corriger xhr.upload.loaded TypeScript error
fix: augmenter presigned URL expiry et XHR timeout pour gros fichiers (258MB+)
fix: retirer Metadata de presigned URL - cause signature invalide pour browser XHR
feat: retry automatique + timeout adaptatif + bouton annuler pour uploads de gros fichiers
```

## Limites Actuelles

- Max 2GB par file (MAX_VIDEO_SIZE)
- 5 tentatives max retry
- Minimum 1h presigned URL expiry
- Minimum 5 min XHR timeout

## Sécurité

- Aucun secret exposé au frontend
- Presigned URLs générées côté serveur
- Validation file type/size côté serveur
- Auth JWT requise pour presign endpoint
- Admin-only routes protégées
