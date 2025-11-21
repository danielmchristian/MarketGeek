# Backend/fastapi_app/schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import List, Literal

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


class Alert(BaseModel):
    alert_id: str
    type: Literal["self_trade", "wash_trading", "volume_spike", "price_manipulation"]
    severity: Literal["high", "medium", "low"]
    confidence: float
    token: str
    description: str
    timestamp: datetime
    affected_addresses: List[str]
    volume: str
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
    status: str  # "high_risk" | "medium_risk" | "low_risk"
    lastAlert: str
    exchanges: List[str]