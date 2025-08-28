#!/bin/bash

# 🚀 KeralGiftsOnline Backend Deployment Script
# This script helps deploy the backend to Railway/Render/Heroku

set -e  # Exit on any error

echo "🚀 Starting KeralGiftsOnline Backend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if we're in the backend directory
if [ ! -f "package.json" ] || [ ! -f "server.ts" ]; then
    print_error "Please run this script from the backend directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Please create one based on env.example"
    print_status "Copying env.example to .env..."
    cp env.example .env
    print_warning "Please edit .env file with your production values before continuing"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version check passed: $(node --version)"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build the project
print_status "Building the project..."
npm run build

# Check if build was successful
if [ ! -f "dist/server.js" ]; then
    print_error "Build failed. dist/server.js not found"
    exit 1
fi

print_success "Build completed successfully!"

# Check environment variables
print_status "Checking environment variables..."

# Required environment variables
REQUIRED_VARS=(
    "MONGODB_URI"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
    "CORS_ORIGIN"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    print_warning "Please add these variables to your .env file"
    exit 1
fi

print_success "Environment variables check passed!"

# Test the build
print_status "Testing the build..."
if npm start &> /dev/null & then
    PID=$!
    sleep 5
    
    # Check if server is running
    if curl -s http://localhost:5001/api/health > /dev/null; then
        print_success "Server test passed!"
        kill $PID
    else
        print_error "Server test failed"
        kill $PID
        exit 1
    fi
else
    print_error "Failed to start server for testing"
    exit 1
fi

# Deployment options
echo ""
echo "🎯 Choose your deployment platform:"
echo "1) Railway (Recommended)"
echo "2) Render"
echo "3) Heroku"
echo "4) Manual deployment instructions"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        print_status "Deploying to Railway..."
        print_status "Please follow these steps:"
        echo "1. Go to https://railway.app"
        echo "2. Sign up/Login with GitHub"
        echo "3. Create new project from GitHub repo"
        echo "4. Set environment variables in Railway dashboard"
        echo "5. Deploy automatically"
        ;;
    2)
        print_status "Deploying to Render..."
        print_status "Please follow these steps:"
        echo "1. Go to https://render.com"
        echo "2. Sign up/Login with GitHub"
        echo "3. Create new Web Service"
        echo "4. Connect your GitHub repository"
        echo "5. Set build command: npm install && npm run build"
        echo "6. Set start command: npm start"
        echo "7. Set environment variables"
        echo "8. Deploy"
        ;;
    3)
        print_status "Deploying to Heroku..."
        
        # Check if Heroku CLI is installed
        if ! command -v heroku &> /dev/null; then
            print_error "Heroku CLI not found. Please install it first:"
            echo "  https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        fi
        
        # Check if logged in to Heroku
        if ! heroku auth:whoami &> /dev/null; then
            print_status "Please login to Heroku first:"
            heroku login
        fi
        
        # Create Heroku app
        read -p "Enter Heroku app name (or press Enter for auto-generated): " app_name
        if [ -z "$app_name" ]; then
            heroku create
        else
            heroku create "$app_name"
        fi
        
        # Set environment variables
        print_status "Setting environment variables..."
        while IFS= read -r line; do
            if [[ $line =~ ^[A-Z_]+=.*$ ]] && [[ $line != \#* ]]; then
                var_name=$(echo "$line" | cut -d'=' -f1)
                var_value=$(echo "$line" | cut -d'=' -f2-)
                heroku config:set "$var_name=$var_value"
            fi
        done < .env
        
        # Deploy
        print_status "Deploying to Heroku..."
        git add .
        git commit -m "Deploy to Heroku"
        git push heroku main
        
        print_success "Deployment completed!"
        print_status "Your app URL: $(heroku info -s | grep web_url | cut -d= -f2)"
        ;;
    4)
        print_status "Manual deployment instructions:"
        echo ""
        echo "1. Ensure your code is committed to GitHub"
        echo "2. Choose a deployment platform (Railway/Render/Heroku)"
        echo "3. Connect your GitHub repository"
        echo "4. Set the following environment variables:"
        echo "   - MONGODB_URI"
        echo "   - JWT_SECRET"
        echo "   - JWT_REFRESH_SECRET"
        echo "   - CLOUDINARY_CLOUD_NAME"
        echo "   - CLOUDINARY_API_KEY"
        echo "   - CLOUDINARY_API_SECRET"
        echo "   - CORS_ORIGIN"
        echo "5. Set build command: npm install && npm run build"
        echo "6. Set start command: npm start"
        echo "7. Deploy"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

print_success "Deployment script completed!"
print_status "Next steps:"
echo "1. Configure your domain DNS settings"
echo "2. Set up SSL certificates"
echo "3. Test your API endpoints"
echo "4. Deploy your frontend"
echo ""
print_status "For detailed instructions, see DEPLOYMENT_GUIDE.md"
