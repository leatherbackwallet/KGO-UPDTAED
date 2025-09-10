#!/bin/bash

# Enhanced Deployment Script with Feature Flag Support
# Deploys with gradual rollout capabilities for reliability features

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${PROJECT_ID:-onyourbehlf}"
ENVIRONMENT="${ENVIRONMENT:-production}"
ROLLOUT_STRATEGY="${ROLLOUT_STRATEGY:-gradual}"
INITIAL_ROLLOUT="${INITIAL_ROLLOUT:-5}"

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
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking deployment prerequisites..."
    
    # Check required tools
    local required_tools=("gcloud" "npm" "node" "curl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            print_error "$tool is required but not installed"
            exit 1
        fi
    done
    
    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "You are not authenticated with Google Cloud. Please run 'gcloud auth login' first."
        exit 1
    fi
    
    # Set project
    gcloud config set project "$PROJECT_ID"
    print_status "Using project: $PROJECT_ID"
}

# Function to build applications
build_applications() {
    print_header "Building applications..."
    
    # Build backend
    print_status "Building backend..."
    cd backend
    npm ci --production=false
    npm run build
    cd ..
    
    # Build frontend
    print_status "Building frontend..."
    cd frontend
    npm ci --production=false
    npm run build
    cd ..
    
    print_status "Applications built successfully"
}

