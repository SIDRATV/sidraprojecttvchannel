# Fix RLS Policies for Users Table

## Problème
La table `users` a RLS (Row Level Security) activé mais **pas de politiques RLS**, ce qui empêche toute lecture/écriture.

## Solution
Exécute les commandes SQL suivantes dans Supabase SQL Editor:

### Étapes:
1. Va vers: https://app.supabase.com/project/gtcstmbruwttjintwoek/sql/new
2. Copie et exécute ce SQL:

```sql
-- Users RLS policies (all public read, authenticated can read own)
CREATE POLICY "Users are publicly readable" ON users FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

3. Clique sur "Run" (ou Ctrl+Enter)
4. Si tu vois "Success", c'est bon ✅

## Vérification
Une fois exécuté, le login devrait fonctionner. Si tu vois toujours l'erreur 400, vérifie:
- La ligne utilisateur existe dans la table `users`
- Le token d'authentification est valide dans le navigateur (voir console)
