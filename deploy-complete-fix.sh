#!/bin/bash

set -e

echo "🚀 Starting complete deployment fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Clean and prepare directories
print_status "Cleaning deployment directories..."
rm -rf deploy/frontend/node_modules/
rm -rf deploy/backend/node_modules/
rm -rf deploy/frontend/.next/
rm -rf deploy/backend/dist/

# Build and prepare backend
print_status "Building backend..."
cd backend
npm install
npm run build
cd ..

# Copy backend files
print_status "Preparing backend deployment..."
cp -r backend/dist/* deploy/backend/
cp -r public/ deploy/backend/ 2>/dev/null || true

# Install backend dependencies in deployment directory
print_status "Installing backend dependencies..."
cd deploy/backend
npm install --production
cd ../..

# Build and prepare frontend
print_status "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Copy frontend files
print_status "Preparing frontend deployment..."
cp -r frontend/.next/ deploy/frontend/
cp -r frontend/public/ deploy/frontend/ 2>/dev/null || true

# Install frontend dependencies in deployment directory
print_status "Installing frontend dependencies..."
cd deploy/frontend
npm install --production
cd ../..

# Deploy backend
print_status "Deploying backend service..."
cd deploy/backend
gcloud app deploy app.yaml --quiet --version=$(date +%Y%m%dt%H%M%S)
cd ../..

# Deploy frontend
print_status "Deploying frontend service..."
cd deploy/frontend
gcloud app deploy app.yaml --quiet --version=$(date +%Y%m%dt%H%M%S)
cd ../..

print_success "Deployment completed!"

# Wait and test
print_status "Waiting for services to start..."
sleep 30

FRONTEND_URL="https://onyourbehlf.uc.r.appspot.com"
BACKEND_URL="https://api-dot-onyourbehlf.uc.r.appspot.com"

print_status "Testing services..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" || echo "000")
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health" || echo "000")

echo ""
echo "=== DEPLOYMENT RESULTS ==="
echo "Frontend: $FRONTEND_URL (HTTP $FRONTEND_STATUS)"
echo "Backend:  $BACKEND_URL (HTTP $BACKEND_STATUS)"
echo ""

if [ "$FRONTEND_STATUS" = "200" ] && [ "$BACKEND_STATUS" = "200" ]; then
    print_success "Both services are working correctly!"
else
    print_error "Some services may need more time to start. Check logs if issues persist."
fi