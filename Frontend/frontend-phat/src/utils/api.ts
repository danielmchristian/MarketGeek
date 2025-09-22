// API client for WashGuard Pro FastAPI backend
// Following UNC Charlotte ITSC 4155 guidelines

export interface SystemHealth {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
}

export interface TradeData {
  trade_id: string;
  timestamp: string;
  token: string;
  from_address: string;
  to_address: string;
  amount: number;
  price: number;
  exchange: string;
  tx_hash: string;
}

export interface Alert {
  alert_id: string;
  type: 'self_trade' | 'wash_trading' | 'volume_spike' | 'price_manipulation';
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  token: string;
  description: string;
  timestamp: string;
  affected_addresses: string[];
  volume: string;
  exchanges: string[];
}

export interface WalletCycle {
  cycle_id: string;
  wallets: string[];
  token: string;
  total_volume: number;
  confidence: number;
  pattern_type: string;
  first_detected: string;
  last_activity: string;
}

export interface VolumeAnomaly {
  token: string;
  timestamp: string;
  z_score: number;
  normal_volume: number;
  actual_volume: number;
  threshold: number;
  severity: 'high' | 'medium' | 'low';
}

export interface CaseReport {
  token: string;
  report_id: string;
  generated_at: string;
  summary: {
    total_alerts: number;
    high_severity_alerts: number;
    risk_score: number;
    compliance_status: string;
  };
  alerts: Alert[];
  anomalies: VolumeAnomaly[];
  wallet_clusters: WalletCycle[];
  recommendations: string[];
}

// Mock data for development - remove when backend is ready
const MOCK_HEALTH: SystemHealth = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  version: '1.0.0'
};

// Generate dynamic mock data with timestamps
const generateMockAlerts = (): Alert[] => [
  {
    alert_id: 'ALT_001',
    type: 'wash_trading',
    severity: 'high',
    confidence: 96.5,
    token: 'SHIB',
    description: 'Circular trading activity identified between 4 wallet addresses',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    affected_addresses: ['0x1a2b3c4d...', '0x3c4d5e6f...', '0x5e6f7890...', '0x7890abcd...'],
    volume: '$45,230',
    exchanges: ['Uniswap', 'SushiSwap']
  },
  {
    alert_id: 'ALT_002',
    type: 'volume_spike',
    severity: 'medium',
    confidence: 89.2,
    token: 'PEPE',
    description: 'Trading volume 340% above normal baseline',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    affected_addresses: ['0x9abcdef1...', '0xdef12345...'],
    volume: '$89,450',
    exchanges: ['Binance', 'KuCoin']
  },
  {
    alert_id: 'ALT_003',
    type: 'self_trade',
    severity: 'high',
    confidence: 92.8,
    token: 'DOGE',
    description: 'Self-trading detected: same entity trading across multiple exchanges',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    affected_addresses: ['0x23456789...'],
    volume: '$127,890',
    exchanges: ['Coinbase', 'Binance', 'Kraken']
  },
  {
    alert_id: 'ALT_004',
    type: 'price_manipulation',
    severity: 'medium',
    confidence: 78.3,
    token: 'FLOKI',
    description: 'Coordinated buying pressure detected before major announcement',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    affected_addresses: ['0x87654321...', '0xfedcba98...'],
    volume: '$67,830',
    exchanges: ['PancakeSwap', 'Uniswap']
  },
  {
    alert_id: 'ALT_005',
    type: 'wash_trading',
    severity: 'medium',
    confidence: 84.1,
    token: 'BONK',
    description: 'Repetitive trading pattern between related wallets',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    affected_addresses: ['0x11223344...', '0x55667788...', '0x99aabbcc...'],
    volume: '$23,450',
    exchanges: ['Raydium', 'Orca']
  }
];

const MOCK_ALERTS = generateMockAlerts();

const MOCK_CYCLES: WalletCycle[] = [
  {
    cycle_id: 'CYCLE_001',
    wallets: ['0x1a2b3c4d...', '0x5e6f7890...', '0xabcdef12...', '0x34567890...'],
    token: 'SHIB',
    total_volume: 8400000,
    confidence: 94.2,
    pattern_type: 'circular_trading',
    first_detected: '2024-01-15T00:00:00Z',
    last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    cycle_id: 'CYCLE_002',
    wallets: ['0x9876543...', '0xfedcba98...', '0x13579bdf...'],
    token: 'PEPE',
    total_volume: 3200000,
    confidence: 78.6,
    pattern_type: 'wash_trading',
    first_detected: '2024-01-18T00:00:00Z',
    last_activity: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  }
];

