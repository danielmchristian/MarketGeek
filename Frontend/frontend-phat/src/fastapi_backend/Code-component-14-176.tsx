# WashGuard Pro FastAPI Backend Environment Configuration

# Application Settings
ENV=development
LOG_LEVEL=info
API_VERSION=1.0.0

# Server Configuration
HOST=0.0.0.0
PORT=8000
WORKERS=4

# Database Configuration (Optional - using in-memory for demo)
DATABASE_URL=postgresql://washguard:washguard123@localhost:5432/washguard

# Redis Configuration (Optional - for caching)
REDIS_URL=redis://localhost:6379/0

# Security (Implement in production)
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here

# External APIs (If needed)
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-project-id
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/your-project-id

# Monitoring & Alerting (Optional)
SENTRY_DSN=your-sentry-dsn-here
DATADOG_API_KEY=your-datadog-key-here

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-frontend-domain.com