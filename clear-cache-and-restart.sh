#!/bin/bash

echo "🧹 Clearing all caches and restarting servers..."

# Kill existing processes
echo "🛑 Stopping existing servers..."
pkill -f "ts-node server.ts" || true
pkill -f "next dev" || true
pkill -f "concurrently" || true

# Wait a moment for processes to stop
sleep 2

# Clear browser caches (if possible)
echo "🧹 Clearing browser caches..."
if command -v open &> /dev/null; then
    # macOS - clear Chrome cache
    rm -rf ~/Library/Caches/Google/Chrome/Default/Cache/* 2>/dev/null || true
    rm -rf ~/Library/Caches/Google/Chrome/Default/Code\ Cache/* 2>/dev/null || true
    
    # macOS - clear Safari cache
    rm -rf ~/Library/Caches/com.apple.Safari/* 2>/dev/null || true
fi

# Clear Node.js cache
echo "🧹 Clearing Node.js cache..."
cd backend
rm -rf node_modules/.cache 2>/dev/null || true

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
cd ../frontend
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Clear any temporary files
echo "🧹 Clearing temporary files..."
cd ..
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.log" -delete 2>/dev/null || true

echo "✅ Cache clearing completed!"

# Restart servers
echo "🚀 Restarting servers..."
npm run dev

echo "🎉 Servers restarted! Please refresh your browsers."
echo "💡 Tip: Use Ctrl+Shift+R (or Cmd+Shift+R on Mac) to force refresh the page"
