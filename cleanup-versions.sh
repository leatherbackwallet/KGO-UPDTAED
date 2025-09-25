#!/bin/bash

# =============================================================================
# OnYourBehlf Version Cleanup Script
# =============================================================================
# This script cleans up old App Engine versions to prevent database conflicts
# and global system outages. It stops 0% traffic versions and deletes old ones.
# =============================================================================

set -e  # Exit on any error

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

# Logging functions
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

# Function to cleanup old versions
cleanup_old_versions() {
    log_info "🧹 Starting version cleanup for project: $PROJECT_ID"
    
    # Stop ALL versions with 0% traffic (these cause database conflicts)
    log_info "Stopping versions with 0% traffic..."
    
    # Backend cleanup
    log_info "Cleaning backend versions..."
    local backend_zero_traffic=$(gcloud app versions list --service="$BACKEND_SERVICE" --format="table(version.id,traffic_split,serving_status)" | grep "0.00" | awk '{print $1}' || true)
    if [ -n "$backend_zero_traffic" ]; then
        echo "$backend_zero_traffic" | xargs -r gcloud app versions stop --service="$BACKEND_SERVICE" --quiet 2>/dev/null || true
        log_success "Stopped backend versions with 0% traffic: $backend_zero_traffic"
    else
        log_info "No backend versions with 0% traffic found"
    fi
    
    # Frontend cleanup
    log_info "Cleaning frontend versions..."
    local frontend_zero_traffic=$(gcloud app versions list --service="$FRONTEND_SERVICE" --format="table(version.id,traffic_split,serving_status)" | grep "0.00" | awk '{print $1}' || true)
    if [ -n "$frontend_zero_traffic" ]; then
        echo "$frontend_zero_traffic" | xargs -r gcloud app versions stop --service="$FRONTEND_SERVICE" --quiet 2>/dev/null || true
        log_success "Stopped frontend versions with 0% traffic: $frontend_zero_traffic"
    else
        log_info "No frontend versions with 0% traffic found"
    fi
    
    # Delete old versions (keep only current + 1 backup)
    log_info "Deleting old versions (keeping only current + 1 backup)..."
    
    # Backend deletion
    local backend_old_versions=$(gcloud app versions list --service="$BACKEND_SERVICE" --sort-by=~version.createTime --format="value(version.id)" | tail -n +3 || true)
    if [ -n "$backend_old_versions" ]; then
        echo "$backend_old_versions" | xargs -r gcloud app versions delete --service="$BACKEND_SERVICE" --quiet 2>/dev/null || true
        log_success "Deleted old backend versions: $backend_old_versions"
    else
        log_info "No old backend versions to delete"
    fi
    
    # Frontend deletion
    local frontend_old_versions=$(gcloud app versions list --service="$FRONTEND_SERVICE" --sort-by=~version.createTime --format="value(version.id)" | tail -n +3 || true)
    if [ -n "$frontend_old_versions" ]; then
        echo "$frontend_old_versions" | xargs -r gcloud app versions delete --service="$FRONTEND_SERVICE" --quiet 2>/dev/null || true
        log_success "Deleted old frontend versions: $frontend_old_versions"
    else
        log_info "No old frontend versions to delete"
    fi
    
    log_success "✅ Version cleanup completed successfully!"
}

# Function to display current version status
show_version_status() {
    log_info "📊 Current version status:"
    echo ""
    echo "Backend versions:"
    gcloud app versions list --service="$BACKEND_SERVICE" --format="table(version.id,traffic_split,serving_status,version.createTime)" || true
    echo ""
    echo "Frontend versions:"
    gcloud app versions list --service="$FRONTEND_SERVICE" --format="table(version.id,traffic_split,serving_status,version.createTime)" || true
    echo ""
}

# Function to display help
show_help() {
    echo "OnYourBehlf Version Cleanup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --status     Show current version status"
    echo "  --help       Show this help message"
    echo "  --dry-run    Show what would be cleaned up without actually doing it"
    echo ""
    echo "This script:"
    echo "  • Stops all versions with 0% traffic (prevents database conflicts)"
    echo "  • Deletes old versions (keeps only current + 1 backup)"
    echo "  • Prevents global system outages caused by multiple versions"
    echo ""
}

# Function to show what would be cleaned up (dry run)
dry_run() {
    log_info "🔍 DRY RUN - Showing what would be cleaned up:"
    echo ""
    
    # Show 0% traffic versions that would be stopped
    log_info "Versions with 0% traffic that would be STOPPED:"
    echo "Backend:"
    gcloud app versions list --service="$BACKEND_SERVICE" --format="table(version.id,traffic_split,serving_status)" | grep "0.00" || echo "  None"
    echo "Frontend:"
    gcloud app versions list --service="$FRONTEND_SERVICE" --format="table(version.id,traffic_split,serving_status)" | grep "0.00" || echo "  None"
    echo ""
    
    # Show old versions that would be deleted
    log_info "Old versions that would be DELETED (keeping only current + 1 backup):"
    echo "Backend:"
    gcloud app versions list --service="$BACKEND_SERVICE" --sort-by=~version.createTime --format="value(version.id)" | tail -n +3 || echo "  None"
    echo "Frontend:"
    gcloud app versions list --service="$FRONTEND_SERVICE" --sort-by=~version.createTime --format="value(version.id)" | tail -n +3 || echo "  None"
    echo ""
}

# Main function
main() {
    echo "=========================================="
    echo " OnYourBehlf Version Cleanup Script"
    echo "=========================================="
    echo "Project: $PROJECT_ID"
    echo "Backend Service: $BACKEND_SERVICE"
    echo "Frontend Service: $FRONTEND_SERVICE"
    echo "=========================================="
    echo ""
    
    # Parse command line arguments
    case "${1:-}" in
        --help)
            show_help
            exit 0
            ;;
        --status)
            show_version_status
            exit 0
            ;;
        --dry-run)
            dry_run
            exit 0
            ;;
        "")
            # No arguments, proceed with cleanup
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
    
    # Show current status before cleanup
    show_version_status
    
    # Perform cleanup
    cleanup_old_versions
    
    # Show final status
    log_info "📊 Final version status:"
    show_version_status
    
    log_success "🎉 Version cleanup completed successfully!"
    echo ""
    echo "💡 This cleanup prevents:"
    echo "  • Database connection conflicts"
    echo "  • Global system outages"
    echo "  • Resource waste from unused versions"
    echo ""
}

# Run main function with all arguments
main "$@"
