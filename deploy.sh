#!/bin/bash

# Deployment script for the Node.js server

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the server directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  Warning: DATABASE_URL environment variable is not set"
    echo "   Make sure to set it in your deployment platform"
fi

# Check if JWT_SECRET is set
if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  Warning: JWT_SECRET environment variable is not set"
    echo "   Make sure to set it in your deployment platform"
fi

# Start the application
echo "🚀 Starting the server..."
npm start 