# Backend/fastapi_app/analysis.py

from datetime import datetime
from typing import Dict, List
from .schemas import Trade, Alert
import statistics

def analyze_token(token: str, trades: List[Trade], alerts: List[Alert]) -> Dict:
    token_trades = [t for t in trades if t.token.lower() == token.lower()]
    token_alerts = [a for a in alerts if (a.token or "").lower() == token.lower()]

    if not token_trades:
        return {
            "token": token.upper(),
            "total_trades": 0,
            "unique_wallets": 0,
            "avg_price": 0,
            "avg_volume": 0,
            "alerts": [],
        }

    wallets = set([t.from_address for t in token_trades] + [t.to_address for t in token_trades])
    
    prices = [t.price for t in token_trades]
    qtys = [t.quantity for t in token_trades]

    return {
        "token": token.upper(),
        "total_trades": len(token_trades),
        "unique_wallets": len(wallets),
        "avg_price": statistics.mean(prices),
        "avg_volume": statistics.mean(qtys),
        "alerts": token_alerts,
    }


def analyze_wallet(address: str, trades: List[Trade], alerts: List[Alert]) -> Dict:
    wallet_trades = [t for t in trades if t.from_address == address or t.to_address == address]
    wallet_alerts = [a for a in alerts if a.wallet == address]

    tokens = list(set([t.token for t in wallet_trades]))

    return {
        "wallet": address,
        "tokens_traded": tokens,
        "total_trades": len(wallet_trades),
        "alerts": wallet_alerts,
    }
