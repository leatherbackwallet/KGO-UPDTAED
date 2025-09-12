#!/bin/bash

# Google Cloud Platform Deployment Script for OnYourBehlf
# This script deploys both frontend and backend to Google App Engine

set -e  # Exit on any error

echo "🚀 Starting Google Cloud Platform Deployment..."

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Please authenticate with Google Cloud first:"
    echo "   gcloud auth login"
    echo "   gcloud auth application-default login"
    exit 1
fi

# Set the project
PROJECT_ID="onyourbehlf"
echo "📋 Using project: $PROJECT_ID"

# Enable required APIs
echo "🔧 Enabling required Google Cloud APIs..."
gcloud services enable appengine.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID
gcloud services enable compute.googleapis.com --project=$PROJECT_ID

# Initialize App Engine if not already done
echo "🏗️  Initializing App Engine..."
gcloud app create --region=us-central --project=$PROJECT_ID || echo "App Engine already exists"

# Deploy Backend
echo "🔧 Deploying Backend API..."
cd /Users/josephjames/Projects/KGO/onYourBehlf
gcloud app deploy app.yaml --project=$PROJECT_ID --quiet

# Deploy Frontend
echo "🎨 Deploying Frontend..."
gcloud app deploy frontend-app.yaml --project=$PROJECT_ID --quiet

# Get the URLs
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your application is now available at:"
echo "   Frontend: https://onyourbehlf.uc.r.appspot.com"
echo "   Backend API: https://api-dot-onyourbehlf.uc.r.appspot.com"
echo ""
echo "📊 To view logs:"
echo "   Backend logs: gcloud app logs tail -s api"
echo "   Frontend logs: gcloud app logs tail -s default"
echo ""
echo "🔍 To monitor your app:"
echo "   gcloud app browse"
