# fastapi_app/binance_ingestion.py

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

import httpx
from fastapi import HTTPException

from .models import Trade  
BINANCE_BASE_URL = "https://api.binance.com"


def ingest_binance_symbol(symbol: str, limit: int = 500) -> List[Trade]:
    """
    Pull recent trades for a symbol from Binance public API.

    Returns:
        List[Trade] - trades normalized into our internal Trade model.

    Raises:
        HTTPException - with a friendly message when Binance blocks us or fails.
    """
    url = f"{BINANCE_BASE_URL}/api/v3/trades"
    params = {"symbol": symbol.upper(), "limit": limit}

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(
                url,
                params=params,
                headers={
                    # some Cloudflare setups want *some* UA string
                    "User-Agent": "WashGuardPro/1.0 (academic project)",
                },
            )
            resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        # Binance sometimes returns 451 in certain regions (legal reasons)
        if status == 451:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Binance returned HTTP 451 (Unavailable For Legal Reasons). "
                    "This symbol or API may be geo-blocked from your region. "
                    "Try a different data source or run offline demo data."
                ),
            )
        # other HTTP errors → treat as upstream failure
        raise HTTPException(
            status_code=502,
            detail=f"Binance API error {status}: {e.response.text[:200]}",
        )
    except httpx.RequestError as e:
        # Network / DNS / timeout issues
        raise HTTPException(
            status_code=502,
            detail=f"Error talking to Binance: {e}",
        )

    raw_trades = resp.json()
    trades: List[Trade] = []

    for r in raw_trades:
        # Binance time is ms since epoch
        ts = datetime.fromtimestamp(r["time"] / 1000, tz=timezone.utc)

        trades.append(
            Trade(
                trade_id=str(r["id"]),
                timestamp=ts,               # aware UTC datetime
                token=symbol.upper(),
                from_address="binance",     # we don't see real wallets here
                to_address="binance",
                amount=float(r["qty"]),
                price=float(r["price"]),
                exchange="binance",
                tx_hash=str(r["id"]),
            )
        )

    return trades
