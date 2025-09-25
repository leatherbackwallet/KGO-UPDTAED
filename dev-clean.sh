#!/bin/bash

# 🚀 KeralGiftsOnline Development Environment Setup
# This script clears all ports and starts both frontend and backend servers

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}🚀 KeralGiftsOnline Dev Setup${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to clear ports
clear_ports() {
    print_status "Clearing development ports..."
    
    # Common development ports
    PORTS=(3000 3001 3002 3003 5000 5001 8000 8080 9000)
    
    for port in "${PORTS[@]}"; do
        if lsof -ti:$port >/dev/null 2>&1; then
            print_warning "Killing processes on port $port"
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
        fi
    done
    
    # Kill any existing Node.js processes
    print_status "Clearing existing Node.js processes..."
    pkill -f "node.*server" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    pkill -f "npm.*dev" 2>/dev/null || true
    pkill -f "next.*dev" 2>/dev/null || true
    
    sleep 2
    print_success "Ports cleared successfully"
}

# Function to check if ports are available
check_ports() {
    print_status "Verifying ports are available..."
    
    # Check if ports are still in use
    if lsof -ti:3000,5001 >/dev/null 2>&1; then
        print_warning "Some ports are still in use, attempting to clear again..."
        clear_ports
    fi
    
    print_success "Ports are available"
}

# Function to build backend
build_backend() {
    print_status "Building backend (TypeScript compilation)..."
    
    cd backend
    
    if npm run build; then
        print_success "Backend built successfully"
    else
        print_error "Backend build failed"
        exit 1
    fi
    
    cd ..
}

# Function to start services
start_services() {
    print_status "Starting development servers..."
    
    # Start both services using concurrently directly
    if npm run dev:concurrent; then
        print_success "Development servers started successfully"
    else
        print_error "Failed to start development servers"
        exit 1
    fi
}

# Function to verify services
verify_services() {
    print_status "Verifying services are running..."
    
    sleep 5  # Wait for services to start
    
    # Check backend
    if curl -s http://localhost:5001/api/health >/dev/null 2>&1; then
        print_success "✅ Backend is running on port 5001"
    else
        print_warning "⚠️  Backend health check failed (may still be starting)"
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        print_success "✅ Frontend is running on port 3000"
    else
        print_warning "⚠️  Frontend health check failed (may still be starting)"
    fi
    
    echo ""
    print_success "🎉 Development environment is ready!"
    echo -e "${CYAN}Frontend:${NC} http://localhost:3000"
    echo -e "${CYAN}Backend:${NC}  http://localhost:5001"
    echo -e "${CYAN}API Health:${NC} http://localhost:5001/api/health"
    echo ""
    print_status "Press Ctrl+C to stop all services"
}

# Function to handle cleanup on exit
cleanup() {
    print_warning "Stopping development servers..."
    pkill -f "npm.*dev" 2>/dev/null || true
    pkill -f "node.*server" 2>/dev/null || true
    pkill -f "next.*dev" 2>/dev/null || true
    print_success "Cleanup completed"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    print_header
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed or not in PATH"
        exit 1
    fi
    
    # Check if concurrently is installed
    if ! npm list concurrently &> /dev/null; then
        print_status "Installing concurrently..."
        npm install
    fi
    
    # Execute the setup steps
    clear_ports
    check_ports
    build_backend
    start_services
    verify_services
    
    # Keep the script running to show logs
    wait
}

# Run main function
main "$@"
