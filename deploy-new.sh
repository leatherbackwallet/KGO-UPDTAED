#!/bin/bash

# Google Cloud Platform Deployment Script for OnYourBehlf
# This script deploys both frontend and backend from properly organized directories

set -e

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

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "You are not authenticated with Google Cloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
print_status "Deploying to project: $PROJECT_ID"

# Check if required APIs are enabled
print_status "Checking required APIs..."
APIS=(
    "appengine.googleapis.com"
    "cloudbuild.googleapis.com"
    "containerregistry.googleapis.com"
    "compute.googleapis.com"
)

for api in "${APIS[@]}"; do
    if ! gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
        print_status "Enabling API: $api"
        gcloud services enable "$api"
    fi
done

# Build applications
print_status "Building backend..."
cd backend && npm run build && cd ..

print_status "Building frontend..."
cd frontend && npm run build && cd ..

# Update deployment directories with fresh builds
print_status "Updating deployment directories..."
rm -rf deploy/backend/dist
cp -R backend/dist deploy/backend/

rm -rf deploy/frontend/.next
cp -R frontend/.next deploy/frontend/

# Deploy backend (api service) first
print_status "Deploying backend to App Engine (api service)..."
cd deploy/backend
gcloud app deploy app.yaml --quiet
cd ../..

# Deploy frontend (default service)
print_status "Deploying frontend to App Engine (default service)..."
cd deploy/frontend
gcloud app deploy app.yaml --quiet
cd ../..

# Get deployment URLs
PROJECT_DOMAIN=$(gcloud app describe --format="value(defaultHostname)")

print_status "Deployment completed successfully!"
print_status "Backend API URL: https://api-dot-$PROJECT_DOMAIN"
print_status "Frontend URL: https://$PROJECT_DOMAIN"

print_status "Deployment script completed!"
