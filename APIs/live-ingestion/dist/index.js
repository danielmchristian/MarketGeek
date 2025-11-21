"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

const ws_1 = __importDefault(require("ws"));
const axios_1 = __importDefault(require("axios"));

const BACKEND_API = process.env.BACKEND_API ?? 'http://localhost:8000/ingest/trades';

// 🔹 Real Binance US streams
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

// 🔹 Names that show up in the UI
//   - BTCUSDT & XRP appear more often
//   - TRUMP appears multiple times so it gets lots of self-trades
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

const WS_URL = 'wss://stream.binance.us:9443/stream?streams=' + STREAMS.join('/');

let counter = 0;

const ws = new ws_1.default(WS_URL);

ws.on('open', () => {
    console.log('[Ingestion] Connected to Binance US multi-stream:', STREAMS.join(', '));
});

// Helper: create a BIG notional trade (50M–200M USD)
function createBigVolumeTrade(base) {
    const minNotional = 50000000;   // 50M
    const maxNotional = 200000000;  // 200M
    const notional = minNotional + Math.random() * (maxNotional - minNotional);

    const price = base.price || 1;
    const amount = +(notional / price).toFixed(3); // adjust size so price * amount ≈ notional

    return Object.assign({}, base, {
        amount,
        exchange: 'BinanceUS-demo',
        trade_id: base.trade_id + '-BIG'
    });
}

ws.on('message', async (data) => {
    counter++;

    const payload = JSON.parse(data.toString());
    // For /stream endpoint: { stream: "btcusdt@trade", data: {...trade...} }
    const msg = payload.data;
    const streamName = payload.stream; // e.g. "btcusdt@trade"
    const baseSymbol = streamName.split('@')[0].toUpperCase(); // e.g. "BTCUSDT"

    // Pick a display token (this gives you BTCUSDT / XRP / TRUMP / SHIBA / etc. in the UI)
    const displayToken = DISPLAY_TOKENS[counter % DISPLAY_TOKENS.length] ?? baseSymbol;

    // Base trade from the real Binance US stream
    const baseTrade = {
        trade_id: msg.t.toString(),
        timestamp: new Date(msg.T).toISOString(),
        token: displayToken, // what the dashboard will see
        from_address: msg.m ? 'maker' : 'taker',
        to_address: msg.m ? 'taker' : 'maker',
        amount: parseFloat(msg.q),
        price: parseFloat(msg.p),
        exchange: 'BinanceUS',
        tx_hash: msg.a.toString(),
    };

    let trade = baseTrade;

    // 🔥 DEMO PATTERNS 🔥
    // 1) Every 15th trade → BIG SELF-TRADE (any token)
    if (counter % 15 === 0) {
        trade = createBigVolumeTrade(Object.assign({}, baseTrade, {
            from_address: 'walletSelf',
            to_address: 'walletSelf',
        }));
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
        trade = createBigVolumeTrade(Object.assign({}, baseTrade, {
            from_address: 'walletBig',
            to_address: 'walletOther',
        }));
        const notional = trade.amount * trade.price;
        console.log(
            '[Ingestion] Injected BIG VOLUME-SPIKE demo for',
            trade.token,
            '≈',
            Math.round(notional).toLocaleString(),
            'USD'
        );
    }
    // 3) EXTRA: TRUMP heavy self-trading every 7th time TRUMP appears
    else if (displayToken === 'TRUMP' && counter % 7 === 0) {
        trade = createBigVolumeTrade(Object.assign({}, baseTrade, {
            from_address: 'walletTrump',
            to_address: 'walletTrump',
        }));
        const notional = trade.amount * trade.price;
        console.log(
            '[Ingestion] Injected TRUMP SELF-TRADE demo ≈',
            Math.round(notional).toLocaleString(),
            'USD'
        );
    }

    try {
        await axios_1.default.post(BACKEND_API, { trades: [trade] });
        console.log('[Ingestion] Sent trade', trade.token, trade.trade_id);
    }
    catch (err) {
        console.error('[Ingestion] Failed to send trade:', err.message);
    }
});

ws.on('error', (err) => {
    console.error('[Ingestion] WebSocket error:', err);
});

ws.on('close', () => {
    console.error('[Ingestion] WebSocket closed');
});
