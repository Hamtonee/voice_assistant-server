# Backend API Endpoints Analysis

## 🔍 **Current Issue:**
`GET https://api.semanami-ai.com/api/sessions 404 (Not Found)`

The frontend is successfully built and running, but the backend API endpoints are missing or incorrectly configured.

---

## 📋 **Required API Endpoints Analysis:**

### **1. Session Management Endpoints (chatApi.js)**
**Base URL**: `https://api.semanami-ai.com/api`

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| `GET` | `/sessions` | Fetch all user sessions | ❌ **404 - Missing** |
| `POST` | `/sessions` | Create new session | ❌ **404 - Missing** |
| `GET` | `/reading/sessions` | Fetch reading sessions | ❌ **404 - Missing** |
| `GET` | `/reading/sessions/:id` | Fetch specific reading session | ❌ **404 - Missing** |
| `POST` | `/reading/sessions` | Create reading session | ❌ **404 - Missing** |
| `POST` | `/reading/generate-topic` | Generate reading topic | ❌ **404 - Missing** |

### **2. Chat Message Endpoints (chatMessageApi.js)**
**Base URL**: `https://api.semanami-ai.com/api`

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| `POST` | `/api/chat/message` | Send chat message | ❌ **404 - Missing** |
| `POST` | `/api/chat/generate-title` | Generate chat title | ❌ **404 - Missing** |
| `PUT` | `/api/chat/:id/title` | Rename chat | ❌ **404 - Missing** |
| `PUT` | `/api/chat/:id` | Update chat instance | ❌ **404 - Missing** |

### **3. Authentication Endpoints (authApi.js)**
**Base URL**: `https://api.semanami-ai.com/api`

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| `POST` | `/api/auth/forgot-password` | Send forgot password email | ❌ **404 - Missing** |
| `POST` | `/api/auth/reset-password` | Reset password with token | ❌ **404 - Missing** |

### **4. Speech & TTS Endpoints (speechApi.js)**
**Base URL**: `https://bubbly-victory-production.up.railway.app`

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| `POST` | `/api/speech/coaching` | Generate speech coaching | ❌ **404 - Missing** |
| `POST` | `/api/tts/generate` | Generate TTS audio | ❌ **404 - Missing** |
| `GET` | `/api/health` | Check Python backend health | ❌ **404 - Missing** |

### **5. Health Check Endpoints (healthApi.js)**
**Base URL**: `https://api.semanami-ai.com/api`

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| `GET` | `/api/health` | Check Node.js backend health | ❌ **404 - Missing** |

---

## 🚨 **Critical Issues Identified:**

### **1. Double `/api` Path Issue**
Some endpoints have double `/api` in the path:
- `chatMessageApi.js` uses `/api/chat/message` 
- `authApi.js` uses `/api/auth/forgot-password`
- But `chatApi.js` uses `/sessions` (single level)

**Problem**: Inconsistent API path structure causing 404 errors.

### **2. Missing Backend Implementation**
All required endpoints are returning 404, indicating:
- Backend server is running but endpoints are not implemented
- Or backend server is not running at all
- Or incorrect base URL configuration

### **3. Authentication Issues**
The frontend expects JWT token authentication but endpoints may not be properly configured.

---

## 🔧 **Immediate Fixes Required:**

### **Fix 1: Standardize API Paths**
Update all API endpoints to use consistent path structure:

**Option A: Single `/api` level**
```javascript
// chatApi.js
const response = await chatApi.get('/api/sessions');
const response = await chatApi.post('/api/sessions', data);

// chatMessageApi.js  
const response = await chatMessageApi.post('/api/chat/message', data);
const response = await chatMessageApi.put(`/api/chat/${sessionId}`, data);

// authApi.js
const response = await authApi.post('/api/auth/forgot-password', data);
```

**Option B: Remove `/api` from individual endpoints**
```javascript
// chatMessageApi.js
const response = await chatMessageApi.post('/chat/message', data);
const response = await chatMessageApi.put(`/chat/${sessionId}`, data);

// authApi.js
const response = await authApi.post('/auth/forgot-password', data);
```

### **Fix 2: Backend Implementation**
Implement these endpoints on your Node.js backend:

```javascript
// Required Express.js routes
app.get('/api/sessions', authMiddleware, getSessions);
app.post('/api/sessions', authMiddleware, createSession);
app.get('/api/reading/sessions', authMiddleware, getReadingSessions);
app.get('/api/reading/sessions/:id', authMiddleware, getReadingSession);
app.post('/api/reading/sessions', authMiddleware, createReadingSession);
app.post('/api/reading/generate-topic', authMiddleware, generateReadingTopic);
app.post('/api/chat/message', authMiddleware, sendChatMessage);
app.post('/api/chat/generate-title', authMiddleware, generateChatTitle);
app.put('/api/chat/:id/title', authMiddleware, renameChat);
app.put('/api/chat/:id', authMiddleware, updateChatInstance);
app.post('/api/auth/forgot-password', sendForgotPassword);
app.post('/api/auth/reset-password', resetPassword);
app.get('/api/health', healthCheck);
```

### **Fix 3: Environment Configuration**
Verify your backend is running at the correct URL:
- **Production**: `https://api.semanami-ai.com`
- **Development**: `http://localhost:5000`

---

## 🎯 **Recommended Action Plan:**

### **Phase 1: Immediate Fix (5 minutes)**
1. **Standardize API paths** in frontend code
2. **Test with a simple endpoint** to verify connectivity

### **Phase 2: Backend Implementation (30-60 minutes)**
1. **Implement missing endpoints** on your Node.js backend
2. **Add proper authentication middleware**
3. **Add error handling and validation**

### **Phase 3: Testing & Validation (15 minutes)**
1. **Test all endpoints** with Postman or similar tool
2. **Verify frontend integration**
3. **Check authentication flow**

---

## 📊 **Priority Order:**

1. **HIGH**: `/api/sessions` (GET) - Core functionality
2. **HIGH**: `/api/sessions` (POST) - Core functionality  
3. **MEDIUM**: `/api/chat/message` - Chat functionality
4. **MEDIUM**: `/api/auth/*` - Authentication
5. **LOW**: `/api/reading/*` - Reading features
6. **LOW**: `/api/health` - Health checks

---

## 🔍 **Next Steps:**

1. **Check if your backend server is running**
2. **Verify the correct base URL** in your backend configuration
3. **Implement the missing endpoints** starting with `/api/sessions`
4. **Test the endpoints** before deploying

Would you like me to help you:
1. **Standardize the API paths** in the frontend code?
2. **Create a sample backend implementation** for the missing endpoints?
3. **Test the current backend connectivity**?





