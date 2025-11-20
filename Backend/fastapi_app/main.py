# Backend/fastapi_app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import List
from collections import defaultdict
from .schemas import (
    TradeIn, IngestRequest, IngestResponse,
    Alert, StatisticsOverview, TokenSummary,
    VolumePoint, VolumeSeries,
)
from .storage import add_trades, get_trades, add_alerts, get_alerts, reset_all
from .detection import (
    detect_self_trades, detect_wash_trading,
    detect_volume_spikes, detect_cycles, detect_all
)


from .db import SessionLocal
from sqlalchemy.orm import Session
from fastapi import Depends

app = FastAPI(title="Wash Sales Detection API", version="0.1.0")

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]

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
        "version": "0.1.0",
    }

@app.post("/reset")
async def reset():
    reset_all()
    return {"status": "reset"}

@app.post("/ingest/trades", response_model=IngestResponse)
async def ingest_trades(req: IngestRequest):
    add_trades(req.trades)
    return IngestResponse(
        success=True,
        processed_count=len(req.trades),
    )


@app.get("/statistics/overview", response_model=StatisticsOverview)
async def statistics_overview():
    trades = get_trades()
    alerts = get_alerts()
    tokens = {t.token for t in trades}
    wallets = {t.from_address for t in trades} | {t.to_address for t in trades}
    wash_sales = [a for a in alerts if a.type == "wash_trading"]

    return StatisticsOverview(
        total_trades=len(trades),
        suspicious_trades=len(alerts),
        wallets_monitored=len(wallets),
        tokens_monitored=len(tokens),
        wash_sales_detected=len(wash_sales),
    )
