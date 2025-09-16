#!/bin/bash

# Custom build script for Google Cloud Build
# This script handles the build process for both frontend and backend

set -e

echo "🔧 Starting custom build process..."

# Install dependencies at root level
echo "📦 Installing root dependencies..."
npm install

# Build backend
echo "🔧 Building backend..."
cd backend
npm install
npm run build
cd ..

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Build completed successfully!"
