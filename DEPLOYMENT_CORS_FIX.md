# CORS Configuration Fix for Python Backend

## 🏗️ Architecture Understanding

Your system has a **3-tier architecture**:

```
┌─────────────────────────┐
│   Frontend (React)      │ 
│  semanami-ai.com       │ ← User's browser
└─────────┬───────────────┘
          │
          ├─────────────────────────────────┐
          │                                 │
          ▼                                 ▼
┌─────────────────────┐           ┌─────────────────────┐
│   Node.js API       │           │   Python API        │
│ api.semanami-ai.com │           │ bubbly-victory-     │
│ (Database/Auth)     │           │ production.up.      │
│                     │           │ railway.app         │
└─────────────────────┘           │ (AI/Voice)          │
                                  └─────────────────────┘
```

**Request Flow:**
1. **Frontend → Node.js**: User messages, authentication
2. **Frontend → Python**: AI chat requests (CORS applies here!)
3. **Node.js ↔ Database**: Data persistence

## The Issue
The user input is being saved to the Node.js API successfully, but the AI response from the Python backend is failing due to two issues:

1. **CORS (Cross-Origin Resource Sharing) restrictions**
2. **Request format mismatch** - Client sending FormData, backend expecting JSON

## Root Causes
1. The Python backend needs to allow requests from the **frontend** (`semanami-ai.com`), not from the Node.js API (`api.semanami-ai.com`). The browser makes direct requests from the frontend to the Python backend.
2. The speech coaching API was sending FormData but the Python backend expects JSON matching the `SpeechCoachRequest` model.

## Solution

### Option 1: Environment Variable (Recommended for Railway)

Add the following environment variable in Railway:

```
ALLOWED_ORIGINS=https://semanami-ai.com,https://www.semanami-ai.com,http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
```

**Note**: We do NOT include `api.semanami-ai.com` because that's your Node.js backend, not your frontend. CORS is about allowing frontend origins, not backend-to-backend communication.

### Option 2: Code Update (Already Applied)

The `voice_assistant/main.py` file has been updated to include more comprehensive default origins:

```python
default_origins = [
    "https://semanami-ai.com",        # Production frontend
    "https://www.semanami-ai.com",    # Production frontend (www)
    "http://localhost:3000",          # Development frontend
    "http://127.0.0.1:3000",         # Development frontend (alternative)
    "https://localhost:3000",         # Development frontend (HTTPS)
    "https://127.0.0.1:3000",        # Development frontend (HTTPS alternative)
    "http://localhost:3001",          # Alternative development port
    "https://localhost:3001"          # Alternative development port (HTTPS)
]
```

**Key Point**: Only frontend origins are included, not `api.semanami-ai.com` which is your Node.js backend.

## Testing Tools Added

### 1. Enhanced Error Logging
- Added comprehensive error logging in `client/src/api.js`
- Enhanced error messages in `ChatDetail.js` and `SpeechCoach.js`
- Python API calls now log detailed information about requests and responses

### 2. Connection Test Utility
- Created `client/src/utils/connectionTest.js`
- Added "Test Connection" button in error UI
- Auto-runs in development to identify issues early

### 3. CORS Specific Testing
- Created `client/src/utils/corsTest.js`
- Tests CORS preflight and actual requests
- Provides specific recommendations for fixing CORS issues

## How to Debug

1. **Open browser dev tools console**
2. **Send a message** - you'll see detailed logs:
   ```
   🚀 [sendChatMessage] Starting Python API call
   📤 [sendChatMessage] Request payload
   📥 [sendChatMessage] Python API response received (if successful)
   ❌ [sendChatMessage] Python API call failed (if failed)
   ```

3. **Click "Test Connection" button** if you see a connection error
4. **Check console for CORS test results** and recommendations

## Expected Behavior After Fix

1. User sends message
2. Message saves to Node.js backend ✅ (already working)
3. Python API call succeeds ✅ (will work after CORS fix)
4. AI response displays in chat ✅ (will work after CORS fix)
5. Audio plays automatically ✅ (will work after CORS fix)

## Fixes Applied

### 1. CORS Configuration Fixed ✅
- Updated `voice_assistant/main.py` CORS origins to include only frontend domains
- Removed incorrect `api.semanami-ai.com` from Python backend CORS

### 2. Request Format Fixed ✅
- Updated `client/src/api.js` `generateSpeechCoaching()` to send JSON instead of FormData
- Now matches Python backend's `SpeechCoachRequest` model expectations

### 3. Enhanced Debugging ✅
- Added comprehensive error logging and connection testing tools
- Created "Test Connection" button for instant issue diagnosis

## Files Modified

1. `client/src/api.js` - Fixed request format + enhanced error logging
2. `client/src/components/ChatDetail.js` - Better error handling + test button  
3. `client/src/components/SpeechCoach.js` - Enhanced debugging logs
4. `client/src/utils/connectionTest.js` - Connection testing utility
5. `client/src/utils/corsTest.js` - CORS-specific testing
6. `client/src/assets/styles/ChatDetail.css` - Error UI styling
7. `voice_assistant/main.py` - Fixed CORS origins

## Next Steps

1. **Set the ALLOWED_ORIGINS environment variable in Railway**
2. **Redeploy the Python backend**
3. **Test the connection** using the new tools
4. **Verify messages get AI responses**

The Python backend is confirmed working (tested via curl), so this is purely a CORS configuration issue.
