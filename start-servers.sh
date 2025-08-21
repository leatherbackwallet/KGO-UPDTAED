#!/bin/bash

echo "🚀 Starting Kerala Gifts Online servers..."

# Kill any existing processes
echo "🔄 Killing existing processes..."
pkill -f "nodemon\|ts-node\|node.*server" 2>/dev/null
pkill -f "next" 2>/dev/null

# Start backend server
echo "🔧 Starting backend server..."
cd backend
JWT_SECRET=your-super-secret-jwt-key-here \
MONGODB_URI=mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline \
PORT=5001 \
npm run dev &

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Test backend health
echo "🏥 Testing backend health..."
curl -s http://localhost:5001/api/health | head -1

# Start frontend server
echo "🎨 Starting frontend server..."
cd ../frontend
npm run dev &

echo "✅ Servers started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:5001/api"
echo ""
echo "📋 To test orders API:"
echo "1. Login as admin at http://localhost:3000/login"
echo "2. Go to admin dashboard at http://localhost:3000/admin"
echo "3. Check the Orders tab"
