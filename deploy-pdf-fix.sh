#!/bin/bash

# PDF Generation Fix Deployment Script
# This script deploys the updated backend with Puppeteer support for PDF generation

echo "🚀 Starting PDF Generation Fix Deployment..."

# Check if we're in the right directory
if [ ! -f "app.yaml" ]; then
    echo "❌ Error: app.yaml not found. Please run this script from the project root."
    exit 1
fi

# Build the backend
echo "📦 Building backend..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi
cd ..

# Deploy to Google Cloud
echo "☁️ Deploying to Google Cloud..."
gcloud app deploy app.yaml --quiet

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🔗 Your API is now available at: https://api-dot-onyourbehlf.uc.r.appspot.com"
    echo "📄 PDF generation should now work in production!"
    echo ""
    echo "🧪 Test the PDF generation by:"
    echo "1. Go to your frontend: https://keralagiftsonline.in"
    echo "2. Place a test order"
    echo "3. Try downloading the receipt"
    echo ""
    echo "📊 Monitor the deployment:"
    echo "gcloud app logs tail -s api"
else
    echo "❌ Deployment failed!"
    echo "Check the logs above for details."
    exit 1
fi
