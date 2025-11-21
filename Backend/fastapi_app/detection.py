# Backend/fastapi_app/detection.py
from datetime import timedelta
from typing import List, Dict, Tuple
from collections import defaultdict
from statistics import mean, pstdev
import uuid

from .schemas import TradeIn, Alert

def _id() -> str:
    return str(uuid.uuid4())

# 1) SELF-TRADES: same economic owner both sides
def detect_self_trades(trades: List[TradeIn]) -> List[Alert]:
    alerts: List[Alert] = []
    for t in trades:
        if t.from_address == t.to_address:
            alerts.append(Alert(
                alert_id=_id(),
                type="self_trade",
                severity="high",
                confidence=95.0,
                token=t.token,
                description=f"Self-trade: wallet {t.from_address} is both buyer and seller on {t.token}.",
                timestamp=t.timestamp,
                affected_addresses=[t.from_address],
                volume=f"{t.amount:.8f} {t.token}",
                exchanges=[t.exchange],
            ))
    return alerts

# 2) WASH TRADES: sell at loss then rebuy within 30 days (simplified)
def detect_wash_trading(trades: List[TradeIn]) -> List[Alert]:
    alerts: List[Alert] = []
    grouped: Dict[Tuple[str, str], List[TradeIn]] = defaultdict(list)

    for t in trades:
        grouped[(t.from_address, t.token)].append(t)

    for (wallet, token), wallet_trades in grouped.items():
        wallet_trades.sort(key=lambda x: x.timestamp)

        for i, sell in enumerate(wallet_trades):
            # we assume from_address is "seller"; amount is quantity sold
            for buy in wallet_trades[i+1:]:
                if buy.timestamp - sell.timestamp > timedelta(days=30):
                    break
                # treat buy as repurchase if direction flips (simple heuristic)
                if buy.price >= sell.price:
                    # realized economic loss (approx)
                    loss_per_unit = buy.price - sell.price
                    realized_loss = abs(loss_per_unit * min(buy.amount, sell.amount))
                    if realized_loss < 100:  # materiality threshold
                        continue

                    alerts.append(Alert(
                        alert_id=_id(),
                        type="wash_trading",
                        severity="medium",
                        confidence=80.0,
                        token=token,
                        description=(
                            f"Potential wash trade: wallet {wallet} sold {token} at a lower price "
                            f"and repurchased within 30 days (approx loss ≈ ${realized_loss:.2f})."
                        ),
                        timestamp=buy.timestamp,
                        affected_addresses=[wallet],
                        volume=f"{min(buy.amount, sell.amount):.8f} {token}",
                        exchanges=[sell.exchange, buy.exchange],
                    ))
                    break
    return alerts

# 3) VOLUME SPIKES: abnormal volume relative to history
def detect_volume_spikes(trades: List[TradeIn]) -> List[Alert]:
    alerts: List[Alert] = []
    if len(trades) < 5:
        return alerts

    token_groups: Dict[str, List[TradeIn]] = defaultdict(list)
    for t in trades:
        token_groups[t.token].append(t)

    for token, ts in token_groups.items():
        amounts = [t.amount for t in ts]
        if len(amounts) < 5:
            continue
        avg = mean(amounts)
        std = pstdev(amounts)
        threshold = avg + 1.5 * std if std > 0 else avg * 2

        for t in ts:
            if t.amount > threshold:
                alerts.append(Alert(
                    alert_id=_id(),
                    type="volume_spike",
                    severity="medium",
                    confidence=75.0,
                    token=token,
                    description=(
                        f"Abnormal volume spike: {t.amount:.8f} {token} on {t.exchange}, "
                        f"above threshold {threshold:.8f}."
                    ),
                    timestamp=t.timestamp,
                    affected_addresses=[t.from_address, t.to_address],
                    volume=f"{t.amount:.8f} {token}",
                    exchanges=[t.exchange],
                ))
    return alerts

# 4) SIMPLE CIRCULAR TRADING (short cycles A→B→C→A)
def detect_cycles(trades: List[TradeIn]) -> List[Alert]:
    alerts: List[Alert] = []
    # Build adjacency list by token within a recent window (e.g. last 1 day)
    token_edges: Dict[str, Dict[str, List[str]]] = defaultdict(lambda: defaultdict(list))

    for t in trades:
        token_edges[t.token][t.from_address].append(t.to_address)

    # Only detect simple 2- or 3-node cycles
    for token, graph in token_edges.items():
        for a in graph:
            for b in graph[a]:
                if b in graph and a in graph[b]:  # 2-cycle A<->B
                    alerts.append(Alert(
                        alert_id=_id(),
                        type="price_manipulation",
                        severity="medium",
                        confidence=70.0,
                        token=token,
                        description=f"Potential circular trading between {a} and {b} on {token}.",
                        timestamp=trades[-1].timestamp if trades else None,
                        affected_addresses=[a, b],
                        volume="N/A",
                        exchanges=list({t.exchange for t in trades if t.token == token}),
                    ))
                # 3-cycle A->B->C->A
                for c in graph.get(b, []):
                    if c in graph and a in graph[c] and len({a, b, c}) == 3:
                        alerts.append(Alert(
                            alert_id=_id(),
                            type="price_manipulation",
                            severity="high",
                            confidence=80.0,
                            token=token,
                            description=f"Potential 3-way circular trading between {a}, {b}, and {c} on {token}.",
                            timestamp=trades[-1].timestamp if trades else None,
                            affected_addresses=[a, b, c],
                            volume="N/A",
                            exchanges=list({t.exchange for t in trades if t.token == token}),
                        ))
    return alerts

def detect_all(trades: List[TradeIn]) -> List[Alert]:
    alerts: List[Alert] = []
    alerts.extend(detect_self_trades(trades))
    alerts.extend(detect_wash_trading(trades))
    alerts.extend(detect_volume_spikes(trades))
    alerts.extend(detect_cycles(trades))
    return alerts
