#!/bin/bash

# Kill existing development servers
echo "🔄 Stopping existing development servers..."

# Kill Next.js processes
pkill -f "next dev" 2>/dev/null || true

# Kill Node.js server processes (backend)
pkill -f "node dist/server.js" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

echo "✅ Cleaned up existing processes"
echo "🚀 Starting development servers..."

# Start development servers
npm run dev
