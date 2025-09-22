# 🛡️ WashGuard Pro - FastAPI Backend Setup Guide

Complete setup instructions for the WashGuard Pro FastAPI backend that replaces the original Supabase implementation.

## 🚀 Quick Start (Recommended)

### Option 1: Using the Run Script
```bash
# Navigate to the backend directory
cd fastapi_backend

# Install dependencies
python run.py install

# Start in development mode (with auto-reload)
python run.py dev
```

### Option 2: Using Docker Compose
```bash
# Navigate to the backend directory
cd fastapi_backend

# Start all services (API + Database + Redis)
docker-compose up -d

# View logs
docker-compose logs -f washguard-api
```

## 📋 Prerequisites

- **Python 3.11+** (if running locally)
- **Docker & Docker Compose** (if using containers)
- **8000 port available** (or configure different port)

## 🔧 Detailed Setup Instructions

### 1. Frontend Configuration
Your frontend is already configured to work with this backend! The API client in `/utils/api.ts` will automatically:
- Try to connect to `http://localhost:8000` in development
- Fall back to mock data if backend is unavailable
- Display "Demo Mode" banner when using mock data

### 2. Backend Setup

#### Option A: Local Development
```bash
# 1. Navigate to backend directory
cd fastapi_backend

# 2. Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the server
python main.py
# OR
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Option B: Docker Development
```bash
# 1. Navigate to backend directory
cd fastapi_backend

# 2. Start with Docker Compose
docker-compose up --build

# 3. To run in background
docker-compose up -d

# 4. To stop
docker-compose down
```

### 3. Verify Setup
```bash
# Test the API
python test_api.py

# Or manually check health
curl http://localhost:8000/health
```

## 🌐 API Integration

### Frontend Connection
Once the backend is running, your React frontend will automatically connect. You'll see:
- ✅ **Connected**: "System Healthy" indicator (green)
- ❌ **Demo Mode**: "Demo Mode" banner with mock data

### API Endpoints
The backend provides all endpoints your frontend expects:
- `GET /health` - System status
- `POST /ingest/trades` - Ingest trading data
- `POST /detect/self-trades` - Self-trading detection
- `POST /detect/cycles` - Circular trading detection
- `POST /detect/volume-anomaly` - Volume anomaly detection
- `GET /reports/case/{token}` - Case reports

### Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📊 Real vs Mock Data

### When Backend is Running ✅
- Real-time detection algorithms
- Dynamic alert generation
- Actual processing of trade data
- Background analysis tasks

### When Backend is Unavailable ❌
- Comprehensive mock data (from `/utils/api.ts`)
- Static but realistic alerts and anomalies
- "Demo Mode" indication in UI
- All frontend features still work

## 🔍 Troubleshooting

### Backend Won't Start
```bash
# Check if port 8000 is in use
lsof -i :8000  # On Unix systems
netstat -ano | findstr 8000  # On Windows

# Kill existing process or use different port
uvicorn main:app --port 8001
```

### Frontend Can't Connect
1. **Check backend is running**: Visit http://localhost:8000/health
2. **Check frontend config**: Verify `/utils/config.ts` has correct API URL
3. **CORS issues**: Backend has CORS enabled for all origins in development

### Database Connection Issues
```bash
# For Docker setup, restart services
docker-compose down
docker-compose up --build

# For local setup, check PostgreSQL is running
# (Note: Backend works without database using in-memory storage)
```

## 📈 Testing & Validation

### Comprehensive API Testing
```bash
# Run all endpoint tests
python test_api.py

# Manual endpoint testing
curl -X POST "http://localhost:8000/detect/self-trades" \
     -H "Content-Type: application/json" \
     -d '{"token": "SHIB", "timeframe": "24h"}'
```

### Frontend Integration Testing
1. Start the backend: `python run.py dev`
2. Start your React frontend
3. Check UI shows "System Healthy" (not "Demo Mode")
4. Test detection features in the dashboard
5. Verify real-time data updates

## 🚢 Production Deployment

### Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit with production values
nano .env
```

### Production Run
```bash
# Run with production settings
python run.py prod

# Or with Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Key Production Considerations
- Set proper CORS origins in `/fastapi_backend/main.py`
- Configure database connection strings
- Set up proper logging and monitoring
- Implement authentication if required
- Use HTTPS with SSL certificates

## 🔧 Advanced Configuration

### Custom Port
```bash
# Run on different port
uvicorn main:app --port 8001

# Update frontend config in /utils/config.ts
# Change localhost:8000 to localhost:8001
```

### Development Features
- **Auto-reload**: Code changes trigger automatic restart
- **Debug logging**: Detailed request/response logging
- **Interactive docs**: Built-in API documentation
- **Error handling**: Graceful fallbacks to mock data

## 📞 Support & Next Steps

### Verify Everything Works
1. ✅ Backend starts without errors
2. ✅ Health endpoint returns 200 OK
3. ✅ Frontend connects (no "Demo Mode" banner)
4. ✅ All detection endpoints return data
5. ✅ Case reports generate successfully

### Common Next Steps
- **Add real blockchain data sources**
- **Implement authentication/authorization**
- **Connect to production databases**
- **Add custom detection algorithms**
- **Implement real-time websocket updates**

### Integration Success Indicators
- React frontend shows "System Healthy" status
- Detection tabs return real-time data
- No "Demo Mode" banner visible
- API test suite passes 100%

Your WashGuard Pro platform is now fully converted from Supabase to FastAPI while maintaining the exact UI layout, colors, and components! 🎉