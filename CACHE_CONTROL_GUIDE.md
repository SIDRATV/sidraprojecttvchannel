# 🚀 Système de Cache Control - Guide Complet

## Vue d'ensemble

Your Sidra TV application est maintenant configurée avec un **système agressif de cache busting** qui garantit que vos utilisateurs reçoivent toujours les mises à jour les plus récentes sans avoir besoin de vider manuellement leur cache.

## 🎯 Comment ça marche

### 1️⃣ **Niveau Middleware** (`src/middleware.ts`)
- Ajoute des headers `Cache-Control` stricts à **CHAQUE** requête
- Force les navigateurs à **TOUJOURS** valider auprès du serveur
- Ajoute des headers `ETag` et `Last-Modified` dynamiques

### 2️⃣ **Niveau Next.js Config** (`next.config.js`)
- Configure les politiques de cache par type de contenu
- `/_next/static/*` → Cached (versioned par Next.js build)
- `/api/*` → NO CACHE
- `/` → NO CACHE
- Assets (`*.png`, `*.jpg`, etc.) → Revalidate on every request

### 3️⃣ **Niveau Browser** (`layout.tsx`)
- Ajoute des meta tags `<meta http-equiv="Cache-Control">`
- Système de détection d'updates automatique
- Efface les caches quand une mise à jour est détectée
- Vérifie toutes les 30 secondes si le site a changé
- Recharge automatiquement si une nouvelle version est trouvée

### 4️⃣ **Niveau Client** (`src/lib/cache.ts`)
- Utilitaires pour faire des requêtes avec cache busting
- Ajoute des paramètres `?v=timestamp` aux URLs
- Fonctions pour forcer la revalidation

## 📦 Utilisation Pratique

### Pour les requêtes API, utilisez :

```typescript
import { fetchWithCacheBusting, buildBustingUrl } from '@/lib/cache';

// Option 1 : Fetch avec cache busting automatique
const response = await fetchWithCacheBusting('/api/videos');
const data = await response.json();

// Option 2 : Obtenir une URL avec cache busting
const url = buildBustingUrl('/api/videos', {
  category: 'education',
  limit: 10
});
const response = await fetch(url);
```

### Dans les composants React :

```typescript
'use client';

import { fetchWithCacheBusting } from '@/lib/cache';
import { useEffect, useState } from 'react';

export function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Utilise automatiquement le cache busting
    fetchWithCacheBusting('/api/videos')
      .then(r => r.json())
      .then(setData);
  }, []);

  return <div>{/* render data */}</div>;
}
```

## 🔄 Cycle de Mise à Jour

```
┌─────────────────────────────────────────────────┐
│  Vous déployez une nouvelle version             │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Le navigateur détecte le changement:            │
│ ✓ Compares les ETags                            │
│ ✓ Vérifie Last-Modified                         │
│ ✓ Utilise les timestamps de cache busting       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Mise à jour détectée! L'app:                    │
│ ✓ Efface tous les caches                        │
│ ✓ Recharge la page automatiquement              │
│ ✓ Charge le contenu frais                       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  L'utilisateur voit toujours la dernière        │
│  version SANS vider le cache manuellement! ✅   │
└─────────────────────────────────────────────────┘
```

## 🎛️ Configuration Avancée

### Ajouter un token d'authentification (optionnel)

Si vous voulez sécuriser l'endpoint de cache clear:

```bash
# Dans votre .env.local
CACHE_CLEAR_TOKEN=votre_secret_token_ici
```

### Déclencher un cache clear depuis CI/CD

```bash
curl -X POST https://sidra.tv/api/cache-control \
  -H "Authorization: Bearer votre_secret_token_ici"
```

### Vérifier l'état du cache

```bash
curl https://sidra.tv/api/cache-control
```

## 📊 Headers Appliqués

### Pour toutes les pages HTML :
```
Cache-Control: no-cache, no-store, must-revalidate, max-age=0, s-maxage=0
Pragma: no-cache
Expires: 0
ETag: W/"1234567890"
Last-Modified: Mon, 16 Mar 2026 12:00:00 GMT
```

### Pour les assets statiques (`_next/static`) :
```
Cache-Control: public, max-age=31536000, immutable
```

Ceci est safe parce que Next.js change automatiquement le nom des fichiers à chaque build.

### Pour les ressources publiques (`.png`, `.jpg`, etc.) :
```
Cache-Control: public, max-age=3600, must-revalidate
```

Les images sont revalidées toutes les heures, mais peuvent être servies depuis le cache navigateur.

## 🛠️ Troubleshooting

### Les utilisateurs voient encore l'ancienne version?

1. **Vérifiez les headers réseau :**
   - Ouvrez DevTools → Network → Sélectionnez une requête
   - Vérifiez les response headers
   - Assurez-vous que `Cache-Control: no-cache, no-store` est présent

2. **Videz manuellement les caches :**
   ```javascript
   // Dans la console du navigateur:
   await caches.keys().then(names =>
     Promise.all(names.map(name => caches.delete(name)))
   );
   localStorage.clear();
   location.reload();
   ```

3. **Vérifiez le Service Worker :**
   - DevTools → Application → Service Workers
   - "Unregister" tous les workers
   - Rafraîchissez la page

### Le site se recharge trop souvent?

Ajustez l'intervalle de vérification dans `layout.tsx` :

```typescript
// Actuellement: 30 secondes
setInterval(checkForUpdates, 30000);

// Changez à 60 secondes (moins de relevés):
setInterval(checkForUpdates, 60000);
```

## ✅ Checklist de Déploiement

- ✅ Middleware.ts mis à jour
- ✅ next.config.js configuré
- ✅ layout.tsx avec cache control meta tags
- ✅ lib/cache.ts utilitaires disponibles
- ✅ API endpoint /api/cache-control créé
- ✅ Testez sur différents navigateurs
- ✅ Vérifiez les headers avec DevTools

## 📈 Monitoring

### Vérifiez que le cache busting fonctionne:

1. Ouvrez DevTools (F12)
2. Allez à Network tab
3. Rafraîchissez la page
4. Vérifiez que:
   - Les requêtes HTML ont `Cache-Control: no-cache, no-store`
   - Les requêtes API ont `Cache-Control: no-cache, no-store`
   - Les URLs de `_next/static` sont très longues (cache-busted par Next.js)

## 🎁 Bonus Features

### Détecter si une mise à jour est disponible:

```typescript
import { useEffect, useState } from 'react';

export function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const checkForUpdate = async () => {
      const response = await fetch('/', {
        method: 'HEAD',
        cache: 'no-store',
      });

      const etag = response.headers.get('etag');
      const stored = sessionStorage.getItem('app_etag');

      if (stored && stored !== etag) {
        setUpdateAvailable(true);
      }

      sessionStorage.setItem('app_etag', etag || '');
    };

    checkForUpdate();
    const interval = setInterval(checkForUpdate, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="bg-blue-500 p-4 text-white">
      Une mise à jour est disponible!
      <button onClick={() => location.reload()}>
        Recharger
      </button>
    </div>
  );
}
```

---

## 🚀 Résumé

Votre site est maintenant configuré pour:
- ✅ **Zéro cache agressif** pour le contenu dynamique
- ✅ **Détection automatique** des mises à jour
- ✅ **Recharge automatique** quand le site change
- ✅ **Aucune action requise** de l'utilisateur
- ✅ **Toujours frais** et à jour
