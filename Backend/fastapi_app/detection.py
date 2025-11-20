# Backend/fastapi_app/detection.py
from datetime import timedelta, datetime
from statistics import mean, pstdev
from typing import List
from .schemas import Trade, Alert
import uuid

def _id() -> str:
    return str(uuid.uuid4())

def detect_self_trades(trades: List[Trade]) -> List[Alert]:
    alerts: List[Alert] = []
    for t in trades:
        if t.from_address == t.to_address:
            alerts.append(Alert(
                alert_id=_id(),
                type="self-trade",
                severity="high",
                message=f"Self-trade detected for token {t.token} in tx {t.tx_hash}",
                token=t.token,
                wallet=t.from_address,
                trade_ids=[t.trade_id],
                timestamp=t.timestamp
            ))
    return alerts

def detect_wash_sales(trades: List[Trade]) -> List[Alert]:
    # extremely simplified wash-sale rule:
    # same wallet sells at loss and buys same token again within 30 days
    alerts: List[Alert] = []
    trades_sorted = sorted(trades, key=lambda t: t.timestamp)
    for i, sell in enumerate(trades_sorted):
        if sell.side.lower() != "sell":
            continue
        # approximate cost basis = price of previous buys (skip for demo)
        for buy in trades_sorted[i+1:]:
            if buy.token != sell.token:
                continue
            if buy.from_address != sell.from_address:
                continue
            if buy.timestamp - sell.timestamp > timedelta(days=30):
                break
            if buy.price >= sell.price:
                alerts.append(Alert(
                    alert_id=_id(),
                    type="wash-sale",
                    severity="medium",
                    message=f"Possible wash sale on {sell.token} for wallet {sell.from_address}",
                    token=sell.token,
                    wallet=sell.from_address,
                    trade_ids=[sell.trade_id, buy.trade_id],
                    timestamp=buy.timestamp
                ))
                break
    return alerts

def detect_volume_anomalies(trades: List[Trade]) -> List[Alert]:
    alerts: List[Alert] = []
    if not trades:
        return alerts

    vols = [t.quantity for t in trades]
    if len(vols) < 2:
        return alerts

    avg = mean(vols)
    std = pstdev(vols)

    threshold = avg + 3 * std if std > 0 else avg * 3

    for t in trades:
        if t.quantity > threshold:
            alerts.append(Alert(
                alert_id=_id(),
                type="volume-anomaly",
                severity="medium",
                message=f"Volume spike detected: {t.quantity:.2f} {t.token} (> {threshold:.2f})",
                token=t.token,
                wallet=t.from_address,
                trade_ids=[t.trade_id],
                timestamp=t.timestamp
            ))
    return alerts

def detect_all(trades: List[Trade]) -> List[Alert]:
    all_alerts: List[Alert] = []
    all_alerts.extend(detect_self_trades(trades))
    all_alerts.extend(detect_wash_sales(trades))
    all_alerts.extend(detect_volume_anomalies(trades))
    return all_alerts