@app.get("/statistics/volume-series", response_model=VolumeSeries)
async def statistics_volume_series(bucket_minutes: int = 5):
    """
    Aggregate trades into time buckets for the dashboard volume chart.
    bucket_minutes = 5 by default (5-minute buckets).
    """
    trades = get_trades()
    alerts = get_alerts()

    if not trades:
        return VolumeSeries(points=[])

    def bucket_time(dt: datetime) -> datetime:
        # round down to nearest bucket
        minute_bucket = (dt.minute // bucket_minutes) * bucket_minutes
        return dt.replace(minute=minute_bucket, second=0, microsecond=0)

    trade_buckets: dict[datetime, dict] = defaultdict(
        lambda: {"trade_count": 0, "total_volume": 0.0}
    )

    for t in trades:
        ts = bucket_time(t.timestamp)
        v = float(t.amount) * float(t.price)
        trade_buckets[ts]["trade_count"] += 1
        trade_buckets[ts]["total_volume"] += v

    alert_buckets: dict[datetime, int] = defaultdict(int)
    for a in alerts:
        ts = bucket_time(a.timestamp)
        alert_buckets[ts] += 1

    points: list[VolumePoint] = []
    for ts, data in sorted(trade_buckets.items()):
        points.append(
            VolumePoint(
                bucket=ts,
                trade_count=data["trade_count"],
                total_volume=data["total_volume"],
                alert_count=alert_buckets.get(ts, 0),
            )
        )

    return VolumeSeries(points=points)



def _pretty_token_name(symbol: str) -> str:
    # Turn BTCUSDT -> BTC/USDT for display
    s = symbol.upper()
    if s.endswith("USDT") and len(s) > 4:
        base = s[:-4]
        return f"{base}/USDT"
    return s
@app.get("/tokens/summary", response_model=List[TokenSummary])
async def tokens_summary():
    trades = get_trades()
    alerts = get_alerts()

    now = datetime.utcnow()
    since = now - timedelta(hours=24)

    # group trades per token
    per_token_trades = defaultdict(list)
    for t in trades:
        try:
            ts = datetime.fromisoformat(t.timestamp.replace("Z", "+00:00"))
        except Exception:
            continue
        if ts >= since:
            per_token_trades[t.token].append((ts, t))

    # group alerts per token
    per_token_alerts = defaultdict(list)
    for a in alerts:
        per_token_alerts[a.token].append(a)

    summaries: List[TokenSummary] = []

    for token, items in per_token_trades.items():
        # sort by timestamp
        items.sort(key=lambda x: x[0])
        timestamps, trades_only = zip(*items)

        # last price and first price for 24h change
        last_price = trades_only[-1].price
        first_price = trades_only[0].price

        # protect divide-by-zero
        if first_price and first_price != 0:
            change_pct = (last_price - first_price) / first_price * 100
        else:
            change_pct = 0.0

        change_str = f"{change_pct:+.1f}%"

        # 24h volume in USD (amount * price)
        volume = sum(t.amount * t.price for t in trades_only)
        # simple formatting (you can make this fancier later)
        volume_str = f"${volume:,.0f}"

        token_alerts = per_token_alerts.get(token, [])
        alert_count = len(token_alerts)

        # simple risk score based on alert density
        # tweak this logic to match your report wording
        if len(trades_only) == 0:
            risk_score = 0
        else:
            ratio = alert_count / max(len(trades_only), 1)
            risk_score = min(100, int(ratio * 100))

        if risk_score >= 75:
            status = "high_risk"
        elif risk_score >= 40:
            status = "medium_risk"
        else:
            status = "low_risk"

        if token_alerts:
            last_alert_ts = max(
                datetime.fromisoformat(a.timestamp.replace("Z", "+00:00"))
                for a in token_alerts
            )
            last_alert_str = last_alert_ts.isoformat() + "Z"
        else:
            last_alert_str = "N/A"

        exchanges = sorted({t.exchange for t in trades_only})

        summaries.append(TokenSummary(
            symbol=token.upper(),
            name=_pretty_token_name(token),
            price=f"${last_price:,.2f}",
            change24h=change_str,
            volume24h=volume_str,
            riskScore=risk_score,
            alerts=alert_count,
            status=status,
            lastAlert=last_alert_str,
            exchanges=exchanges,
        ))

    return summaries

@app.post("/detect/self-trades")
async def api_self_trades():
    alerts = detect_self_trades(get_trades())
    add_alerts(alerts)
    return {"alerts": alerts}

@app.post("/detect/volume-anomaly")
async def api_volume_anomaly():
    alerts = detect_volume_spikes(get_trades())
    add_alerts(alerts)
    return {"anomalies": alerts}

@app.post("/detect/cycles")
async def api_cycles():
    alerts = detect_cycles(get_trades())
    add_alerts(alerts)
    return {"cycles": alerts}

@app.post("/detect/all-patterns")
async def api_all_patterns():
    alerts = detect_all(get_trades())
    add_alerts(alerts)
    return {"alerts": alerts}

@app.get("/analysis/token/{token}")
async def api_analyze_token(token: str):
    trades = [t for t in get_trades() if t.token.lower() == token.lower()]
    alerts = [a for a in get_alerts() if a.token.lower() == token.lower()]
    return {
        "token": token.upper(),
        "total_trades": len(trades),
        "alerts": alerts,
    }

@app.get("/analysis/wallet/{address}")
async def api_analyze_wallet(address: str):
    trades = [t for t in get_trades() if t.from_address == address or t.to_address == address]
    alerts = [a for a in get_alerts() if address in a.affected_addresses]
    return {
        "wallet": address,
        "total_trades": len(trades),
        "alerts": alerts,
    }

@app.get("/reports/case/{token}")
async def api_case_report(token: str):
    trades = [t for t in get_trades() if t.token.lower() == token.lower()]
    alerts = [a for a in get_alerts() if a.token.lower() == token.lower()]
    return {
        "token": token.upper(),
        "trade_count": len(trades),
        "alert_count": len(alerts),
        "alerts": alerts,
        "trades": trades,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
@app.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    result = db.execute("SELECT 1;").fetchone()
    return {"status": "ok", "result": result[0]}
