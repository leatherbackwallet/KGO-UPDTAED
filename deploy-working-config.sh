#!/bin/bash

# Working Configuration Deployment Script
# Based on commit 6ffd4ac30f25a1be2009f5bcbceb841aee432475

echo "🚀 Starting OnYourBehlf Deployment with Working Configuration..."

# Function to cleanup old versions
cleanup_old_versions() {
    echo "🧹 Cleaning up old versions..."
    
    # Stop ALL versions with 0% traffic (these cause database conflicts)
    echo "Stopping versions with 0% traffic..."
    
    # Backend cleanup
    echo "Cleaning backend versions..."
    local backend_zero_traffic=$(gcloud app versions list --service=api --format="table(version.id,traffic_split,serving_status)" | grep "0.00.*SERVING" | awk '{print $1}' || true)
    if [ -n "$backend_zero_traffic" ]; then
        echo "$backend_zero_traffic" | xargs -r gcloud app versions stop --service=api --quiet 2>/dev/null || true
        echo "Stopped backend versions with 0% traffic: $backend_zero_traffic"
    fi
    
    # Frontend cleanup
    echo "Cleaning frontend versions..."
    local frontend_zero_traffic=$(gcloud app versions list --service=default --format="table(version.id,traffic_split,serving_status)" | grep "0.00.*SERVING" | awk '{print $1}' || true)
    if [ -n "$frontend_zero_traffic" ]; then
        echo "$frontend_zero_traffic" | xargs -r gcloud app versions stop --service=default --quiet 2>/dev/null || true
        echo "Stopped frontend versions with 0% traffic: $frontend_zero_traffic"
    fi
    
    # Delete old versions (keep only current + 1 backup)
    echo "Deleting old versions (keeping only current + 1 backup)..."
    gcloud app versions list --service=api --sort-by=~version.createTime --format="value(version.id)" | tail -n +3 | xargs -r gcloud app versions delete --service=api --quiet 2>/dev/null || true
    gcloud app versions list --service=default --sort-by=~version.createTime --format="value(version.id)" | tail -n +3 | xargs -r gcloud app versions delete --service=default --quiet 2>/dev/null || true
    
    echo "✅ Old versions cleaned up (stopped 0% traffic versions, deleted old versions)"
}

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
    
    # Clean up old versions to prevent database conflicts
    cleanup_old_versions
    
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
