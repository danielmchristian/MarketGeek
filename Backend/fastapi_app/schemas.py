# Backend/fastapi_app/schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class Trade(BaseModel):
    trade_id: str
    timestamp: datetime
    token: str
    tx_hash: str
    from_address: str
    to_address: str
    side: str           # "buy" or "sell"
    quantity: float
    price: float        # price per unit
    venue: Optional[str] = None

class IngestResponse(BaseModel):
    ingested_count: int

class Alert(BaseModel):
    alert_id: str
    type: str           # "self-trade", "wash-sale", "cycle", "volume-anomaly"
    severity: str       # "low", "medium", "high"
    message: str
    token: Optional[str] = None
    wallet: Optional[str] = None
    trade_ids: List[str] = []
    timestamp: datetime

class StatisticsOverview(BaseModel):
    total_trades: int
    suspicious_trades: int
    wallets_monitored: int
    tokens_monitored: int
    wash_sales_detected: int
