#!/bin/bash

# Environment Switching Script for KeralGiftsOnline
# Usage: ./switch-env.sh [development|production]

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
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Environment Switch Script${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to switch to development environment
switch_to_development() {
    print_status "Switching to DEVELOPMENT environment..."
    
    # Backend: Copy development config
    if [ -f "backend/.env" ]; then
        print_status "Backend development config already exists"
    else
        print_error "Backend development config not found!"
        exit 1
    fi
    
    # Frontend: Copy development config
    if [ -f "frontend/.env.local" ]; then
        print_status "Frontend development config already exists"
    else
        print_error "Frontend development config not found!"
        exit 1
    fi
    
    print_status "Development environment is ready!"
    print_status "Backend will run on: http://localhost:5001"
    print_status "Frontend will run on: http://localhost:3000"
}

# Function to switch to production environment
switch_to_production() {
    print_status "Switching to PRODUCTION environment..."
    
    # Backend: Copy production config
    if [ -f "backend/.env.production" ]; then
        print_status "Backend production config found"
    else
        print_error "Backend production config not found!"
        exit 1
    fi
    
    # Frontend: Copy production config
    if [ -f "frontend/.env.production" ]; then
        print_status "Frontend production config found"
    else
        print_error "Frontend production config not found!"
        exit 1
    fi
    
    print_status "Production environment is ready!"
    print_status "Backend URL: https://api-dot-onyourbehlf.ew.r.appspot.com"
    print_status "Frontend URL: https://onyourbehlf.ew.r.appspot.com"
}

# Function to show current environment status
show_status() {
    print_header
    echo ""
    
    # Check backend environment
    if [ -f "backend/.env" ]; then
        BACKEND_PORT=$(grep "^PORT=" backend/.env | cut -d'=' -f2)
        BACKEND_NODE_ENV=$(grep "^NODE_ENV=" backend/.env | cut -d'=' -f2)
        echo -e "${GREEN}Backend:${NC} $BACKEND_NODE_ENV (Port: $BACKEND_PORT)"
    else
        echo -e "${RED}Backend:${NC} No development config found"
    fi
    
    # Check frontend environment
    if [ -f "frontend/.env.local" ]; then
        FRONTEND_API_URL=$(grep "^NEXT_PUBLIC_API_URL=" frontend/.env.local | cut -d'=' -f2)
        echo -e "${GREEN}Frontend:${NC} Development (API: $FRONTEND_API_URL)"
    else
        echo -e "${RED}Frontend:${NC} No development config found"
    fi
    
    echo ""
    print_status "Available commands:"
    echo "  ./switch-env.sh development  - Switch to development"
    echo "  ./switch-env.sh production   - Switch to production"
    echo "  ./switch-env.sh status       - Show current status"
}

# Main script logic
print_header

case "${1:-status}" in
    "development"|"dev")
        switch_to_development
        ;;
    "production"|"prod")
        switch_to_production
        ;;
    "status")
        show_status
        ;;
    *)
        print_error "Invalid option: $1"
        echo ""
        echo "Usage: $0 [development|production|status]"
        echo ""
        echo "Options:"
        echo "  development, dev  - Switch to development environment"
        echo "  production, prod  - Switch to production environment"
        echo "  status           - Show current environment status"
        exit 1
        ;;
esac

echo ""
print_status "Environment switch completed!"
