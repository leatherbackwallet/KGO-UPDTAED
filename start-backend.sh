#!/bin/bash

cd /Users/josephjames/Projects/KGO/onYourBehlf/backend

export MONGODB_URI="mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline"
export JWT_SECRET="kerala-gifts-online-super-secure-jwt-secret-production-2024-minimum-32-chars"
export JWT_REFRESH_SECRET="kerala-gifts-online-refresh-token-secret-production-2024-minimum-32-chars"
export RAZORPAY_KEY_ID="rzp_live_RJUs4PJL0Hctlv"
export RAZORPAY_KEY_SECRET="kgZuBvXrRs1JEbEiQdzG7MeN"
export RAZORPAY_WEBHOOK_SECRET="esmeR2lda"
export PAYMENT_CURRENCY="INR"
export PORT=5001
export NODE_ENV=development
export CORS_ORIGIN="http://localhost:3000"
export FRONTEND_URL="http://localhost:3000"
export API_URL="http://localhost:5001"
export SESSION_SECRET="kerala-gifts-online-session-secret-production-2024-minimum-32-chars"
export CLOUDINARY_CLOUD_NAME="deojqbepy"
export CLOUDINARY_API_KEY="476938714454695"
export CLOUDINARY_API_SECRET="fQBjh1m4rF9ztey7u4FANZQUNhQ"

echo "Starting backend server with Razorpay integration..."
node dist/server.js
