# SQL Files Organization

## Structure

Tous les fichiers SQL sont **séparés par table** avec leurs **RLS policies** individuelles. Cela facilite:
- ✅ Déboguer les erreurs
- ✅ Comprendre chaque table clairement
- ✅ Ajouter ou modifier les policies sans risque

## Fichiers

### Core Tables
- **sql.users.sql** — Table `users` avec RLS (READ: public, UPDATE: self)
- **sql.categories.sql** — Table `categories` avec RLS (admins only)
- **sql.videos.sql** — Table `videos` avec RLS (admins only for INSERT/UPDATE/DELETE)
- **sql.comments.sql** — Table `comments` avec RLS
- **sql.likes.sql** — Table `likes` avec RLS
- **sql.newsletter.sql** — Table `newsletter` avec RLS
- **sql.analytics.sql** — Table `analytics` avec RLS (service role only)

### Content Tables
- **sql.live-streams.sql** — Table `live_streams` avec RLS (admins only)
- **sql.podcasts.sql** — Table `podcasts` avec RLS (admins only)

### Wallet Tables
- **sql.wallet_accounts.sql** — Comptes internes
- **sql.wallet_transactions.sql** — Ledger transactionnel
- **sql.wallet_withdrawals.sql** — Files de retrait
- **sql.wallet_limits.sql** — Limites quotidiennes
- **sql.wallet_deposit_addresses.sql** — Adresses de dépôt
- **sql.wallet_audit_logs.sql** — Logs d'audit

### Infrastructure
- **sql.extensions-indexes.sql** — Extensions et indexes
- **sql.functions.sql** — Fonctions et triggers
- **00-init.sql** — Fichier initial (à ignorer)
- **schema.sql** — Ancien fichier complet (à archiver)

## Important: RLS Policies

### Users
- **SELECT**: Public (tous peuvent lire)
- **UPDATE**: Self only (chaque utilisateur peut mettre à jour ses données)

### Videos
- **SELECT**: Public (tous peuvent lire)
- **INSERT**: Admins only ❌ (les utilisateurs normaux CANNOT insérer)
- **UPDATE**: Admins only ❌ (les utilisateurs normaux CANNOT mettre à jour)
- **DELETE**: Admins only

### Comments & Likes
- **SELECT**: Public
- **INSERT**: Authenticated users (each can insert their own)
- **UPDATE/DELETE**: Self only

### Wallet Tables
- **SELECT**: Users can read their own (auth.uid() = user_id)
- **ALL**: Service role only (for internal operations)

## Exécution des fichiers

### 1. Supabase SQL Editor - Ordre d'exécution
```
1. sql.extensions-indexes.sql (extensions first)
2. sql.users.sql
3. sql.categories.sql
4. sql.videos.sql
5. sql.comments.sql
6. sql.likes.sql
7. sql.newsletter.sql
8. sql.analytics.sql
9. sql.live-streams.sql
10. sql.podcasts.sql
11. sql.wallet_accounts.sql
12. sql.wallet_transactions.sql
13. sql.wallet_withdrawals.sql
14. sql.wallet_limits.sql
15. sql.wallet_deposit_addresses.sql
16. sql.wallet_audit_logs.sql
17. sql.functions.sql (triggers last)
```

### Notes
- ⚠️ Chaque fichier utilise `DROP POLICY IF EXISTS` + `CREATE POLICY` → idempotent
- ⚠️ Les fichiers changent `IF NOT EXISTS` pour les tables existantes
- ⚠️ Les RLS policies BLOQUENT les utilisateurs normaux d'insérer/modifier les vidéos
- ✅ Les admins peuvent tout gérer 

### Table Files (sql.xxx.sql)
- Table creation with constraints
- Row Level Security (RLS) enabled
- RLS policies (DROP + CREATE for idempotency)

### Types
- Types are defined in the files where they're first used
- Example: `wallet_transaction_type` in **sql.wallet_transactions.sql**

### sql.indexes.sql
- All indexes for performance optimization
- Safe to run multiple times (uses IF NOT EXISTS)

### sql.functions.sql
- Trigger helper functions
- Wallet RPC functions (wallet_internal_transfer, wallet_credit_deposit, etc)
- Safe to run multiple times (DROP + CREATE)

### sql.seed_categories.sql
- Default categories for the platform
- Uses ON CONFLICT to avoid duplicates

## Running in Supabase

Run each file in Supabase SQL Editor in order:

1. Copy entire content of each file
2. Paste into Supabase SQL Editor
3. Click "Run"
4. If you see "no rows returned" - that's good, it means no errors
5. Continue to next file

## Running Locally

If using local PostgreSQL:

```bash
psql -U postgres -d sidratv < prisma/00-init.sql
psql -U postgres -d sidratv < prisma/sql.users.sql
psql -U postgres -d sidratv < prisma/sql.wallet_accounts.sql
# ... continue with all files
```

Or in one command:

```bash
cat prisma/00-init.sql \
    prisma/sql.users.sql \
    prisma/sql.wallet_accounts.sql \
    prisma/sql.wallet_transactions.sql \
    prisma/sql.wallet_withdrawals.sql \
    prisma/sql.wallet_limits.sql \
    prisma/sql.wallet_deposit_addresses.sql \
    prisma/sql.wallet_audit_logs.sql \
    prisma/sql.categories.sql \
    prisma/sql.videos.sql \
    prisma/sql.comments.sql \
    prisma/sql.likes.sql \
    prisma/sql.newsletter.sql \
    prisma/sql.analytics.sql \
    prisma/sql.indexes.sql \
    prisma/sql.functions.sql \
    prisma/sql.seed_categories.sql | psql -U postgres -d sidratv
```

## Key Features

### Idempotency
- All CREATE statements use `IF NOT EXISTS`
- All policies use `DROP POLICY IF EXISTS` before `CREATE POLICY`
- Safe to run multiple times without errors

### RLS (Row Level Security)
- **Users**: Public read, authenticated can update own profile
- **Videos**: Public read only; only admins can insert/update/delete
- **Wallet**: Users read own; service_role manages all
- **Comments/Likes**: Public read, authenticated can insert/delete own
- **Analytics**: Fully restricted (service_role only via triggers)

### Wallet Functions
- `wallet_internal_transfer()` - Atomic internal transfer
- `wallet_credit_deposit()` - Credit on-chain deposit
- `wallet_create_withdrawal()` - Create withdrawal request
- All use `SECURITY DEFINER` and transaction isolation

## Troubleshooting

### Error: "relation already exists"
- You likely already ran this file
- Safe to ignore or run again (thanks to IF NOT EXISTS)

### Error: "permission denied" or "No rows returned"
- This is normal when RLS policies restrict access
- Use service_role key in API for admin operations

### Error: "function already exists"
- Run `sql.functions.sql` again to update
- DROP IF EXISTS handles the cleanup

## Notes

- Each table file is independent and contains all RLS setup for that table
- Easier to review, debug, and version control individual files
- Clear separation of concerns between tables
- All `UPDATE`/`INSERT` ON policies are properly configured
