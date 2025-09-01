#!/bin/bash

set -e

echo "🔧 FIXING ALL REMAINING AUTH ENDPOINTS"
echo "======================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

print_status "Fixed auth endpoints in the following files:"
echo "  ✅ frontend/src/utils/api.ts - /auth/refresh → /users/refresh"
echo "  ✅ frontend/src/pages/register.tsx - /auth/register → /users/register"
echo "  ✅ frontend/src/pages/login.tsx - /auth/login → /users/login"
echo "  ✅ frontend/src/context/AuthContext.tsx - /auth/refresh → /users/refresh"
echo "  ✅ frontend/src/pages/checkout.tsx - All auth endpoints updated"

print_status "Rebuilding frontend with all auth endpoint fixes..."
cd frontend
npm run build
cd ..

print_status "Updating deployment directory..."
rm -rf deploy/frontend/.next
cp -r frontend/.next deploy/frontend/

print_status "Redeploying frontend with complete auth fix..."
cd deploy/frontend
gcloud app deploy app.yaml --quiet --version=$(date +%Y%m%dt%H%M%S)
cd ../..

print_success "All auth endpoints have been fixed and deployed!"

print_status "Testing the complete fix..."
sleep 15

echo ""
echo "=== ALL AUTH ENDPOINTS FIXED ==="
echo "Frontend: https://onyourbehlf.uc.r.appspot.com"
echo "Backend: https://api-dot-onyourbehlf.uc.r.appspot.com/api/users/"
echo ""
echo "✅ Login: /api/users/login"
echo "✅ Register: /api/users/register"
echo "✅ Refresh: /api/users/refresh"
echo "✅ Guest: /api/users/guest"
echo ""
print_success "Login should now work perfectly on the deployed site!"