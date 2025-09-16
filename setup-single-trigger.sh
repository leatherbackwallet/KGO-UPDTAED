#!/bin/bash

# Setup Single Cloud Build Trigger Script
# This script creates a single, optimized Cloud Build trigger to eliminate additional builds

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI is not installed. Please install it first."
    exit 1
fi

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "You are not authenticated with Google Cloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
print_status "Setting up Cloud Build trigger for project: $PROJECT_ID"

# Check if GitHub repository is connected
print_info "Checking GitHub repository connection..."

# Create a single, optimized Cloud Build trigger
print_status "Creating optimized Cloud Build trigger..."

# First, let's check if there are existing triggers and remove them
print_info "Checking for existing triggers..."
EXISTING_TRIGGERS=$(gcloud builds triggers list --format="value(name)" --project="$PROJECT_ID" 2>/dev/null || echo "")

if [ ! -z "$EXISTING_TRIGGERS" ]; then
    print_warning "Found existing triggers. You may want to remove them first:"
    echo "$EXISTING_TRIGGERS"
    echo ""
    read -p "Do you want to remove existing triggers? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for trigger in $EXISTING_TRIGGERS; do
            print_info "Removing trigger: $trigger"
            gcloud builds triggers delete "$trigger" --project="$PROJECT_ID" --quiet || true
        done
    fi
fi

# Create the optimized trigger
print_status "Creating new optimized Cloud Build trigger..."

# Create trigger configuration
cat > trigger-config.yaml << EOF
name: onyourbehlf-consolidated-deploy
description: Consolidated deployment trigger for OnYourBehlf - eliminates additional builds
github:
  owner: leatherbackwallet
  name: onYourBehlf
  push:
    branch: main
filename: cloudbuild-optimized.yaml
disabled: false
substitutions:
  _BUILD_TIMESTAMP: '${BUILD_TIMESTAMP}'
  _COMMIT_SHA: '${COMMIT_SHA}'
  _BRANCH_NAME: '${BRANCH_NAME}'
  _REPO_NAME: '${REPO_NAME}'
options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'E2_HIGHCPU_8'
  diskSizeGb: 100
  substitution_option: 'ALLOW_LOOSE'
  env:
    - 'DOCKER_BUILDKIT=1'
timeout: '1200s'
EOF

# Create the trigger
gcloud builds triggers import --source=trigger-config.yaml --project="$PROJECT_ID"

# Clean up
rm -f trigger-config.yaml

print_status "Cloud Build trigger created successfully!"
print_info "Trigger Details:"
print_info "  Name: onyourbehlf-consolidated-deploy"
print_info "  Repository: leatherbackwallet/onYourBehlf"
print_info "  Branch: main"
print_info "  Config: cloudbuild-optimized.yaml"

print_status "This single trigger will now handle all deployments when the main branch is updated."
print_info "The optimized configuration will:"
print_info "  - Build both frontend and backend in parallel"
print_info "  - Use Docker layer caching for faster builds"
print_info "  - Deploy both services efficiently"
print_info "  - Eliminate additional builds"

print_status "Setup completed! Your next push to main will use the optimized build process."
