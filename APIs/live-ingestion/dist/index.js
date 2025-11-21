"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const axios_1 = __importDefault(require("axios"));
const BACKEND_API = process.env.BACKEND_API ?? 'http://localhost:8000/ingest/trades';
// 🔹 Real Binance US streams (adjust/remove any that Binance US doesn’t support)
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
// 🔹 Names you want to see in the UI (aliases)
// Some map 1:1 (BTCUSDT → BTCUSDT), others are “marketing” labels (MOONWELL, HYPERLIQUID)
const DISPLAY_TOKENS = [
    'BTCUSDT',
    'ETHUSDT',
    'SOLUSDT',
    'SHIBA', // from SHIBUSDT stream
    'DOGE', // from DOGEUSDT stream
    'XRP',
    'MOONWELL', // alias from any real stream
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
ws.on('message', async (data) => {
    counter++;
    const payload = JSON.parse(data.toString());
    // For /stream endpoint: { stream: "btcusdt@trade", data: {...trade...} }
    const msg = payload.data;
    const streamName = payload.stream; // e.g. "btcusdt@trade"
    const baseSymbol = streamName.split('@')[0].toUpperCase(); // e.g. "BTCUSDT"
    // Pick a display token (this gives you SHIBA / DOGE / MOONWELL / HYPERLIQUID in the UI)
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
    //  Every 15th trade → simulate a SELF-TRADE (same wallet)
    if (counter % 15 === 0) {
        trade = {
            ...baseTrade,
            from_address: 'walletSelf',
            to_address: 'walletSelf',
            amount: 0.5,
            exchange: 'BinanceUS-demo',
        };
        console.log('[Ingestion] Injected SELF-TRADE demo event for', trade.token);
    }
    // Every 25th trade → simulate a big VOLUME SPIKE
    else if (counter % 25 === 0) {
        trade = {
            ...baseTrade,
            from_address: 'walletBig',
            to_address: 'walletOther',
            amount: baseTrade.amount * 500 || 5,
            exchange: 'BinanceUS-demo',
        };
        console.log('[Ingestion] Injected VOLUME-SPIKE demo event for', trade.token);
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
