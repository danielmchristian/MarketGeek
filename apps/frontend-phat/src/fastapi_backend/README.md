# WashGuard Pro FastAPI Backend

Digital Asset Wash Sales Detection Platform backend built with FastAPI, designed to detect fraudulent trading patterns and compliance violations.

## Features

- **Real-time Detection**: Self-trading, circular trading, and volume anomaly detection
- **Compliance Monitoring**: SEC Rule 10b-5 violation detection
- **Graph Analytics**: Wallet clustering and relationship mapping
- **Automated Reporting**: Comprehensive case reports for regulatory compliance
- **RESTful API**: Full REST API with OpenAPI documentation

## API Endpoints

### Core Detection Endpoints
- `GET /health` - System health check
- `POST /ingest/trades` - Ingest trading data for analysis
- `POST /detect/self-trades` - Detect self-trading patterns
- `POST /detect/cycles` - Detect circular trading patterns
- `POST /detect/volume-anomaly` - Detect volume anomalies
- `GET /reports/case/{token}` - Generate comprehensive case reports

### Documentation
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

## Quick Start

### Option 1: Docker Compose (Recommended)
```bash
# Clone and navigate to backend directory
cd fastapi_backend

# Start all services (API, Redis, PostgreSQL)
docker-compose up -d

# View logs
docker-compose logs -f washguard-api
```

### Option 2: Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Usage Examples

### Health Check
```bash
curl http://localhost:8000/health
```

### Ingest Trade Data
```bash
curl -X POST "http://localhost:8000/ingest/trades" \
     -H "Content-Type: application/json" \
     -d '{
       "trades": [
         {
           "trade_id": "TXN_001",
           "timestamp": "2024-01-15T10:30:00Z",
           "token": "SHIB",
           "from_address": "0x1a2b3c4d...",
           "to_address": "0x5e6f7890...",
           "amount": 1000000,
           "price": 0.00001,
           "exchange": "Uniswap",
           "tx_hash": "0xabc123..."
         }
       ]
     }'
```

### Detect Self-Trades
```bash
curl -X POST "http://localhost:8000/detect/self-trades" \
     -H "Content-Type: application/json" \
     -d '{
       "token": "SHIB",
       "timeframe": "24h"
     }'
```

### Generate Case Report
```bash
curl "http://localhost:8000/reports/case/SHIB"
```

## Configuration

### Environment Variables
- `ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging level (debug/info/warning/error)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

### Frontend Integration
The backend is designed to work with the React frontend. Make sure your frontend's API configuration points to:
- Development: `http://localhost:8000`
- Production: Your deployed backend URL

## Data Models

### Alert Types
- `self_trade`: Self-trading detection
- `wash_trading`: Circular trading patterns
- `volume_spike`: Unusual volume increases
- `price_manipulation`: Coordinated price manipulation

### Severity Levels
- `high`: Immediate attention required
- `medium`: Monitor closely
- `low`: Informational

## Compliance Features

- **SEC Rule 10b-5 Compliance**: Detects patterns that violate securities regulations
- **Audit Trail**: Complete transaction and detection logging
- **Regulatory Reporting**: Structured reports for compliance teams
- **Risk Scoring**: Automated risk assessment for tokens and wallets

## Development

### Project Structure
```
fastapi_backend/
├── main.py              # Main FastAPI application
├── requirements.txt     # Python dependencies
├── Dockerfile          # Container configuration
├── docker-compose.yml  # Multi-service setup
└── README.md           # This file
```

### Adding New Detection Algorithms
1. Create detection function in `main.py`
2. Add corresponding endpoint
3. Update response models
4. Test with frontend integration

### Testing
```bash
# Run the server in development mode
uvicorn main:app --reload

# Test all endpoints
curl http://localhost:8000/docs  # Interactive testing
```

## Monitoring & Logging

- Health checks at `/health` and `/status`
- Structured logging for all operations
- Performance metrics for detection algorithms
- Background task monitoring

## Security Considerations

- CORS configured for frontend integration
- Input validation with Pydantic models
- Rate limiting (implement in production)
- Authentication (implement for production use)

## Production Deployment

1. Set environment variables
2. Configure database connections
3. Set up SSL/TLS certificates
4. Configure reverse proxy (nginx)
5. Set up monitoring and alerting

## Support

For issues related to:
- Frontend integration: Check `/utils/api.ts` configuration
- Backend errors: Check logs with `docker-compose logs`
- API documentation: Visit `/docs` endpoint