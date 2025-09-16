# WashGuard Pro - Digital Asset Compliance Platform

A comprehensive wash sales detection platform for digital assets, designed to identify fraudulent or manipulative trading activity in violation of SEC Rule 10b-5.

## Features

- **Real-time Anomaly Detection**: Statistical analysis of trading volumes and patterns
- **Wallet Clustering**: Graph-based analysis to identify related entities
- **Self-Trade Detection**: Automated detection of circular trading patterns
- **Compliance Reporting**: Generate reports for regulatory compliance
- **Interactive Dashboard**: Real-time monitoring and visualization

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **Charts**: Recharts for data visualization
- **UI Components**: Shadcn/ui component library
- **API Client**: Typed REST API client with mock data fallback

### Backend (Python FastAPI)
- **Framework**: FastAPI with Pydantic models
- **Detection Algorithms**: Statistical anomaly detection, graph analysis
- **Data Processing**: Real-time transaction analysis
- **Compliance**: SEC Rule 10b-5 violation detection

## API Endpoints

The frontend connects to a Python FastAPI backend with the following endpoints:

- `GET /health` - System health status
- `POST /ingest/trades` - Upload trade data for analysis
- `POST /detect/self-trades` - Detect self-trading patterns
- `POST /detect/cycles` - Identify wallet cycles and clusters
- `POST /detect/volume-anomaly` - Detect volume anomalies using z-scores
- `GET /reports/case/{token}` - Generate compliance reports

## Development Setup

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- FastAPI backend (see backend repository)

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The frontend automatically detects the environment:
- **Development**: Uses `http://localhost:8000` for API calls
- **Production**: Uses `https://api.washguard.pro` (configure in `/utils/config.ts`)

No environment variables needed - configuration is handled automatically.

### Demo Mode with Mock Data

The frontend includes comprehensive mock data for development and demonstration purposes. When the FastAPI backend is not available, the application automatically enters "Demo Mode" and displays realistic mock data including:

- **Live Alerts**: Simulated wash trading, volume spikes, and self-trade detections
- **System Health**: Mock system status and performance metrics  
- **Volume Anomalies**: Generated statistical anomalies with z-scores
- **Wallet Clusters**: Simulated suspicious wallet relationships
- **Interactive Charts**: Populated with realistic trading data

**Demo Mode Features:**
- 🔄 Automatic fallback when API is unreachable
- 📊 Realistic data patterns for demonstrations
- 🎯 All UI components remain fully functional
- ⚡ No setup required - works immediately

### Code Quality

Following UNC Charlotte ITSC 4155 guidelines:

- **ESLint**: Configured for React and TypeScript
- **Prettier**: Code formatting with consistent style
- **TypeScript**: Strict type checking enabled
- **Component Structure**: Modular, reusable components

Run linting and formatting:
```bash
npm run lint
npm run format
```

## Project Structure

```
/
├── components/           # React components
│   ├── ui/              # Shadcn/ui components
│   ├── AlertsPanel.tsx  # Alert management interface
│   ├── AnomalyDetection.tsx  # Statistical analysis
│   ├── DashboardOverview.tsx # Main dashboard
│   ├── TokenMonitoring.tsx   # Token-specific analysis
│   └── WalletClustering.tsx  # Graph-based clustering
├── utils/
│   └── api.ts           # Typed API client
├── styles/
│   └── globals.css      # Tailwind v4 configuration
└── App.tsx              # Main application component
```

## Features in Detail

### Anomaly Detection
- Volume spike detection using z-score analysis
- Pattern recognition for wash trading
- Statistical baseline comparison
- Confidence scoring for alerts

### Wallet Clustering
- Graph-based relationship analysis
- Entity resolution algorithms
- Risk scoring based on transaction patterns
- Network visualization of connections

### Compliance Reporting
- SEC Rule 10b-5 violation reports
- Automated case generation
- Export functionality for regulatory submission
- Audit trail maintenance

### Real-time Monitoring
- Live alert feed
- System health monitoring
- Performance metrics dashboard
- API status indicators

## Deployment

The application is designed for cloud deployment with:
- Static frontend hosting (Vercel, Netlify, etc.)
- Containerized FastAPI backend
- PostgreSQL for data persistence
- Redis for real-time features

## Security Considerations

- API rate limiting
- Input validation and sanitization  
- Secure data transmission (HTTPS)
- No PII storage in compliance with regulations

## Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Add TypeScript types for all new functionality
3. Include mock data for new API endpoints
4. Test with both real API and mock data modes
5. Update documentation for new features

## License

Proprietary - UNC Charlotte ITSC 4155 Course Project