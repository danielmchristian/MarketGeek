# Backend/fastapi_app/storage.py
from typing import List
from .schemas import TradeIn, Alert

_trades: List[TradeIn] = []
_alerts: List[Alert] = []

def add_trades(new_trades: List[TradeIn]):
    _trades.extend(new_trades)

def get_trades() -> List[TradeIn]:
    return list(_trades)

def add_alerts(new_alerts: List[Alert]):
    _alerts.extend(new_alerts)

def get_alerts() -> List[Alert]:
    return list(_alerts)

def reset_all():
    _trades.clear()
    _alerts.clear()
