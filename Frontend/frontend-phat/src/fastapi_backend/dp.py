import os
from typing import Iterable
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import execute_values

_pool: SimpleConnectionPool | None = None

def _dsn() -> str:
    return " ".join([
        f"host={os.getenv('DB_HOST','')}",
        f"dbname={os.getenv('DB_NAME','')}",
        f"user={os.getenv('DB_USER','')}",
        f"password={os.getenv('DB_PASSWORD','')}",
        f"port={os.getenv('DB_PORT','5432')}",
        f"sslmode={os.getenv('DB_SSLMODE','require')}",
    ])

def init_pool() -> None:
    global _pool
    if _pool: return
    _pool = SimpleConnectionPool(minconn=1, maxconn=5, dsn=_dsn())
    # bootstrap schema
    conn = _pool.getconn()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS trades (
                    tx_hash       TEXT PRIMARY KEY,
                    trade_id      TEXT,
                    timestamp     TIMESTAMPTZ,
                    token         TEXT,
                    from_address  TEXT,
                    to_address    TEXT,
                    amount        DOUBLE PRECISION,
                    price         DOUBLE PRECISION,
                    exchange      TEXT
                );
            """)
    finally:
        _pool.putconn(conn)

def close_pool() -> None:
    global _pool
    if _pool:
        _pool.closeall()
        _pool = None

def ping_db() -> bool:
    if not _pool: return False
    conn = _pool.getconn()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("SELECT 1;")
            cur.fetchone()
        return True
    except Exception:
        return False
    finally:
        _pool.putconn(conn)

def count_trades() -> int:
    if not _pool: return 0
    conn = _pool.getconn()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM trades;")
            return int(cur.fetchone()[0])
    finally:
        _pool.putconn(conn)

def bulk_upsert_trades(trades: Iterable[dict]) -> int:
    """
    trades: iterable of dicts with keys:
      trade_id, timestamp (ISO string), token, from_address, to_address, amount, price, exchange, tx_hash
    """
    if not _pool: return 0
    rows = [
        (
            t.get("tx_hash"),
            t.get("trade_id"),
            t.get("timestamp"),
            t.get("token"),
            t.get("from_address"),
            t.get("to_address"),
            t.get("amount"),
            t.get("price"),
            t.get("exchange"),
        )
        for t in trades
    ]
    if not rows: return 0

    conn = _pool.getconn()
    try:
        with conn, conn.cursor() as cur:
            execute_values(cur, """
                INSERT INTO trades (tx_hash, trade_id, timestamp, token, from_address, to_address, amount, price, exchange)
                VALUES %s
                ON CONFLICT (tx_hash) DO UPDATE SET
                    trade_id = EXCLUDED.trade_id,
                    timestamp = EXCLUDED.timestamp,
                    token = EXCLUDED.token,
                    from_address = EXCLUDED.from_address,
                    to_address = EXCLUDED.to_address,
                    amount = EXCLUDED.amount,
                    price = EXCLUDED.price,
                    exchange = EXCLUDED.exchange;
            """, rows)
        return len(rows)
    finally:
        _pool.putconn(conn)
