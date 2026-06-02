# Configuration pour uploads vidéo 2GB

## Limites augmentées

### Fichiers modifiés:
1. **src/app/api/admin/upload-video/presign/route.ts**
   - `MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024` (2 GB)

2. **src/app/api/admin/upload-video/route.ts**
   - `MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024` (2 GB)

3. **src/services/premiumVideos.ts**
   - Timeout XHR: 5s par MB (au lieu de 15s)
   - Calcul dynamique: `fileSizeMB * 5s + 120s buffer`
   - Pour 2GB: ~10240 + 120 = ~2.8 heures max

4. **src/app/admin/upload-video/page.tsx**
   - UI message: "Max 2 GB" (au lieu de "Max 500 MB")

## Limites Next.js / Vercel

### ⚠️ IMPORTANT - Body Size Limit

**Vercel Edge Functions limit:** 4.5 MB
**Next.js API Routes limit:** Dépend de la configuration

Pour supporter 2GB, on utilise le **presigned URL approach** (client upload directement à R2):

```ts
// ✅ Notre approche (fonctionne avec 2GB):
1. Client → Server: Presign request (tiny JSON) ✅
2. Client → R2: Upload vidéo directement avec presigned URL ✅
3. Server → R2: Aucun upload du vidéo via server ✅
```

Cette approche **évite complètement les limites Next.js body size**.

## Presigned URL Expiry (dynamique)

Calculé pour chaque fichier:
- Minimum: 30 minutes
- Pour 2GB: ~107 minutes (calculé comme 30s par 10MB + 5min buffer)
- Formule: `Math.max(1800, Math.ceil((videoSize / (10 * 1024 * 1024)) * 30) + 300)`

## XHR Timeout (dynamique)

Calculé pour chaque fichier:
- Minimum: 30 minutes
- Pour 2GB: ~10360 secondes (~2.8 heures, cappé à 1 heure pour sécurité)
- Formule: `Math.max(1800, Math.ceil(fileSizeMB * 5) + 120)`

## Cloudflare R2 Limits

✅ **No size limit** pour single object uploads
✅ **Multipart upload** supporté automatiquement pour gros fichiers

## Configuration recommandée

```json
{
  "MAX_VIDEO_SIZE": "2 GB",
  "MAX_THUMBNAIL_SIZE": "10 MB",
  "PRESIGNED_URL_EXPIRY": "Dynamique (min 30 min)",
  "XHR_TIMEOUT": "Dynamique (5s par MB, cap 1h)",
  "UPLOAD_METHOD": "Presigned URL (Direct client→R2)",
  "BROWSER_CACHE": "24 heures pour thumbnails"
}
```

## Problèmes potentiels et solutions

### ❌ Erreur: "Connection failed" pour gros fichiers (200-500MB+)
**Cause:** Timeout XHR trop court
**Solution:** Appliquée ✅ (timeout dynamique basé sur taille)

### ❌ Erreur: "Presigned URL expired"
**Cause:** Expiry trop court pour upload long
**Solution:** Appliquée ✅ (expiry dynamique basé sur taille)

### ❌ Upload interrompu en cours de route
**Cause:** Network timeout / instabilité
**Solution:** 
- Réduire la taille ou utiliser une meilleure connexion
- Implémenter resumable uploads (future enhancement)

## Testing

Pour tester l'upload 2GB:
1. Créer un fichier vidéo de 100-500MB en premier (confirmer que ça marche)
2. Puis tester avec un fichier plus gros
3. Vérifier les logs dans DevTools (F12 → Console)

## Logs à vérifier

```
🎬 Starting video upload to R2...
📍 Presigned URL domain: ...
⏱️ Set XHR timeout to XXXs for XXX.XMB file
📝 Presigned URL expiry: XXXs for XXX.XMB video
⏳ Upload progress: XX% (XX/XX bytes)
✅ Video uploaded successfully
```

## Performance tips pour gros fichiers

1. **Connexion stable:** Câble Ethernet plutôt que WiFi
2. **Bande passante:** ≥10Mbps recommandé
3. **Pas d'autres uploads:** Fermer les autres téléchargements
4. **Navigateur moderne:** Chrome, Firefox, Safari (pas IE)
5. **Memory:** Au moins 4GB RAM pour supporter les gros uploads en-mémoire

## Future Enhancements

- [ ] Resumable uploads (continuer après interruption)
- [ ] Upload par chunks/multipart
- [ ] Compression vidéo avant upload
- [ ] Server-side upload avec streaming (bypass client)
