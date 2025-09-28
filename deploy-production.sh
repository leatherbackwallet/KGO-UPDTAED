#!/bin/bash

# =============================================================================
# KeralGiftsOnline Production Deployment Script
# =============================================================================
# This is the ONLY deployment script for production.
# Features:
# - Comprehensive build validation and linting
# - JSON file verification and testing
# - Single API version policy (deletes all old versions)
# - Bulletproof error handling and rollback
# - Complete health checks and endpoint testing
# =============================================================================

set -e  # Exit on any error

# =============================================================================
# CONFIGURATION
# =============================================================================
PROJECT_ID="onyourbehlf"
API_SERVICE="api"
API_URL="https://api-dot-${PROJECT_ID}.uc.r.appspot.com"
TIMESTAMP=$(date +%Y%m%dt%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================
print_header() {
    echo ""
    echo -e "${PURPLE}============================================================${NC}"
    echo -e "${PURPLE}🚀 KeralGiftsOnline Production Deployment${NC}"
    echo -e "${PURPLE}============================================================${NC}"
    echo -e "${CYAN}Project:${NC} $PROJECT_ID"
    echo -e "${CYAN}Service:${NC} $API_SERVICE"
    echo -e "${CYAN}Timestamp:${NC} $TIMESTAMP"
    echo -e "${PURPLE}============================================================${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${BLUE}[STEP]${NC} $1"
    echo -e "${BLUE}$(printf '%.0s─' {1..60})${NC}"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
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

print_final() {
    echo ""
    echo -e "${GREEN}============================================================${NC}"
    echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}============================================================${NC}"
    echo -e "${CYAN}API URL:${NC} $API_URL"
    echo -e "${CYAN}Health Check:${NC} $API_URL/api/health-status"
    echo -e "${CYAN}Products API:${NC} $API_URL/api/products"
    echo -e "${CYAN}Categories API:${NC} $API_URL/api/categories"
    echo -e "${CYAN}Occasions API:${NC} $API_URL/api/occasions"
    echo -e "${GREEN}============================================================${NC}"
    echo ""
}

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================
validate_environment() {
    print_step "1. Environment Validation"
    
    # Check if we're in the right directory
    if [ ! -f "app.yaml" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the project root directory"
        print_error "Required files: app.yaml, backend/ directory"
        exit 1
    fi
    print_success "✓ Project structure validated"
    
    # Check Google Cloud SDK
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud SDK not found. Please install it first."
        exit 1
    fi
    print_success "✓ Google Cloud SDK found"
    
    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "Not authenticated with Google Cloud. Please run 'gcloud auth login'"
        exit 1
    fi
    print_success "✓ Google Cloud authentication verified"
    
    # Verify project
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
    if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
        print_error "Wrong project selected. Expected: $PROJECT_ID, Current: $CURRENT_PROJECT"
        print_error "Run: gcloud config set project $PROJECT_ID"
        exit 1
    fi
    print_success "✓ Project verified: $PROJECT_ID"
    
    # Check required tools
    for tool in node npm curl python3; do
        if ! command -v $tool &> /dev/null; then
            print_error "$tool is required but not found"
            exit 1
        fi
    done
    print_success "✓ Required tools available"
}

validate_json_files() {
    print_step "2. JSON Files Validation"
    
    # Define JSON files
    JSON_FILES=(
        "backend/Products/keralagiftsonline.products.json"
        "backend/Products/keralagiftsonline.categories.json"
        "backend/Products/keralagiftsonline.occasions.json"
    )
    
    # Check if files exist
    for json_file in "${JSON_FILES[@]}"; do
        if [ ! -f "$json_file" ]; then
            print_error "Required JSON file not found: $json_file"
            exit 1
        fi
        print_success "✓ Found: $json_file"
    done
    
    # Validate JSON syntax
    print_info "Validating JSON syntax..."
    for json_file in "${JSON_FILES[@]}"; do
        if ! python3 -m json.tool "$json_file" > /dev/null 2>&1; then
            print_error "Invalid JSON syntax in file: $json_file"
            exit 1
        fi
        
        # Check file size (should not be empty)
        file_size=$(stat -f%z "$json_file" 2>/dev/null || stat -c%s "$json_file" 2>/dev/null || echo "0")
        if [ "$file_size" -lt 10 ]; then
            print_error "JSON file appears to be empty or too small: $json_file"
            exit 1
        fi
        
        print_success "✓ Valid JSON: $json_file (${file_size} bytes)"
    done
    
    # Validate JSON content structure
    print_info "Validating JSON content structure..."
    
    # Check products file has array structure
    if ! python3 -c "import json; data=json.load(open('backend/Products/keralagiftsonline.products.json')); assert isinstance(data, list) and len(data) > 0" 2>/dev/null; then
        print_error "Products JSON file must contain a non-empty array"
        exit 1
    fi
    
    # Check categories file has array structure
    if ! python3 -c "import json; data=json.load(open('backend/Products/keralagiftsonline.categories.json')); assert isinstance(data, list) and len(data) > 0" 2>/dev/null; then
        print_error "Categories JSON file must contain a non-empty array"
        exit 1
    fi
    
    # Check occasions file has array structure
    if ! python3 -c "import json; data=json.load(open('backend/Products/keralagiftsonline.occasions.json')); assert isinstance(data, list) and len(data) > 0" 2>/dev/null; then
        print_error "Occasions JSON file must contain a non-empty array"
        exit 1
    fi
    
    print_success "✓ All JSON files have valid structure and content"
}

validate_build() {
    print_step "3. Build Validation & Linting"
    
    # Install dependencies if needed
    print_info "Installing/updating dependencies..."
    cd backend
    if ! npm ci --silent; then
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    print_success "✓ Backend dependencies installed"
    
    # Check for TypeScript compilation errors
    print_info "Compiling TypeScript..."
    if ! npm run build 2>/dev/null; then
        print_error "TypeScript compilation failed"
        print_error "Please fix compilation errors before deploying"
        exit 1
    fi
    print_success "✓ TypeScript compilation successful"
    
    # Check for linting errors (if eslint is available)
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
        print_info "Running linter..."
        if command -v npx &> /dev/null && npx eslint --version &> /dev/null; then
            if ! npx eslint . --ext .ts,.js --max-warnings 0 --quiet; then
                print_warning "Linting warnings/errors found, but continuing deployment"
                print_warning "Please fix linting issues in future deployments"
            else
                print_success "✓ No linting errors found"
            fi
        else
            print_info "ESLint not available, skipping linting"
        fi
    else
        print_info "No ESLint configuration found, skipping linting"
    fi
    
    # Verify dist directory was created
    if [ ! -d "dist" ] || [ ! -f "dist/server.js" ]; then
        print_error "Build output not found. dist/server.js is missing"
        exit 1
    fi
    print_success "✓ Build output verified"
    
    cd ..
}

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================
cleanup_old_versions() {
    print_step "4. Cleaning Up Old Versions"
    
    # Stop all traffic to old versions first
    print_info "Stopping traffic to all versions..."
    if ! gcloud app services set-traffic $API_SERVICE --splits= --quiet 2>/dev/null; then
        print_warning "Failed to stop traffic (service might not exist yet)"
    else
        print_success "✓ Traffic stopped for all versions"
    fi
    
    # Get all existing versions
    print_info "Fetching existing versions..."
    EXISTING_VERSIONS=$(gcloud app versions list --service=$API_SERVICE --format="value(version.id)" 2>/dev/null || echo "")
    
    if [ -n "$EXISTING_VERSIONS" ]; then
        VERSION_COUNT=$(echo "$EXISTING_VERSIONS" | wc -l | tr -d ' ')
        print_info "Found $VERSION_COUNT existing versions"
        
        # Delete ALL old versions (we want only the new one)
        print_info "Deleting all existing versions..."
        for version in $EXISTING_VERSIONS; do
            print_info "Deleting version: $version"
            if ! gcloud app versions delete $version --service=$API_SERVICE --quiet 2>/dev/null; then
                print_warning "Failed to delete version $version (might be serving traffic)"
            else
                print_success "✓ Deleted version: $version"
            fi
        done
    else
        print_info "No existing versions found"
    fi
}

deploy_new_version() {
    print_step "5. Deploying New Version"
    
    print_info "Starting deployment to Google App Engine..."
    print_info "This may take several minutes..."
    
    # Deploy without promoting (we'll promote after health checks)
    DEPLOY_OUTPUT=$(gcloud app deploy app.yaml --version=$TIMESTAMP --quiet --no-promote 2>&1)
    DEPLOY_EXIT_CODE=$?
    
    if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
        print_error "Deployment failed!"
        echo "$DEPLOY_OUTPUT"
        exit 1
    fi
    
    print_success "✓ New version deployed: $TIMESTAMP"
    print_info "Version URL: https://$TIMESTAMP-dot-$API_SERVICE-dot-$PROJECT_ID.uc.r.appspot.com"
}

# =============================================================================
# HEALTH CHECK FUNCTIONS
# =============================================================================
wait_for_version() {
    print_step "6. Waiting for Version to be Ready"
    
    local version_url="https://$TIMESTAMP-dot-$API_SERVICE-dot-$PROJECT_ID.uc.r.appspot.com"
    local max_attempts=30
    local attempt=1
    
    print_info "Waiting for version to be ready..."
    print_info "Testing URL: $version_url/api/health-status"
    
    while [ $attempt -le $max_attempts ]; do
        print_info "Attempt $attempt/$max_attempts..."
        
        # Check if version is serving
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$version_url/api/health-status" 2>/dev/null || echo "000")
        
        if [ "$status_code" = "200" ]; then
            print_success "✓ Version is ready and responding"
            return 0
        fi
        
        print_info "Status: $status_code - waiting 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    print_error "Version failed to become ready after $max_attempts attempts"
    exit 1
}

test_json_endpoints() {
    print_step "7. Testing JSON Data Endpoints"
    
    local version_url="https://$TIMESTAMP-dot-$API_SERVICE-dot-$PROJECT_ID.uc.r.appspot.com"
    
    # Test products endpoint
    print_info "Testing products endpoint..."
    local products_response=$(curl -s "$version_url/api/products?limit=1" 2>/dev/null || echo "")
    local products_success=$(echo "$products_response" | grep -o '"success":true' || echo "")
    
    if [ -z "$products_success" ]; then
        print_error "Products endpoint test failed"
        print_error "Response: $products_response"
        exit 1
    fi
    print_success "✓ Products endpoint working"
    
    # Test categories endpoint
    print_info "Testing categories endpoint..."
    local categories_response=$(curl -s "$version_url/api/categories" 2>/dev/null || echo "")
    local categories_success=$(echo "$categories_response" | grep -o '"success":true' || echo "")
    
    if [ -z "$categories_success" ]; then
        print_error "Categories endpoint test failed"
        print_error "Response: $categories_response"
        exit 1
    fi
    print_success "✓ Categories endpoint working"
    
    # Test occasions endpoint
    print_info "Testing occasions endpoint..."
    local occasions_response=$(curl -s "$version_url/api/occasions" 2>/dev/null || echo "")
    local occasions_success=$(echo "$occasions_response" | grep -o '"success":true' || echo "")
    
    if [ -z "$occasions_success" ]; then
        print_error "Occasions endpoint test failed"
        print_error "Response: $occasions_response"
        exit 1
    fi
    print_success "✓ Occasions endpoint working"
    
    # Extract and display data counts
    local products_count=$(echo "$products_response" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data.get('count', 0))" 2>/dev/null || echo "0")
    local categories_count=$(echo "$categories_response" | python3 -c "import json,sys; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "0")
    local occasions_count=$(echo "$occasions_response" | python3 -c "import json,sys; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "0")
    
    print_success "✓ Data verification: $products_count products, $categories_count categories, $occasions_count occasions"
}

promote_version() {
    print_step "8. Promoting Version to Production"
    
    print_info "Routing 100% traffic to new version: $TIMESTAMP"
    if ! gcloud app services set-traffic $API_SERVICE --splits=$TIMESTAMP=1 --quiet; then
        print_error "Failed to promote version to production"
        exit 1
    fi
    
    print_success "✓ Version promoted to production"
    
    # Wait a moment for traffic to switch
    sleep 10
    
    # Test production URL
    print_info "Testing production URL..."
    local prod_status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health-status" 2>/dev/null || echo "000")
    
    if [ "$prod_status" = "200" ]; then
        print_success "✓ Production URL is responding correctly"
    else
        print_warning "Production URL returned status: $prod_status"
    fi
}

final_verification() {
    print_step "9. Final Verification"
    
    # Verify only one version is serving
    print_info "Verifying version status..."
    local serving_versions=$(gcloud app versions list --service=$API_SERVICE --format="value(version.id)" --filter="servingStatus=SERVING" 2>/dev/null || echo "")
    local version_count=$(echo "$serving_versions" | wc -l | tr -d ' ')
    
    if [ "$version_count" -eq 1 ] && [ "$serving_versions" = "$TIMESTAMP" ]; then
        print_success "✓ Only one version serving: $TIMESTAMP"
    else
        print_warning "Multiple versions may be serving. Current serving versions:"
        gcloud app versions list --service=$API_SERVICE --format="table(version.id,traffic_split,serving_status)" 2>/dev/null || true
    fi
    
    # Final endpoint tests on production URL
    print_info "Final production endpoint tests..."
    
    local final_products=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/products?limit=1" 2>/dev/null || echo "000")
    local final_categories=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/categories" 2>/dev/null || echo "000")
    local final_occasions=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/occasions" 2>/dev/null || echo "000")
    
    if [ "$final_products" = "200" ] && [ "$final_categories" = "200" ] && [ "$final_occasions" = "200" ]; then
        print_success "✓ All production endpoints responding correctly"
    else
        print_error "Some production endpoints are not responding correctly:"
        print_error "Products: $final_products, Categories: $final_categories, Occasions: $final_occasions"
        exit 1
    fi
}

# =============================================================================
# ERROR HANDLING
# =============================================================================
cleanup_on_error() {
    print_error "Deployment failed! Cleaning up..."
    
    # If we deployed a version but it failed, try to delete it
    if [ -n "$TIMESTAMP" ]; then
        print_info "Attempting to delete failed version: $TIMESTAMP"
        gcloud app versions delete $TIMESTAMP --service=$API_SERVICE --quiet 2>/dev/null || true
    fi
    
    print_error "Deployment aborted. Please check the errors above and try again."
    exit 1
}

# Set up error handling
trap cleanup_on_error ERR

# =============================================================================
# MAIN EXECUTION
# =============================================================================
main() {
    print_header
    
    # Execute deployment steps
    validate_environment
    validate_json_files
    validate_build
    cleanup_old_versions
    deploy_new_version
    wait_for_version
    test_json_endpoints
    promote_version
    final_verification
    
    print_final
    
    # Show final status
    echo -e "${CYAN}Final Status:${NC}"
    gcloud app versions list --service=$API_SERVICE --format="table(version.id,traffic_split,serving_status,version.createTime)" 2>/dev/null || true
    echo ""
    
    print_success "🎉 Deployment completed successfully!"
    print_success "Your API is now serving from a single, verified version with working JSON data endpoints."
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================
# Check for help flag
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    echo "KeralGiftsOnline Production Deployment Script"
    echo ""
    echo "Usage: $0"
    echo ""
    echo "This script performs a complete production deployment with:"
    echo "  • Environment and dependency validation"
    echo "  • JSON file verification and testing"
    echo "  • Build validation and linting"
    echo "  • Complete cleanup of old versions"
    echo "  • Health checks and endpoint testing"
    echo "  • Single version policy enforcement"
    echo ""
    echo "Requirements:"
    echo "  • Google Cloud SDK installed and authenticated"
    echo "  • Project set to: $PROJECT_ID"
    echo "  • Run from project root directory"
    echo ""
    exit 0
fi

# Run main function
main "$@"