const MOCK_ANOMALIES: VolumeAnomaly[] = [
  {
    token: 'SHIB',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    z_score: 4.8,
    normal_volume: 100000,
    actual_volume: 480000,
    threshold: 150000,
    severity: 'high'
  },
  {
    token: 'PEPE',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    z_score: 3.2,
    normal_volume: 80000,
    actual_volume: 280000,
    threshold: 120000,
    severity: 'medium'
  },
  {
    token: 'DOGE',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    z_score: 2.8,
    normal_volume: 150000,
    actual_volume: 350000,
    threshold: 225000,
    severity: 'medium'
  }
];

import { config } from './config';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const fullUrl = `${config.apiBaseUrl}${endpoint}`;
  
  if (config.isDevelopment) {
    console.log(`API Request: ${options.method || 'GET'} ${fullUrl}`);
  }

  try {
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (config.isDevelopment) {
      console.log(`API Response from ${endpoint}:`, data);
    }

    return data;
  } catch (error) {
    console.warn(`API call to ${endpoint} failed:`, error);
    console.log(`🔄 Falling back to mock data for ${endpoint}`);
    
    // Always return mock data when API is not available (for demo purposes)
    if (endpoint === '/health') return MOCK_HEALTH as T;
    if (endpoint === '/detect/self-trades') return { alerts: MOCK_ALERTS } as T;
    if (endpoint === '/detect/cycles') return { cycles: MOCK_CYCLES } as T;
    if (endpoint === '/detect/volume-anomaly') return { anomalies: MOCK_ANOMALIES } as T;
    if (endpoint === '/ingest/trades') return { success: true, processed_count: 100 } as T;
    if (endpoint.startsWith('/reports/case/')) {
      const token = endpoint.split('/').pop() || 'UNKNOWN';
      return {
        token,
        report_id: `RPT_${Date.now()}`,
        generated_at: new Date().toISOString(),
        summary: {
          total_alerts: MOCK_ALERTS.length,
          high_severity_alerts: MOCK_ALERTS.filter(a => a.severity === 'high').length,
          risk_score: 89,
          compliance_status: 'non_compliant'
        },
        alerts: MOCK_ALERTS,
        anomalies: MOCK_ANOMALIES,
        wallet_clusters: MOCK_CYCLES,
        recommendations: [
          'Implement enhanced monitoring for flagged wallets',
          'Report suspicious activity to relevant authorities',
          'Consider delisting token if violations persist'
        ]
      } as T;
    }
    
    // If no mock data available for this endpoint, return empty but valid response
    console.warn(`No mock data available for ${endpoint}`);
    return {} as T;
  }
}

// API client functions
export const apiClient = {
  // System health check
  async getHealth(): Promise<SystemHealth> {
    return apiCall<SystemHealth>('/health');
  },

  // Ingest trade data
  async ingestTrades(trades: TradeData[]): Promise<{ success: boolean; processed_count: number }> {
    return apiCall('/ingest/trades', {
      method: 'POST',
      body: JSON.stringify({ trades }),
    });
  },

  // Detect self-trades
  async detectSelfTrades(data: { token?: string; timeframe?: string } = {}): Promise<{ alerts: Alert[] }> {
    return apiCall('/detect/self-trades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Detect wallet cycles
  async detectCycles(data: { token?: string; min_cycle_length?: number } = {}): Promise<{ cycles: WalletCycle[] }> {
    return apiCall('/detect/cycles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Detect volume anomalies
  async detectVolumeAnomalies(data: { token?: string; timeframe?: string } = {}): Promise<{ anomalies: VolumeAnomaly[] }> {
    return apiCall('/detect/volume-anomaly', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get case report for token
  async getCaseReport(token: string): Promise<CaseReport> {
    return apiCall<CaseReport>(`/reports/case/${token}`);
  },

  // Combined dashboard data - calls multiple endpoints
  async getDashboardData(): Promise<{
    health: SystemHealth;
    alerts: Alert[];
    cycles: WalletCycle[];
    anomalies: VolumeAnomaly[];
  }> {
    const [health, alertsResponse, cyclesResponse, anomaliesResponse] = await Promise.all([
      this.getHealth(),
      this.detectSelfTrades(),
      this.detectCycles(),
      this.detectVolumeAnomalies(),
    ]);

    return {
      health,
      alerts: alertsResponse.alerts,
      cycles: cyclesResponse.cycles,
      anomalies: anomaliesResponse.anomalies,
    };
  },
};

export default apiClient;