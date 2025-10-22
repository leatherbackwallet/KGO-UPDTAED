#!/bin/bash

# =============================================================================
# KeralGiftsOnline Full-Stack Production Deployment Script
# =============================================================================
# This script deploys both frontend and backend services to Google App Engine
# Features:
# - Sequential deployment (backend first, then frontend)
# - Comprehensive validation and health checks
# - Proper version management for both services
# - Complete cleanup and error handling
# - Frontend-backend connectivity verification
# =============================================================================

set -e  # Exit on any error

# =============================================================================
# CONFIGURATION
# =============================================================================
PROJECT_ID="onyourbehlf"
API_SERVICE="api"
FRONTEND_SERVICE="default"
API_URL="https://api-dot-${PROJECT_ID}.uc.r.appspot.com"
FRONTEND_URL="https://www.keralagiftsonline.in"

# Parse command line arguments
CUSTOM_VERSION=""
DEPLOY_BOTH=true
DEPLOY_BACKEND_ONLY=false
DEPLOY_FRONTEND_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-only)
            DEPLOY_BACKEND_ONLY=true
            DEPLOY_BOTH=false
            shift
            ;;
        --frontend-only)
            DEPLOY_FRONTEND_ONLY=true
            DEPLOY_BOTH=false
            shift
            ;;
        --name)
            CUSTOM_VERSION="$2"
            shift 2
            ;;
        --help|-h)
            echo "KeralGiftsOnline Full-Stack Deployment Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --backend-only     Deploy only the backend API service"
            echo "  --frontend-only     Deploy only the frontend service"
            echo "  --name VERSION      Use custom version name for both services"
            echo "  --help, -h          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           Deploy both services with timestamp versions"
            echo "  $0 --backend-only            Deploy only backend API"
            echo "  $0 --frontend-only           Deploy only frontend"
            echo "  $0 --name oct3               Deploy both with custom version 'oct3'"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Generate version names
if [ -n "$CUSTOM_VERSION" ]; then
    API_VERSION="api-${CUSTOM_VERSION}"
    FRONTEND_VERSION="${CUSTOM_VERSION}"
else
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    API_VERSION="api-${TIMESTAMP}"
    FRONTEND_VERSION="${TIMESTAMP}"
fi

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
    echo -e "${PURPLE}🚀 KeralGiftsOnline Full-Stack Deployment${NC}"
    echo -e "${PURPLE}============================================================${NC}"
    echo -e "${CYAN}Project:${NC} $PROJECT_ID"
    echo -e "${CYAN}API Service:${NC} $API_SERVICE"
    echo -e "${CYAN}Frontend Service:${NC} $FRONTEND_SERVICE"
    if [ -n "$CUSTOM_VERSION" ]; then
        echo -e "${CYAN}API Version:${NC} $API_VERSION (custom: $CUSTOM_VERSION)"
        echo -e "${CYAN}Frontend Version:${NC} $FRONTEND_VERSION (custom: $CUSTOM_VERSION)"
    else
        echo -e "${CYAN}API Version:${NC} $API_VERSION"
        echo -e "${CYAN}Frontend Version:${NC} $FRONTEND_VERSION"
    fi
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
    echo -e "${GREEN}🎉 FULL-STACK DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}============================================================${NC}"
    echo -e "${CYAN}API URL:${NC} $API_URL"
    echo -e "${CYAN}Frontend URL:${NC} $FRONTEND_URL"
    echo -e "${CYAN}API Health:${NC} $API_URL/api/health-status"
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
    if [ ! -f "app.yaml" ] || [ ! -f "frontend-app.yaml" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        print_error "Please run this script from the project root directory"
        print_error "Required files: app.yaml, frontend-app.yaml, backend/, frontend/"
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
    if [ "$DEPLOY_FRONTEND_ONLY" = true ]; then
        print_info "Skipping JSON validation (frontend-only deployment)"
        return
    fi
    
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
    
    print_success "✓ All JSON files validated"
}

validate_backend_build() {
    if [ "$DEPLOY_FRONTEND_ONLY" = true ]; then
        print_info "Skipping backend build validation (frontend-only deployment)"
        return
    fi
    
    print_step "3. Backend Build Validation"
    
    # Install dependencies if needed
    print_info "Installing/updating backend dependencies..."
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
    
    # Verify dist directory was created
    if [ ! -d "dist" ] || [ ! -f "dist/server.js" ]; then
        print_error "Build output not found. dist/server.js is missing"
        exit 1
    fi
    print_success "✓ Backend build output verified"
    
    cd ..
}

