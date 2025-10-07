from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any, List
import os, json, httpx, logging
from providers.stub_provider import StubNodeProvider

log = logging.getLogger(__name__)
router = APIRouter(tags=["node-fetch"])

FETCH_MODE   = os.getenv("FETCH_MODE", "stub").lower()
FIXTURES_DIR = os.getenv("STUB_FIXTURES_DIR", "data/fixtures/evm")
API_BASE     = os.getenv("API_BASE", "http://127.0.0.1:8000")  # Windows-safe

@router.get("/nodes/mode")
async def get_mode() -> Dict[str, Any]:
    return {"mode": FETCH_MODE, "fixtures_dir": FIXTURES_DIR}

def _normalize_trade(t: Dict[str, Any]) -> Dict[str, Any]:
    # Map either style -> ingest schema (timestamp/from_address/to_address)
    return {
        "trade_id":      t.get("trade_id") or t.get("id"),
        "timestamp":     t.get("timestamp") or t.get("ts"),
        "token":        (t.get("token") or "").upper(),
        "from_address":  t.get("from_address") or t.get("from_addr"),
        "to_address":    t.get("to_address") or t.get("to_addr"),
        "amount":        t.get("amount"),
        "price":         t.get("price"),
        "exchange":      t.get("exchange"),
        "tx_hash":       t.get("tx_hash"),
    }

def _validate(trades: List[Dict[str, Any]]) -> None:
    req = ["trade_id","timestamp","token","from_address","to_address","amount","tx_hash"]
    for i, tr in enumerate(trades):
        missing = [k for k in req if not tr.get(k)]
        if missing:
            raise HTTPException(status_code=422, detail=f"Trade[{i}] missing {missing}: {json.dumps(tr)[:400]}")

@router.get("/debug/fetch-preview")
async def fetch_preview(token: Optional[str] = None, limit: int = 3):
    if FETCH_MODE != "stub":
        raise HTTPException(status_code=400, detail="Only 'stub' mode implemented for now.")
    if not os.path.isdir(FIXTURES_DIR):
        raise HTTPException(status_code=500, detail=f"Fixture dir not found: {os.path.abspath(FIXTURES_DIR)}")
    provider = StubNodeProvider(FIXTURES_DIR)
    raw = provider.fetch_trades(token=token, limit=limit)
    trades = [_normalize_trade(t) for t in raw]
    _validate(trades)
    return {"normalized": trades}

@router.post("/fetch/trades")
async def fetch_and_ingest(token: Optional[str] = None, limit: int = 100):
    if FETCH_MODE != "stub":
        raise HTTPException(status_code=400, detail="Only 'stub' mode implemented for now.")
    if not os.path.isdir(FIXTURES_DIR):
        raise HTTPException(status_code=500, detail=f"Fixture dir not found: {os.path.abspath(FIXTURES_DIR)}")

    provider = StubNodeProvider(FIXTURES_DIR)
    try:
        raw = provider.fetch_trades(token=token, limit=limit)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"Fixture not found: {e}")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Fixture JSON invalid: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fetch error: {e}")

    trades = [_normalize_trade(t) for t in raw]
    _validate(trades)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(f"{API_BASE}/ingest/trades", json={"trades": trades})
            if r.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Ingest failed {r.status_code}: {r.text}")
    except HTTPException:
        raise
    except httpx.HTTPError as e:
        body = getattr(e, "response", None)
        body_text = body.text if body is not None else ""
        raise HTTPException(status_code=500, detail=f"Ingest call error: {e} | body={body_text}")

    data = r.json()
    return {"fetched": len(raw), "normalized": len(trades), "ingested": data.get("processed_count", 0)}
