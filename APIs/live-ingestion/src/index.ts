import WebSocket from 'ws';
import axios from 'axios';

const BACKEND_API =
  process.env.BACKEND_API ?? 'http://localhost:8000/ingest/trades';

// --------- Types ---------

type BinanceTradeMsg = {
  t: number;    // trade id
  T: number;    // trade time (ms)
  q: string;    // quantity
  p: string;    // price
  m: boolean;   // is buyer the market maker
  a: number;    // aggregate trade id
};

type StreamPayload = {
  stream: string;        // e.g. "btcusdt@trade"
  data: BinanceTradeMsg; // the trade payload
};

type Trade = {
  trade_id: string;
  timestamp: string;
  token: string;
  from_address: string;
  to_address: string;
  amount: number;
  price: number;
  exchange: string;
  tx_hash: string;
  metadata?: Record<string, unknown>;
};

// --------- Streams & display tokens ---------

// Real Binance US streams
const STREAMS = [
  'btcusdt@trade',
  'ethusdt@trade',
  'solusdt@trade',
  'xrpusdt@trade',
  'dogeusdt@trade',
  'shibusdt@trade',
  'adausdt@trade',
  'avaxusdt@trade',
  'ltcusdt@trade',
  'linkusdt@trade',
];

// Names you want to see in the UI
// BTCUSDT & XRP repeated so they appear more often
// TRUMP repeated so it gets lots of self-trading
const DISPLAY_TOKENS = [
  'BTCUSDT', 'BTCUSDT', 'BTCUSDT',
  'XRP', 'XRP',
  'TRUMP', 'TRUMP',
  'SHIBA',       // from SHIBUSDT stream
  'DOGE',        // from DOGEUSDT stream
  'MOONWELL',    // alias from any real stream
  'HYPERLIQUID', // alias from any real stream
  'ADA',
  'AVAX',
];

const WS_URL =
  'wss://stream.binance.us:9443/stream?streams=' + STREAMS.join('/');

let counter = 0;

// --------- WebSocket connection ---------

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log(
    '[Ingestion] Connected to Binance US multi-stream:',
    STREAMS.join(', ')
  );
});

// Helper: create a BIG notional trade (50M–200M USD)
function createBigVolumeTrade(base: Trade): Trade {
  const minNotional = 50_000_000;   // 50M
  const maxNotional = 200_000_000;  // 200M
  const notional =
    minNotional + Math.random() * (maxNotional - minNotional);

  const price = base.price || 1;
  const amount = +(notional / price).toFixed(3); // adjust so price * amount ≈ notional

  return {
    ...base,
    amount,
    exchange: 'BinanceUS-demo',
    trade_id: base.trade_id + '-BIG',
    metadata: {
      ...(base.metadata || {}),
      demo_pattern: 'BIG_NOTIONAL',
      target_notional: notional,
    },
  };
}

ws.on('message', async (raw: WebSocket.RawData) => {
  counter++;

  const payload = JSON.parse(raw.toString()) as StreamPayload;
  const msg = payload.data;
  const streamName = payload.stream; // e.g. "btcusdt@trade"
  const baseSymbol = streamName.split('@')[0].toUpperCase(); // "BTCUSDT"

  // Rotate through DISPLAY_TOKENS so UI shows BTCUSDT / XRP / TRUMP / etc.
  const displayToken =
    DISPLAY_TOKENS[counter % DISPLAY_TOKENS.length] ?? baseSymbol;

  // Base trade from real Binance US stream
  const baseTrade: Trade = {
    trade_id: msg.t.toString(),
    timestamp: new Date(msg.T).toISOString(),
    token: displayToken,
    from_address: msg.m ? 'maker' : 'taker',
    to_address: msg.m ? 'taker' : 'maker',
    amount: parseFloat(msg.q),
    price: parseFloat(msg.p),
    exchange: 'BinanceUS',
    tx_hash: msg.a.toString(),
  };

  let trade: Trade = baseTrade;

  

  // 1) Every 15th trade → BIG SELF-TRADE (any token)
  if (counter % 15 === 0) {
    trade = createBigVolumeTrade({
      ...baseTrade,
      from_address: 'walletSelf',
      to_address: 'walletSelf',
    });

    const notional = trade.amount * trade.price;
    console.log(
      '[Ingestion] Injected BIG SELF-TRADE demo for',
      trade.token,
      '≈',
      Math.round(notional).toLocaleString(),
      'USD'
    );
  }
  // 2) Every 25th trade → BIG VOLUME SPIKE between two wallets
  else if (counter % 25 === 0) {
    trade = createBigVolumeTrade({
      ...baseTrade,
      from_address: 'walletBig',
      to_address: 'walletOther',
    });

    const notional = trade.amount * trade.price;
    console.log(
      '[Ingestion] Injected BIG VOLUME-SPIKE demo for',
      trade.token,
      '≈',
      Math.round(notional).toLocaleString(),
      'USD'
    );
  }
  
  else if (displayToken === 'TRUMP' && counter % 7 === 0) {
    trade = createBigVolumeTrade({
      ...baseTrade,
      from_address: 'walletTrump',
      to_address: 'walletTrump',
    });

    const notional = trade.amount * trade.price;
    console.log(
      '[Ingestion] Injected TRUMP SELF-TRADE demo ≈',
      Math.round(notional).toLocaleString(),
      'USD'
    );
  }

  try {
    await axios.post(BACKEND_API, { trades: [trade] });
    console.log('[Ingestion] Sent trade', trade.token, trade.trade_id);
  } catch (err: any) {
    console.error('[Ingestion] Failed to send trade:', err.message);
  }
});

ws.on('error', (err) => {
  console.error('[Ingestion] WebSocket error:', err);
});

ws.on('close', () => {
  console.error('[Ingestion] WebSocket closed');
});
