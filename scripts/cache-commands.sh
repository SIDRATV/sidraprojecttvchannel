#!/bin/bash

# ============================================
# 📦 COMMANDES ESSENTIELLES - CACHE SYSTEM
# ============================================

# Copier ce fichier dans votre .bash_aliases ou utiliser directement

# 1️⃣ DÉVELOPPEMENT
alias dev="npm run dev"
alias build="npm run build"
alias start="npm start"

# 2️⃣ TESTER LES HEADERS DE CACHE

# Tester page accueil
cache-test-home() {
    echo "🔍 Testing home page cache headers..."
    curl -I http://localhost:3000 2>/dev/null | grep -iE "cache-control|pragma|expires|etag|last-modified"
}

# Tester API
cache-test-api() {
    echo "🔍 Testing API cache headers..."
    curl -I http://localhost:3000/api/cache-control 2>/dev/null | grep -iE "cache-control|pragma|expires|etag"
}

# Tester tout
cache-test-all() {
    echo "🔍 Testing all cache headers..."
    echo ""
    echo "📄 HOME PAGE:"
    cache-test-home
    echo ""
    echo "📡 API:"
    cache-test-api
    echo ""
    echo "✅ Cache test complete!"
}

# 3️⃣ TESTER EN PRODUCTION

# Remplacer 'domain.com' par votre vrai domaine
cache-test-prod() {
    DOMAIN="${1:-domain.com}"
    echo "🔍 Testing production cache headers for $DOMAIN..."
    curl -I https://$DOMAIN 2>/dev/null | grep -iE "cache-control|pragma|expires|etag"
}

# 4️⃣ DÉCLENCHER UN CACHE CLEAR à la demande

# Pour développement local
cache-clear-local() {
    echo "🗑️  Clearing cache locally..."
    curl -X POST http://localhost:3000/api/cache-control \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer local-dev-token"
    echo ""
    echo "✅ Local cache cleared!"
}

# Pour production (sécurisé avec token)
cache-clear-prod() {
    DOMAIN="${1:-domain.com}"
    TOKEN="${2:-your-secret-token}"

    if [ "$TOKEN" = "your-secret-token" ]; then
        echo "❌ Please set your actual token!"
        echo "Usage: cache-clear-prod domain.com YOUR_ACTUAL_TOKEN"
        return 1
    fi

    echo "🗑️  Clearing cache on $DOMAIN..."
    curl -X POST https://$DOMAIN/api/cache-control \
        -H "Authorization: Bearer $TOKEN"
    echo ""
    echo "✅ Production cache cleared!"
}

# 5️⃣ CHECKER LE STATUT

# Status local
cache-status-local() {
    echo "📊 Checking local cache status..."
    curl -s http://localhost:3000/api/cache-control | jq '.'
}

# Status production
cache-status-prod() {
    DOMAIN="${1:-domain.com}"
    echo "📊 Checking production cache status for $DOMAIN..."
    curl -s https://$DOMAIN/api/cache-control | jq '.'
}

# 6️⃣ BUILD & DEPLOY

# Build optimisé pour production
build-prod() {
    echo "🔨 Building for production..."
    npm run build
    echo "✅ Build complete!"
    echo ""
    echo "📦 Next steps:"
    echo "1. Test locally: npm start"
    echo "2. Test cache headers: cache-test-all"
    echo "3. Deploy when ready"
}

# 7️⃣ NETTOYER LES CACHES LOCAUX

# Nettoyer node_modules
clean-node() {
    echo "🗑️  Cleaning node_modules..."
    rm -rf node_modules
    rm -rf package-lock.json
    npm install
    echo "✅ Cleaned!"
}

# Nettoyer .next
clean-next() {
    echo "🗑️  Cleaning .next..."
    rm -rf .next
    echo "✅ Cleaned!"
}

# Nettoyer tout
clean-all() {
    echo "🗑️  Cleaning everything..."
    clean-next
    clean-node
    echo "✅ All cleaned!"
}

# 8️⃣ AFFICHER LE HELP

cache-help() {
    cat << 'EOF'

📚 CACHE SYSTEM - COMMANDES DISPONIBLES

🧪 TESTS:
  cache-test-home        → Tester home page cache headers
  cache-test-api         → Tester API cache headers
  cache-test-all         → Tester tous les headers
  cache-test-prod [domaine] → Tester en production

📊 STATUS:
  cache-status-local     → Status local
  cache-status-prod [domaine] → Status production

🗑️  CACHE CLEAR:
  cache-clear-local      → Clear cache local
  cache-clear-prod [domaine] [token] → Clear cache production

🔨 BUILD:
  build-prod             → Build optimisé pour prod
  dev                    → Dev server
  build                  → Build Next.js
  start                  → Start production server

🧹 NETTOYAGE:
  clean-next             → Supprimer .next
  clean-node             → Supprimer node_modules
  clean-all              → Supprimer tout

ℹ️  INFO:
  cache-help             → Afficher cette aide

EXEMPLES:
  # Tester localement
  cache-test-all

  # Vérifier les headers en production
  cache-test-prod sidra.tv

  # Clear cache en production
  cache-clear-prod sidra.tv $YOUR_SECRET_TOKEN

  # Build pour production
  build-prod && npm start

EOF
}

# Afficher help au chargement
echo "✅ Cache system commands loaded! Type 'cache-help' for list of commands"
