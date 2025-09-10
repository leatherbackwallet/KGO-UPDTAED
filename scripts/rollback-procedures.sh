#!/bin/bash

# Rollback Procedures for Reliability Features
# Emergency rollback script for reliability improvements

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
ADMIN_TOKEN="${ADMIN_TOKEN}"
LOG_FILE="logs/rollback-$(date +%Y%m%d-%H%M%S).log"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "${BLUE}[ROLLBACK]${NC} $1" | tee -a "$LOG_FILE"
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to check if API is accessible
check_api_health() {
    print_status "Checking API health..."
    
    if curl -s -f "$API_URL/api/feature-flags/health/check" > /dev/null; then
        print_status "API is accessible"
        return 0
    else
        print_error "API is not accessible at $API_URL"
        return 1
    fi
}

# Function to get current feature flag status
get_flag_status() {
    local flag_name="$1"
    
    curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
         -H "Content-Type: application/json" \
         "$API_URL/api/feature-flags/$flag_name" | \
    jq -r '.flag.enabled // false'
}

# Function to rollback a specific feature flag
rollback_flag() {
    local flag_name="$1"
    local reason="$2"
    
    print_header "Rolling back feature flag: $flag_name"
    
    # Check current status
    local current_status
    current_status=$(get_flag_status "$flag_name")
    
    if [ "$current_status" = "false" ]; then
        print_warning "Flag $flag_name is already disabled"
        return 0
    fi
    
    # Perform rollback
    local response
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"reason\": \"$reason\"}" \
        "$API_URL/api/feature-flags/$flag_name/rollback")
    
    if echo "$response" | jq -e '.success' > /dev/null; then
        print_status "Successfully rolled back $flag_name"
        return 0
    else
        local error_msg
        error_msg=$(echo "$response" | jq -r '.message // "Unknown error"')
        print_error "Failed to rollback $flag_name: $error_msg"
        return 1
    fi
}

