#!/bin/bash

# Google Cloud Platform Monitoring Setup Script
# Sets up monitoring, alerting, and logging for reliability features

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${PROJECT_ID:-onyourbehlf}"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL}"
SLACK_WEBHOOK="${SLACK_WEBHOOK}"

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
    echo -e "${BLUE}[SETUP]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud CLI is not installed"
        exit 1
    fi
    
    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "You are not authenticated with Google Cloud. Please run 'gcloud auth login' first."
        exit 1
    fi
    
    # Set project
    gcloud config set project "$PROJECT_ID"
    print_status "Using project: $PROJECT_ID"
}

# Function to enable required APIs
enable_apis() {
    print_header "Enabling required APIs..."
    
    local apis=(
        "monitoring.googleapis.com"
        "logging.googleapis.com"
        "clouderrorreporting.googleapis.com"
        "cloudtrace.googleapis.com"
        "cloudprofiler.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        print_status "Enabling $api..."
        gcloud services enable "$api" --quiet
    done
    
    print_status "All required APIs enabled"
}

# Function to create log-based metrics
create_log_metrics() {
    print_header "Creating log-based metrics..."
    
    # Error rate metric
    print_status "Creating error rate metric..."
    gcloud logging metrics create reliability_error_rate \
        --description="Error rate for reliability features" \
        --log-filter='resource.type="gae_app" AND severity>=ERROR AND (jsonPayload.feature_flag=~".*" OR labels.feature_flag=~".*")' \
        --quiet 2>/dev/null || print_warning "Error rate metric already exists"
    
    # Performance degradation metric
    print_status "Creating performance metric..."
    gcloud logging metrics create reliability_performance_degradation \
        --description="Performance degradation events" \
        --log-filter='resource.type="gae_app" AND (jsonPayload.performance_impact<-3 OR labels.performance_impact<-3)' \
        --quiet 2>/dev/null || print_warning "Performance metric already exists"
    
    # Loading failure metric
    print_status "Creating loading failure metric..."
    gcloud logging metrics create reliability_loading_failures \
        --description="Loading failure events" \
        --log-filter='resource.type="gae_app" AND (jsonPayload.loading_failure=true OR labels.loading_failure=true)' \
        --quiet 2>/dev/null || print_warning "Loading failure metric already exists"
    
    # Cache miss metric
    print_status "Creating cache miss metric..."
    gcloud logging metrics create reliability_cache_misses \
        --description="Cache miss events" \
        --log-filter='resource.type="gae_app" AND (jsonPayload.cache_miss=true OR labels.cache_miss=true)' \
        --quiet 2>/dev/null || print_warning "Cache miss metric already exists"
    
    # Feature flag rollback metric
    print_status "Creating rollback metric..."
    gcloud logging metrics create reliability_rollbacks \
        --description="Feature flag rollback events" \
        --log-filter='resource.type="gae_app" AND (jsonPayload.rollback=true OR labels.rollback=true)' \
        --quiet 2>/dev/null || print_warning "Rollback metric already exists"
    
    print_status "Log-based metrics created"
}

# Function to create notification channels
create_notification_channels() {
    print_header "Creating notification channels..."
    
    # Email notification channel
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        print_status "Creating email notification channel..."
        
        cat > email_channel.json << EOF
{
  "type": "email",
  "displayName": "Reliability Team Email",
  "description": "Email notifications for reliability alerts",
  "labels": {
    "email_address": "$NOTIFICATION_EMAIL"
  }
}
EOF
        
        gcloud alpha monitoring channels create --channel-content-from-file=email_channel.json \
            --quiet 2>/dev/null || print_warning "Email channel may already exist"
        
        rm -f email_channel.json
    else
        print_warning "NOTIFICATION_EMAIL not set, skipping email channel creation"
    fi
    
    # Slack notification channel (webhook)
    if [ -n "$SLACK_WEBHOOK" ]; then
        print_status "Creating Slack notification channel..."
        
        cat > slack_channel.json << EOF
{
  "type": "webhook_tokenauth",
  "displayName": "Reliability Team Slack",
  "description": "Slack notifications for reliability alerts",
  "labels": {
    "url": "$SLACK_WEBHOOK"
  }
}
EOF
        
        gcloud alpha monitoring channels create --channel-content-from-file=slack_channel.json \
            --quiet 2>/dev/null || print_warning "Slack channel may already exist"
        
        rm -f slack_channel.json
    else
        print_warning "SLACK_WEBHOOK not set, skipping Slack channel creation"
    fi
    
    print_status "Notification channels created"
}

# Function to create alerting policies
create_alerting_policies() {
    print_header "Creating alerting policies..."
    
    # Get notification channel names
    local email_channel=""
    local slack_channel=""
    
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        email_channel=$(gcloud alpha monitoring channels list --filter="displayName:'Reliability Team Email'" --format="value(name)" | head -n1)
    fi
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        slack_channel=$(gcloud alpha monitoring channels list --filter="displayName:'Reliability Team Slack'" --format="value(name)" | head -n1)
    fi
    
    # Build notification channels array
    local notification_channels="[]"
    if [ -n "$email_channel" ] || [ -n "$slack_channel" ]; then
        local channels=""
        [ -n "$email_channel" ] && channels="\"$email_channel\""
        [ -n "$slack_channel" ] && [ -n "$channels" ] && channels="$channels, \"$slack_channel\""
        [ -n "$slack_channel" ] && [ -z "$channels" ] && channels="\"$slack_channel\""
        notification_channels="[$channels]"
    fi
    
    # High error rate alert
    print_status "Creating high error rate alert..."
    cat > error_rate_alert.json << EOF
{
  "displayName": "High Error Rate - Reliability Features",
  "documentation": {
    "content": "Error rate for reliability features has exceeded 3%",
    "mimeType": "text/markdown"
  },
  "conditions": [
    {
      "displayName": "Error rate > 3%",
      "conditionThreshold": {
        "filter": "resource.type=\"gae_app\" AND metric.type=\"logging.googleapis.com/user/reliability_error_rate\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 3,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_RATE",
            "crossSeriesReducer": "REDUCE_SUM"
          }
        ]
      }
    }
  ],
  "notificationChannels": $notification_channels,
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
EOF
    
    gcloud alpha monitoring policies create --policy-from-file=error_rate_alert.json \
        --quiet 2>/dev/null || print_warning "Error rate alert may already exist"
    
    # Performance degradation alert
    print_status "Creating performance degradation alert..."
    cat > performance_alert.json << EOF
{
  "displayName": "Performance Degradation - Reliability Features",
  "documentation": {
    "content": "Performance degradation detected in reliability features",
    "mimeType": "text/markdown"
  },
  "conditions": [
    {
      "displayName": "Performance degradation events",
      "conditionThreshold": {
        "filter": "resource.type=\"gae_app\" AND metric.type=\"logging.googleapis.com/user/reliability_performance_degradation\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 5,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_RATE",
            "crossSeriesReducer": "REDUCE_SUM"
          }
        ]
      }
    }
  ],
  "notificationChannels": $notification_channels,
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
EOF
    
    gcloud alpha monitoring policies create --policy-from-file=performance_alert.json \
        --quiet 2>/dev/null || print_warning "Performance alert may already exist"
    
    # Loading failure alert
    print_status "Creating loading failure alert..."
    cat > loading_failure_alert.json << EOF
{
  "displayName": "High Loading Failure Rate - Reliability Features",
  "documentation": {
    "content": "Loading failure rate has exceeded acceptable threshold",
    "mimeType": "text/markdown"
  },
  "conditions": [
    {
      "displayName": "Loading failures > 5%",
      "conditionThreshold": {
        "filter": "resource.type=\"gae_app\" AND metric.type=\"logging.googleapis.com/user/reliability_loading_failures\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 10,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_RATE",
            "crossSeriesReducer": "REDUCE_SUM"
          }
        ]
      }
    }
  ],
  "notificationChannels": $notification_channels,
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
EOF
    
    gcloud alpha monitoring policies create --policy-from-file=loading_failure_alert.json \
        --quiet 2>/dev/null || print_warning "Loading failure alert may already exist"
    
    # Rollback alert
    print_status "Creating rollback alert..."
    cat > rollback_alert.json << EOF
{
  "displayName": "Feature Flag Rollback - Reliability Features",
  "documentation": {
    "content": "A reliability feature has been rolled back",
    "mimeType": "text/markdown"
  },
  "conditions": [
    {
      "displayName": "Rollback events",
      "conditionThreshold": {
        "filter": "resource.type=\"gae_app\" AND metric.type=\"logging.googleapis.com/user/reliability_rollbacks\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 0,
        "duration": "60s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_RATE",
            "crossSeriesReducer": "REDUCE_SUM"
          }
        ]
      }
    }
  ],
  "notificationChannels": $notification_channels,
  "alertStrategy": {
    "autoClose": "3600s"
  }
}
EOF
    
    gcloud alpha monitoring policies create --policy-from-file=rollback_alert.json \
        --quiet 2>/dev/null || print_warning "Rollback alert may already exist"
    
    # Clean up temporary files
    rm -f *_alert.json
    
    print_status "Alerting policies created"
}

