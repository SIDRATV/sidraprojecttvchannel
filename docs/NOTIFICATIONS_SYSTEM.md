# 💬 Système de Notifications Internes - Documentation Complète

## Vue d'ensemble

Le système de notifications internes permet aux utilisateurs de recevoir des notifications directement dans l'app concernant :
- 📺 **Nouvelles vidéos uploadées**
- 💰 **Transactions du portefeuille** (dépôts, retraits, paiements)
- 👑 **Abonnements premium** (activation, expiration, renouvellement)
- ⚠️ **Alertes système** (sécurité, changements importants)

## Caractéristiques

✅ **Notifications en temps réel** - Apparaissent immédiatement après les événements  
✅ **Badge rouge avec compteur** - Affiche le nombre de notifications non lues  
✅ **Mark as read** - Les notifications disparaissent après consultation  
✅ **Filtrage** - Voir toutes ou uniquement les non lues  
✅ **Préférences granulaires** - Contrôle par type de notification  
✅ **Activées par défaut** - Les utilisateurs reçoivent les notifications automatiquement  
✅ **Authentification DB** - Chaque utilisateur ne voit que ses propres notifications  

---

## 🗄️ Structure de la Base de Données

### Table: `notifications`

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_video',      -- Nouvelle vidéo uploadée
    'transaction',    -- Transaction wallet
    'subscription',   -- Abonnement premium
    'system',         -- Alerte système
    'referral',       -- Programme de parrainage
    'promo'          -- Promotions
  )),
  title TEXT NOT NULL,        -- Titre court
  message TEXT NOT NULL,      -- Message détaillé
  icon TEXT DEFAULT 'bell',   -- Lucide icon name
  link TEXT,                  -- Lien vers la ressource
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `users` - Colonne additionnelle

```sql
ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;
```

---

## 🔌 Triggers Automatiques

### 1. Trigger: Nouvelle Vidéo

**Déclenché:** À chaque insertion dans la table `videos`  
**Action:** Envoie une notification à tous les utilisateurs avec notifications activées

```sql
CREATE TRIGGER trigger_new_video
  AFTER INSERT ON videos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_video_notification();
```

**Exemple de notification:**
- **Type:** `new_video`
- **Titre:** "Nouvelle vidéo disponible"
- **Message:** "Découvrez: [Titre de la vidéo]"
- **Icon:** `video`
- **Link:** `/videos/{video_id}`

### 2. Trigger: Transaction du Portefeuille

**Déclenché:** À chaque insertion dans `wallet_transactions`  
**Action:** Crée une notification liée à la transaction

```sql
CREATE TRIGGER trigger_transaction_notification
  AFTER INSERT ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_transaction_notification();
```

**Types de notifications générées:**

#### Réception de fonds (direction = 'in')
- **Type:** `transaction`
- **Title:** "Vous avez reçu {amount} SIDRA"
- **Icon:** `arrow-down-left` (vert)
- **Cas spéciaux:**
  - Si type = 'subscription': Icon = `crown`, Message = "Recharge d'abonnement reçue"

#### Envoi/Paiement (direction = 'out')
- **Type:** `transaction`
- **Title:** "Vous avez envoyé {amount} SIDRA"
- **Icon:** `arrow-up-right` (rouge)
- **Cas spéciaux:**
  - Si type = 'subscription': "Abonnement premium: -{amount} SIDRA"
  - Si type = 'withdrawal': "Retrait: -{amount} SIDRA (frais: {fee})"

### 3. Trigger: Abonnement Premium

**Déclenché:** À chaque insertion dans `premium_subscriptions`  
**Action:** Crée une notification d'activation d'abonnement

```sql
CREATE TRIGGER trigger_subscription_notification
  AFTER INSERT ON premium_subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION trigger_subscription_notification();
```

**Exemple:**
- **Type:** `subscription`
- **Title:** "Abonnement Premium activé"
- **Message:** "Abonnement 1 an jusqu'au 15/04/2027. Montant: 100 SIDRA"
- **Icon:** `crown`
- **Link:** `/premium-dashboard`

### 4. Trigger: Expiration d'Abonnement

**Déclenché:** Lors de la mise à jour du statut d'abonnement à 'expired'  
**Action:** Alerte l'utilisateur

```sql
CREATE TRIGGER trigger_subscription_expiring
  BEFORE UPDATE ON premium_subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'expired' AND OLD.status != 'expired')
  EXECUTE FUNCTION trigger_subscription_expiring();
```

---

## 📡 API Endpoints

### GET `/api/notifications`

**Description:** Récupère les notifications de l'utilisateur

**Query Parameters:**
- `limit` (optionnel, défaut: 20, max: 100) - Nombre de notifications à retourner
- `unread` (optionnel: 'true') - Retourner uniquement les non lues

**Exemple:**
```bash
curl -H "Authorization: Bearer {token}" \
  "https://app.com/api/notifications?limit=10&unread=true"
```

