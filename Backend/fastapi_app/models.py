# fastapi_app/models.py

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------
# Basic system health model  -> used by /health
# ---------------------------------------------------------
class SystemHealth(BaseModel):
    status: str = "ok"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message: Optional[str] = None


# ---------------------------------------------------------
# Core Trade model (used for ingestion & detection)
# ---------------------------------------------------------
class Trade(BaseModel):
    trade_id: str | int
    token: str
    price: float
    amount: float                       # used in detection.py
    timestamp: datetime                 # timezone-naive or aware → normalized later

    side: Optional[str] = None          # "buy"/"sell", etc.
    from_address: Optional[str] = None  # for self-trade / cycles
    to_address: Optional[str] = None
    tx_hash: Optional[str] = None
    exchange: Optional[str] = None      # "binance", "uniswap", etc.


# ---------------------------------------------------------
# Alert model returned by detection endpoints
# ---------------------------------------------------------
class Alert(BaseModel):
    alert_id: str
    type: str                  # "self_trade", "volume_anomaly", "cycle", "wash_trading", ...
    severity: str              # "high", "medium", "low"
    token: str
    description: str

    # IMPORTANT: make this a string, so frontend can safely do new Date(...)
    timestamp: str

    # Extra context (optional – safe for frontend)
    confidence: Optional[float] = None
    volume: Optional[float] = None
    affected_addresses: List[str] = []
    exchanges: List[str] = []


# ---------------------------------------------------------
# Volume anomaly model -> used by detect_volume_spikes()
# ---------------------------------------------------------
class VolumeAnomaly(BaseModel):
    token: str
    timestamp: str             # bucket time in ISO format
    z_score: float
    normal_volume: float
    actual_volume: float
    threshold: float
    severity: str              # "high"/"medium"/"low"


# ---------------------------------------------------------
# Cycle / circular pattern model -> detect_cycles()
# ---------------------------------------------------------
class WalletCycle(BaseModel):
    cycle_id: str
    wallets: List[str]         # ordered addresses in the cycle
    token: str
    total_volume: float
    confidence: float
    pattern_type: str          # e.g. "simple_cycle"
    first_detected: str        # ISO datetime string
    last_activity: str         # ISO datetime string


# ---------------------------------------------------------
# Token monitoring summary -> used by /tokens/summary
# and consumed by TokenMonitoring.tsx
# ---------------------------------------------------------
class TokenSummary(BaseModel):
    symbol: str
    name: Optional[str] = None
    price: Optional[str] = None
    change24h: Optional[str] = None
    volume24h: Optional[float] = None

    riskScore: Optional[float] = None
    alerts: Optional[int] = None
    lastAlert: Optional[str] = None
    status: Optional[str] = None        # "high_risk" | "medium_risk" | "low_risk" ...
    exchanges: List[str] = []
