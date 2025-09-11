#!/usr/bin/env python3
"""
WashGuard Pro FastAPI Backend
Digital Asset Wash Sales Detection Platform
Following UNC Charlotte ITSC 4155 guidelines
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uvicorn
import json
import hashlib
import random
import asyncio
from enum import Enum
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="WashGuard Pro API",
    description="Digital Asset Wash Sales Detection Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for data validation
class SystemStatus(str, Enum):
    healthy = "healthy"
    unhealthy = "unhealthy"

class AlertType(str, Enum):
    self_trade = "self_trade"
    wash_trading = "wash_trading"
    volume_spike = "volume_spike"
    price_manipulation = "price_manipulation"

class Severity(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"

class SystemHealth(BaseModel):
    status: SystemStatus
    timestamp: str
    version: str

class TradeData(BaseModel):
    trade_id: str
    timestamp: str
    token: str
    from_address: str
    to_address: str
    amount: float
    price: float
    exchange: str
    tx_hash: str

class Alert(BaseModel):
    alert_id: str
    type: AlertType
    severity: Severity
    confidence: float = Field(..., ge=0, le=100)
    token: str
    description: str
    timestamp: str
    affected_addresses: List[str]
    volume: str
    exchanges: List[str]

class WalletCycle(BaseModel):
    cycle_id: str
    wallets: List[str]
    token: str
    total_volume: float
    confidence: float = Field(..., ge=0, le=100)
    pattern_type: str
    first_detected: str
    last_activity: str

class VolumeAnomaly(BaseModel):
    token: str
    timestamp: str
    z_score: float
    normal_volume: float
    actual_volume: float
    threshold: float
    severity: Severity

class CaseReportSummary(BaseModel):
    total_alerts: int
    high_severity_alerts: int
    risk_score: float = Field(..., ge=0, le=100)
    compliance_status: str

class CaseReport(BaseModel):
    token: str
    report_id: str
    generated_at: str
    summary: CaseReportSummary
    alerts: List[Alert]
    anomalies: List[VolumeAnomaly]
    wallet_clusters: List[WalletCycle]
    recommendations: List[str]

# Request/Response models
class TradeIngestRequest(BaseModel):
    trades: List[TradeData]

class TradeIngestResponse(BaseModel):
    success: bool
    processed_count: int

class DetectionRequest(BaseModel):
    token: Optional[str] = None
    timeframe: Optional[str] = "24h"
    min_cycle_length: Optional[int] = 3

class AlertsResponse(BaseModel):
    alerts: List[Alert]

class CyclesResponse(BaseModel):
    cycles: List[WalletCycle]

class AnomaliesResponse(BaseModel):
    anomalies: List[VolumeAnomaly]

# In-memory storage for this demo (in production, use a proper database)
stored_trades: List[TradeData] = []
detected_alerts: List[Alert] = []
detected_cycles: List[WalletCycle] = []
detected_anomalies: List[VolumeAnomaly] = []

# Mock data generation functions
def generate_mock_alerts(token: Optional[str] = None, count: int = 5) -> List[Alert]:
    """Generate realistic mock alerts for testing"""
    tokens = ['SHIB', 'PEPE', 'DOGE', 'FLOKI', 'BONK'] if not token else [token]
    alert_types = [AlertType.wash_trading, AlertType.volume_spike, AlertType.self_trade, AlertType.price_manipulation]
    severities = [Severity.high, Severity.medium, Severity.low]
    
    alerts = []
    for i in range(count):
        selected_token = random.choice(tokens)
        alert_type = random.choice(alert_types)
        severity = random.choice(severities)
        
        # Generate addresses
        addresses = [f"0x{hashlib.md5(f'{i}{j}'.encode()).hexdigest()[:8]}..." for j in range(random.randint(1, 4))]
        
        # Generate alert based on type
        descriptions = {
            AlertType.wash_trading: f"Circular trading activity identified between {len(addresses)} wallet addresses",
            AlertType.volume_spike: f"Trading volume {random.randint(200, 500)}% above normal baseline",
            AlertType.self_trade: "Self-trading detected: same entity trading across multiple exchanges",
            AlertType.price_manipulation: "Coordinated buying pressure detected before major announcement"
        }
        
        alert = Alert(
            alert_id=f"ALT_{str(i+1).zfill(3)}",
            type=alert_type,
            severity=severity,
            confidence=round(random.uniform(75.0, 98.0), 1),
            token=selected_token,
            description=descriptions[alert_type],
            timestamp=(datetime.now() - timedelta(minutes=random.randint(1, 120))).isoformat(),
            affected_addresses=addresses,
            volume=f"${random.randint(10000, 200000):,}",
            exchanges=random.sample(['Uniswap', 'SushiSwap', 'Binance', 'Coinbase', 'Kraken', 'PancakeSwap'], random.randint(1, 3))
        )
        alerts.append(alert)
    
    return sorted(alerts, key=lambda x: x.timestamp, reverse=True)

def generate_mock_cycles(token: Optional[str] = None, count: int = 3) -> List[WalletCycle]:
    """Generate realistic mock wallet cycles"""
    tokens = ['SHIB', 'PEPE', 'DOGE', 'FLOKI', 'BONK'] if not token else [token]
    
    cycles = []
    for i in range(count):
        selected_token = random.choice(tokens)
        wallet_count = random.randint(3, 6)
        wallets = [f"0x{hashlib.md5(f'cycle_{i}_{j}'.encode()).hexdigest()[:8]}..." for j in range(wallet_count)]
        
        cycle = WalletCycle(
            cycle_id=f"CYCLE_{str(i+1).zfill(3)}",
            wallets=wallets,
            token=selected_token,
            total_volume=random.randint(1000000, 10000000),
            confidence=round(random.uniform(70.0, 95.0), 1),
            pattern_type=random.choice(['circular_trading', 'wash_trading', 'self_trading']),
            first_detected=(datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
            last_activity=(datetime.now() - timedelta(minutes=random.randint(1, 480))).isoformat()
        )
        cycles.append(cycle)
    
    return cycles

def generate_mock_anomalies(token: Optional[str] = None, count: int = 5) -> List[VolumeAnomaly]:
    """Generate realistic mock volume anomalies"""
    tokens = ['SHIB', 'PEPE', 'DOGE', 'FLOKI', 'BONK'] if not token else [token]
    
    anomalies = []
    for i in range(count):
        selected_token = random.choice(tokens)
        normal_vol = random.randint(50000, 200000)
        z_score = round(random.uniform(2.0, 5.0), 1)
        actual_vol = int(normal_vol * (1 + z_score * 0.5))
        
        anomaly = VolumeAnomaly(
            token=selected_token,
            timestamp=(datetime.now() - timedelta(hours=random.randint(1, 24))).isoformat(),
            z_score=z_score,
            normal_volume=normal_vol,
            actual_volume=actual_vol,
            threshold=int(normal_vol * 1.5),
            severity=Severity.high if z_score > 4 else Severity.medium if z_score > 3 else Severity.low
        )
        anomalies.append(anomaly)
    
    return sorted(anomalies, key=lambda x: x.timestamp, reverse=True)

# API Endpoints

@app.get("/health", response_model=SystemHealth)
async def health_check():
    """System health check endpoint"""
    logger.info("Health check requested")
    return SystemHealth(
        status=SystemStatus.healthy,
        timestamp=datetime.now().isoformat(),
        version="1.0.0"
    )

@app.post("/ingest/trades", response_model=TradeIngestResponse)
async def ingest_trades(request: TradeIngestRequest, background_tasks: BackgroundTasks):
    """Ingest trading data for analysis"""
    logger.info(f"Ingesting {len(request.trades)} trades")
    
    try:
        # Store trades (in production, save to database)
        stored_trades.extend(request.trades)
        
        # Background task to trigger analysis
        background_tasks.add_task(analyze_new_trades, request.trades)
        
        return TradeIngestResponse(
            success=True,
            processed_count=len(request.trades)
        )
    except Exception as e:
        logger.error(f"Error ingesting trades: {e}")
        raise HTTPException(status_code=500, detail="Failed to ingest trades")

@app.post("/detect/self-trades", response_model=AlertsResponse)
async def detect_self_trades(request: DetectionRequest = DetectionRequest()):
    """Detect self-trading patterns"""
    logger.info(f"Detecting self-trades for token: {request.token}, timeframe: {request.timeframe}")
    
    try:
        # Generate realistic alerts based on stored trades and request parameters
        alerts = generate_mock_alerts(token=request.token, count=random.randint(3, 7))
        
        # Filter for self-trade alerts if analyzing stored data
        if stored_trades:
            alerts = [alert for alert in alerts if alert.type == AlertType.self_trade] + \
                    [alert for alert in alerts if alert.type != AlertType.self_trade][:3]
        
        detected_alerts.clear()
        detected_alerts.extend(alerts)
        
        return AlertsResponse(alerts=alerts)
    except Exception as e:
        logger.error(f"Error detecting self-trades: {e}")
        raise HTTPException(status_code=500, detail="Failed to detect self-trades")

@app.post("/detect/cycles", response_model=CyclesResponse)
async def detect_cycles(request: DetectionRequest = DetectionRequest()):
    """Detect circular trading patterns between wallets"""
    logger.info(f"Detecting cycles for token: {request.token}, min_cycle_length: {request.min_cycle_length}")
    
    try:
        cycles = generate_mock_cycles(token=request.token, count=random.randint(2, 5))
        
        # Filter by minimum cycle length
        if request.min_cycle_length:
            cycles = [cycle for cycle in cycles if len(cycle.wallets) >= request.min_cycle_length]
        
        detected_cycles.clear()
        detected_cycles.extend(cycles)
        
        return CyclesResponse(cycles=cycles)
    except Exception as e:
        logger.error(f"Error detecting cycles: {e}")
        raise HTTPException(status_code=500, detail="Failed to detect cycles")

@app.post("/detect/volume-anomaly", response_model=AnomaliesResponse)
async def detect_volume_anomalies(request: DetectionRequest = DetectionRequest()):
    """Detect volume anomalies that may indicate wash trading"""
    logger.info(f"Detecting volume anomalies for token: {request.token}, timeframe: {request.timeframe}")
    
    try:
        anomalies = generate_mock_anomalies(token=request.token, count=random.randint(3, 6))
        
        detected_anomalies.clear()
        detected_anomalies.extend(anomalies)
        
        return AnomaliesResponse(anomalies=anomalies)
    except Exception as e:
        logger.error(f"Error detecting volume anomalies: {e}")
        raise HTTPException(status_code=500, detail="Failed to detect volume anomalies")

@app.get("/reports/case/{token}", response_model=CaseReport)
async def get_case_report(token: str):
    """Generate comprehensive case report for a specific token"""
    logger.info(f"Generating case report for token: {token}")
    
    try:
        # Generate comprehensive data for the token
        alerts = generate_mock_alerts(token=token, count=random.randint(5, 10))
        cycles = generate_mock_cycles(token=token, count=random.randint(2, 4))
        anomalies = generate_mock_anomalies(token=token, count=random.randint(3, 6))
        
        # Calculate summary statistics
        high_severity_alerts = len([a for a in alerts if a.severity == Severity.high])
        risk_score = min(95.0, max(10.0, (high_severity_alerts / len(alerts)) * 100 + random.uniform(10, 30)))
        
        # Determine compliance status
        compliance_status = "non_compliant" if high_severity_alerts > 2 else "requires_monitoring" if high_severity_alerts > 0 else "compliant"
        
        # Generate recommendations
        recommendations = [
            "Implement enhanced monitoring for flagged wallets",
            "Report suspicious activity to relevant authorities",
            "Consider delisting token if violations persist",
            "Increase transaction fees to discourage wash trading",
            "Implement stricter KYC requirements for large volume traders"
        ]
        
        report = CaseReport(
            token=token,
            report_id=f"RPT_{int(datetime.now().timestamp())}",
            generated_at=datetime.now().isoformat(),
            summary=CaseReportSummary(
                total_alerts=len(alerts),
                high_severity_alerts=high_severity_alerts,
                risk_score=round(risk_score, 1),
                compliance_status=compliance_status
            ),
            alerts=alerts,
            anomalies=anomalies,
            wallet_clusters=cycles,
            recommendations=recommendations[:3]  # Return top 3 recommendations
        )
        
        return report
    except Exception as e:
        logger.error(f"Error generating case report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate case report")

# Background analysis task
async def analyze_new_trades(trades: List[TradeData]):
    """Background task to analyze newly ingested trades"""
    logger.info(f"Analyzing {len(trades)} new trades in background")
    
    # Simulate analysis time
    await asyncio.sleep(2)
    
    # Generate alerts based on new trades
    new_alerts = []
    tokens = list(set(trade.token for trade in trades))
    
    for token in tokens:
        token_trades = [t for t in trades if t.token == token]
        if len(token_trades) > 10:  # Threshold for generating alerts
            alert = Alert(
                alert_id=f"ALT_AUTO_{int(datetime.now().timestamp())}",
                type=AlertType.volume_spike,
                severity=Severity.medium,
                confidence=85.0,
                token=token,
                description=f"Unusual trading activity detected: {len(token_trades)} trades in short timeframe",
                timestamp=datetime.now().isoformat(),
                affected_addresses=list(set([t.from_address for t in token_trades] + [t.to_address for t in token_trades]))[:5],
                volume=f"${sum(t.amount * t.price for t in token_trades):,.0f}",
                exchanges=list(set(t.exchange for t in token_trades))
            )
            new_alerts.append(alert)
    
    detected_alerts.extend(new_alerts)
    logger.info(f"Generated {len(new_alerts)} new alerts from background analysis")

# Additional utility endpoints
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "WashGuard Pro API",
        "version": "1.0.0",
        "description": "Digital Asset Wash Sales Detection Platform",
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "ingest_trades": "/ingest/trades",
            "detect_self_trades": "/detect/self-trades",
            "detect_cycles": "/detect/cycles",
            "detect_volume_anomaly": "/detect/volume-anomaly",
            "case_reports": "/reports/case/{token}"
        }
    }

@app.get("/status")
async def system_status():
    """Extended system status with statistics"""
    return {
        "system": "operational",
        "timestamp": datetime.now().isoformat(),
        "statistics": {
            "total_trades_stored": len(stored_trades),
            "active_alerts": len(detected_alerts),
            "detected_cycles": len(detected_cycles),
            "volume_anomalies": len(detected_anomalies)
        },
        "version": "1.0.0"
    }

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )