#!/bin/bash

# TypeScript Fixed Google Cloud Platform Deployment Script for OnYourBehlf
# This script builds everything locally with proper TypeScript types and deploys

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

print_status "🚀 Starting TypeScript Fixed Google Cloud Platform Deployment..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "You are not authenticated with Google Cloud. Please run:"
    print_error "  gcloud auth login"
    print_error "  gcloud auth application-default login"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
print_status "📋 Using project: $PROJECT_ID"

# Enable required APIs
print_status "🔧 Enabling required Google Cloud APIs..."
gcloud services enable appengine.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID
gcloud services enable compute.googleapis.com --project=$PROJECT_ID

# Initialize App Engine if not already done
print_status "🏗️  Initializing App Engine..."
gcloud app create --region=us-central --project=$PROJECT_ID || print_warning "App Engine already exists"

# Clean previous builds
print_status "🧹 Cleaning previous builds..."
rm -rf backend/dist
rm -rf frontend/.next
rm -rf frontend/out

# Build applications locally with proper TypeScript types
print_status "🔧 Building backend with TypeScript types..."
cd backend
npm install
npm run build
cd ..

print_status "🎨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Verify builds exist
if [ ! -d "backend/dist" ]; then
    print_error "Backend build failed - dist directory not found"
    exit 1
fi

if [ ! -d "frontend/.next" ]; then
    print_error "Frontend build failed - .next directory not found"
    exit 1
fi

print_status "✅ Local builds completed successfully with TypeScript types!"

# Deploy backend (api service) first
print_status "🔧 Deploying backend to App Engine (api service)..."
gcloud app deploy app.yaml --project=$PROJECT_ID --quiet

# Deploy frontend (default service)
print_status "🎨 Deploying frontend to App Engine (default service)..."
gcloud app deploy frontend-app.yaml --project=$PROJECT_ID --quiet

# Get deployment URLs
PROJECT_DOMAIN=$(gcloud app describe --format="value(defaultHostname)" --project=$PROJECT_ID)

print_status "✅ Deployment completed successfully!"
print_status "🌐 Your application is now available at:"
print_status "   Frontend: https://$PROJECT_DOMAIN"
print_status "   Backend API: https://api-dot-$PROJECT_DOMAIN"
print_status ""
print_status "📊 To view logs:"
print_status "   Backend logs: gcloud app logs tail -s api"
print_status "   Frontend logs: gcloud app logs tail -s default"
print_status ""
print_status "🔍 To monitor your app:"
print_status "   gcloud app browse"

