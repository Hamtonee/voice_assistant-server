# Server Deployment Guide

## Problem
You're getting HTTP 429 (Too Many Requests) errors during deployment because the platform is trying to download Nix packages from GitHub, which is rate limiting the requests.

## Solution
We've created several configuration files to ensure proper deployment:

### 1. Dockerfile
- Uses Node.js 18 Alpine for a lightweight container
- Properly installs dependencies and generates Prisma client
- Includes health checks and security best practices

### 2. Railway Configuration
- `railway.toml` - Explicitly tells Railway to use Dockerfile instead of Nix
- `nixpacks.toml` - Fallback configuration if Nixpacks is still used

### 3. Environment Variables Required
Make sure to set these environment variables in your deployment platform:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Secret
JWT_SECRET=your-secret-key-here

# Frontend URLs (comma-separated)
FRONTEND_URLS=https://your-frontend-domain.com,http://localhost:3000

# Optional: TTS Service
TTS_SERVICE_URL=https://your-tts-service.com

# Optional: Google Credentials (Base64 encoded)
GOOGLE_CREDENTIALS_BASE64=your-base64-encoded-credentials
```

## Deployment Steps

### Option 1: Railway (Recommended)
1. Push your code to GitHub
2. Connect your repository to Railway
3. Set the environment variables above
4. Railway will automatically use the Dockerfile

### Option 2: Manual Docker Build
```bash
cd server
docker build -t your-app-name .
docker run -p 5000:5000 --env-file .env your-app-name
```

### Option 3: Other Platforms
- **Heroku**: Add `engines` to package.json
- **Vercel**: Use the Dockerfile
- **DigitalOcean App Platform**: Use the Dockerfile

## Troubleshooting

### If you still get Nix errors:
1. Make sure you're deploying from the `server/` directory
2. Check that `railway.toml` has `builder = "dockerfile"`
3. Ensure your deployment platform is set to use the `server/` directory as the root

### Database Connection Issues:
1. Run `npx prisma db push` to sync your schema
2. Check that `DATABASE_URL` is correctly formatted
3. Ensure your database is accessible from your deployment platform

### CORS Issues:
1. Update `FRONTEND_URLS` with your actual frontend domain
2. Make sure the URLs are comma-separated without spaces

## Health Check
Your server includes a health check endpoint at `/api/health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "tts_available": true,
  "version": "1.0.0",
  "environment": "production",
  "server": "express",
  "uptime": 123.456
}
``` 