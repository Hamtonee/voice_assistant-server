# Deployment script for the Node.js server (PowerShell)

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Make sure you're in the server directory." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci --only=production

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "⚠️  Warning: DATABASE_URL environment variable is not set" -ForegroundColor Yellow
    Write-Host "   Make sure to set it in your deployment platform" -ForegroundColor Yellow
}

# Check if JWT_SECRET is set
if (-not $env:JWT_SECRET) {
    Write-Host "⚠️  Warning: JWT_SECRET environment variable is not set" -ForegroundColor Yellow
    Write-Host "   Make sure to set it in your deployment platform" -ForegroundColor Yellow
}

# Start the application
Write-Host "🚀 Starting the server..." -ForegroundColor Green
npm start 