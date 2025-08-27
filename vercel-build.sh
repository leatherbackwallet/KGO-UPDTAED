#!/bin/bash

# Vercel Build Script for Frontend Only
echo "🚀 Starting Vercel build for frontend..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build the Next.js application
echo "🔨 Building Next.js application..."
npm run build

echo "✅ Frontend build completed successfully!"