**Réponse:**
```json
{
  "notifications": [
    {
      "id": "uuid-123",
      "type": "new_video",
      "title": "Nouvelle vidéo disponible",
      "message": "Découvrez: Ma Superbe Vidéo",
      "icon": "video",
      "link": "/videos/video-123",
      "read": false,
      "created_at": "2024-04-14T10:30:00Z"
    }
  ],
  "unreadCount": 3
}
```

### PATCH `/api/notifications`

**Description:** Marquer les notifications comme lues

**Body:**
```json
{
  "markAll": true  // Marquer toutes comme lues
}
```

Ou:
```json
{
  "notificationIds": ["uuid-1", "uuid-2"]  // Marquer spécifiques
}
```

**Réponse:**
```json
{
  "success": true
}
```

### PATCH `/api/notifications/settings`

**Description:** Activer/Désactiver les notifications pour un utilisateur

**Body:**
```json
{
  "enabled": false
}
```

**Réponse:**
```json
{
  "success": true,
  "notifications_enabled": false
}
```

### GET/PATCH `/api/notifications/preferences`

**Description:** Gérer les préférences granulaires par type

**GET Response:**
```json
{
  "notifications_enabled": true,
  "preferences": {
    "new_video": true,
    "transactions": true,
    "subscriptions": true,
    "system": true
  }
}
```

**PATCH Body:**
```json
{
  "notifications_enabled": true,
  "preferences": {
    "new_video": true,
    "transactions": false,
    "subscriptions": true
  }
}
```

---

## 🎨 UI/UX - Composants

### Badge dans AppHeader

**Affichage:**
- ✅ Badge rouge avec compteur blanc en haut à droite de la cloche
- ✅ Animé avec Framer Motion
- ✅ Clique pour ouvrir un dropdown avec les 10 dernières notifications
- ✅ Lien "Voir tout" vers la page `/notifications`

**Code:**
```tsx
{unreadCount > 0 && (
  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
    {unreadCount}
  </span>
)}
```

### Dropdown Notifications

**Contenue:**
- Titre "Notifications"
- Bouton "Tout lire" (visible si non lues)
- Liste scrollable des 10 dernières notifications
- Indicateur de lecture (point blanc/bleu si non lu)
- Heure relative (ex: "il y a 5min")
- Clic pour naviguer vers le lien asocié
- "Voir tout" pour aller à la page complète

### Page Notifications Complète

**URL:** `/notifications`

**Fonctionnalités:**
- ✅ Affiche toutes les notifications
- ✅ Filtre: "Toutes" ou "Non lues"
- ✅ Tri: Plus récent au plus ancien
- ✅ Bouton "Supprimer" pour chaque notification
- ✅ Bouton "Marquer tout comme lu"
- ✅ Animations fluides avec Framer Motion

---

## 🔧 Implémentation: Créer une Notification Automatiquement

### Depuis la Base de Données (PL/SQL)

```sql
-- Fonction: Créer une notification unique
SELECT create_notification(
  p_user_id => '550e8400-e29b-41d4-a716-446655440000',
  p_type => 'transaction',
  p_title => 'Vous avez reçu 50 SIDRA',
  p_message => 'Réception de 50 SIDRA de votre ami',
  p_icon => 'arrow-down-left',
  p_link => '/wallet'
);

-- Fonction: Broadcaster à tous les users
SELECT broadcast_notification(
  p_type => 'new_video',
  p_title => 'Nouvelle vidéo: Les merveilles du Maroc',
  p_message => 'Découvrez une nouvelle vidéo documentaire',
  p_icon => 'video',
  p_link => '/videos/doc-123'
);
```

### Depuis l'API (Backend Next.js)

```typescript
// Dans une route API
import { createServerClient } from '@/lib/supabase';

const supabase = createServerClient();

// Créer une notification
const { data, error } = await (supabase as any).rpc('create_notification', {
  p_user_id: userId,
  p_type: 'system',
  p_title: 'Bienvenue!',
  p_message: 'Votre compte a été créé avec succès',
  p_icon: 'gift',
  p_link: '/dashboard'
});
```

### Exemple Complet: Lors de l'Upload d'une Vidéo

```typescript
// Dans /api/admin/upload-video/confirm
export async function POST(request: NextRequest) {
  // ... logique d'upload ...
  
  // Après insertion dans la DB, le trigger déclenche automatiquement
  // INSERT INTO videos (title, ...) VALUES (...)
  // 
  // Le trigger trigger_new_video s'exécute et appelle:
  // PERFORM broadcast_notification(
  //   'new_video',
  //   'Nouvelle vidéo disponible',
  //   'Découvrez: ' || video_title,
  //   'video',
  //   '/videos/' || video_id
  // );
  
  return NextResponse.json({ success: true });
}
```

---

## 💾 Préférences Utilisateur

### Stockage

Les préférences sont stockées à deux niveaux:

1. **Base de Données** (global):
   - `users.notifications_enabled` - Activer/désactiver TOUTES les notifications

2. **LocalStorage** (client-side):
   - `settings_notif_new_video` - Notifications vidéos
   - `settings_notif_transactions` - Notifications transactions
   - `settings_notif_subscriptions` - Notifications abonnements
   - `settings_notif_system` - Alertes système

