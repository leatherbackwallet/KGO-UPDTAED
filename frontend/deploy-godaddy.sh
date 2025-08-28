#!/bin/bash

# 🚀 KeralGiftsOnline GoDaddy Deployment Script
# This script helps deploy your application to GoDaddy hosting

set -e  # Exit on any error

echo "🚀 Starting KeralGiftsOnline GoDaddy Deployment..."

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

# Check if we're in the project root
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version check passed: $(node --version)"

# Step 1: Prepare Frontend for Static Export
print_status "Step 1: Preparing frontend for static export..."

cd frontend

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production file not found. Creating from example..."
    cp env.example .env.production
    print_warning "Please edit .env.production with your production values:"
    echo "  - NEXT_PUBLIC_API_URL=https://keralagiftsonline.in/api"
    echo "  - NEXT_PUBLIC_APP_NAME=KeralGiftsOnline"
    echo "  - NEXT_PUBLIC_WHATSAPP_NUMBER=+918075030919"
    read -p "Press Enter after editing .env.production..."
fi

# Install dependencies
print_status "Installing frontend dependencies..."
npm install

# Update next.config.js for static export
print_status "Updating Next.js configuration for static export..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['res.cloudinary.com'],
  },
  experimental: {
    appDir: false,
  },
};

module.exports = nextConfig;
EOF

# Build static frontend
print_status "Building static frontend..."
npm run build

# Check if build was successful
if [ ! -d "out" ]; then
    print_error "Frontend build failed. out directory not found"
    exit 1
fi

print_success "Frontend static build completed!"

# Create .htaccess file for GoDaddy
print_status "Creating .htaccess file for GoDaddy..."
cat > out/.htaccess << 'EOF'
# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle Next.js routing
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set Referrer-Policy "origin-when-cross-origin"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# Enable Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
EOF

print_success "Frontend preparation completed!"

# Step 2: Prepare Backend for GoDaddy
print_status "Step 2: Preparing backend for GoDaddy..."

cd ../backend

# Check if .env exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from example..."
    cp env.example .env
    print_warning "Please edit .env with your production values:"
    echo "  - MONGODB_URI (MongoDB Atlas connection string)"
    echo "  - JWT_SECRET (32+ character secret)"
    echo "  - JWT_REFRESH_SECRET (32+ character secret)"
    echo "  - CLOUDINARY credentials"
    echo "  - CORS_ORIGIN=https://keralagiftsonline.in,https://www.keralagiftsonline.in"
    read -p "Press Enter after editing .env..."
fi

# Install dependencies
print_status "Installing backend dependencies..."
npm install

# Build backend
print_status "Building backend..."
npm run build

# Check if build was successful
if [ ! -f "dist/server.js" ]; then
    print_error "Backend build failed. dist/server.js not found"
    exit 1
fi

print_success "Backend build completed!"

# Create deployment package
print_status "Creating deployment packages..."

# Create frontend deployment package
cd ../frontend
tar -czf ../keralagiftsonline-frontend.tar.gz out/

# Create backend deployment package
cd ../backend
tar -czf ../keralagiftsonline-backend.tar.gz dist/ package.json package-lock.json

cd ..

print_success "Deployment packages created!"

# Step 3: Deployment Instructions
echo ""
echo "🎯 GoDaddy Deployment Instructions"
echo "=================================="
echo ""
echo "📁 Frontend Files: keralagiftsonline-frontend.tar.gz"
echo "📁 Backend Files: keralagiftsonline-backend.tar.gz"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 📦 Upload Frontend to GoDaddy:"
echo "   - Extract keralagiftsonline-frontend.tar.gz"
echo "   - Upload contents to public_html/ directory"
echo "   - Set file permissions: 644 for files, 755 for directories"
echo ""
echo "2. ⚙️ Set up Backend on GoDaddy:"
echo "   - Extract keralagiftsonline-backend.tar.gz"
echo "   - Upload to a subdirectory (e.g., /api/)"
echo "   - Go to cPanel → Node.js"
echo "   - Create Node.js app with these settings:"
echo "     * App Name: keralagiftsonline-api"
echo "     * App Root: /api"
echo "     * App URL: https://keralagiftsonline.in/api"
echo "     * Node.js Version: 18.x"
echo "     * Startup File: server.js"
echo ""
echo "3. 🔧 Configure Environment Variables in GoDaddy Node.js Panel:"
echo "   - MONGODB_URI"
echo "   - JWT_SECRET"
echo "   - JWT_REFRESH_SECRET"
echo "   - CLOUDINARY_CLOUD_NAME"
echo "   - CLOUDINARY_API_KEY"
echo "   - CLOUDINARY_API_SECRET"
echo "   - CORS_ORIGIN=https://keralagiftsonline.in,https://www.keralagiftsonline.in"
echo "   - NODE_ENV=production"
echo ""
echo "4. 🌐 Configure DNS in GoDaddy:"
echo "   - Go to Domain Management → DNS"
echo "   - Set A record: @ → [Your GoDaddy hosting IP]"
echo "   - Set CNAME record: www → keralagiftsonline.in"
echo ""
echo "5. 🔒 Enable SSL Certificate:"
echo "   - Go to cPanel → SSL/TLS"
echo "   - Install SSL Certificate"
echo "   - Force HTTPS redirect"
echo ""
echo "6. 🧪 Test Your Deployment:"
echo "   - Frontend: https://keralagiftsonline.in"
echo "   - Backend: https://keralagiftsonline.in/api/health"
echo ""

# Deployment options
echo "🎯 Choose your upload method:"
echo "1) Manual upload via cPanel File Manager"
echo "2) FTP/SFTP upload instructions"
echo "3) View deployment packages location"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        print_status "Manual Upload via cPanel File Manager:"
        echo ""
        echo "1. Log into GoDaddy cPanel"
        echo "2. Go to File Manager"
        echo "3. Navigate to public_html/"
        echo "4. Upload and extract keralagiftsonline-frontend.tar.gz"
        echo "5. Create /api/ directory"
        echo "6. Upload and extract keralagiftsonline-backend.tar.gz to /api/"
        echo "7. Set file permissions: 644 for files, 755 for directories"
        ;;
    2)
        print_status "FTP/SFTP Upload Instructions:"
        echo ""
        echo "FTP/SFTP Credentials (from GoDaddy cPanel):"
        echo "Host: your-domain.com or FTP server"
        echo "Username: your-ftp-username"
        echo "Password: your-ftp-password"
        echo "Port: 21 (FTP) or 22 (SFTP)"
        echo ""
        echo "Upload Steps:"
        echo "1. Connect via FTP client (FileZilla, etc.)"
        echo "2. Upload frontend files to public_html/"
        echo "3. Upload backend files to /api/ directory"
        echo "4. Set correct file permissions"
        ;;
    3)
        print_status "Deployment packages location:"
        echo ""
        echo "Frontend package: $(pwd)/keralagiftsonline-frontend.tar.gz"
        echo "Backend package: $(pwd)/keralagiftsonline-backend.tar.gz"
        echo ""
        echo "Package sizes:"
        ls -lh keralagiftsonline-*.tar.gz
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

print_success "GoDaddy deployment preparation completed!"
print_status "For detailed instructions, see GODADDY_DEPLOYMENT_GUIDE.md"
print_status "For troubleshooting, refer to GoDaddy's 24/7 support"