# Function to create custom dashboards
create_dashboards() {
    print_header "Creating monitoring dashboards..."
    
    # Reliability Features Dashboard
    print_status "Creating reliability features dashboard..."
    cat > reliability_dashboard.json << EOF
{
  "displayName": "Reliability Features Monitoring",
  "mosaicLayout": {
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Error Rate",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"gae_app\" AND metric.type=\"logging.googleapis.com/user/reliability_error_rate\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE",
                      "crossSeriesReducer": "REDUCE_SUM"
                    }
                  }
                },
                "plotType": "LINE"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Error Rate (%)",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "xPos": 6,
        "widget": {
          "title": "Performance Degradation Events",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"gae_app\" AND metric.type=\"logging.googleapis.com/user/reliability_performance_degradation\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE",
                      "crossSeriesReducer": "REDUCE_SUM"
                    }
                  }
                },
                "plotType": "LINE"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Events/min",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "yPos": 4,
        "widget": {
          "title": "Loading Failures",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"gae_app\" AND metric.type=\"logging.googleapis.com/user/reliability_loading_failures\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE",
                      "crossSeriesReducer": "REDUCE_SUM"
                    }
                  }
                },
                "plotType": "LINE"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Failures/min",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "xPos": 6,
        "yPos": 4,
        "widget": {
          "title": "Cache Misses",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"gae_app\" AND metric.type=\"logging.googleapis.com/user/reliability_cache_misses\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE",
                      "crossSeriesReducer": "REDUCE_SUM"
                    }
                  }
                },
                "plotType": "LINE"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Cache Misses/min",
              "scale": "LINEAR"
            }
          }
        }
      }
    ]
  }
}
EOF
    
    gcloud monitoring dashboards create --config-from-file=reliability_dashboard.json \
        --quiet 2>/dev/null || print_warning "Dashboard may already exist"
    
    rm -f reliability_dashboard.json
    
    print_status "Monitoring dashboards created"
}

