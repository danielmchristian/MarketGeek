from datetime import datetime, timedelta
from .schemas import Trade
import uuid

def sample_trades():
    now = datetime.utcnow()
    return [
        Trade(
            trade_id=str(uuid.uuid4()),
            timestamp=now - timedelta(minutes=30),
            token="SHIB",
            from_address="0xAAA",
            to_address="0xBBB",
            side="sell",
            quantity=1000000,
            price=0.000008,
            venue="Uniswap",
            tx_hash=str(uuid.uuid4())
        ),
        Trade(
            trade_id=str(uuid.uuid4()),
            timestamp=now - timedelta(minutes=10),
            token="SHIB",
            from_address="0xAAA",
            to_address="0xCCC",
            side="buy",
            quantity=1200000,
            price=0.000009,
            venue="SushiSwap",
            tx_hash=str(uuid.uuid4())
        ),
        Trade(
            trade_id=str(uuid.uuid4()),
            timestamp=now - timedelta(minutes=5),
            token="PEPE",
            from_address="0xDDD",
            to_address="0xDDD",  # SELF TRADE
            side="sell",
            quantity=900000,
            price=0.0000011,
            venue="Binance",
            tx_hash=str(uuid.uuid4())
        )
    ]
