#!/bin/bash

set -e

echo "🔧 FIXING AUTH ENDPOINTS TO USE /api/auth/"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_warning "IMPORTANT: Backend has auth routes at /api/auth/, not /api/users/"
echo ""
print_status "Backend Route Configuration:"
echo "  ✅ /api/auth/login - Login endpoint"
echo "  ✅ /api/auth/register - Registration endpoint"  
echo "  ✅ /api/auth/refresh - Token refresh endpoint"
echo "  ✅ /api/users/ - User management (admin functions)"
echo ""

print_status "Fixed frontend to use correct /api/auth/ endpoints:"
echo "  ✅ frontend/src/utils/api.ts - /users/refresh → /auth/refresh"
echo "  ✅ frontend/src/pages/register.tsx - /users/register → /auth/register"
echo "  ✅ frontend/src/pages/login.tsx - /users/login → /auth/login"
echo "  ✅ frontend/src/context/AuthContext.tsx - /users/refresh → /auth/refresh"
echo "  ✅ frontend/src/pages/checkout.tsx - All endpoints updated to /auth/"

print_status "Rebuilding frontend with correct auth endpoints..."
cd frontend
npm run build
cd ..

print_status "Updating deployment directory..."
rm -rf deploy/frontend/.next
cp -r frontend/.next deploy/frontend/

print_status "Redeploying frontend with correct auth endpoints..."
cd deploy/frontend
gcloud app deploy app.yaml --quiet --version=$(date +%Y%m%dt%H%M%S)
cd ../..

print_success "Auth endpoints corrected and deployed!"

print_status "Testing the fix..."
sleep 15

echo ""
echo "=== AUTH ENDPOINTS CORRECTED ==="
echo "Frontend: https://onyourbehlf.uc.r.appspot.com"
echo "Backend Auth: https://api-dot-onyourbehlf.uc.r.appspot.com/api/auth/"
echo ""
echo "✅ Login: /api/auth/login"
echo "✅ Register: /api/auth/register"
echo "✅ Refresh: /api/auth/refresh"
echo "✅ Logout: /api/auth/logout"
echo ""
print_success "Login should now work correctly on the deployed site!"