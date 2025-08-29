#!/bin/bash

# Deployment Verification Script for OnYourBehlf
# This script verifies that the deployment is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
print_status "Verifying deployment for project: $PROJECT_ID"

# Define URLs
FRONTEND_URL="https://${PROJECT_ID}.uc.r.appspot.com"
BACKEND_URL="https://api-dot-${PROJECT_ID}.uc.r.appspot.com"

print_status "Frontend URL: $FRONTEND_URL"
print_status "Backend URL: $BACKEND_URL"

# Test backend health endpoint
print_test "Testing backend health endpoint..."
BACKEND_HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "${BACKEND_URL}/api/health" -o /tmp/backend_health.json)
if [ "$BACKEND_HEALTH_RESPONSE" = "200" ]; then
    print_status "✅ Backend health check passed"
    cat /tmp/backend_health.json | jq '.' 2>/dev/null || cat /tmp/backend_health.json
else
    print_error "❌ Backend health check failed (HTTP $BACKEND_HEALTH_RESPONSE)"
    cat /tmp/backend_health.json
fi

echo ""

# Test backend API endpoints
print_test "Testing backend API endpoints..."
PRODUCTS_RESPONSE=$(curl -s -w "%{http_code}" "${BACKEND_URL}/api/products" -o /tmp/products.json)
if [ "$PRODUCTS_RESPONSE" = "200" ]; then
    print_status "✅ Products API endpoint working"
else
    print_error "❌ Products API endpoint failed (HTTP $PRODUCTS_RESPONSE)"
fi

echo ""

# Test frontend
print_test "Testing frontend availability..."
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" "$FRONTEND_URL" -o /dev/null)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    print_status "✅ Frontend is accessible"
else
    print_error "❌ Frontend access failed (HTTP $FRONTEND_RESPONSE)"
fi

echo ""

# Test CORS by simulating frontend to backend request
print_test "Testing CORS configuration..."
CORS_RESPONSE=$(curl -s -w "%{http_code}" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS \
    "${BACKEND_URL}/api/products" -o /dev/null)

if [ "$CORS_RESPONSE" = "200" ] || [ "$CORS_RESPONSE" = "204" ]; then
    print_status "✅ CORS configuration is working"
else
    print_error "❌ CORS configuration failed (HTTP $CORS_RESPONSE)"
fi

echo ""

# Check if services are running
print_test "Checking App Engine services..."
gcloud app services list --format="table(id,version,traffic_allocation)"

echo ""

# Summary
print_status "=== DEPLOYMENT VERIFICATION SUMMARY ==="
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo "API Base URL: ${BACKEND_URL}/api"
echo ""
print_status "If all tests passed, your deployment is ready!"
print_warning "Note: It may take a few minutes for the services to be fully available after deployment."

# Clean up
rm -f /tmp/backend_health.json /tmp/products.json
