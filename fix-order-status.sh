#!/bin/bash

echo "🔧 Fixing Order Status Inconsistencies..."
echo "This script will fix the critical issue where orders show 'payment_done' but 'pending' payment status"
echo ""

# Set environment variables
export MONGODB_URI="mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline"

# Run the migration script
cd backend
node scripts/fix-order-status.js

echo ""
echo "✅ Order status fix completed!"
echo "Please restart your backend server to apply the changes."
