# Système de Diagnostic HLS - Documentation Complète

## 📋 Vue d'ensemble

Un système de diagnostic sophistiqué a été intégré au lecteur HLS.js pour identifier, analyser et expliquer les erreurs de streaming vidéo en détail.

## 🎯 Fonctionnalités Principales

### 1. **Identification Automatique des Erreurs**
Le système identifie automatiquement le type d'erreur parmi:
- ❌ **NETWORK_ERROR** - Erreur réseau (serveur inaccessible)
- ⛔ **GEO_BLOCKED** - Contenu géobloqu (Code HTTP 403)
- 🔒 **CORS_ERROR** - Erreur de sécurité cross-origin (Code HTTP 0/401)
- ❓ **INVALID_URL** - URL mal formée ou invalide
- ⏱️ **TIMEOUT** - Timeout de chargement
- 📦 **FORMAT_NOT_SUPPORTED** - Codecs non compatibles
- 📋 **MANIFEST_PARSING_ERROR** - Manifeste HLS invalide
- 🎬 **SEGMENT_LOADING_ERROR** - Erreur de chargement d'un segment

### 2. **Code d'Erreur Unique**
Chaque erreur reçoit un code unique permettant un suivi:
- Format: `ERROR_TYPE_NNN` ou `ERROR_TYPE_CODE`
- Exemples: `NET_500`, `GEO_403`, `CORS_0`, `INVALID_URL_001`

### 3. **Diagnostic Multi-Couche**

Chaque diagnostic inclut:

#### **Message Principal** 🎯
- Emoji contextuel
- Description courte et claire en français

#### **Détails Techniques** 📊
- Analyse complète de l'erreur
- Code HTTP si disponible
- Détails spécifiques HLS.js

#### **Suggestions Actionables** 💡
- Steps concrets pour l'utilisateur
- Ordre de priorité
- Solutions progressives

#### **Metadata** 📍
- URL du flux
- Code HTTP
- Timestamp de l'erreur
- Type de sévérité (fatal/warning/info)

## 🔧 Architecture du Système

### Fichier Principal: `src/utils/hlsDiagnostic.ts`

#### Exports Clés:

```typescript
// Types
export enum ErrorType { ... }
export interface DiagnosticResult { ... }

// Fonctions
export function identifyErrorType(event, url)
export function createDiagnostic(event, url)
export function logDiagnostic(diagnostic)
export function getUserFriendlyMessage(diagnostic)
```

### Intégration dans HLSVideoPlayer

Le lecteur capture TOUS les types d'erreurs:

1. **Erreurs HLS.js**
   ```typescript
   hls.on('hlsError', event => { ... })
   hls.on('hlsFatal', event => { ... })
   hls.on('hlsFragError', event => { ... })
   ```

2. **Erreurs du Lecteur Vidéo HTML5**
   ```typescript
   video.addEventListener('error', event => { ... })
   ```

3. **Erreurs de Validation URL**
   ```typescript
   if (!url.startsWith('http') && !url.startsWith('blob')) { ... }
   ```

## 🖥️ Interface Utilisateur

### État Normal
- Lecteur vidéo normal sans diagnostic visible
- Système fonctionne silencieusement en arrière-plan

### État d'Erreur
```
┌─────────────────────────────────────┐
│    ❌ Message d'erreur principal    │
│    Détails spécifiques à l'erreur   │
│                                     │
│  [⚡ Voir le diagnostic]           │
│                                     │
│  (Diagnostic détaillé affiché si    │
│   bouton cliqué)                    │
└─────────────────────────────────────┘
```

### Diagnostic Détaillé
Quand l'utilisateur clique "Voir le diagnostic":

```
Code d'erreur: NET_500
Type: NETWORK_ERROR
Sévérité: FATAL
Suggestions:
  1. Vérifiez votre connexion Internet
  2. Attendez quelques secondes et réessayez
  3. Vérifiez que l'URL du flux est valide
URL: https://...
Code HTTP: 500
```

## 📊 Exemples de Diagnostics

### Exemple 1: Erreur Réseau
```
Message: ❌ Erreur réseau - Le flux est inaccessible
Code: NET_503
Type: NETWORK_ERROR
Sévérité: FATAL
Détails: Le serveur n'est pas accessible. Code HTTP: 503. 
         Vérifiez votre connexion Internet...
```

### Exemple 2: Géoblocage
```
Message: ⛔ Contenu géobloqu - Accès refusé depuis votre localisation
Code: GEO_403
Type: GEO_BLOCKED
Sévérité: WARNING
Détails: Le flux vidéo est restreint géographiquement...
```

### Exemple 3: Format Non Supporté
```
Message: 📦 Format non supporté - Codec incompatible
Code: FORMAT_001
Type: FORMAT_NOT_SUPPORTED
Sévérité: FATAL
Détails: Les codecs vidéo/audio utilisés ne sont pas supportés...
```

