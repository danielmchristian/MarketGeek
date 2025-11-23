# fastapi_app/wash_detector.py
from typing import List
from datetime import datetime
from .schemas import TradeData, Alert


def detect_wash_like_patterns(trades: List[TradeData]) -> List[Alert]:
    """
    Detect wash-like / volume-inflation patterns in a list of trades
    for a *single symbol* from Binance.

    Heuristic:
      - look for many small alternating buy/sell trades
      - price stays in a very tight band
      - aggregate volume is high but net position change is small
    """
    if not trades:
        return []

    # Sort by time (Binance already sorted, but be safe)
    trades_sorted = sorted(trades, key=lambda t: t.timestamp)

    token = trades_sorted[0].token
    exchange = trades_sorted[0].exchange

    total_volume = 0.0
    alternation_count = 0
    tight_band_trades = 0
    wash_pair_volume = 0.0

    # Helper to extract side from pseudo-address mapping
    def get_side(t: TradeData) -> str:
        # We encoded side in from/to addresses
        if t.to_address == "BINANCE_BUYER":
            return "buy"
        if t.from_address == "BINANCE_SELLER":
            return "sell"
        # Fallback: treat as unknown/other
        return "other"

    prices = [t.price for t in trades_sorted]
    min_price = min(prices)
    max_price = max(prices)
    price_range = max_price - min_price if max_price != min_price else 0.0

    for i, trade in enumerate(trades_sorted):
        total_volume += trade.amount * trade.price

        # Count how many trades stay inside ±0.15% band around mid price
        if price_range > 0:
            mid_price = (min_price + max_price) / 2
            if abs(trade.price - mid_price) / mid_price <= 0.0015:
                tight_band_trades += 1

        if i == 0:
            continue

        prev = trades_sorted[i - 1]
        side_prev = get_side(prev)
        side_curr = get_side(trade)

        # Same symbol, different side, close in price, similar size → suspect pair
        if (
            side_prev != "other"
            and side_curr != "other"
            and side_prev != side_curr
            and abs(prev.price - trade.price) / max(prev.price, trade.price) <= 0.001
            and abs(prev.amount - trade.amount) / max(prev.amount, trade.amount) <= 0.2
        ):
            alternation_count += 1
            wash_pair_volume += trade.amount * trade.price

    if total_volume == 0:
        return []

    # Metrics
    volume_millions = total_volume / 1_000_000
    wash_share = wash_pair_volume / total_volume
    tight_band_ratio = tight_band_trades / len(trades_sorted)

    # Simple wash "score" [0,100]
    score = (
        40 * wash_share      # how much of volume is in ping-pong pairs
        + 30 * tight_band_ratio
        + 30 * min(alternation_count / 50, 1.0)  # cap at 50 alternations
    )
    confidence = round(score, 1)

    alerts: List[Alert] = []

    # Thresholds tuned to be demo-friendly: busy symbol like BTCUSDT will often trip it
    if (
        alternation_count >= 20      # enough ping-pong trades
        and wash_share >= 0.25       # at least 25% of volume looks like pairs
        and tight_band_ratio >= 0.5  # most trades in tight band
    ):
        severity = "high" if confidence >= 80 else "medium"

        first_ts = trades_sorted[0].timestamp
        last_ts = trades_sorted[-1].timestamp

        description = (
            f"Wash-like trading pattern detected on {token} "
            f"with {alternation_count} alternating buy/sell pairs and "
            f"{wash_share:.0%} of volume in short-horizon round trips on Binance."
        )

        alerts.append(
            Alert(
                alert_id=f"WASH_{token}_{last_ts}",
                type="wash_trading",
                severity=severity,
                confidence=confidence,
                token=token,
                description=description,
                timestamp=last_ts,
                affected_addresses=list(
                    {
                        t.from_address
                        for t in trades_sorted
                    }
                    | {
                        t.to_address
                        for t in trades_sorted
                    }
                ),
                volume=f"${volume_millions:.2f}M (window {first_ts} → {last_ts})",
                exchanges=[exchange],
            )
        )

    return alerts