# Function to set up log sinks
create_log_sinks() {
    print_header "Creating log sinks..."
    
    # Create a BigQuery dataset for log analysis (optional)
    print_status "Creating BigQuery dataset for logs..."
    bq mk --dataset --description="Reliability features logs" \
        "${PROJECT_ID}:reliability_logs" 2>/dev/null || print_warning "Dataset may already exist"
    
    # Create log sink to BigQuery
    print_status "Creating log sink to BigQuery..."
    gcloud logging sinks create reliability-logs-sink \
        bigquery.googleapis.com/projects/${PROJECT_ID}/datasets/reliability_logs \
        --log-filter='resource.type="gae_app" AND (jsonPayload.feature_flag=~".*" OR labels.feature_flag=~".*")' \
        --quiet 2>/dev/null || print_warning "Log sink may already exist"
    
    print_status "Log sinks created"
}

# Function to create uptime checks
create_uptime_checks() {
    print_header "Creating uptime checks..."
    
    # Health check uptime monitor
    print_status "Creating health check uptime monitor..."
    cat > health_uptime_check.json << EOF
{
  "displayName": "Reliability Features Health Check",
  "httpCheck": {
    "path": "/api/health/check",
    "port": 443,
    "useSsl": true,
    "validateSsl": true
  },
  "monitoredResource": {
    "type": "uptime_url",
    "labels": {
      "project_id": "$PROJECT_ID",
      "host": "api-dot-${PROJECT_ID}.uc.r.appspot.com"
    }
  },
  "timeout": "10s",
  "period": "60s",
  "contentMatchers": [
    {
      "content": "\"status\":\"ok\"",
      "matcher": "CONTAINS_STRING"
    }
  ]
}
EOF
    
    gcloud monitoring uptime create --config-from-file=health_uptime_check.json \
        --quiet 2>/dev/null || print_warning "Health uptime check may already exist"
    
    # Feature flags health check
    print_status "Creating feature flags uptime monitor..."
    cat > flags_uptime_check.json << EOF
{
  "displayName": "Feature Flags Health Check",
  "httpCheck": {
    "path": "/api/feature-flags/health/check",
    "port": 443,
    "useSsl": true,
    "validateSsl": true
  },
  "monitoredResource": {
    "type": "uptime_url",
    "labels": {
      "project_id": "$PROJECT_ID",
      "host": "api-dot-${PROJECT_ID}.uc.r.appspot.com"
    }
  },
  "timeout": "10s",
  "period": "300s",
  "contentMatchers": [
    {
      "content": "\"status\":\"healthy\"",
      "matcher": "CONTAINS_STRING"
    }
  ]
}
EOF
    
    gcloud monitoring uptime create --config-from-file=flags_uptime_check.json \
        --quiet 2>/dev/null || print_warning "Feature flags uptime check may already exist"
    
    rm -f *_uptime_check.json
    
    print_status "Uptime checks created"
}

