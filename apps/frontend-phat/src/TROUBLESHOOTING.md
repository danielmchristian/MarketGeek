# 🛠️ WashGuard Pro - Troubleshooting Guide

## Quick Fix for "Failed to fetch" Errors

The errors you're seeing indicate that the FastAPI backend is not running or not accessible. Here's how to fix it:

### 🚀 Immediate Solution

1. **Run the automatic fix script:**
   ```bash
   python fix_backend.py
   ```
   This will automatically:
   - Fix any structural issues
   - Install requirements
   - Check port availability
   - Start the backend
   - Verify it's working

2. **Or manually start the backend:**
   ```bash
   cd fastapi_backend
   python start_backend.py
   ```

3. **Or use the simple run script:**
   ```bash
   cd fastapi_backend
   python run.py dev
   ```

### 🔍 Diagnostic Steps

#### Step 1: Check if Backend is Running
```bash
# Test if the API is responding
python debug_connection.py
```

#### Step 2: Manual Health Check
```bash
# In your browser or curl
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

#### Step 3: Check Port Usage
```bash
# Windows
netstat -ano | findstr :8000

# macOS/Linux
lsof -i :8000
```

## Common Issues & Solutions

### Issue 1: "TypeError: Failed to fetch"
**Cause:** Backend not running or wrong port
**Solution:**
```bash
cd fastapi_backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Issue 2: Port 8000 in Use
**Cause:** Another service using port 8000
**Solutions:**
```bash
# Kill existing processes (Windows)
for /f "tokens=5" %a in ('netstat -aon ^| find ":8000"') do taskkill /f /pid %a

# Kill existing processes (macOS/Linux)
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn main:app --port 8001
# Then update /utils/config.ts to use port 8001
```

### Issue 3: CORS Errors
**Cause:** Frontend and backend on different domains
**Solution:** Backend already has CORS enabled for all origins in development

### Issue 4: Python Dependencies Missing
**Solution:**
```bash
cd fastapi_backend
pip install -r requirements.txt
```

### Issue 5: Wrong Directory Structure
**Cause:** Files got moved during manual editing
**Solution:**
```bash
python fix_backend.py  # Automatically fixes structure
```

## Expected Behavior

### ✅ When Backend is Connected:
- Frontend shows "System Healthy" (green indicator)
- No "Demo Mode" banner
- Real-time detection data
- All API endpoints return live data

### ❌ When Backend is Disconnected:
- Frontend shows "Demo Mode" banner
- Mock data displayed
- All features still work with sample data

## File Structure Check

Your backend should look like this:
```
fastapi_backend/
├── main.py              # ✅ Should exist
├── requirements.txt     # ✅ Should exist
├── Dockerfile          # ✅ Should be a file, not directory
├── run.py              # ✅ Should exist
├── start_backend.py    # ✅ New helper script
└── test_api.py         # ✅ Should exist
```

**❌ Do NOT have:**
- `fastapi_backend/Dockerfile/` (directory)
- React components in backend directory

## Testing the Fix

1. **Start Backend:**
   ```bash
   cd fastapi_backend
   python start_backend.py
   ```

2. **Verify Health:**
   ```bash
   curl http://localhost:8000/health
   ```

3. **Check Frontend:**
   - Refresh your React app
   - Look for "System Healthy" (not "Demo Mode")
   - Try the detection features

4. **Run Full Test:**
   ```bash
   python debug_connection.py
   ```

## Success Indicators

✅ **Backend Started Successfully:**
```
🚀 Starting WashGuard Pro API in development mode...
📝 API Documentation: http://localhost:8000/docs
INFO: Uvicorn running on http://0.0.0.0:8000
```

✅ **Frontend Connected:**
- Green "System Healthy" indicator
- No "Demo Mode" banner
- Real-time alerts and data

✅ **All Tests Pass:**
```
📊 Tests Passed: 7/7 (100.0%)
🎉 All tests passed! Your WashGuard Pro API is working perfectly.
```

## Still Having Issues?

### 1. Check Firewall/Antivirus
- Windows Defender might block localhost connections
- Allow Python/uvicorn through firewall

### 2. Try Different Port
```bash
# Backend
uvicorn main:app --port 8001

# Update frontend config
# Edit /utils/config.ts line 27:
return 'http://localhost:8001';
```

### 3. Check Browser Console
- Open DevTools → Console
- Look for detailed error messages
- Check Network tab for failed requests

### 4. Restart Everything
```bash
# Kill all Python processes
pkill -f uvicorn  # macOS/Linux
# Or restart computer (Windows)

# Start fresh
python fix_backend.py
```

## Contact Information

If you continue having issues:
1. Run `python debug_connection.py` and share the output
2. Check the browser console for error details
3. Verify the backend directory structure
4. Ensure Python 3.8+ is installed

The FastAPI backend should completely replace your Supabase implementation while maintaining all the same functionality and UI layout.