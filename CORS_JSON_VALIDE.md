# CORS Configuration JSON - VERSION VALIDE

## À coller directement dans Cloudflare R2

**Pour les 2 buckets:**
- `avatar-user-url`
- `sidratvstoragevideopremium`

---

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

---

## Étapes:

1. **Cloudflare Dashboard** → **R2**
2. Sélectionner le bucket
3. **Settings** → **CORS Configuration**
4. **Add CORS rule**
5. Coller le JSON ci-dessus
6. **Save**
7. Répéter pour l'autre bucket

---

## Erreurs corrigées:

❌ Ancien: `ExposedHeaders` → ✅ Nouveau: `ExposeHeaders`
❌ Ancien: `["Authorization", "Content-Type", "x-amz-*"]` → ✅ Nouveau: `["*"]`
❌ Ancien: `["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"]` → ✅ Nouveau: `["GET", "PUT", "POST", "HEAD"]`

---

**Après Save, attendez 5-10 secondes et testez l'upload d'avatar!**