# Function to rollback all reliability features
rollback_all_reliability_features() {
    local reason="$1"
    
    print_header "Rolling back all reliability features"
    
    local flags=(
        "enhanced-retry-logic"
        "advanced-caching"
        "robust-image-loading"
        "connection-monitoring"
        "performance-monitoring"
        "error-recovery-ui"
    )
    
    local failed_rollbacks=()
    
    for flag in "${flags[@]}"; do
        if ! rollback_flag "$flag" "$reason"; then
            failed_rollbacks+=("$flag")
        fi
        sleep 1 # Brief pause between rollbacks
    done
    
    if [ ${#failed_rollbacks[@]} -eq 0 ]; then
        print_status "All reliability features rolled back successfully"
        return 0
    else
        print_error "Failed to rollback: ${failed_rollbacks[*]}"
        return 1
    fi
}

# Function to verify rollback success
verify_rollback() {
    print_status "Verifying rollback success..."
    
    local flags=(
        "enhanced-retry-logic"
        "advanced-caching"
        "robust-image-loading"
        "connection-monitoring"
        "performance-monitoring"
        "error-recovery-ui"
    )
    
    local still_enabled=()
    
    for flag in "${flags[@]}"; do
        local status
        status=$(get_flag_status "$flag")
        if [ "$status" = "true" ]; then
            still_enabled+=("$flag")
        fi
    done
    
    if [ ${#still_enabled[@]} -eq 0 ]; then
        print_status "Rollback verification successful - all flags disabled"
        return 0
    else
        print_error "Rollback verification failed - still enabled: ${still_enabled[*]}"
        return 1
    fi
}

# Function to restart services (if needed)
restart_services() {
    print_status "Checking if service restart is needed..."
    
    # In production, you might need to restart certain services
    # This is a placeholder for service restart logic
    
    if [ "$NODE_ENV" = "production" ]; then
        print_warning "Production environment detected"
        print_warning "Consider restarting application services if needed"
        print_warning "Run: gcloud app versions list && gcloud app services set-traffic [SERVICE] --splits [VERSION]=1"
    else
        print_status "Development environment - no service restart needed"
    fi
}

# Function to send rollback notification
send_notification() {
    local reason="$1"
    local success="$2"
    
    local status_emoji="✅"
    local status_text="SUCCESS"
    
    if [ "$success" != "true" ]; then
        status_emoji="❌"
        status_text="FAILED"
    fi
    
    local message="$status_emoji Reliability Features Rollback $status_text
Reason: $reason
Timestamp: $(date)
Environment: ${NODE_ENV:-development}
Log: $LOG_FILE"
    
    print_status "Sending rollback notification..."
    
    # Send to webhook if configured
    if [ -n "$WEBHOOK_URL" ]; then
        curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"$message\"}" \
            "$WEBHOOK_URL" || print_warning "Failed to send webhook notification"
    fi
    
    # Send email if configured
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "Reliability Features Rollback $status_text" "$NOTIFICATION_EMAIL" || \
            print_warning "Failed to send email notification"
    fi
    
    print_status "Notification sent"
}

# Function to create rollback report
create_rollback_report() {
    local reason="$1"
    local success="$2"
    
    local report_file="logs/rollback-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "reason": "$reason",
  "success": $success,
  "environment": "${NODE_ENV:-development}",
  "api_url": "$API_URL",
  "log_file": "$LOG_FILE",
  "flags_rolled_back": [
    "enhanced-retry-logic",
    "advanced-caching",
    "robust-image-loading",
    "connection-monitoring",
    "performance-monitoring",
    "error-recovery-ui"
  ]
}
EOF
    
    print_status "Rollback report created: $report_file"
}

# Main rollback function
perform_rollback() {
    local reason="$1"
    local specific_flag="$2"
    
    print_header "Starting rollback procedure"
    print_status "Reason: $reason"
    print_status "Timestamp: $(date)"
    print_status "Environment: ${NODE_ENV:-development}"
    
    # Check prerequisites
    if [ -z "$ADMIN_TOKEN" ]; then
        print_error "ADMIN_TOKEN environment variable is required"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed"
        exit 1
    fi
    
    # Check API health
    if ! check_api_health; then
        print_error "Cannot proceed with rollback - API is not accessible"
        exit 1
    fi
    
    # Perform rollback
    local rollback_success=false
    
    if [ -n "$specific_flag" ]; then
        if rollback_flag "$specific_flag" "$reason"; then
            rollback_success=true
        fi
    else
        if rollback_all_reliability_features "$reason"; then
            rollback_success=true
        fi
    fi
    
    # Verify rollback
    if [ "$rollback_success" = true ]; then
        if verify_rollback; then
            print_status "Rollback completed successfully"
        else
            print_error "Rollback verification failed"
            rollback_success=false
        fi
    fi
    
    # Post-rollback actions
    restart_services
    send_notification "$reason" "$rollback_success"
    create_rollback_report "$reason" "$rollback_success"
    
    if [ "$rollback_success" = true ]; then
        print_header "Rollback procedure completed successfully"
        exit 0
    else
        print_header "Rollback procedure failed"
        exit 1
    fi
}

# CLI interface
show_usage() {
    echo "Usage: $0 [OPTIONS] <reason>"
    echo ""
    echo "Options:"
    echo "  -f, --flag FLAG_NAME    Rollback specific flag only"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  API_URL                API endpoint (default: http://localhost:3001)"
    echo "  ADMIN_TOKEN            Admin authentication token (required)"
    echo "  WEBHOOK_URL            Webhook URL for notifications (optional)"
    echo "  NOTIFICATION_EMAIL     Email for notifications (optional)"
    echo ""
    echo "Examples:"
    echo "  $0 'High error rate detected'"
    echo "  $0 -f enhanced-retry-logic 'Performance regression'"
}

# Parse command line arguments
SPECIFIC_FLAG=""
REASON=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--flag)
            SPECIFIC_FLAG="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            if [ -z "$REASON" ]; then
                REASON="$1"
            else
                print_error "Unknown option: $1"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate arguments
if [ -z "$REASON" ]; then
    print_error "Rollback reason is required"
    show_usage
    exit 1
fi

# Execute rollback
perform_rollback "$REASON" "$SPECIFIC_FLAG"