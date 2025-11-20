from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import List

from .schemas import Trade, IngestResponse, StatisticsOverview, Alert
from .storage import add_trades, get_trades, add_alerts, get_alerts
from .detection import detect_self_trades, detect_wash_sales, detect_volume_anomalies, detect_all

from .seed_data import sample_trades
from .storage import add_trades

from .analysis import analyze_token, analyze_wallet


app = FastAPI(title="WashGuard Pro API", version="0.1.0")

origins = ["http://localhost:3000", "http://localhost:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "0.2.0"
    }

@app.post("/ingest/trades", response_model=IngestResponse)
async def ingest_trades(trades: List[Trade]):
    add_trades(trades)
    return IngestResponse(ingested_count=len(trades))

@app.get("/statistics/overview", response_model=StatisticsOverview)
async def statistics_overview():
    trades = get_trades()
    tokens = {t.token for t in trades}
    wallets = {t.from_address for t in trades} | {t.to_address for t in trades}
    alerts = get_alerts()
    wash_sales = [a for a in alerts if a.type == "wash-sale"]

    return StatisticsOverview(
        total_trades=len(trades),
        suspicious_trades=len(alerts),
        wallets_monitored=len(wallets),
        tokens_monitored=len(tokens),
        wash_sales_detected=len(wash_sales),
    )

@app.post("/detect/self-trades", response_model=List[Alert])
async def api_self_trades():
    alerts = detect_self_trades(get_trades())
    add_alerts(alerts)
    return alerts

@app.post("/detect/cycles", response_model=List[Alert])
async def api_cycles():
    # cycles not implemented yet – for now, reuse wash-sale or return empty list
    return []

@app.post("/detect/volume-anomaly", response_model=List[Alert])
async def api_volume():
    alerts = detect_volume_anomalies(get_trades())
    add_alerts(alerts)
    return alerts

@app.post("/detect/all-patterns", response_model=List[Alert])
async def api_all():
    alerts = detect_all(get_trades())
    add_alerts(alerts)
    return alerts
# Load sample trades on startup
@app.on_event("startup")
async def startup_event():
    trades = sample_trades()
    add_trades(trades)
    print(f"[Startup] Loaded {len(trades)} sample trades.")
@app.get("/analysis/token/{token}")
async def api_analyze_token(token: str):
    return analyze_token(
        token,
        get_trades(),
        get_alerts()
    )

@app.get("/analysis/wallet/{address}")
async def api_analyze_wallet(address: str):
    return analyze_wallet(
        address,
        get_trades(),
        get_alerts()
    )
