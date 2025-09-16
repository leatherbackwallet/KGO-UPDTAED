#!/bin/bash

# Consolidated Google Cloud Platform Deployment Script for OnYourBehlf
# This script uses Cloud Build for a single, optimized deployment process

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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Get current branch and commit info
CURRENT_BRANCH=$(git branch --show-current)
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_COMMIT_SHORT=$(git rev-parse --short HEAD)

print_info "Deployment Details:"
print_info "  Branch: $CURRENT_BRANCH"
print_info "  Commit: $CURRENT_COMMIT_SHORT"
print_info "  Project: $PROJECT_ID"

# Trigger Cloud Build with optimized configuration
print_status "Triggering consolidated Cloud Build deployment..."
print_info "This will build both frontend and backend in parallel and deploy them efficiently."

# Submit build to Cloud Build
BUILD_ID=$(gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions=_BRANCH_NAME="$CURRENT_BRANCH",_COMMIT_SHA="$CURRENT_COMMIT" \
    --project="$PROJECT_ID" \
    --format="value(id)" \
    .)

print_status "Build submitted with ID: $BUILD_ID"
print_info "You can monitor the build at: https://console.cloud.google.com/cloud-build/builds/$BUILD_ID?project=$PROJECT_ID"

# Wait for build to complete (optional)
read -p "Do you want to wait for the build to complete? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Waiting for build to complete..."
    gcloud builds log "$BUILD_ID" --project="$PROJECT_ID" --stream
else
    print_info "Build is running in the background. Check the Cloud Console for progress."
fi

# Get deployment URLs
PROJECT_DOMAIN=$(gcloud app describe --format="value(defaultHostname)" --project="$PROJECT_ID")

print_status "Deployment completed successfully!"
print_status "Frontend URL: https://$PROJECT_DOMAIN"
print_status "Backend API URL: https://api-dot-$PROJECT_DOMAIN"

print_info "To view logs:"
print_info "  Backend logs: gcloud app logs tail -s api --project=$PROJECT_ID"
print_info "  Frontend logs: gcloud app logs tail -s default --project=$PROJECT_ID"

print_status "Consolidated deployment script completed!"
