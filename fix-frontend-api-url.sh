#!/bin/bash

set -e

echo "🔧 FIXING FRONTEND API URL CONFIGURATION"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_status "Removing problematic .env.local file..."
rm -f frontend/.env.local

print_status "Updating frontend .env.production with correct API URL..."
cat > frontend/.env.production << 'EOF'
# API Configuration - PRODUCTION
NEXT_PUBLIC_API_URL=https://api-dot-onyourbehlf.uc.r.appspot.com/api

# App Configuration
NEXT_PUBLIC_APP_NAME=KeralGiftsOnline
NEXT_PUBLIC_APP_VERSION=3.0.0
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_WHATSAPP_NUMBER=+918075030919

# Performance
FAST_REFRESH=false
EOF

print_status "Rebuilding frontend with correct environment variables..."
cd frontend
npm run build
cd ..

print_status "Updating deployment directory..."
rm -rf deploy/frontend/.next
cp -r frontend/.next deploy/frontend/

print_status "Redeploying frontend..."
cd deploy/frontend
gcloud app deploy app.yaml --quiet --version=$(date +%Y%m%dt%H%M%S)
cd ../..

print_success "Frontend API URL fix completed!"

print_status "Testing the fix..."
sleep 15

# Test the deployment
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://onyourbehlf.uc.r.appspot.com/)

echo ""
echo "=== RESULTS ==="
echo "Frontend Status: HTTP $FRONTEND_STATUS"
echo "Frontend URL: https://onyourbehlf.uc.r.appspot.com/"
echo "Backend API: https://api-dot-onyourbehlf.uc.r.appspot.com/api"
echo ""

if [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "✅ Frontend is responding!"
    print_success "🔗 API URL should now be correct"
    echo ""
    echo "Please test the frontend in your browser:"
    echo "https://onyourbehlf.uc.r.appspot.com/"
else
    print_error "❌ Frontend deployment may need more time"
fi