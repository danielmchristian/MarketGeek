// src/utils/api.ts


const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8000';

// Generic helper to call the FastAPI backend
async function apiCall<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const resp = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!resp.ok) {
    let message = `Request failed with status ${resp.status}`;
    try {
      const data = await resp.json();
      if (data && (data.detail || data.error)) {
        message = data.detail || data.error;
      }
    } catch {
      // ignore JSON parse errors, keep default message
    }
    throw new Error(message);
  }

  if (resp.status === 204) {
    // no content
    return undefined as unknown as T;
  }

  return (await resp.json()) as T;
}

/* --------------------
 * Shared Types
 * -------------------- */

export interface TokenSummary {
  symbol: string;
  name?: string;
  price?: string;
  change24h?: string;
  volume24h?: string;
  riskScore?: number;
  alerts?: number;
  status?: 'high_risk' | 'medium_risk' | 'low_risk' | 'unknown';
  lastAlert?: string;
  exchanges?: string[];
}

export interface Alert {
  alert_id: string;
  type: string; // 'self_trade', 'wash_trading', 'volume_spike', etc.
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  token: string;
  description: string;
  timestamp: string; // ISO string from backend
  affected_addresses: string[];
  volume: number;
  exchanges: string[];
}

// Health & series types used by dashboard components
export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded' | string;
  timestamp: string;
  version?: string;
}

export interface VolumePoint {
  bucket: string; // ISO timestamp string
  trade_count: number;
  total_volume: number; // in base currency (e.g. USD)
  alert_count: number;
}

export interface VolumeSeries {
  points: VolumePoint[];
}

export interface VolumeAnomaly {
  timestamp: string;
  actual_volume: number;
  normal_volume: number;
  threshold: number;
  z_score: number;
}

/* --------------------
 * API Client
 * -------------------- */

export const apiClient = {
  // ---- Token statistics for dashboard ----
  async getTokenSummaries(): Promise<TokenSummary[]> {
    
    return apiCall<TokenSummary[]>('/tokens/summary');
  },

  // ---- Self trade detection (stored trades) ----
  async detectSelfTrades(_params?: { timeframe?: string }) {
    
    return apiCall<{ alerts: Alert[] }>('/detect/self-trades', {
      method: 'POST',
      // no body so FastAPI doesn't need to parse anything
    });
  },

  // ---- Volume anomaly detection (stored trades) ----
  async detectVolumeAnomaly() {
    return apiCall<{ anomalies: VolumeAnomaly[] }>('/detect/volume-anomaly', {
      method: 'POST',
    });
  },

  // plural alias expected by some components
  async detectVolumeAnomalies() {
    return this.detectVolumeAnomaly();
  },

  // Fetch aggregated volume series (backend: /statistics/volume-series)
  async getVolumeSeries(bucket_minutes = 5) {
    const q = `?bucket_minutes=${encodeURIComponent(String(bucket_minutes))}`;
    return apiCall<VolumeSeries>(`/statistics/volume-series${q}`);
  },

  // ---- Cycles detection (stored trades) ----
  async detectCycles() {
    return apiCall<{ cycles: any[] }>('/detect/cycles', {
      method: 'POST',
    });
  },

  // ---- Health & alerts ----
  async getHealth(): Promise<SystemHealth> {
    return apiCall<SystemHealth>('/health');
  },

  async fetchAlerts(): Promise<Alert[]> {
    return apiCall<Alert[]>('/alerts');
  },

  // Aggregate baseline dashboard data in a single call for initial load
  async getDashboardData(): Promise<{
    health: SystemHealth;
    alerts: Alert[];
    anomalies: VolumeAnomaly[];
  }> {
    const [health, alerts, anomaliesResp] = await Promise.all([
      this.getHealth(),
      this.fetchAlerts(),
      // call detection endpoint for anomalies (may be empty)
      this.detectVolumeAnomalies(),
    ]);

    // detectVolumeAnomalies returns { anomalies: VolumeAnomaly[] }
    const anomalies = (anomaliesResp as { anomalies: VolumeAnomaly[] }).anomalies || [];

    return {
      health,
      alerts,
      anomalies,
    };
  },

  // Binance one-click wash-trading detection
  async detectWashTradingFromBinance(symbol: string, limit: number) {
    const query = `?symbol=${encodeURIComponent(symbol)}&limit=${limit}&use_demo_on_error=true`;
    return apiCall<Alert[]>(`/detect/wash-trading/binance${query}`, {
      method: 'POST',
    });
  },
};

export type { TokenSummary as TTokenSummary, Alert as TAlert };
