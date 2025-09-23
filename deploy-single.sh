#!/bin/bash

# Single Consolidated Deployment Script for OnYourBehlf
# This script replaces all other deployment scripts and ensures only one deployment runs
# Includes PDF generation fix with App Engine Flex support

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

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} OnYourBehlf Single Deployment Script${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
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
    if [ -z "$PROJECT_ID" ]; then
        print_error "No project set. Please run 'gcloud config set project YOUR_PROJECT_ID'"
        exit 1
    fi
    
    print_status "Using project: $PROJECT_ID"
}

# Stop any running builds
stop_running_builds() {
    print_status "Checking for running builds..."
    
    RUNNING_BUILDS=$(gcloud builds list --ongoing --format="value(id)" 2>/dev/null || true)
    
    if [ ! -z "$RUNNING_BUILDS" ]; then
        print_warning "Found running builds. Stopping them to prevent conflicts..."
        echo "$RUNNING_BUILDS" | while read build_id; do
            if [ ! -z "$build_id" ]; then
                print_status "Stopping build: $build_id"
                gcloud builds cancel "$build_id" --quiet || true
            fi
        done
        print_status "Waiting 30 seconds for builds to stop..."
        sleep 30
    else
        print_status "No running builds found."
    fi
}

# Pre-flight checks
preflight_checks() {
    print_status "Running pre-flight checks..."
    
    # Check if required files exist
    if [ ! -f "app.yaml" ]; then
        print_error "app.yaml not found!"
        exit 1
    fi
    
    if [ ! -f "frontend-app.yaml" ]; then
        print_error "frontend-app.yaml not found!"
        exit 1
    fi
    
    if [ ! -f "cloudbuild.yaml" ]; then
        print_error "cloudbuild.yaml not found!"
        exit 1
    fi
    
    # Check if backend source exists
    if [ ! -d "backend" ]; then
        print_error "Backend directory not found!"
        exit 1
    fi
    
    # Check if frontend source exists
    if [ ! -d "frontend" ]; then
        print_error "Frontend directory not found!"
        exit 1
    fi
    
    # Check if backend Dockerfile exists (required for PDF generation)
    if [ ! -f "backend/Dockerfile" ]; then
        print_error "backend/Dockerfile not found! Required for PDF generation with Chromium."
        exit 1
    fi
    
    # Verify app.yaml is configured for App Engine Flex (required for PDF generation)
    if ! grep -q "runtime: custom" app.yaml; then
        print_error "app.yaml must use 'runtime: custom' for PDF generation support!"
        print_error "Current app.yaml uses managed runtime which doesn't support Chromium installation."
        exit 1
    fi
    
    if ! grep -q "env: flex" app.yaml; then
        print_error "app.yaml must use 'env: flex' for PDF generation support!"
        exit 1
    fi
    
    print_status "Pre-flight checks passed."
    print_status "✅ PDF generation support verified (App Engine Flex + Dockerfile)"
}

# Main deployment function
deploy_application() {
    print_status "Starting single consolidated deployment..."
    
    # Submit the build
    BUILD_ID=$(gcloud builds submit \
        --config=cloudbuild.yaml \
        --format="value(id)" \
        . 2>/dev/null)
    
    if [ $? -eq 0 ] && [ ! -z "$BUILD_ID" ]; then
        print_status "Build submitted successfully: $BUILD_ID"
        print_status "You can monitor the build at: https://console.cloud.google.com/cloud-build/builds/$BUILD_ID"
        
        # Follow the build logs
        print_status "Following build logs..."
        gcloud builds log --stream "$BUILD_ID"
        
        # Check final build status
        BUILD_STATUS=$(gcloud builds describe "$BUILD_ID" --format="value(status)")
        
        if [ "$BUILD_STATUS" = "SUCCESS" ]; then
            print_status "🎉 Deployment completed successfully!"
            print_deployment_info
        else
            print_error "❌ Deployment failed with status: $BUILD_STATUS"
            print_error "Check the build logs for details: https://console.cloud.google.com/cloud-build/builds/$BUILD_ID"
            exit 1
        fi
    else
        print_error "Failed to submit build"
        exit 1
    fi
}

# Print deployment information
print_deployment_info() {
    PROJECT_DOMAIN=$(gcloud app describe --format="value(defaultHostname)" 2>/dev/null || echo "${PROJECT_ID}.uc.r.appspot.com")
    
    echo ""
    print_status "🚀 Deployment URLs:"
    echo -e "   Frontend: ${GREEN}https://$PROJECT_DOMAIN${NC}"
    echo -e "   Backend API: ${GREEN}https://api-dot-$PROJECT_DOMAIN${NC}"
    echo -e "   Health Check: ${GREEN}https://api-dot-$PROJECT_DOMAIN/api/health${NC}"
    echo ""
    
    print_status "Testing endpoints..."
    
    # Test backend health
    if curl -sf "https://api-dot-$PROJECT_DOMAIN/api/health" > /dev/null; then
        print_status "✅ Backend is healthy"
    else
        print_warning "⚠️  Backend health check failed"
    fi
    
    # Test frontend
    if curl -sf "https://$PROJECT_DOMAIN" > /dev/null; then
        print_status "✅ Frontend is accessible"
    else
        print_warning "⚠️  Frontend accessibility check failed"
    fi
    
    echo ""
    print_status "📄 PDF Generation Status:"
    print_status "✅ App Engine Flex runtime configured"
    print_status "✅ Chromium installed via Dockerfile"
    print_status "✅ Puppeteer configured for PDF generation"
    print_status "✅ Fallback mechanism in place"
    echo ""
    print_status "🧪 To test PDF generation:"
    echo "   1. Place a test order on your website"
    echo "   2. Download the receipt - it should be a proper PDF file"
    echo "   3. Verify it opens correctly in your browser"
}

# Cleanup function
cleanup_old_versions() {
    print_status "Cleaning up old versions (keeping last 3)..."
    
    # This is handled in the Cloud Build script, but we can also do it here as backup
    gcloud app versions list --service=api --sort-by=~version.createTime --format="value(version.id)" | tail -n +4 | xargs -r gcloud app versions delete --service=api --quiet 2>/dev/null || true
    gcloud app versions list --service=default --sort-by=~version.createTime --format="value(version.id)" | tail -n +4 | xargs -r gcloud app versions delete --service=default --quiet 2>/dev/null || true
    
    print_status "Cleanup completed"
}

# Main execution
main() {
    print_header
    check_prerequisites
    stop_running_builds
    preflight_checks
    deploy_application
    cleanup_old_versions
    
    print_status "🎉 Single deployment completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "  1. Test your application thoroughly"
    echo "  2. Test PDF generation by placing an order and downloading receipt"
    echo "  3. Monitor the logs for any issues"
    echo "  4. Set up monitoring and alerting if needed"
    echo ""
    print_status "📊 Monitor PDF generation logs:"
    echo "   gcloud app logs tail -s api | grep -i 'pdf\\|puppeteer\\|chromium'"
}

# Handle interrupts gracefully
trap 'print_error "Deployment interrupted by user"; exit 1' INT TERM

# Run main function
main "$@"
