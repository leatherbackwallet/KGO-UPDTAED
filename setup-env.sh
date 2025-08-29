#!/bin/bash

# Environment Variables Setup Script for Google Cloud
# This script helps set up environment variables for Google Cloud deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_status "Creating .env file from env.production..."
    cp env.production .env
    print_status ".env file created successfully!"
else
    print_warning ".env file already exists. Skipping creation."
fi

# Function to set environment variables in Google Cloud
set_gcp_env_vars() {
    print_status "Setting environment variables in Google Cloud..."
    
    # Set environment variables for backend
    gcloud app deploy app.yaml --set-env-vars \
        MONGODB_URI="mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline",\
        JWT_SECRET="kerala-gifts-online-super-secure-jwt-secret-production-2024-minimum-32-chars",\
        JWT_REFRESH_SECRET="kerala-gifts-online-refresh-token-secret-production-2024-minimum-32-chars",\
        JWT_ACCESS_TOKEN_EXPIRY="15m",\
        JWT_REFRESH_TOKEN_EXPIRY="7d",\
        JWT_EXPIRES_IN="7d",\
        SESSION_SECRET="kerala-gifts-online-session-secret-production-2024-minimum-32-chars",\
        NODE_ENV="production",\
        PORT="8080" \
        --quiet

    # Set environment variables for frontend
    gcloud app deploy frontend-app.yaml --set-env-vars \
        MONGODB_URI="mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline",\
        JWT_SECRET="kerala-gifts-online-super-secure-jwt-secret-production-2024-minimum-32-chars",\
        JWT_REFRESH_SECRET="kerala-gifts-online-refresh-token-secret-production-2024-minimum-32-chars",\
        JWT_ACCESS_TOKEN_EXPIRY="15m",\
        JWT_REFRESH_TOKEN_EXPIRY="7d",\
        JWT_EXPIRES_IN="7d",\
        SESSION_SECRET="kerala-gifts-online-session-secret-production-2024-minimum-32-chars",\
        NODE_ENV="production",\
        PORT="8080" \
        --quiet

    print_status "Environment variables set successfully!"
}

# Function to update app.yaml files with environment variables
update_app_yaml() {
    print_status "Updating app.yaml files with environment variables..."
    
    # Update backend app.yaml
    cat > app.yaml << 'EOF'
runtime: nodejs20
service: api

env_variables:
  NODE_ENV: production
  PORT: 8080
  # Database Configuration
  MONGODB_URI: "mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline"
  
  # JWT Configuration
  JWT_SECRET: "kerala-gifts-online-super-secure-jwt-secret-production-2024-minimum-32-chars"
  JWT_REFRESH_SECRET: "kerala-gifts-online-refresh-token-secret-production-2024-minimum-32-chars"
  JWT_ACCESS_TOKEN_EXPIRY: "15m"
  JWT_REFRESH_TOKEN_EXPIRY: "7d"
  JWT_EXPIRES_IN: "7d"
  
  # Session Configuration
  SESSION_SECRET: "kerala-gifts-online-session-secret-production-2024-minimum-32-chars"
  
  # Frontend URL
  FRONTEND_URL: "https://onyourbehlf.ew.r.appspot.com"
  
  # API URL
  API_URL: "https://api-dot-onyourbehlf.ew.r.appspot.com"

automatic_scaling:
  target_cpu_utilization: 0.65
  min_instances: 1
  max_instances: 10
  target_throughput_utilization: 0.6

resources:
  cpu: 1
  memory_gb: 1
  disk_size_gb: 10

handlers:
  - url: /.*
    script: auto
    secure: always
    http_headers:
      X-Content-Type-Options: nosniff
      X-Frame-Options: DENY
      X-XSS-Protection: 1; mode=block
      Strict-Transport-Security: max-age=31536000; includeSubDomains
      Referrer-Policy: strict-origin-when-cross-origin
EOF

    # Update frontend app.yaml
    cat > frontend-app.yaml << 'EOF'
runtime: nodejs20
service: frontend

env_variables:
  NODE_ENV: production
  PORT: 8080
  # Database Configuration
  MONGODB_URI: "mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline"
  
  # JWT Configuration
  JWT_SECRET: "kerala-gifts-online-super-secure-jwt-secret-production-2024-minimum-32-chars"
  JWT_REFRESH_SECRET: "kerala-gifts-online-refresh-token-secret-production-2024-minimum-32-chars"
  JWT_ACCESS_TOKEN_EXPIRY: "15m"
  JWT_REFRESH_TOKEN_EXPIRY: "7d"
  JWT_EXPIRES_IN: "7d"
  
  # Session Configuration
  SESSION_SECRET: "kerala-gifts-online-session-secret-production-2024-minimum-32-chars"
  
  # Frontend URL
  FRONTEND_URL: "https://onyourbehlf.ew.r.appspot.com"
  
  # API URL
  API_URL: "https://api-dot-onyourbehlf.ew.r.appspot.com"

automatic_scaling:
  target_cpu_utilization: 0.65
  min_instances: 1
  max_instances: 10
  target_throughput_utilization: 0.6

resources:
  cpu: 1
  memory_gb: 2
  disk_size_gb: 10

handlers:
  - url: /_next/static
    static_dir: .next/static
    secure: always
    http_headers:
      Cache-Control: public, max-age=31536000, immutable
      X-Content-Type-Options: nosniff
      X-Frame-Options: DENY
      X-XSS-Protection: 1; mode=block
      Strict-Transport-Security: max-age=31536000; includeSubDomains
      Referrer-Policy: strict-origin-when-cross-origin

  - url: /static
    static_dir: public
    secure: always
    http_headers:
      Cache-Control: public, max-age=31536000
      X-Content-Type-Options: nosniff
      X-Frame-Options: DENY
      X-XSS-Protection: 1; mode=block
      Strict-Transport-Security: max-age=31536000; includeSubDomains
      Referrer-Policy: strict-origin-when-cross-origin

  - url: /.*
    script: auto
    secure: always
    http_headers:
      X-Content-Type-Options: nosniff
      X-Frame-Options: DENY
      X-XSS-Protection: 1; mode=block
      Strict-Transport-Security: max-age=31536000; includeSubDomains
      Referrer-Policy: strict-origin-when-cross-origin
EOF

    print_status "app.yaml files updated successfully!"
}

# Main script
print_status "Setting up environment variables for Google Cloud deployment..."

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI is not installed. Please install it first."
    exit 1
fi

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "You are not authenticated with Google Cloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Create .env file
if [ ! -f ".env" ]; then
    print_status "Creating .env file from env.production..."
    cp env.production .env
    print_status ".env file created successfully!"
else
    print_warning ".env file already exists. Skipping creation."
fi

# Update app.yaml files
update_app_yaml

# Ask user if they want to set environment variables in Google Cloud
read -p "Do you want to set environment variables in Google Cloud now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    set_gcp_env_vars
else
    print_status "You can set environment variables later using:"
    echo "gcloud app deploy app.yaml --set-env-vars VAR=value"
fi

print_status "Environment setup completed!"
print_status "You can now run './deploy.sh' to deploy your application."
