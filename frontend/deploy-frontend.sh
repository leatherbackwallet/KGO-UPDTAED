#!/bin/bash

# ⚡ KeralGiftsOnline Frontend Deployment Script
# This script helps deploy the frontend to Vercel

set -e  # Exit on any error

echo "⚡ Starting KeralGiftsOnline Frontend Deployment..."

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

# Check if we're in the frontend directory
if [ ! -f "package.json" ] || [ ! -f "next.config.js" ]; then
    print_error "Please run this script from the frontend directory"
    exit 1
fi

# Check if .env.production file exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production file not found. Please create one based on env.example"
    print_status "Copying env.example to .env.production..."
    cp env.example .env.production
    print_warning "Please edit .env.production file with your production values before continuing"
    print_status "Make sure to set NEXT_PUBLIC_API_URL to your backend URL"
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

# Check environment variables
print_status "Checking environment variables..."

# Required environment variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_APP_NAME"
    "NEXT_PUBLIC_WHATSAPP_NUMBER"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env.production; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    print_warning "Please add these variables to your .env.production file"
    exit 1
fi

print_success "Environment variables check passed!"

# Build the project
print_status "Building the project..."
npm run build

# Check if build was successful
if [ ! -d ".next" ]; then
    print_error "Build failed. .next directory not found"
    exit 1
fi

print_success "Build completed successfully!"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_status "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    print_status "Please login to Vercel first:"
    vercel login
fi

# Deployment options
echo ""
echo "🎯 Choose your deployment method:"
echo "1) Deploy to Vercel (Recommended)"
echo "2) Manual deployment instructions"
echo "3) GitHub integration setup"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        print_status "Deploying to Vercel..."
        
        # Check if project is already linked
        if [ -f ".vercel/project.json" ]; then
            print_status "Project already linked to Vercel"
            read -p "Do you want to deploy to existing project? (y/n): " deploy_existing
            if [ "$deploy_existing" = "y" ]; then
                vercel --prod
            else
                print_status "Removing existing link..."
                rm -rf .vercel
                vercel
            fi
        else
            print_status "Linking project to Vercel..."
            vercel
        fi
        
        print_success "Deployment completed!"
        print_status "Your app URL: $(vercel ls | grep -o 'https://[^[:space:]]*')"
        ;;
    2)
        print_status "Manual deployment instructions:"
        echo ""
        echo "1. Go to https://vercel.com"
        echo "2. Sign up/Login with GitHub"
        echo "3. Click 'New Project'"
        echo "4. Import your GitHub repository"
        echo "5. Configure project settings:"
        echo "   - Framework Preset: Next.js"
        echo "   - Root Directory: frontend"
        echo "   - Build Command: npm run build"
        echo "   - Output Directory: .next"
        echo "6. Set environment variables:"
        echo "   - NEXT_PUBLIC_API_URL"
        echo "   - NEXT_PUBLIC_APP_NAME"
        echo "   - NEXT_PUBLIC_WHATSAPP_NUMBER"
        echo "7. Deploy"
        echo ""
        echo "After deployment:"
        echo "1. Go to project settings"
        echo "2. Add custom domain: keralagiftsonline.in"
        echo "3. Add custom domain: www.keralagiftsonline.in"
        echo "4. Follow Vercel's DNS instructions"
        ;;
    3)
        print_status "GitHub integration setup:"
        echo ""
        echo "1. Go to https://vercel.com"
        echo "2. Connect your GitHub account"
        echo "3. Import your repository"
        echo "4. Configure automatic deployments:"
        echo "   - Enable 'Auto Deploy'"
        echo "   - Set branch to 'main'"
        echo "5. Set environment variables in Vercel dashboard"
        echo "6. Push to main branch to trigger deployment"
        echo ""
        print_status "This will automatically deploy on every push to main branch"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Domain configuration reminder
echo ""
print_status "Domain Configuration Reminder:"
echo "1. In GoDaddy DNS settings, add CNAME records:"
echo "   - @ -> cname.vercel-dns.com"
echo "   - www -> cname.vercel-dns.com"
echo "2. In Vercel dashboard, add custom domains:"
echo "   - keralagiftsonline.in"
echo "   - www.keralagiftsonline.in"
echo "3. Follow Vercel's verification instructions"

print_success "Frontend deployment script completed!"
print_status "Next steps:"
echo "1. Configure your domain DNS settings"
echo "2. Test your website"
echo "3. Set up analytics and monitoring"
echo ""
print_status "For detailed instructions, see DEPLOYMENT_GUIDE.md"
