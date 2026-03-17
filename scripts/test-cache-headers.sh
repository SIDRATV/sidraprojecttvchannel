#!/bin/bash

# Script to test cache control headers

echo "🔍 Testing Cache Control Headers..."
echo ""

URL="${1:-http://localhost:3000}"

echo "Testing main page ($URL):"
curl -I "$URL" 2>/dev/null | grep -i "cache-control\|pragma\|expires\|etag\|last-modified"

echo ""
echo "Testing API route ($URL/api/cache-control):"
curl -I "$URL/api/cache-control" 2>/dev/null | grep -i "cache-control\|pragma\|expires\|etag\|last-modified"

echo ""
echo "Testing static assets ($URL/_next/static):"
curl -I "$URL/_next/static/test" 2>/dev/null | grep -i "cache-control" || echo "No _next/static files found"

echo ""
echo "✅ Cache control check complete!"
echo ""
echo "Expected results:"
echo "- Main page: no-cache, no-store, must-revalidate, max-age=0"
echo "- API routes: no-cache, no-store, must-revalidate, max-age=0"
echo "- Static assets: public, max-age=31536000, immutable"