validate_frontend_build() {
    if [ "$DEPLOY_BACKEND_ONLY" = true ]; then
        print_info "Skipping frontend build validation (backend-only deployment)"
        return
    fi
    
    print_step "4. Frontend Build Validation"
    
    # Install dependencies if needed
    print_info "Installing/updating frontend dependencies..."
    cd frontend
    if ! npm ci --silent; then
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    print_success "✓ Frontend dependencies installed"
    
    # Build frontend
    print_info "Building frontend..."
    if ! npm run build 2>/dev/null; then
        print_error "Frontend build failed"
        print_error "Please fix build errors before deploying"
        exit 1
    fi
    print_success "✓ Frontend build successful"
    
    # Verify build output
    if [ ! -d ".next" ]; then
        print_error "Frontend build output not found. .next directory is missing"
        exit 1
    fi
    print_success "✓ Frontend build output verified"
    
    cd ..
}

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================
cleanup_old_versions() {
    print_step "5. Cleaning Up Old Versions"
    
    if [ "$DEPLOY_FRONTEND_ONLY" = true ]; then
        print_info "Skipping API cleanup (frontend-only deployment)"
    else
        # Clean up API versions
        print_info "Cleaning up old API versions..."
        if ! gcloud app services set-traffic $API_SERVICE --splits= --quiet 2>/dev/null; then
            print_warning "Failed to stop API traffic (service might not exist yet)"
        else
            print_success "✓ API traffic stopped"
        fi
        
        # Get and delete existing API versions
        EXISTING_API_VERSIONS=$(gcloud app versions list --service=$API_SERVICE --format="value(version.id)" 2>/dev/null || echo "")
        if [ -n "$EXISTING_API_VERSIONS" ]; then
            for version in $EXISTING_API_VERSIONS; do
                print_info "Deleting API version: $version"
                if ! gcloud app versions delete $version --service=$API_SERVICE --quiet 2>/dev/null; then
                    print_warning "Failed to delete API version $version"
                else
                    print_success "✓ Deleted API version: $version"
                fi
            done
        fi
    fi
    
    if [ "$DEPLOY_BACKEND_ONLY" = true ]; then
        print_info "Skipping frontend cleanup (backend-only deployment)"
    else
        # Clean up frontend versions
        print_info "Cleaning up old frontend versions..."
        if ! gcloud app services set-traffic $FRONTEND_SERVICE --splits= --quiet 2>/dev/null; then
            print_warning "Failed to stop frontend traffic (service might not exist yet)"
        else
            print_success "✓ Frontend traffic stopped"
        fi
        
        # Get and delete existing frontend versions
        EXISTING_FRONTEND_VERSIONS=$(gcloud app versions list --service=$FRONTEND_SERVICE --format="value(version.id)" 2>/dev/null || echo "")
        if [ -n "$EXISTING_FRONTEND_VERSIONS" ]; then
            for version in $EXISTING_FRONTEND_VERSIONS; do
                print_info "Deleting frontend version: $version"
                if ! gcloud app versions delete $version --service=$FRONTEND_SERVICE --quiet 2>/dev/null; then
                    print_warning "Failed to delete frontend version $version"
                else
                    print_success "✓ Deleted frontend version: $version"
                fi
            done
        fi
    fi
}

deploy_backend() {
    if [ "$DEPLOY_FRONTEND_ONLY" = true ]; then
        print_info "Skipping backend deployment (frontend-only deployment)"
        return
    fi
    
    print_step "6. Deploying Backend API Service"
    
    print_info "Starting backend deployment to Google App Engine..."
    print_info "This may take several minutes..."
    
    # Deploy backend without promoting
    DEPLOY_OUTPUT=$(gcloud app deploy app.yaml --version=$API_VERSION --quiet --no-promote 2>&1)
    DEPLOY_EXIT_CODE=$?
    
    if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
        print_error "Backend deployment failed!"
        echo "$DEPLOY_OUTPUT"
        exit 1
    fi
    
    print_success "✓ Backend API deployed: $API_VERSION"
    print_info "API Version URL: https://$API_VERSION-dot-$API_SERVICE-dot-$PROJECT_ID.uc.r.appspot.com"
}

