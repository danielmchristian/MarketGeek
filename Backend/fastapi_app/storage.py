# Backend/fastapi_app/storage.py
from typing import List
from .schemas import Trade, Alert

trades: List[Trade] = []
alerts: List[Alert] = []

def add_trades(new_trades: List[Trade]):
    trades.extend(new_trades)

def get_trades() -> List[Trade]:
    return trades

def add_alerts(new_alerts: List[Alert]):
    alerts.extend(new_alerts)

def get_alerts() -> List[Alert]:
    return alerts
