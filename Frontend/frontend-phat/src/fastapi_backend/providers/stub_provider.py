# fastapi_backend/providers/stub_provider.py
from typing import List, Dict, Any, Optional
from pathlib import Path
import json, time, hashlib, random

class StubNodeProvider:
    chain = "evm-stub"

    def __init__(self, fixtures_dir: str):
        self.fixtures_dir = Path(fixtures_dir)

    def get_latest_block(self) -> int:
        # simple monotonic block stand-in
        return int(time.time())

    def _load_fixture(self, name: str) -> List[Dict[str, Any]]:
        p = self.fixtures_dir / name
        with p.open("r", encoding="utf-8") as f:
            return json.load(f)

    def fetch_trades(self, token: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        data = self._load_fixture("shib_sample_trades.json")
        if token:
            tu = token.upper()
            data = [t for t in data if t.get("token", "").upper() == tu]

        # deterministic shuffle so demos are repeatable
        random.seed(4155)
        random.shuffle(data)
        out = data[:limit]

        # ensure IDs/hashes exist
        for t in out:
            t.setdefault("trade_id", hashlib.sha1(json.dumps(t, sort_keys=True).encode()).hexdigest()[:16])
            t.setdefault("tx_hash", "0x" + hashlib.md5(t["trade_id"].encode()).hexdigest())
        return out
