#!/bin/bash

# Verification Script for OnYourBehlf Deployment Structure
# This script verifies that the deployment structure is correct

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "🔍 Verifying OnYourBehlf Deployment Structure"
echo "=============================================="

# Check deployment directories exist
print_test "Checking deployment directories..."
if [ -d "deploy/backend" ]; then
    print_status "Backend deployment directory exists"
else
    print_error "Backend deployment directory missing"
    exit 1
fi

if [ -d "deploy/frontend" ]; then
    print_status "Frontend deployment directory exists"
else
    print_error "Frontend deployment directory missing"
    exit 1
fi

# Check backend structure
print_test "Checking backend deployment structure..."
if [ -f "deploy/backend/app.yaml" ]; then
    print_status "Backend app.yaml exists"
else
    print_error "Backend app.yaml missing"
    exit 1
fi

if [ -d "deploy/backend/dist" ]; then
    print_status "Backend dist directory exists"
else
    print_error "Backend dist directory missing"
    exit 1
fi

if [ -f "deploy/backend/dist/server.js" ]; then
    print_status "Backend compiled server.js exists"
else
    print_error "Backend compiled server.js missing"
    exit 1
fi

if [ -f "deploy/backend/package.json" ]; then
    print_status "Backend package.json exists"
else
    print_error "Backend package.json missing"
    exit 1
fi

# Check frontend structure
print_test "Checking frontend deployment structure..."
if [ -f "deploy/frontend/app.yaml" ]; then
    print_status "Frontend app.yaml exists"
else
    print_error "Frontend app.yaml missing"
    exit 1
fi

if [ -d "deploy/frontend/.next" ]; then
    print_status "Frontend .next build directory exists"
else
    print_error "Frontend .next build directory missing"
    exit 1
fi

if [ -f "deploy/frontend/server.js" ]; then
    print_status "Frontend server.js exists"
else
    print_error "Frontend server.js missing"
    exit 1
fi

if [ -f "deploy/frontend/package.json" ]; then
    print_status "Frontend package.json exists"
else
    print_error "Frontend package.json missing"
    exit 1
fi

if [ -d "deploy/frontend/node_modules" ]; then
    print_status "Frontend node_modules exists"
else
    print_error "Frontend node_modules missing"
    exit 1
fi

# Check configuration files
print_test "Checking configuration files..."
if grep -q "entrypoint: node dist/server.js" deploy/backend/app.yaml; then
    print_status "Backend entrypoint is correct"
else
    print_error "Backend entrypoint is incorrect"
    exit 1
fi

if grep -q "entrypoint: node server.js" deploy/frontend/app.yaml; then
    print_status "Frontend entrypoint is correct"
else
    print_error "Frontend entrypoint is incorrect"
    exit 1
fi

if grep -q "service: api" deploy/backend/app.yaml; then
    print_status "Backend service name is correct"
else
    print_error "Backend service name is incorrect"
    exit 1
fi

if grep -q "service: default" deploy/frontend/app.yaml; then
    print_status "Frontend service name is correct"
else
    print_error "Frontend service name is incorrect"
    exit 1
fi

# Check API URL configuration
if grep -q "NEXT_PUBLIC_API_URL.*api-dot-onyourbehlf" deploy/frontend/app.yaml; then
    print_status "Frontend API URL is correctly configured"
else
    print_error "Frontend API URL is not correctly configured"
    exit 1
fi

# Summary
echo ""
echo "🎉 All verification checks passed!"
echo ""
echo "📋 Deployment Structure Summary:"
echo "├── deploy/"
echo "│   ├── backend/"
echo "│   │   ├── app.yaml (service: api, entrypoint: node dist/server.js)"
echo "│   │   ├── dist/server.js (compiled backend)"
echo "│   │   ├── package.json"
echo "│   │   └── node_modules/"
echo "│   └── frontend/"
echo "│       ├── app.yaml (service: default, entrypoint: node server.js)"
echo "│       ├── .next/ (Next.js build)"
echo "│       ├── server.js (Next.js server)"
echo "│       ├── package.json"
echo "│       └── node_modules/"
echo ""
echo "🚀 Ready for deployment with: ./deploy-new.sh"
echo ""
echo "📡 After deployment:"
echo "   Frontend: https://onyourbehlf.uc.r.appspot.com"
echo "   Backend:  https://api-dot-onyourbehlf.uc.r.appspot.com"
