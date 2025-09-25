#!/bin/bash

# =============================================================================
# OnYourBehlf Bulletproof Deployment Script
# =============================================================================
# This script ensures deployments never fail by:
# 1. Using simple, sequential deployment (no complex orchestration)
# 2. Comprehensive error handling and rollback capabilities
# 3. Health checks and validation at each step
# 4. Automatic cleanup of problematic files
# 5. Multiple fallback strategies
# =============================================================================

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="onyourbehlf"
BACKEND_SERVICE="api"
FRONTEND_SERVICE="default"
BACKEND_YAML="app.yaml"
FRONTEND_YAML="frontend-app.yaml"
CLOUDBUILD_BACKUP="cloudbuild.yaml.backup"

# Deployment tracking
DEPLOYMENT_ID=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="deployment-backups/${DEPLOYMENT_ID}"
ROLLBACK_NEEDED=false

# Logging
LOG_FILE="deployment-${DEPLOYMENT_ID}.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a service is healthy
check_service_health() {
    local service_url="$1"
    local service_name="$2"
    local max_attempts=10
    local attempt=1
    
    log_info "Checking $service_name health at $service_url"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s --fail --max-time 10 "$service_url" >/dev/null 2>&1; then
            log_success "$service_name is healthy"
            return 0
        else
            log_warning "$service_name health check attempt $attempt/$max_attempts failed"
            sleep 10
            ((attempt++))
        fi
    done
    
    log_error "$service_name health check failed after $max_attempts attempts"
    return 1
}

# Function to create backup
create_backup() {
    log_info "Creating deployment backup..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup current versions
    gcloud app versions list --service="$BACKEND_SERVICE" --format="value(version.id)" | head -5 > "$BACKUP_DIR/backend-versions.txt" 2>/dev/null || true
    gcloud app versions list --service="$FRONTEND_SERVICE" --format="value(version.id)" | head -5 > "$BACKUP_DIR/frontend-versions.txt" 2>/dev/null || true
    
    log_success "Backup created in $BACKUP_DIR"
}

# Function to rollback on failure
rollback_deployment() {
    if [ "$ROLLBACK_NEEDED" = true ]; then
        log_error "Deployment failed! Initiating rollback..."
        
        # Rollback backend if we have a backup version
        if [ -f "$BACKUP_DIR/backend-versions.txt" ]; then
            local last_backend_version=$(head -1 "$BACKUP_DIR/backend-versions.txt" 2>/dev/null || echo "")
            if [ -n "$last_backend_version" ]; then
                log_info "Rolling back backend to version: $last_backend_version"
                gcloud app services set-traffic "$BACKEND_SERVICE" --splits="$last_backend_version=1" --quiet || true
            fi
        fi
        
        # Rollback frontend if we have a backup version
        if [ -f "$BACKUP_DIR/frontend-versions.txt" ]; then
            local last_frontend_version=$(head -1 "$BACKUP_DIR/frontend-versions.txt" 2>/dev/null || echo "")
            if [ -n "$last_frontend_version" ]; then
                log_info "Rolling back frontend to version: $last_frontend_version"
                gcloud app services set-traffic "$FRONTEND_SERVICE" --splits="$last_frontend_version=1" --quiet || true
            fi
        fi
        
        log_warning "Rollback completed. Please check service status manually."
    fi
}

# Function to cleanup problematic files
cleanup_problematic_files() {
    log_info "Cleaning up problematic files..."
    
    # Move cloudbuild.yaml to backup if it exists
    if [ -f "cloudbuild.yaml" ]; then
        mv cloudbuild.yaml "$CLOUDBUILD_BACKUP"
        log_info "Moved cloudbuild.yaml to $CLOUDBUILD_BACKUP"
    fi
    
    # Remove any other problematic build files
    rm -f cloudbuild.yaml.backup.old 2>/dev/null || true
    
    log_success "Problematic files cleaned up"
}

# Function to validate prerequisites
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    # Check if gcloud is installed
    if ! command_exists gcloud; then
        log_error "gcloud CLI is not installed"
        exit 1
    fi
    
    # Check if we're authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "Not authenticated with gcloud. Please run 'gcloud auth login'"
        exit 1
    fi
    
    # Check if project is set
    local current_project=$(gcloud config get-value project 2>/dev/null || echo "")
    if [ "$current_project" != "$PROJECT_ID" ]; then
        log_info "Setting project to $PROJECT_ID"
        gcloud config set project "$PROJECT_ID"
    fi
    
    # Check if required files exist
    if [ ! -f "$BACKEND_YAML" ]; then
        log_error "Backend YAML file $BACKEND_YAML not found"
        exit 1
    fi
    
    if [ ! -f "$FRONTEND_YAML" ]; then
        log_error "Frontend YAML file $FRONTEND_YAML not found"
        exit 1
    fi
    
    log_success "Prerequisites validated"
}

