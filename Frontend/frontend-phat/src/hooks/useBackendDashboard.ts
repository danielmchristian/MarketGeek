// src/hooks/useBackendDashboard.ts
import { useEffect, useState } from 'react';
import { apiClient, type Alert } from '../utils/api';

export interface StatisticsOverview {
  total_trades: number;
  suspicious_trades: number;
  wallets_monitored: number;
  tokens_monitored: number;
  wash_sales_detected: number;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

export function useBackendDashboard() {
  const [overview, setOverview] = useState<StatisticsOverview | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [backendOk, setBackendOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [overviewResp, alertsResp, healthResp] = await Promise.all([
          // direct call, since we didn't wrap these in apiClient yet:
          fetch(`${(import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8000'}/statistics/overview`)
            .then((r) => r.json()),
          fetch(`${(import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8000'}/alerts`)
            .then((r) => r.json()),
          fetch(`${(import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8000'}/health`)
            .then((r) => r.json()),
        ]);

        setOverview(overviewResp);
        setAlerts(alertsResp);
        setHealth(healthResp);
        setBackendOk(true);
      } catch (e: any) {
        console.error('Dashboard backend error:', e);
        setError(e.message || 'Backend unavailable, using mock data');
        setBackendOk(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { overview, alerts, health, backendOk, loading, error };
}