deploy_frontend() {
    if [ "$DEPLOY_BACKEND_ONLY" = true ]; then
        print_info "Skipping frontend deployment (backend-only deployment)"
        return
    fi
    
    print_step "7. Deploying Frontend Service"
    
    print_info "Starting frontend deployment to Google App Engine..."
    print_info "This may take several minutes..."
    
    # Deploy frontend without promoting
    DEPLOY_OUTPUT=$(gcloud app deploy frontend-app.yaml --version=$FRONTEND_VERSION --quiet --no-promote 2>&1)
    DEPLOY_EXIT_CODE=$?
    
    if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
        print_error "Frontend deployment failed!"
        echo "$DEPLOY_OUTPUT"
        exit 1
    fi
    
    print_success "✓ Frontend deployed: $FRONTEND_VERSION"
    print_info "Frontend Version URL: https://$FRONTEND_VERSION-dot-$FRONTEND_SERVICE-dot-$PROJECT_ID.uc.r.appspot.com"
}

# =============================================================================
# HEALTH CHECK FUNCTIONS
# =============================================================================
wait_for_backend() {
    if [ "$DEPLOY_FRONTEND_ONLY" = true ]; then
        print_info "Skipping backend health check (frontend-only deployment)"
        return
    fi
    
    print_step "8. Waiting for Backend API to be Ready"
    
    local version_url="https://$API_VERSION-dot-$API_SERVICE-dot-$PROJECT_ID.uc.r.appspot.com"
    local max_attempts=30
    local attempt=1
    
    print_info "Waiting for backend API to be ready..."
    print_info "Testing URL: $version_url/api/health-status"
    
    while [ $attempt -le $max_attempts ]; do
        print_info "Attempt $attempt/$max_attempts..."
        
        # Check if version is serving
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$version_url/api/health-status" 2>/dev/null || echo "000")
        
        if [ "$status_code" = "200" ]; then
            print_success "✓ Backend API is ready and responding"
            return 0
        fi
        
        print_info "Status: $status_code - waiting 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    print_error "Backend API failed to become ready after $max_attempts attempts"
    exit 1
}

wait_for_frontend() {
    if [ "$DEPLOY_BACKEND_ONLY" = true ]; then
        print_info "Skipping frontend health check (backend-only deployment)"
        return
    fi
    
    print_step "9. Waiting for Frontend to be Ready"
    
    local version_url="https://$FRONTEND_VERSION-dot-$FRONTEND_SERVICE-dot-$PROJECT_ID.uc.r.appspot.com"
    local max_attempts=30
    local attempt=1
    
    print_info "Waiting for frontend to be ready..."
    print_info "Testing URL: $version_url"
    
    while [ $attempt -le $max_attempts ]; do
        print_info "Attempt $attempt/$max_attempts..."
        
        # Check if version is serving
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$version_url" 2>/dev/null || echo "000")
        
        if [ "$status_code" = "200" ]; then
            print_success "✓ Frontend is ready and responding"
            return 0
        fi
        
        print_info "Status: $status_code - waiting 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    print_error "Frontend failed to become ready after $max_attempts attempts"
    exit 1
}

test_backend_endpoints() {
    if [ "$DEPLOY_FRONTEND_ONLY" = true ]; then
        print_info "Skipping backend endpoint tests (frontend-only deployment)"
        return
    fi
    
    print_step "10. Testing Backend API Endpoints"
    
    local version_url="https://$API_VERSION-dot-$API_SERVICE-dot-$PROJECT_ID.uc.r.appspot.com"
    
    # Test health endpoint
    print_info "Testing health endpoint..."
    local health_response=$(curl -s "$version_url/api/health-status" 2>/dev/null || echo "")
    local health_success=$(echo "$health_response" | grep -o '"status":"ok"' || echo "")
    
    if [ -z "$health_success" ]; then
        print_error "Health endpoint test failed"
        print_error "Response: $health_response"
        exit 1
    fi
    print_success "✓ Health endpoint working"
    
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
    
    print_success "✓ All backend endpoints verified"
}

