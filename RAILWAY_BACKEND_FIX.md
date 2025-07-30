# 🚂 Railway Backend Fix Guide

## **Current Issues**

1. **CORS Policy Error**: Railway backend not allowing requests from `https://semanami-ai.com`
2. **404 Not Found**: Health endpoints returning 404 errors
3. **Lottie Loading Loop**: Frontend stuck in loading because backend is unreachable

## **Root Cause Analysis**

The Railway backend is not properly configured to:
- Allow CORS requests from the frontend domain
- Serve the correct health endpoints
- Handle preflight OPTIONS requests

## **Solution Steps**

### **Step 1: Set Railway Environment Variables**

Go to your Railway dashboard and set these critical environment variables:

```bash
# CORS Configuration - CRITICAL
FRONTEND_URLS=https://semanami-ai.com,https://www.semanami-ai.com,http://localhost:3000

# Node.js Environment
NODE_ENV=production

# Database Configuration
DATABASE_URL=your_postgresql_database_url_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# Email Configuration (if using SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_USER=your_sendgrid_username
SENDGRID_HOST=smtp.sendgrid.net
SENDGRID_PORT=587
FROM_EMAIL=noreply@semanami-ai.com

# AI API Keys
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# Google Cloud Configuration (for TTS)
GOOGLE_CREDENTIALS_BASE64=your_base64_encoded_google_credentials
```

### **Step 2: Verify Railway Deployment**

1. **Check Railway Logs**: Go to Railway dashboard → Deployments → Latest deployment → Logs
2. **Look for these messages**:
   ```
   🔧 Final Cleaned Origins: ['https://semanami-ai.com', 'https://www.semanami-ai.com', 'http://localhost:3000']
   ✅ Allowed origin: https://semanami-ai.com
   Registering route: /api/health (app.get)
   Registering route: /health (app.get)
   ```

3. **If you see CORS errors**, the environment variables are not set correctly

### **Step 3: Test Railway Backend Directly**

Test the Railway backend endpoints directly:

```bash
# Test health endpoint
curl -X GET https://bubbly-victory-production.up.railway.app/health

# Test API health endpoint
curl -X GET https://bubbly-victory-production.up.railway.app/api/health

# Test CORS preflight
curl -X OPTIONS https://bubbly-victory-production.up.railway.app/api/health \
  -H "Origin: https://semanami-ai.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type"
```

### **Step 4: Redeploy Railway Application**

1. **Force Redeploy**: Go to Railway dashboard → Deployments → "Redeploy"
2. **Check Build Logs**: Ensure the application builds successfully
3. **Verify Environment Variables**: Make sure all variables are loaded

### **Step 5: Test Frontend Connection**

After fixing the backend, test the frontend:

1. **Clear Browser Cache**: Hard refresh (Ctrl+F5)
2. **Check Console**: Look for successful API calls
3. **Test Login**: Try logging in to verify the connection works

## **Expected Results**

After fixing:

### **Railway Logs Should Show**:
```
🔧 Final Cleaned Origins: ['https://semanami-ai.com', 'https://www.semanami-ai.com', 'http://localhost:3000']
✅ Allowed origin: https://semanami-ai.com
Registering route: /api/health (app.get)
Registering route: /health (app.get)
🟢 API up and running!
```

### **Frontend Console Should Show**:
```
🔧 Environment Configuration:
  Environment: production
  Node.js API: https://bubbly-victory-production.up.railway.app/api
  Python API: https://bubbly-victory-production.up.railway.app
✅ Using Railway domain - SSL should work correctly.
```

### **No More Errors**:
- ❌ No CORS policy errors
- ❌ No 404 Not Found errors
- ❌ No SSL certificate errors
- ✅ Login should work
- ✅ All features should be functional

## **Troubleshooting**

### **If CORS Still Fails**:

1. **Check Environment Variables**: Verify `FRONTEND_URLS` is set correctly
2. **Check Railway Logs**: Look for CORS-related errors
3. **Test Direct Access**: Try accessing the Railway URL directly
4. **Redeploy**: Force a new deployment

### **If Health Endpoints Return 404**:

1. **Check Route Registration**: Look for route registration messages in logs
2. **Verify Server Startup**: Ensure the server starts without errors
3. **Check Port Configuration**: Make sure the server is listening on the correct port

### **If Frontend Still Shows Loading**:

1. **Clear Browser Cache**: Hard refresh the page
2. **Check Network Tab**: Look for failed API requests
3. **Test API Endpoints**: Try accessing them directly in browser

## **Quick Fix Commands**

```bash
# Test Railway backend health
curl https://bubbly-victory-production.up.railway.app/health

# Test CORS
curl -X OPTIONS https://bubbly-victory-production.up.railway.app/api/health \
  -H "Origin: https://semanami-ai.com" \
  -v
```

The main issue is likely that the Railway environment variables are not set correctly, causing the CORS configuration to fail. 