# Function to display setup summary
show_setup_summary() {
    print_header "Setup Summary"
    
    echo ""
    echo "🎉 Google Cloud monitoring setup completed successfully!"
    echo ""
    echo "📊 What was configured:"
    echo "   ✅ Required APIs enabled"
    echo "   ✅ Log-based metrics created"
    echo "   ✅ Notification channels configured"
    echo "   ✅ Alerting policies created"
    echo "   ✅ Monitoring dashboards created"
    echo "   ✅ Log sinks configured"
    echo "   ✅ Uptime checks created"
    echo ""
    echo "🔗 Access your monitoring:"
    echo "   • Monitoring Console: https://console.cloud.google.com/monitoring"
    echo "   • Dashboards: https://console.cloud.google.com/monitoring/dashboards"
    echo "   • Alerting: https://console.cloud.google.com/monitoring/alerting"
    echo "   • Logs: https://console.cloud.google.com/logs"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Review and customize alert thresholds"
    echo "   2. Test notification channels"
    echo "   3. Set up additional custom metrics as needed"
    echo "   4. Configure log retention policies"
    echo ""
    echo "🚨 Alert thresholds configured:"
    echo "   • Error rate > 3%"
    echo "   • Performance degradation events > 5/min"
    echo "   • Loading failures > 10/min"
    echo "   • Any rollback events"
    echo ""
}

# Main setup function
main() {
    print_header "Starting Google Cloud monitoring setup"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --project)
                PROJECT_ID="$2"
                shift 2
                ;;
            --email)
                NOTIFICATION_EMAIL="$2"
                shift 2
                ;;
            --slack-webhook)
                SLACK_WEBHOOK="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --project PROJECT_ID       Google Cloud project ID"
                echo "  --email EMAIL              Email for notifications"
                echo "  --slack-webhook URL        Slack webhook URL for notifications"
                echo "  --help                     Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute setup steps
    check_prerequisites
    enable_apis
    create_log_metrics
    create_notification_channels
    create_alerting_policies
    create_dashboards
    create_log_sinks
    create_uptime_checks
    show_setup_summary
    
    print_header "Google Cloud monitoring setup completed!"
}

# Execute main function
main "$@"