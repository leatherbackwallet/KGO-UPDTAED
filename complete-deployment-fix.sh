#!/bin/bash

set -e

echo "🚀 COMPREHENSIVE DEPLOYMENT FIX"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Phase 1: Clean Everything
print_status "Phase 1: Cleaning all deployment artifacts..."
rm -rf deploy/frontend/.next deploy/frontend/node_modules
rm -rf deploy/backend/dist deploy/backend/node_modules
rm -rf .next dist

# Phase 2: Fix Environment Variables
print_status "Phase 2: Standardizing environment variables..."

# Update backend .env.production with correct URLs
cat > backend/.env.production << 'EOF'
# Database Configuration
MONGODB_URI=mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline

# JWT Configuration
JWT_SECRET=kerala-gifts-online-super-secure-jwt-secret-production-2024-minimum-32-chars
JWT_REFRESH_SECRET=kerala-gifts-online-refresh-token-secret-production-2024-minimum-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=kerala-gifts-online-session-secret-production-2024-minimum-32-chars

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=deojqbepy
CLOUDINARY_API_KEY=476938714454695
CLOUDINARY_API_SECRET=fQBjh1m4rF9ztey7u4FANZQUNhQ

# CORS Configuration
CORS_ORIGIN=https://onyourbehlf.uc.r.appspot.com

# Application URLs
FRONTEND_URL=https://onyourbehlf.uc.r.appspot.com
API_URL=https://api-dot-onyourbehlf.uc.r.appspot.com

# Server Configuration
PORT=8080
NODE_ENV=production
CREATE_SUPERUSER=true

# Admin Configuration
ADMIN_EMAIL=admin@keralagiftsonline.com
ADMIN_PASSWORD=SuperSecure123!
ADMIN_PHONE=+49123456789
EOF

# Update frontend .env.production
cat > frontend/.env.production << 'EOF'
# API Configuration
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

# Phase 3: Build Backend
print_status "Phase 3: Building backend..."
cd backend
npm install
npm run build
cd ..

# Phase 4: Build Frontend
print_status "Phase 4: Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Verify frontend build
if [ ! -f "frontend/.next/BUILD_ID" ]; then
    print_error "Frontend build failed - BUILD_ID missing"
    exit 1
fi

print_success "Frontend build completed with BUILD_ID: $(cat frontend/.next/BUILD_ID)"

# Phase 5: Prepare Backend Deployment
print_status "Phase 5: Preparing backend deployment..."
cp -r backend/dist/* deploy/backend/
cp -r public deploy/backend/ 2>/dev/null || true

# Install backend dependencies
cd deploy/backend
npm install --production
cd ../..

# Phase 6: Prepare Frontend Deployment
print_status "Phase 6: Preparing frontend deployment..."
cp -r frontend/.next deploy/frontend/
cp -r frontend/public deploy/frontend/ 2>/dev/null || true

# Ensure correct package.json for frontend
cat > deploy/frontend/package.json << 'EOF'
{
  "name": "keralagiftsonline-frontend-deploy",
  "version": "3.0.0",
  "description": "KeralGiftsOnline.com Frontend Deployment",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.85.5",
    "axios": "^1.10.0",
    "critters": "^0.0.23",
    "date-fns": "^4.1.0",
    "jwt-decode": "^4.0.0",
    "lucide-react": "^0.540.0",
    "next": "^14.2.32",
    "react": "^18",
    "react-dom": "^18",
    "recharts": "^3.1.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
EOF

# Install frontend dependencies
cd deploy/frontend
npm install --production
cd ../..

# Phase 7: Deploy Backend
print_status "Phase 7: Deploying backend..."
cd deploy/backend
gcloud app deploy app.yaml --quiet --version=$(date +%Y%m%dt%H%M%S)
cd ../..

# Phase 8: Deploy Frontend
print_status "Phase 8: Deploying frontend..."
cd deploy/frontend
gcloud app deploy app.yaml --quiet --version=$(date +%Y%m%dt%H%M%S)
cd ../..

# Phase 9: Test Deployments
print_status "Phase 9: Testing deployments..."
sleep 30

BACKEND_URL="https://api-dot-onyourbehlf.uc.r.appspot.com"
FRONTEND_URL="https://onyourbehlf.uc.r.appspot.com"

print_status "Testing backend health..."
BACKEND_STATUS=$(curl -s -m 10 "$BACKEND_URL/api/health-status" | grep -o '"status":"[^"]*"' || echo "failed")

print_status "Testing frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" || echo "000")

echo ""
echo "=== DEPLOYMENT RESULTS ==="
echo "Backend:  $BACKEND_URL ($BACKEND_STATUS)"
echo "Frontend: $FRONTEND_URL (HTTP $FRONTEND_STATUS)"
echo ""

if [[ "$BACKEND_STATUS" == *"ok"* ]] && [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "✅ Backend is healthy"
    echo "✅ Frontend is responding"
    echo "✅ Services are ready for use"
else
    print_warning "⚠️  Some services may need more time to start"
    echo "Backend: $BACKEND_STATUS"
    echo "Frontend: HTTP $FRONTEND_STATUS"
    echo ""
    echo "Check logs if issues persist:"
    echo "  gcloud app logs tail --service=api"
    echo "  gcloud app logs tail --service=default"
fi

print_success "Deployment process completed!"