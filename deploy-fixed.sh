#!/bin/bash

set -e

echo "🚀 Starting comprehensive deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/
rm -rf .next/
rm -rf deploy/frontend/.next/
rm -rf deploy/backend/dist/

# Build backend
print_status "Building backend..."
cd backend
npm install
npm run build
cd ..

# Copy backend build to deploy directory
print_status "Preparing backend deployment..."
cp -r backend/dist/ deploy/backend/
cp -r public/ deploy/backend/ 2>/dev/null || true

# Build frontend
print_status "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Copy frontend build to deploy directory
print_status "Preparing frontend deployment..."
cp -r frontend/.next/ deploy/frontend/ 2>/dev/null || true
cp -r frontend/public/ deploy/frontend/ 2>/dev/null || true

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

print_success "Deployment completed successfully!"

# Test the deployments
print_status "Testing deployments..."
sleep 10

FRONTEND_URL="https://onyourbehlf.uc.r.appspot.com"
BACKEND_URL="https://api-dot-onyourbehlf.uc.r.appspot.com"

print_status "Testing frontend: $FRONTEND_URL"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" || echo "000")

print_status "Testing backend health: $BACKEND_URL/api/health"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health" || echo "000")

if [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "Frontend is responding (HTTP $FRONTEND_STATUS)"
else
    print_warning "Frontend returned HTTP $FRONTEND_STATUS"
fi

if [ "$BACKEND_STATUS" = "200" ]; then
    print_success "Backend is responding (HTTP $BACKEND_STATUS)"
else
    print_warning "Backend returned HTTP $BACKEND_STATUS"
fi

print_status "Deployment URLs:"
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"

print_success "Deployment process completed!"