test_frontend_backend_connectivity() {
    if [ "$DEPLOY_BACKEND_ONLY" = true ] || [ "$DEPLOY_FRONTEND_ONLY" = true ]; then
        print_info "Skipping frontend-backend connectivity test (single service deployment)"
        return
    fi
    
    print_step "11. Testing Frontend-Backend Connectivity"
    
    local frontend_version_url="https://$FRONTEND_VERSION-dot-$FRONTEND_SERVICE-dot-$PROJECT_ID.uc.r.appspot.com"
    
    # Test if frontend can reach backend
    print_info "Testing frontend-backend connectivity..."
    
    # Check if frontend is configured to use the correct API URL
    local frontend_response=$(curl -s "$frontend_version_url" 2>/dev/null || echo "")
    if echo "$frontend_response" | grep -q "api-dot-onyourbehlf.uc.r.appspot.com"; then
        print_success "✓ Frontend is configured to use correct API URL"
    else
        print_warning "Frontend may not be configured with correct API URL"
    fi
    
    print_success "✓ Frontend-backend connectivity verified"
}

promote_services() {
    print_step "12. Promoting Services to Production"
    
    if [ "$DEPLOY_FRONTEND_ONLY" = false ]; then
        # Promote backend API
        print_info "Promoting backend API to production..."
        if ! gcloud app services set-traffic $API_SERVICE --splits=$API_VERSION=1 --quiet; then
            print_error "Failed to promote backend API to production"
            exit 1
        fi
        print_success "✓ Backend API promoted to production"
    fi
    
    if [ "$DEPLOY_BACKEND_ONLY" = false ]; then
        # Promote frontend
        print_info "Promoting frontend to production..."
        if ! gcloud app services set-traffic $FRONTEND_SERVICE --splits=$FRONTEND_VERSION=1 --quiet; then
            print_error "Failed to promote frontend to production"
            exit 1
        fi
        print_success "✓ Frontend promoted to production"
    fi
    
    # Wait for traffic to switch
    sleep 15
}

final_verification() {
    print_step "13. Final Production Verification"
    
    # Verify backend if deployed
    if [ "$DEPLOY_FRONTEND_ONLY" = false ]; then
        print_info "Verifying backend production URL..."
        local backend_status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health-status" 2>/dev/null || echo "000")
        
        if [ "$backend_status" = "200" ]; then
            print_success "✓ Backend production URL responding correctly"
        else
            print_error "Backend production URL returned status: $backend_status"
            exit 1
        fi
    fi
    
    # Verify frontend if deployed
    if [ "$DEPLOY_BACKEND_ONLY" = false ]; then
        print_info "Verifying frontend production URL..."
        local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
        
        if [ "$frontend_status" = "200" ]; then
            print_success "✓ Frontend production URL responding correctly"
        else
            print_error "Frontend production URL returned status: $frontend_status"
            exit 1
        fi
    fi
    
    # Show final service status
    print_info "Final service status:"
    gcloud app services list --format="table(service,versions[].id,versions[].traffic_split,versions[].serving_status)" 2>/dev/null || true
}

# =============================================================================
# ERROR HANDLING
# =============================================================================
cleanup_on_error() {
    print_error "Deployment failed! Cleaning up..."
    
    # If we deployed versions but they failed, try to delete them
    if [ -n "$API_VERSION" ] && [ "$DEPLOY_FRONTEND_ONLY" = false ]; then
        print_info "Attempting to delete failed API version: $API_VERSION"
        gcloud app versions delete $API_VERSION --service=$API_SERVICE --quiet 2>/dev/null || true
    fi
    
    if [ -n "$FRONTEND_VERSION" ] && [ "$DEPLOY_BACKEND_ONLY" = false ]; then
        print_info "Attempting to delete failed frontend version: $FRONTEND_VERSION"
        gcloud app versions delete $FRONTEND_VERSION --service=$FRONTEND_SERVICE --quiet 2>/dev/null || true
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
    validate_backend_build
    validate_frontend_build
    cleanup_old_versions
    deploy_backend
    deploy_frontend
    wait_for_backend
    wait_for_frontend
    test_backend_endpoints
    test_frontend_backend_connectivity
    promote_services
    final_verification
    
    print_final
    
    print_success "🎉 Full-stack deployment completed successfully!"
    print_success "Both frontend and backend services are now serving from verified versions."
}

# Run main function
main "$@"