### Exemple 4: Timeout
```
Message: ⏱️ Timeout - Le flux prend trop de temps à charger
Code: TIMEOUT_001
Type: TIMEOUT
Sévérité: WARNING
Détails: La connexion au serveur a expiré...
```

## 🔍 Console Logging

Tous les diagnostics sont aussi enregistrés dans la console avec formatage distinctif:

```
[HLS DIAGNOSTIC] NETWORK_ERROR
📌 Message: ❌ Erreur réseau - Le flux est inaccessible
📋 Détails: Le serveur n'est pas accessible...
💡 Suggestions: 1. Vérifiez votre connexion Internet...
🔗 URL: https://...
📊 Code HTTP: 500
⏰ Timestamp: 2026-06-13T10:30:45.123Z
```

### Légende Couleurs Console
- 🔴 **Fatal**: `color: #ff4444` (Rouge vif)
- 🟡 **Warning**: `color: #ffaa00` (Orange)
- 🔵 **Info**: `color: #4488ff` (Bleu)

## 🛠️ Détection des Erreurs HLS.js

### Erreurs Capturées

| Type HLS.js | Détection | Action |
|---|---|---|
| `networkError` | Erreur réseau → **NETWORK_ERROR** | Fatal |
| `manifest` parsing | Mauvais format → **MANIFEST_PARSING_ERROR** | Fatal |
| `level` incompatible | Codec non supporté → **FORMAT_NOT_SUPPORTED** | Fatal |
| `segment` loading | Impossible charger segment → **SEGMENT_LOADING_ERROR** | Warning |
| `timeout` | Dépassement délai → **TIMEOUT** | Warning |

### Codes HTTP Interprétés

| Code | Interprétation | Type d'Erreur |
|---|---|---|
| 0 | Requête bloquée/CORS | CORS_ERROR |
| 401 | Non autorisé | CORS_ERROR |
| 403 | Interdit/Géoblocage | GEO_BLOCKED |
| 404 | Non trouvé | INVALID_URL |
| 5xx | Erreur serveur | NETWORK_ERROR |

## 💻 Utilisation pour le Développeur

### Accéder aux Diagnostics

```typescript
// Dans les logs du navigateur
const diagnostic = createDiagnostic(event, url);
console.log(diagnostic); // Accès complet aux données

// Message utilisateur lisible
const message = getUserFriendlyMessage(diagnostic);
alert(message);
```

### Tests des Erreurs

Pour tester le système:

1. **URL invalide**: `http://invalid-url-without-m3u8`
2. **URL inexistante**: `https://example.com/nonexistent.m3u8`
3. **CORS non configuré**: URL cross-origin sans CORS
4. **Format invalide**: URL qui n'est pas .m3u8
5. **Timeout**: URL très lente

## 🔐 Sécurité et Confidentialité

- ✅ Les URLs sont enregistrées (nécessaire pour diagnostic)
- ✅ Pas de données sensibles autre que l'URL
- ✅ Logs dans la console browser (accessible dev tools)
- ⚠️ Les codes HTTP peuvent révéler info sur le serveur

## 📈 Statistiques et Monitoring

Le système enregistre:

```typescript
{
  errorType: string,
  errorCode: string,
  severity: 'fatal' | 'warning' | 'info',
  timestamp: ISO8601,
  statusCode?: number,
  url: string
}
```

Peut être envoyé à un service de monitoring:

```typescript
// Exemple: Envoi à service analytics
fetch('/api/video-errors', {
  method: 'POST',
  body: JSON.stringify(diagnostic)
});
```

## 🎓 Scénarios d'Usage

### Scénario 1: Support Utilisateur
1. Utilisateur signale erreur vidéo
2. Support demande code d'erreur (ex: `NET_500`)
3. Identification immédiate du problème
4. Solution rapide fournie

### Scénario 2: Monitoring Qualité Service
1. Récolte des codes d'erreur via analytics
2. Identification des problèmes récurrents
3. Prioritisation des corrections

### Scénario 3: Debugging En Développement
1. Ouvrir Console Dev
2. Voir diagnostic complet avec détails HLS.js
3. Comprendre exactement pourquoi ça échoue
4. Corriger rapidement

## 🚀 Améliorations Futures

- [ ] Historique des erreurs (dernières 10 erreurs)
- [ ] Statistiques d'erreurs par type
- [ ] Retry automatique intelligent par type
- [ ] Tests de connectivité avant lecture
- [ ] Prédiction des problèmes basée sur patterns
- [ ] Intégration avec service de monitoring

## 📝 Résumé des Bénéfices

✅ **Diagnostic automatique** - Identification instantanée du problème
✅ **Messages clairs** - Français, emojis, visuellement distinct
✅ **Suggestions utiles** - Steps concrets pour résoudre
✅ **Logging complet** - Console + Interface
✅ **Codes d'erreur** - Suivi et support facilité
✅ **Sévérité marquée** - Priorité immédiate des actions
✅ **Métadonnées riches** - Toutes les infos pour investigation
✅ **UX améliorée** - Utilisateur informé et guidé
