# 🚂 Railway Environment Setup Guide

## **Critical Environment Variables to Set on Railway**

### **1. CORS Configuration**
Set these environment variables in your Railway dashboard:

```bash
# Frontend URLs that are allowed to make requests
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

### **2. How to Set Environment Variables on Railway**

1. Go to your Railway dashboard
2. Select your project
3. Go to the "Variables" tab
4. Add each variable above with its corresponding value
5. Click "Save" to apply changes
6. Redeploy your application

### **3. Verify Configuration**

After setting the variables, check your Railway logs to ensure:

```bash
# You should see these logs:
🔧 Final Cleaned Origins: ['https://semanami-ai.com', 'https://www.semanami-ai.com', 'http://localhost:3000']
✅ Allowed origin: https://semanami-ai.com
```

### **4. Test CORS**

Test that CORS is working by making a request from your frontend:

```javascript
// Test in browser console
fetch('https://bubbly-victory-production.up.railway.app/api/health')
  .then(response => response.json())
  .then(data => console.log('✅ CORS working:', data))
  .catch(error => console.error('❌ CORS error:', error));
```

## **SSL Certificate Fix**

### **Option 1: Use Railway Domain (Recommended)**
- Keep using `bubbly-victory-production.up.railway.app` as your API endpoint
- Railway provides SSL certificates automatically
- Update your frontend to use this URL

### **Option 2: Fix Custom Domain SSL**
If you want to use `api.semanami-ai.com`:

1. **DNS Configuration**: Ensure your DNS points to Railway's IP
2. **SSL Certificate**: Railway should automatically provision SSL for custom domains
3. **Domain Verification**: Verify the domain in Railway dashboard

## **Frontend Environment Variables**

Create a `.env.production` file in your client directory:

```bash
# Production Environment Variables
REACT_APP_API_BASE_URL=https://bubbly-victory-production.up.railway.app/api
REACT_APP_PYTHON_API_BASE_URL=https://bubbly-victory-production.up.railway.app
REACT_APP_ENABLE_DEBUG=false
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_APP_NAME=SemanaMi AI
REACT_APP_VERSION=1.0.0
REACT_APP_API_TIMEOUT=60000
```

## **Deployment Checklist**

- [ ] Set all Railway environment variables
- [ ] Redeploy Railway application
- [ ] Update frontend environment variables
- [ ] Rebuild and deploy frontend
- [ ] Test CORS from production frontend
- [ ] Verify all API endpoints work
- [ ] Check SSL certificates are valid

## **Troubleshooting**

### **CORS Still Not Working**
1. Check Railway logs for CORS errors
2. Verify `FRONTEND_URLS` environment variable is set correctly
3. Ensure the frontend URL exactly matches what's in the environment variable

### **SSL Certificate Issues**
1. Use Railway's default domain instead of custom domain
2. Wait for SSL certificate to provision (can take up to 24 hours)
3. Check domain DNS configuration

### **API Endpoints Not Found (404)**
1. Verify the Railway application is running
2. Check that routes are properly configured
3. Ensure the base URL includes `/api` for Node.js endpoints 