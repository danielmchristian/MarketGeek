# backend/fastapi_app/schemas.py

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


# -------------------------------------------------
# Ingestion models
# -------------------------------------------------

class TradeIn(BaseModel):
    trade_id: str
    timestamp: datetime          # ISO string from ingestion node
    token: str                   # e.g. "BTCUSDT"
    from_address: str            # maker / seller / wallet
    to_address: str              # taker / buyer / wallet
    amount: float                # quantity of base asset
    price: float                 # price per unit in quote asset / USD
    exchange: str                # "Binance", "UniswapV3", etc.
    tx_hash: str                 # tx id or trade id


class IngestRequest(BaseModel):
    trades: List[TradeIn]


class IngestResponse(BaseModel):
    success: bool
    processed_count: int


# -------------------------------------------------
# Alert & statistics models
# -------------------------------------------------

class Alert(BaseModel):
    alert_id: str
    type: str              # "wash_trading", "self_trade", "volume_spike", etc.
    severity: str          # "high" | "medium" | "low"
    confidence: float
    token: str
    description: str
    timestamp: datetime    # Pydantic will parse ISO strings
    affected_addresses: List[str]
    volume: float          # MUST be float to match detection.py
    exchanges: List[str]


class StatisticsOverview(BaseModel):
    total_trades: int
    suspicious_trades: int
    wallets_monitored: int
    tokens_monitored: int
    wash_sales_detected: int


class VolumePoint(BaseModel):
    bucket: datetime         # start time of the bucket
    trade_count: int
    total_volume: float      # notional = amount * price
    alert_count: int         # how many alerts in this bucket


class VolumeSeries(BaseModel):
    points: List[VolumePoint]


class TokenSummary(BaseModel):
    symbol: str
    name: str
    price: str
    change24h: str
    volume24h: str
    riskScore: int
    alerts: int
    status: str          # "high_risk" | "medium_risk" | "low_risk"
    lastAlert: str
    exchanges: List[str]


# -------------------------------------------------
# Compliance report models
# -------------------------------------------------

class ComplianceReport(BaseModel):
    id: str
    title: str
    type: str               # 'quarterly' | 'token_specific' | 'exchange_analysis' | ...
    status: str             # 'completed' | 'in_progress' | 'pending'
    generatedBy: str
    createdDate: datetime
    period: str
    tokensAnalyzed: int
    violationsFound: int
    riskLevel: str          # 'high' | 'medium' | 'low' | 'unknown'
    downloadUrl: Optional[str] = None


class ReportTemplate(BaseModel):
    id: str
    name: str
    description: str
    sections: List[str]
    estimatedTime: str


class ReportAuditEntry(BaseModel):
    timestamp: datetime
    user: str
    action: str
    details: str
    reportId: Optional[str] = None