# Function to configure feature flags for deployment
configure_feature_flags() {
    print_header "Configuring feature flags for deployment..."
    
    # Create feature flag configuration file
    cat > "feature-flags-config.json" << EOF
{
  "flags": {
    "enhanced-retry-logic": {
      "name": "enhanced-retry-logic",
      "enabled": false,
      "rolloutPercentage": 0,
      "conditions": {
        "environment": ["$ENVIRONMENT"]
      },
      "metadata": {
        "description": "Enhanced API retry logic with exponential backoff",
        "owner": "reliability-team",
        "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "lastModified": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      }
    },
    "advanced-caching": {
      "name": "advanced-caching",
      "enabled": false,
      "rolloutPercentage": 0,
      "conditions": {
        "environment": ["$ENVIRONMENT"]
      },
      "metadata": {
        "description": "Multi-level caching with intelligent invalidation",
        "owner": "reliability-team",
        "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "lastModified": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      }
    },
    "robust-image-loading": {
      "name": "robust-image-loading",
      "enabled": false,
      "rolloutPercentage": 0,
      "conditions": {
        "environment": ["$ENVIRONMENT"]
      },
      "metadata": {
        "description": "Enhanced image loading with fallback chains",
        "owner": "reliability-team",
        "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "lastModified": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      }
    },
    "connection-monitoring": {
      "name": "connection-monitoring",
      "enabled": false,
      "rolloutPercentage": 0,
      "conditions": {
        "environment": ["$ENVIRONMENT"]
      },
      "metadata": {
        "description": "Real-time connection status monitoring",
        "owner": "reliability-team",
        "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "lastModified": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      }
    },
    "performance-monitoring": {
      "name": "performance-monitoring",
      "enabled": false,
      "rolloutPercentage": 0,
      "conditions": {
        "environment": ["$ENVIRONMENT"]
      },
      "metadata": {
        "description": "Comprehensive performance metrics collection",
        "owner": "reliability-team",
        "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "lastModified": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      }
    },
    "error-recovery-ui": {
      "name": "error-recovery-ui",
      "enabled": false,
      "rolloutPercentage": 0,
      "conditions": {
        "environment": ["$ENVIRONMENT"]
      },
      "metadata": {
        "description": "Enhanced error recovery user interface",
        "owner": "reliability-team",
        "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "lastModified": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      }
    }
  },
  "defaultEnabled": false,
  "environment": "$ENVIRONMENT"
}
EOF
    
    print_status "Feature flags configured for $ENVIRONMENT environment"
}

# Function to deploy with traffic splitting
deploy_with_traffic_splitting() {
    print_header "Deploying with traffic splitting..."
    
    local version_id="v$(date +%Y%m%d-%H%M%S)"
    
    # Deploy backend with no traffic initially
    print_status "Deploying backend version $version_id..."
    gcloud app deploy app.yaml \
        --version="$version_id" \
        --no-promote \
        --quiet
    
    # Deploy frontend with no traffic initially
    print_status "Deploying frontend version $version_id..."
    gcloud app deploy frontend-app.yaml \
        --version="$version_id" \
        --no-promote \
        --quiet
    
    # Gradually shift traffic if rollout strategy is gradual
    if [ "$ROLLOUT_STRATEGY" = "gradual" ]; then
        print_status "Starting gradual traffic rollout..."
        
        # Start with initial rollout percentage
        print_status "Shifting ${INITIAL_ROLLOUT}% traffic to new version..."
        gcloud app services set-traffic default \
            --splits="$version_id=$INITIAL_ROLLOUT" \
            --quiet
        
        gcloud app services set-traffic api \
            --splits="$version_id=$INITIAL_ROLLOUT" \
            --quiet
        
        print_status "Initial rollout complete. Monitor metrics before increasing traffic."
        print_warning "Use 'gcloud app services set-traffic' to adjust traffic allocation"
        
    else
        # Full deployment
        print_status "Promoting new version to receive all traffic..."
        gcloud app versions migrate "$version_id" --service=default --quiet
        gcloud app versions migrate "$version_id" --service=api --quiet
    fi
    
    echo "$version_id" > ".deployed-version"
    print_status "Deployed version: $version_id"
}

# Function to setup monitoring
setup_monitoring() {
    print_header "Setting up deployment monitoring..."
    
    # Create monitoring configuration
    cat > "monitoring-config.json" << EOF
{
  "deployment": {
    "version": "$(cat .deployed-version 2>/dev/null || echo 'unknown')",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$ENVIRONMENT",
    "rolloutStrategy": "$ROLLOUT_STRATEGY",
    "initialRollout": "$INITIAL_ROLLOUT"
  },
  "monitoring": {
    "errorRateThreshold": 3,
    "performanceThreshold": 3,
    "userFeedbackThreshold": 2.0,
    "monitoringInterval": 30000,
    "stabilityPeriod": 300000
  }
}
EOF
    
    print_status "Monitoring configuration created"
    
    # Setup log-based metrics (if not already exists)
    print_status "Setting up log-based metrics..."
    
    # Error rate metric
    gcloud logging metrics create reliability_error_rate \
        --description="Error rate for reliability features" \
        --log-filter='resource.type="gae_app" AND severity>=ERROR AND jsonPayload.feature_flag=~".*"' \
        --quiet 2>/dev/null || print_warning "Error rate metric already exists"
    
    # Performance metric
    gcloud logging metrics create reliability_performance \
        --description="Performance metrics for reliability features" \
        --log-filter='resource.type="gae_app" AND jsonPayload.performance_impact=~".*"' \
        --quiet 2>/dev/null || print_warning "Performance metric already exists"
    
    print_status "Monitoring setup complete"
}

# Function to create rollback plan
create_rollback_plan() {
    print_header "Creating rollback plan..."
    
    local current_version
    current_version=$(cat .deployed-version 2>/dev/null || echo 'unknown')
    
    cat > "rollback-plan.md" << EOF
# Rollback Plan for Deployment $current_version

## Quick Rollback Commands

### Emergency Rollback (All Traffic)
\`\`\`bash
# Rollback to previous version
gcloud app versions list --service=default --sort-by=~version.createTime --limit=2 --format="value(version.id)" | tail -n 1 | xargs -I {} gcloud app services set-traffic default --splits={}=100

gcloud app versions list --service=api --sort-by=~version.createTime --limit=2 --format="value(version.id)" | tail -n 1 | xargs -I {} gcloud app services set-traffic api --splits={}=100
\`\`\`

### Feature Flag Rollback
\`\`\`bash
# Rollback all reliability features
./scripts/rollback-procedures.sh "Emergency rollback from deployment"

# Rollback specific feature
./scripts/rollback-procedures.sh -f enhanced-retry-logic "Performance issue detected"
\`\`\`

### Traffic Rollback (Gradual)
\`\`\`bash
# Reduce traffic to new version
gcloud app services set-traffic default --splits=$current_version=25
gcloud app services set-traffic api --splits=$current_version=25
\`\`\`

## Monitoring Commands

### Check Application Health
\`\`\`bash
curl -s https://api-dot-$PROJECT_ID.uc.r.appspot.com/api/health/check | jq
\`\`\`

### Check Feature Flag Status
\`\`\`bash
curl -s https://api-dot-$PROJECT_ID.uc.r.appspot.com/api/feature-flags/health/check | jq
\`\`\`

### View Error Logs
\`\`\`bash
gcloud logging read "resource.type=gae_app AND severity>=ERROR" --limit=50 --format=json
\`\`\`

## Rollback Triggers

- Error rate > 3%
- Performance degradation > 3%
- User feedback score < 2.0
- Critical functionality broken
- Memory/CPU usage spikes

## Contact Information

- On-call Engineer: [Your contact]
- Slack Channel: #reliability-alerts
- PagerDuty: [Your PagerDuty service]

Generated: $(date)
Environment: $ENVIRONMENT
Version: $current_version
EOF
    
    print_status "Rollback plan created: rollback-plan.md"
}

# Function to start automated monitoring
start_automated_monitoring() {
    if [ "$ROLLOUT_STRATEGY" = "gradual" ]; then
        print_header "Starting automated rollout monitoring..."
        
        # Check if Node.js monitoring script should be started
        if [ -f "scripts/rollout-automation.js" ]; then
            print_status "Automated rollout monitoring available"
            print_status "To start: node scripts/rollout-automation.js"
            print_warning "Ensure ADMIN_TOKEN environment variable is set"
        else
            print_warning "Automated rollout script not found"
        fi
    fi
}

# Function to display post-deployment information
show_deployment_info() {
    print_header "Deployment Information"
    
    local version
    version=$(cat .deployed-version 2>/dev/null || echo 'unknown')
    
    echo ""
    echo "🚀 Deployment completed successfully!"
    echo ""
    echo "📊 Deployment Details:"
    echo "   Project: $PROJECT_ID"
    echo "   Environment: $ENVIRONMENT"
    echo "   Version: $version"
    echo "   Strategy: $ROLLOUT_STRATEGY"
    if [ "$ROLLOUT_STRATEGY" = "gradual" ]; then
        echo "   Initial Traffic: ${INITIAL_ROLLOUT}%"
    fi
    echo ""
    echo "🔗 Application URLs:"
    echo "   Frontend: https://$PROJECT_ID.uc.r.appspot.com"
    echo "   Backend API: https://api-dot-$PROJECT_ID.uc.r.appspot.com"
    echo "   Health Check: https://api-dot-$PROJECT_ID.uc.r.appspot.com/api/health/check"
    echo "   Feature Flags: https://api-dot-$PROJECT_ID.uc.r.appspot.com/api/feature-flags/health/check"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Monitor application metrics and logs"
    echo "   2. Gradually enable feature flags as needed"
    if [ "$ROLLOUT_STRATEGY" = "gradual" ]; then
        echo "   3. Increase traffic allocation if metrics are healthy"
        echo "   4. Use rollback procedures if issues are detected"
    fi
    echo "   5. Review rollback-plan.md for emergency procedures"
    echo ""
    echo "📚 Useful Commands:"
    echo "   Monitor logs: gcloud app logs tail -s default"
    echo "   Check versions: gcloud app versions list"
    echo "   Adjust traffic: gcloud app services set-traffic default --splits=VERSION=PERCENTAGE"
    echo "   Emergency rollback: ./scripts/rollback-procedures.sh 'Emergency rollback'"
    echo ""
}

# Main deployment function
main() {
    print_header "Starting deployment with feature flag support"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --project)
                PROJECT_ID="$2"
                shift 2
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --strategy)
                ROLLOUT_STRATEGY="$2"
                shift 2
                ;;
            --initial-rollout)
                INITIAL_ROLLOUT="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --project PROJECT_ID          Google Cloud project ID"
                echo "  --environment ENV             Deployment environment (production, staging)"
                echo "  --strategy STRATEGY           Rollout strategy (gradual, immediate)"
                echo "  --initial-rollout PERCENTAGE  Initial traffic percentage for gradual rollout"
                echo "  --help                        Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute deployment steps
    check_prerequisites
    build_applications
    configure_feature_flags
    deploy_with_traffic_splitting
    setup_monitoring
    create_rollback_plan
    start_automated_monitoring
    show_deployment_info
    
    print_header "Deployment completed successfully!"
}

# Execute main function
main "$@"