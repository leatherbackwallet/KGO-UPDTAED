#!/bin/bash

# Working Configuration Deployment Script
# Based on commit 6ffd4ac30f25a1be2009f5bcbceb841aee432475

echo "🚀 Starting OnYourBehlf Deployment with Working Configuration..."

# Check if we're in the right directory
if [ ! -f "app.yaml" ] || [ ! -f "frontend-app.yaml" ]; then
    echo "❌ Error: Configuration files not found. Please run this script from the project root."
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

# Build the frontend
echo "📦 Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
cd ..

# Deploy backend first
echo "☁️ Deploying backend to Google Cloud..."
gcloud app deploy app.yaml --quiet

if [ $? -ne 0 ]; then
    echo "❌ Backend deployment failed!"
    exit 1
fi

# Deploy frontend
echo "☁️ Deploying frontend to Google Cloud..."
gcloud app deploy frontend-app.yaml --quiet

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your website is now available at:"
    echo "   Frontend: https://onyourbehlf.uc.r.appspot.com"
    echo "   API: https://api-dot-onyourbehlf.uc.r.appspot.com"
    echo ""
    echo "🧪 Test the deployment:"
    echo "   Frontend Health: https://onyourbehlf.uc.r.appspot.com/api/health"
    echo "   Backend Health: https://api-dot-onyourbehlf.uc.r.appspot.com/api/health-status"
    echo "   Products API: https://api-dot-onyourbehlf.uc.r.appspot.com/api/products"
    echo ""
    echo "📊 Monitor the deployment:"
    echo "   Backend logs: gcloud app logs tail -s api"
    echo "   Frontend logs: gcloud app logs tail -s default"
else
    echo "❌ Frontend deployment failed!"
    echo "Check the logs above for details."
    exit 1
fi