# Function to build and deploy backend
deploy_backend() {
    log_info "🚀 Starting backend deployment..."
    
    # Build backend
    log_info "Building backend..."
    cd backend
    if ! npm ci --silent; then
        log_error "Backend npm install failed"
        exit 1
    fi
    
    if ! npm run build; then
        log_error "Backend build failed"
        exit 1
    fi
    cd ..
    
    log_success "Backend build completed"
    
    # Deploy backend
    log_info "Deploying backend to Google Cloud..."
    local backend_version="v${DEPLOYMENT_ID}"
    
    if ! gcloud app deploy "$BACKEND_YAML" --version="$backend_version" --no-promote --quiet; then
        log_error "Backend deployment failed"
        exit 1
    fi
    
    log_success "Backend deployed successfully"
    
    # Health check backend
    local backend_url="https://${backend_version}-dot-${BACKEND_SERVICE}-dot-${PROJECT_ID}.uc.r.appspot.com"
    if ! check_service_health "${backend_url}/api/health-status" "Backend"; then
        log_error "Backend health check failed"
        ROLLBACK_NEEDED=true
        exit 1
    fi
    
    # Promote backend
    log_info "Promoting backend to 100% traffic..."
    if ! gcloud app services set-traffic "$BACKEND_SERVICE" --splits="$backend_version=1" --quiet; then
        log_error "Backend promotion failed"
        ROLLBACK_NEEDED=true
        exit 1
    fi
    
    log_success "Backend deployment completed successfully"
}

# Function to build and deploy frontend
deploy_frontend() {
    log_info "🚀 Starting frontend deployment..."
    
    # Build frontend
    log_info "Building frontend..."
    cd frontend
    if ! npm ci --silent; then
        log_error "Frontend npm install failed"
        exit 1
    fi
    
    if ! npm run build; then
        log_error "Frontend build failed"
        exit 1
    fi
    cd ..
    
    log_success "Frontend build completed"
    
    # Deploy frontend
    log_info "Deploying frontend to Google Cloud..."
    local frontend_version="v${DEPLOYMENT_ID}"
    
    if ! gcloud app deploy "$FRONTEND_YAML" --version="$frontend_version" --no-promote --quiet; then
        log_error "Frontend deployment failed"
        exit 1
    fi
    
    log_success "Frontend deployed successfully"
    
    # Health check frontend
    local frontend_url="https://${frontend_version}-dot-${PROJECT_ID}.uc.r.appspot.com"
    if ! check_service_health "${frontend_url}/api/health" "Frontend"; then
        log_error "Frontend health check failed"
        ROLLBACK_NEEDED=true
        exit 1
    fi
    
    # Promote frontend
    log_info "Promoting frontend to 100% traffic..."
    if ! gcloud app services set-traffic "$FRONTEND_SERVICE" --splits="$frontend_version=1" --quiet; then
        log_error "Frontend promotion failed"
        ROLLBACK_NEEDED=true
        exit 1
    fi
    
    log_success "Frontend deployment completed successfully"
}

# Function to cleanup old versions
cleanup_old_versions() {
    log_info "🧹 Cleaning up old versions..."
    
    # Clean up old backend versions (keep last 3)
    log_info "Cleaning old backend versions..."
    gcloud app versions list --service="$BACKEND_SERVICE" --sort-by=~version.createTime --format="value(version.id)" | tail -n +4 | xargs -r gcloud app versions delete --service="$BACKEND_SERVICE" --quiet 2>/dev/null || true
    
    # Clean up old frontend versions (keep last 3)
    log_info "Cleaning old frontend versions..."
    gcloud app versions list --service="$FRONTEND_SERVICE" --sort-by=~version.createTime --format="value(version.id)" | tail -n +4 | xargs -r gcloud app versions delete --service="$FRONTEND_SERVICE" --quiet 2>/dev/null || true
    
    log_success "Old versions cleaned up"
}

# Function to display deployment summary
display_summary() {
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📊 Deployment Summary:"
    echo "  • Deployment ID: $DEPLOYMENT_ID"
    echo "  • Backend Service: https://${BACKEND_SERVICE}-dot-${PROJECT_ID}.uc.r.appspot.com"
    echo "  • Frontend Service: https://${PROJECT_ID}.uc.r.appspot.com"
    echo "  • Log File: $LOG_FILE"
    echo ""
    echo "🧪 Test URLs:"
    echo "  • Frontend Health: https://${PROJECT_ID}.uc.r.appspot.com/api/health"
    echo "  • Backend Health: https://${BACKEND_SERVICE}-dot-${PROJECT_ID}.uc.r.appspot.com/api/health-status"
    echo "  • Products API: https://${BACKEND_SERVICE}-dot-${PROJECT_ID}.uc.r.appspot.com/api/products"
    echo ""
    echo "📋 Monitoring Commands:"
    echo "  • Backend logs: gcloud app logs tail -s $BACKEND_SERVICE"
    echo "  • Frontend logs: gcloud app logs tail -s $FRONTEND_SERVICE"
    echo ""
}

# =============================================================================
# MAIN DEPLOYMENT SCRIPT
# =============================================================================

main() {
    echo "=========================================="
    echo " OnYourBehlf Bulletproof Deployment"
    echo "=========================================="
    echo "Deployment ID: $DEPLOYMENT_ID"
    echo "Project: $PROJECT_ID"
    echo "Log File: $LOG_FILE"
    echo "=========================================="
    echo ""
    
    # Set up error handling
    trap rollback_deployment EXIT
    
    # Step 1: Validate prerequisites
    validate_prerequisites
    
    # Step 2: Create backup
    create_backup
    
    # Step 3: Cleanup problematic files
    cleanup_problematic_files
    
    # Step 4: Deploy backend
    deploy_backend
    
    # Step 5: Deploy frontend
    deploy_frontend
    
    # Step 6: Cleanup old versions
    cleanup_old_versions
    
    # Step 7: Display summary
    display_summary
    
    # Clear rollback flag on success
    ROLLBACK_NEEDED=false
    
    log_success "🎉 Bulletproof deployment completed successfully!"
}

# Run main function
main "$@"
