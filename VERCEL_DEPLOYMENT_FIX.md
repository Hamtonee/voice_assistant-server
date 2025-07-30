# 🚀 Vercel Deployment Fix Guide

## **Current Issue**

The frontend is still using the old API URLs even after our configuration updates:

```
🔧 Environment Configuration:
  Environment: production
  Node.js API: https://api.semanami-ai.com/api  ← Still using broken domain
  Python API: https://bubbly-victory-production.up.railway.app
```

## **Root Cause**

1. **Environment Variables Not Set**: Vercel doesn't have the correct environment variables
2. **Old Build Cache**: Vercel might be using cached build files
3. **Multiple Configuration Files**: There are conflicting API configurations

## **Solution Steps**

### **Step 1: Set Environment Variables in Vercel**

Go to your Vercel dashboard and set these environment variables:

```bash
# Remove or clear these variables if they exist:
REACT_APP_API_BASE_URL
REACT_APP_PYTHON_API_BASE_URL

# Or set them to the correct Railway URLs:
REACT_APP_API_BASE_URL=https://bubbly-victory-production.up.railway.app/api
REACT_APP_PYTHON_API_BASE_URL=https://bubbly-victory-production.up.railway.app
```

### **Step 2: Force Production URLs**

Our updated configuration now forces Railway URLs in production:

```javascript
// In client/src/config/environment.js
NODE_BASE_URL: isProduction 
  ? 'https://bubbly-victory-production.up.railway.app/api'
  : (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'),

PYTHON_BASE_URL: isProduction 
  ? 'https://bubbly-victory-production.up.railway.app'
  : (process.env.REACT_APP_PYTHON_API_BASE_URL || 'http://localhost:8000'),
```

### **Step 3: Clear Vercel Cache**

1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → General
4. Scroll down to "Build & Development Settings"
5. Click "Clear Build Cache"
6. Redeploy the project

### **Step 4: Force Redeploy**

```bash
# If you have Vercel CLI installed:
vercel --prod --force

# Or trigger a new deployment from GitHub:
# Push a small change to trigger a new build
```

## **Alternative Solution: Environment File**

Create a `.env.production` file in the client directory:

```bash
# client/.env.production
REACT_APP_API_BASE_URL=https://bubbly-victory-production.up.railway.app/api
REACT_APP_PYTHON_API_BASE_URL=https://bubbly-victory-production.up.railway.app
REACT_APP_ENABLE_DEBUG=false
REACT_APP_ENABLE_ANALYTICS=true
```

## **Verification Steps**

After deployment, check the browser console for:

```javascript
🔧 Environment Configuration:
  Environment: production
  Node.js API: https://bubbly-victory-production.up.railway.app/api  ← Should show this
  Python API: https://bubbly-victory-production.up.railway.app
```

## **Troubleshooting**

### **If URLs Still Show Old Domain:**

1. **Check Environment Variables**: Verify they're set correctly in Vercel
2. **Clear Browser Cache**: Hard refresh (Ctrl+F5) or clear browser cache
3. **Check Build Logs**: Look for any environment variable warnings
4. **Force New Build**: Make a small change and redeploy

### **If CORS Errors Persist:**

1. **Check Railway Environment**: Ensure `FRONTEND_URLS` is set correctly
2. **Verify Railway Deployment**: Check that the backend is running
3. **Test API Endpoints**: Try accessing the health endpoint directly

## **Expected Result**

After fixing:

- ✅ No more SSL certificate errors
- ✅ No more CORS policy errors  
- ✅ API calls should work properly
- ✅ Login functionality should work
- ✅ All features should be functional

## **Quick Fix Command**

If you want to force the correct URLs without environment variables, the configuration now automatically uses Railway URLs in production, so a simple redeploy should fix the issue. 