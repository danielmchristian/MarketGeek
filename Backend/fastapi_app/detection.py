# backend/fastapi_app/detection.py

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from statistics import mean, stdev
from typing import List, Dict, Tuple

from .schemas import Alert          # Pydantic model for API
from .models import Trade           # internal trade object
from .utils import _id              # id generator


# ----------------------------
# Helper: ensure tz-aware UTC
# ----------------------------
def _to_utc(dt: datetime) -> datetime:
    """Return a timezone-aware UTC datetime."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


# -------------------------------------------------
# 1) Self-trade / wash-trade style “same wallet” alerts
# -------------------------------------------------
def detect_self_trades(trades: List[Trade]) -> List[Alert]:
    alerts: List[Alert] = []

    for t in trades:
        if not t.from_address or not t.to_address:
            continue

        if t.from_address.lower() != t.to_address.lower():
            continue

        ts = _to_utc(t.timestamp)

        alerts.append(
            Alert(
                alert_id=_id(),  
                type="self_trade",
                severity="high",
                confidence=0.9,
                token=t.token,
                description=(
                    f"Self-trade detected for {t.token} on {t.exchange} "
                    f"between {t.from_address} and {t.to_address}."
                ),
                timestamp=ts.isoformat(),
                affected_addresses=[t.from_address, t.to_address],
                volume=float(t.amount) * float(t.price),
                exchanges=[t.exchange],
            )
        )

    return alerts



# -------------------------------------------------
# 2) Volume spike / anomaly detection
#    (returns plain dicts, not Pydantic models)
# -------------------------------------------------
def detect_volume_spikes(trades: List[Trade]) -> List[dict]:
    """
    Group trades into 5-minute buckets per token and flag high volume buckets.
    Returns a list[dict] with keys:
      token, timestamp, z_score, normal_volume, actual_volume, threshold, severity
    """
    if not trades:
        return []

    # bucket: (token, bucket_start_iso) -> total volume
    buckets: Dict[Tuple[str, str], float] = defaultdict(float)

    for t in trades:
        ts = _to_utc(t.timestamp)
        # 5-minute bucket
        bucket_minute = (ts.minute // 5) * 5
        bucket = ts.replace(minute=bucket_minute, second=0, microsecond=0)
        bucket_ts = bucket.isoformat()
        bucket_key = (t.token, bucket_ts)

        notional = float(t.amount) * float(t.price)
        buckets[bucket_key] += notional

    anomalies: List[dict] = []

    # group by token to compute per-token stats
    per_token: Dict[str, List[float]] = defaultdict(list)
    for (token, _bucket_ts), vol in buckets.items():
        per_token[token].append(vol)

    for (token, bucket_ts), vol in buckets.items():
        vols = per_token[token]
        if len(vols) < 2:
            # Not enough history to meaningfully compute anomaly
            continue

        mu = mean(vols)
        sigma = stdev(vols) or 1e-9  # avoid div by zero
        z = (vol - mu) / sigma
        threshold = 3.0  # 3-sigma rule

        if z < threshold:
            continue

        severity = "high" if z >= 6 else "medium"

        anomalies.append(
            {
                "token": token,
                "timestamp": bucket_ts,
                "z_score": z,
                "normal_volume": mu,
                "actual_volume": vol,
                "threshold": threshold,
                "severity": severity,
            }
        )

    return anomalies


# -------------------------------------------------
# 3) Simple cycle / circular pattern detection
#    (also returns plain dicts)
# -------------------------------------------------
def detect_cycles(trades: List[Trade], min_cycle_length: int = 3) -> List[dict]:
    """
    VERY simple cycle detection:
    - Looks for chains from A→B→C→...→A for the same token.
    - Returns a list[dict] with keys:
        cycle_id, wallets, token, total_volume, confidence,
        pattern_type, first_detected, last_activity
    """
    cycles: List[dict] = []

    # group trades by token
    trades_by_token: Dict[str, List[Trade]] = defaultdict(list)
    for t in trades:
        trades_by_token[t.token].append(t)

    for token, token_trades in trades_by_token.items():
        # Build adjacency: wallet -> set(neighbors)
        graph: Dict[str, set[str]] = defaultdict(set)
        for t in token_trades:
            if not t.from_address or not t.to_address:
                continue
            graph[t.from_address].add(t.to_address)

        visited_paths: set[Tuple[str, ...]] = set()

        def dfs(start: str, current: str, path: List[str]):
            if len(path) > min_cycle_length + 1:
                return
            for nxt in graph.get(current, []):
                if nxt == start and len(path) >= min_cycle_length:
                    cycle_tuple = tuple(path)
                    if cycle_tuple in visited_paths:
                        continue
                    visited_paths.add(cycle_tuple)

                    # Collect basic stats
                    related_trades = [
                        t for t in token_trades
                        if t.from_address in path and t.to_address in path
                    ]
                    total_vol = sum(
                        float(t.amount) * float(t.price) for t in related_trades
                    )
                    times = [_to_utc(t.timestamp) for t in related_trades]
                    if times:
                        first_ts = min(times).isoformat()
                        last_ts = max(times).isoformat()
                    else:
                        first_ts = last_ts = datetime.now(timezone.utc).isoformat()

                    cycles.append(
                        {
                            "cycle_id": _id(),
                            "wallets": path,
                            "token": token,
                            "total_volume": total_vol,
                            "confidence": 0.7,
                            "pattern_type": "simple_cycle",
                            "first_detected": first_ts,
                            "last_activity": last_ts,
                        }
                    )
                elif nxt not in path:
                    dfs(start, nxt, path + [nxt])

        for start_wallet in list(graph.keys()):
            dfs(start_wallet, start_wallet, [start_wallet])

    return cycles


# -------------------------------------------------
# 4) Helper: run all detectors on a trade list
# -------------------------------------------------
def detect_all(trades: List[Trade]) -> List[Alert]:
    """
    Convenience function used by /detect/all-patterns.
    Combines self-trade alerts and volume spike alerts.
    """
    alerts: List[Alert] = []

    # Self-trade alerts
    alerts.extend(detect_self_trades(trades))

    # Volume anomalies → convert to generic "volume_spike" Alert
    anomalies = detect_volume_spikes(trades)
    for a in anomalies:
        alerts.append(
            Alert(
                alert_id=_id(),
                type="volume_spike",
                severity=a["severity"],
                confidence=0.8,
                token=a["token"],
                description=(
                    f"Volume spike detected (z={a['z_score']:.2f}) for {a['token']} "
                    f"at {a['timestamp']}."
                ),
                timestamp=a["timestamp"],
                affected_addresses=[],
                volume=a["actual_volume"],
                exchanges=[],
            )
        )

    return alerts
