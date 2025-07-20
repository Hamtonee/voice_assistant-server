# 🚀 Complete Railway Setup Guide

## **📋 Environment Variables Configuration**

### **Step 1: Access Railway Dashboard**
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your Node.js backend project
3. Go to **Variables** tab
4. Add all the variables below

### **Step 2: Complete Environment Variables**

```bash
# ============================================================================
# EXISTING VARIABLES (Keep these - DO NOT DELETE)
# ============================================================================
FRONTEND_URLS="https://semanami-ai.com,https://www.semanami-ai.com"
DATABASE_URL="postgresql://neondb_owner:npg_ktlr6YBh2WUS@ep-weathered-bread-a2vdbrti-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="5mNJ2xNYLv6aIAK"
JWT_REFRESH_SECRET="oBSiISee8rvEG8a"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT="5000"

# ============================================================================
# NEW VARIABLES TO ADD (Add these)
# ============================================================================
NODE_ENV="production"
VERSION="12.0.0"

# Base API Configuration
API_BASE_URL="https://api.semanami-ai.com/api"
API_VERSION="v1"

# CORS Configuration
CORS_ORIGINS="https://semanami-ai.com,https://www.semanami-ai.com,http://localhost:3000"
CUSTOM_DOMAIN="api.semanami-ai.com"

# Authentication Endpoints
AUTH_REGISTER_ENDPOINT="/auth/register"
AUTH_LOGIN_ENDPOINT="/auth/login"
AUTH_REFRESH_ENDPOINT="/auth/refresh"
AUTH_ME_ENDPOINT="/auth/me"
AUTH_LOGOUT_ENDPOINT="/auth/logout"

# Chat Management Endpoints
CHATS_ENDPOINT="/chats"
CHAT_DETAIL_ENDPOINT="/chats/{chat_id}"
CHAT_MESSAGES_ENDPOINT="/chats/{chat_id}/messages"

# Health Check Endpoint
HEALTH_CHECK_ENDPOINT="/health"
```

## **🔧 Backend Configuration**

### **Step 3: Verify Backend Code**
The backend has been updated to use these environment variables:

- ✅ **apiConfig.js**: Centralized configuration management
- ✅ **index.js**: Updated to use environment variables
- ✅ **CORS**: Properly configured for production
- ✅ **Health Check**: Enhanced with configuration details

### **Step 4: Expected Log Output**
After deployment, you should see:

```
🔧 API Configuration: {
  baseUrl: 'https://api.semanami-ai.com/api',
  version: 'v1',
  customDomain: 'api.semanami-ai.com',
  environment: 'production',
  corsOrigins: ['https://semanami-ai.com', 'https://www.semanami-ai.com', 'http://localhost:3000'],
  databaseConnected: true
}
🔧 CORS Origins: ['https://semanami-ai.com', 'https://www.semanami-ai.com', 'http://localhost:3000']
🚀 Server listening on port 5000
🔗 Environment: production
🔗 Custom Domain: api.semanami-ai.com
🔗 API Base URL: https://api.semanami-ai.com/api
🔗 API Version: v1
🔗 CORS Origins: https://semanami-ai.com, https://www.semanami-ai.com, http://localhost:3000
🔗 Database: Connected
🔗 JWT: Configured
🔧 CORS: Configured with environment variables
```

## **🌐 API Endpoints**

### **Authentication Endpoints**
```
POST https://api.semanami-ai.com/api/auth/register
POST https://api.semanami-ai.com/api/auth/login
POST https://api.semanami-ai.com/api/auth/refresh
GET  https://api.semanami-ai.com/api/auth/me
POST https://api.semanami-ai.com/api/auth/logout
```

### **Chat Management Endpoints**
```
GET    https://api.semanami-ai.com/api/chats
POST   https://api.semanami-ai.com/api/chats
GET    https://api.semanami-ai.com/api/chats/{chat_id}
POST   https://api.semanami-ai.com/api/chats/{chat_id}/messages
PUT    https://api.semanami-ai.com/api/chats/{chat_id}
DELETE https://api.semanami-ai.com/api/chats/{chat_id}
```

### **Health & Monitoring**
```
GET https://api.semanami-ai.com/api/health
GET https://api.semanami-ai.com/
```

## **✅ Verification Steps**

### **Step 5: Test Health Endpoint**
```bash
curl https://api.semanami-ai.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "tts_available": false,
  "version": "12.0.0",
  "environment": "production",
  "server": "express",
  "uptime": 123.456,
  "custom_domain": "api.semanami-ai.com",
  "api_base_url": "https://api.semanami-ai.com/api",
  "cors_origins": ["https://semanami-ai.com", "https://www.semanami-ai.com", "http://localhost:3000"],
  "database_connected": true,
  "jwt_configured": true
}
```

### **Step 6: Test Authentication**
Try logging in through your frontend at `https://semanami-ai.com`

### **Step 7: Check Railway Logs**
Monitor the Railway logs for any errors or issues.

## **🚨 Troubleshooting**

### **Common Issues:**

1. **500 Internal Server Error**
   - ✅ Check if all environment variables are set
   - ✅ Verify `DATABASE_URL` is correct
   - ✅ Ensure `JWT_SECRET` is set
   - ✅ Check Railway logs for specific errors

2. **CORS Errors**
   - ✅ Ensure `CORS_ORIGINS` includes your frontend domain
   - ✅ Verify frontend is using correct API URL
   - ✅ Check if domain is properly configured

3. **Authentication Failures**
   - ✅ Verify JWT secrets are set correctly
   - ✅ Check database connection
   - ✅ Ensure user exists in database

4. **DNS Issues**
   - ✅ Verify `api.semanami-ai.com` points to Railway
   - ✅ Check DNS propagation (can take up to 24 hours)

### **Debug Commands:**
```bash
# Check DNS resolution
nslookup api.semanami-ai.com

# Test health endpoint
curl -I https://api.semanami-ai.com/api/health

# Test with verbose output
curl -v https://api.semanami-ai.com/api/health
```

## **🔒 Security Notes**

- ✅ All secrets stored securely in Railway
- ✅ CORS properly configured for production
- ✅ JWT tokens have appropriate expiration times
- ✅ Database connection uses SSL
- ✅ Environment variables not exposed to frontend
- ✅ Custom domain properly configured

## **📈 Next Steps**

After successful setup:

1. **Monitor Performance**: Watch Railway metrics
2. **Set Up Alerts**: Configure monitoring alerts
3. **Backup Strategy**: Ensure database backups
4. **SSL Certificate**: Verify SSL is working
5. **Load Testing**: Test under load if needed

## **🎯 Success Criteria**

Your setup is successful when:

- ✅ Health endpoint returns 200 OK
- ✅ Frontend can authenticate users
- ✅ Chat functionality works
- ✅ No CORS errors in browser console
- ✅ All environment variables are recognized
- ✅ Database connection is stable
- ✅ Custom domain resolves correctly

**🚀 Your API is now production-ready!** 