### Page des Paramètres

**Chemin:** `/settings` → "Notifications"

```tsx
<SettingToggle
  label="Notifications internes activées"
  defaultValue={true}
  onChange={updateNotificationsEnabled}
/>

<SettingToggle
  label="Nouvelles vidéos"
  storageKey="settings_notif_new_video"
/>

<SettingToggle
  label="Transactions du portefeuille"
  storageKey="settings_notif_transactions"
/>
```

---

## 📝 Installer la Migration

### Étapes:

1. **Aller à Supabase Dashboard** → SQL Editor
2. **Créer une nouvelle requête**
3. **Copier le contenu de** `prisma/migration_notifications_triggers.sql`
4. **Exécuter la requête**
5. **Vérifier** que les triggers sont créés:

```sql
SELECT * FROM pg_proc 
WHERE proname IN ('trigger_new_video_notification', 'trigger_transaction_notification');
```

---

## 🧪 Test

### Test Manual: Créer une Notification

```sql
-- Test 1: Notification unique
SELECT create_notification(
  '550e8400-e29b-41d4-a716-446655440000',
  'transaction',
  'Test Transaction',
  'Ceci est un test',
  'wallet',
  '/wallet'
);

-- Test 2: Vérifier la création
SELECT * FROM notifications 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC LIMIT 5;
```

### Test Frontend: Vérifier l'UI

1. Créer une notification via SQL
2. Aller sur l'app
3. Voir le badge rouge avec le compteur
4. Cliquer pour ouvrir le dropdown
5. Cliquer sur la notification → navigateur vers le lien
6. Revenir à l'app → notification marquée comme lue
7. Badge doit disparaître

---

## 📊 Monitoring & Logs

### Vérifier les Notifications Non Lues

```sql
SELECT user_id, COUNT(*) as unread_count
FROM notifications
WHERE read = FALSE
GROUP BY user_id
ORDER BY unread_count DESC;
```

### Vérifier les Triggers Récents

```sql
SELECT 
  user_id,
  type,
  title,
  created_at,
  read
FROM notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Statistiques

```sql
-- Notifications par type
SELECT type, COUNT(*) as total, 
  COUNT(CASE WHEN read = FALSE THEN 1 END) as unread
FROM notifications
GROUP BY type;

-- Utilisateurs avec le plus de notifications
SELECT user_id, COUNT(*) as total
FROM notifications
GROUP BY user_id
ORDER BY total DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Les notifications ne s'affichent pas

1. ✅ Vérifier `users.notifications_enabled = TRUE`
2. ✅ Vérifier que l'event s'est produit (INSERT dans videos, wallet_transactions, etc.)
3. ✅ Vérifier les logs Supabase pour les erreurs des triggers
4. ✅ Vérifier la RLS (`SELECT * FROM notifications` doit retourner les données)

### Le badge ne se met pas à jour

1. ✅ Vérifier le polling (par défaut 30s)
2. ✅ Forcer un refresh: `fetchNotifications()`
3. ✅ Vérifier le token Bearer est correct

### Les triggers ne se déclenchent pas

1. ✅ Vérifier que la migration a été exécutée
2. ✅ Vérifier `SELECT * FROM information_schema.triggers;`
3. ✅ Vérifier la RLS sur la table notifications

---

## 🎯 Checklist d'Implémentation

- [ ] Migration SQL exécutée (`migration_notifications_triggers.sql`)
- [ ] Table `notifications` existe
- [ ] Colonne `users.notifications_enabled` existe
- [ ] Triggers créés (4 au total)
- [ ] API `/api/notifications` fonctionne
- [ ] API `/api/notifications/settings` fonctionne
- [ ] Page `/notifications` affiche les notifications
- [ ] AppHeader affiche le badge rouge
- [ ] Page `/settings` a la section Notifications
- [ ] Test: Créer une notification manuelle = OK
- [ ] Test: Voir le badge = OK
- [ ] Test: Mark as read = OK
- [ ] Test: Dropdown fonctionne = OK

---

## 📚 Fichiers Importants

- **Migration SQL:** `prisma/migration_notifications_triggers.sql`
- **API Notifications:** `src/app/api/notifications/route.ts`
- **API Préférences:** `src/app/api/notifications/preferences/route.ts`
- **API Paramètres:** `src/app/api/notifications/settings/route.ts`
- **Page Notifications:** `src/app/(app)/notifications/page.tsx`
- **Page Paramètres:** `src/app/(app)/settings/page.tsx`
- **Composant Header:** `src/components/app/AppHeader.tsx`

---

## 🚀 Prochaines Étapes

1. ✅ Exécuter la migration SQL
2. ✅ Tester les triggers
3. ✅ Améliorer les préférences granulaires (DB storage)
4. ✅ Ajouter les Web Notifications API
5. ✅ Ajouter le Real-Time (Supabase Realtime)
6. ✅ Analytics sur les notifications lues/ignorées
