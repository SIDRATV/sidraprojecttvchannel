# Configuration CORS réelle pour votre site

## Domaines de votre application:
- **Production:** `https://sidraprojecttvchannel-pi.vercel.app`
- **Développement:** `http://localhost:3000`
- **Domaine custom (si applicable):** Ajouter ici

## Configuration CORS pour Cloudflare R2

### Pour CHAQUE bucket (`avatar-user-url` ET `sidratvstoragevideopremium`):

**Étapes dans Cloudflare Dashboard:**
1. **R2** → Cliquer sur le bucket
2. **Settings** → **CORS Configuration**
3. **Add CORS rule** → Coller la configuration ci-dessous
4. **Save**

---

## Configuration JSON à coller:

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

## Explication:

| Paramètre | Valeur | Raison |
|-----------|--------|--------|
| **AllowedOrigins** | `https://sidraprojecttvchannel-pi.vercel.app`<br>`http://localhost:3000` | Vos domaines d'accès |
| **AllowedMethods** | GET, PUT, POST, HEAD | GET pour affichage avatars, PUT pour uploads |
| **AllowedHeaders** | * | Autorise tous les en-têtes |
| **ExposeHeaders** | ETag, x-amz-version-id | Permet JS de lire les en-têtes (⚠️ pas "ExposedHeaders") |
| **MaxAgeSeconds** | 3600 | Cache preflight pendant 1 heure |

### ⚠️ NOTES IMPORTANTES:
- **`ExposeHeaders`** et NON `ExposedHeaders` (cette était l'erreur!)
- **Pas de `/` à la fin** des AllowedOrigins
- **Pas de DELETE ni OPTIONS** (Cloudflare les gère automatiquement)
- **`"*"` est valide** pour AllowedHeaders

---

## ✅ CORRECTION (2ème version - cette fois valide!)

Si vous avez reçu une erreur: **"Cette politique n'est pas valide"**

Les corrections apportées:
1. ✅ **`ExposeHeaders`** au lieu de `ExposedHeaders` (pas de "d")
2. ✅ **Suppression de `DELETE` et `OPTIONS`** (Cloudflare les ajoute automatiquement)
3. ✅ **Simplification de `AllowedHeaders`** en `["*"]` au lieu de `["Authorization", "Content-Type", "x-amz-*"]`

Utilisez la configuration ci-dessus au lieu de la première version!

---

### Bucket 1: `avatar-user-url`
1. Cloudflare R2 → `avatar-user-url` bucket
2. Settings → CORS Configuration
3. Add rule → Coller la config JSON ci-dessus
4. Save

### Bucket 2: `sidratvstoragevideopremium`
1. Cloudflare R2 → `sidratvstoragevideopremium` bucket
2. Settings → CORS Configuration
3. Add rule → Coller la même config JSON
4. Save

---

## Après la configuration:

### Test sur PC:
```
1. Aller à https://sidraprojecttvchannel-pi.vercel.app/profile
2. Uploader une photo de profil
3. Vérifier que la photo s'affiche immédiatement
```

### Test sur mobile:
```
1. Accéder au même URL depuis mobile (MÊME DOMAINE)
2. Uploader une photo
3. Doit fonctionner sans "network connection failed"
```

### Vérifier les logs:
```
1. F12 → Console
2. Doit voir les logs détaillés:
   - "📤 Uploading avatar for user..."
   - "✅ Avatar uploaded successfully"
```

---

## Si ça ne marche pas:

### ❌ Erreur CORS dans Console?
- Vérifier que le domaine dans CORS config correspond EXACTEMENT à celui de votre navigateur
- Actualiser la page (Ctrl+F5)
- Vider le cache (Ctrl+Shift+Del)

### ❌ Photo ne s'affiche pas après upload?
- Check logs: `GET /api/user/avatar-serve?uid=...`
- Doit voir: `✅ Presigned URL generated`
- Si 404: le fichier n'a pas été uploadé

### ❌ Marche en dev (localhost) mais pas en prod?
- Vérifier que `https://sidraprojecttvchannel-pi.vercel.app` est bien dans CORS AllowedOrigins
- Peut prendre 5-10 min pour appliquer après Save

---

## NextUpload Domains à ajouter plus tard:

Si vous achetez un domaine custom (ex: `sidra.tv`), ajouter à AllowedOrigins:
```json
"AllowedOrigins": [
  "https://sidraprojecttvchannel-pi.vercel.app",
  "https://sidra.tv",
  "http://localhost:3000"
]
```
