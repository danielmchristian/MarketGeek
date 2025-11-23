import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Eye,
  Activity,
  Users,
  BarChart3,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import {
  apiClient,
  type SystemHealth,
  type Alert as ApiAlert,
  type VolumeAnomaly,
  type VolumePoint,
} from '../utils/api';

interface DashboardOverviewProps {
  systemHealth: SystemHealth | null;
}

type DashboardState = {
  alerts: ApiAlert[];
  anomalies: VolumeAnomaly[];
  volumePoints: VolumePoint[];
  isLoading: boolean;
};


const SAMPLE_TRANSACTION_DATA = [
  { time: '09:00', volume: 20, normal: 15, alerts: 1, threshold: 18 },
  { time: '10:00', volume: 55, normal: 25, alerts: 3, threshold: 30 },
  { time: '11:00', volume: 80, normal: 35, alerts: 5, threshold: 40 },
  { time: '12:00', volume: 120, normal: 50, alerts: 7, threshold: 60 },
  { time: '13:00', volume: 60, normal: 40, alerts: 2, threshold: 50 },
  { time: '14:00', volume: 95, normal: 45, alerts: 4, threshold: 55 },
];

export function DashboardOverview({ systemHealth }: DashboardOverviewProps) {
  const [dashboardData, setDashboardData] = useState<DashboardState>({
    alerts: [],
    anomalies: [],
    volumePoints: [],
    isLoading: true,
  });

  // Load all dashboard data from backend on first mount
  useEffect(() => {
    void loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [alertsResponse, anomaliesResponse, volumeSeries] = await Promise.all([
        apiClient.detectSelfTrades(),        // /detect/self-trades  → wash/self-trade alerts
        apiClient.detectVolumeAnomalies(),   // /detect/volume-anomaly
        apiClient.getVolumeSeries(5),        // /statistics/volume-series?bucket_minutes=5
      ]);

      setDashboardData({
        alerts: alertsResponse.alerts || [],
        anomalies: anomaliesResponse.anomalies || [],
        volumePoints: volumeSeries.points || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // ============================
  // 1) Trading Volume & Alerts chart
  // ============================

  const transactionData =
    dashboardData.volumePoints.length > 0
      ? dashboardData.volumePoints.map((p: VolumePoint) => {
          const volumeMillions = +(p.total_volume / 1_000_000).toFixed(2);
          return {
            time: new Date(p.bucket).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            volume: volumeMillions,
            alerts: p.alert_count,
            // synthetic baseline/threshold purely for visualization
            normal: +(volumeMillions * 0.6).toFixed(2),
            threshold: +(volumeMillions * 0.8).toFixed(2),
          };
        })
      : dashboardData.anomalies.length > 0
      ? dashboardData.anomalies.map((anomaly: VolumeAnomaly) => ({
          time: new Date(anomaly.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          volume: Math.round(anomaly.actual_volume / 1_000_000),
          alerts: Math.floor(anomaly.z_score * 2),
          normal: Math.round(anomaly.normal_volume / 1_000_000),
          threshold: Math.round(anomaly.threshold / 1_000_000),
        }))
      : SAMPLE_TRANSACTION_DATA;

 
  // 2) Risk distribution donut
  // ============================

  const severityCounts = dashboardData.alerts.reduce(
    (acc, alert) => {
      const key = alert.severity || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const riskDistribution = [
    { name: 'High Risk', value: severityCounts.high || 0, color: '#ef4444' },
    { name: 'Medium Risk', value: severityCounts.medium || 0, color: '#f59e0b' },
    { name: 'Low Risk', value: severityCounts.low || 0, color: '#10b981' },
  ];

  // ============================
  // 3) Wash-trade–specific stats
  // ============================

  // Any alert where backend tagged `type` as "wash_trading" or "self_trade"
  const washAlerts = dashboardData.alerts.filter(
    a => a.type === 'wash_trading' || a.type === 'self_trade'
  );
  const washAlertCount = washAlerts.length;
  const washHighSeverity = washAlerts.filter(a => a.severity === 'high').length;

  // Unique tokens involved in any alert (used in cards / explanation)
  const uniqueTokenCount = dashboardData.alerts.length
    ? new Set(dashboardData.alerts.map(a => a.token)).size
    : 0;

  // ============================
  // 4) Top flagged tokens
  // ============================

  const tokenAlertAgg = dashboardData.alerts.reduce(
    (acc, alert) => {
      const symbol = alert.token || 'UNKNOWN';
      if (!acc[symbol]) {
        acc[symbol] = {
          count: 0,
          totalConfidence: 0,
          volume: alert.volume,
        };
      }
      acc[symbol].count += 1;
      acc[symbol].totalConfidence += alert.confidence || 0;
      // keep last seen volume as display value
      acc[symbol].volume = alert.volume ?? acc[symbol].volume;
      return acc;
    },
    {} as Record<string, { count: number; totalConfidence: number; volume: string | number | null }>
  );

  const topFlaggedTokens = Object.entries(tokenAlertAgg)
    .map(([symbol, data]) => ({
      symbol,
      alerts: data.count,
      riskScore: data.count ? Math.round(data.totalConfidence / data.count) : 0,
      volume: data.volume ?? 'N/A',
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 4);

  // ============================
  // Render
  // ============================

  return (
    <div className="space-y-6">
      {/* Key Metrics with wash-trade callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardData.isLoading ? '...' : dashboardData.alerts.length}
            </div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              High severity:{' '}
              {dashboardData.alerts.filter(a => a.severity === 'high').length}
            </p>
          </CardContent>
        </Card>

        {/* Wash trades metric – THIS is your “wash sale” showcase */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wash Trades Detected</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardData.isLoading ? '...' : washAlertCount}
            </div>
            <p className="text-xs text-slate-500">
              High severity: {washHighSeverity}
            </p>
          </CardContent>
        </Card>

        {/* Volume anomalies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Anomalies</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.isLoading ? '...' : dashboardData.anomalies.length}
            </div>
            <p className="text-xs text-slate-500">Detected this hour</p>
          </CardContent>
        </Card>

        {/* System health + quick token count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                systemHealth?.status === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {systemHealth?.status === 'healthy' ? '✓ OK' : '✗ ERROR'}
            </div>
            <p className="text-xs text-slate-500">
              {systemHealth
                ? `Last check: ${new Date(systemHealth.timestamp).toLocaleTimeString()}`
                : 'Checking...'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Tokens with alerts: {uniqueTokenCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume & alerts over time */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Volume & Alerts (24h)</CardTitle>
            <CardDescription>
              Live transaction volume and alert generation over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {transactionData.length > 0 ? (
                <AreaChart data={transactionData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name.includes('Volume')) {
                        return [`${value} M`, 'Volume ($M)`'];
                      }
                      if (name.includes('Alert')) {
                        return [value, 'Alert Count'];
                      }
                      return [value, name];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    name="Actual Volume ($M)"
                  />
                  <Area
                    type="monotone"
                    dataKey="normal"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.05}
                    name="Baseline Volume ($M)"
                  />
                  <Line
                    type="monotone"
                    dataKey="alerts"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Alert Count"
                  />
                </AreaChart>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  {dashboardData.isLoading
                    ? 'Loading chart data...'
                    : 'No volume data available'}
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk distribution donut */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>
              Current risk assessment across all monitored assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {riskDistribution.some(item => item.value > 0) ? (
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={value => [`${value}`, 'Alerts']} />
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  {dashboardData.isLoading
                    ? 'Loading risk data...'
                    : 'No risk data available'}
                </div>
              )}
            </ResponsiveContainer>

            <div className="flex justify-center space-x-4 mt-4">
              {riskDistribution.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top flagged tokens & system status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top flagged tokens list */}
        <Card>
          <CardHeader>
            <CardTitle>Top Flagged Tokens</CardTitle>
            <CardDescription>
              Tokens with the highest concentration of suspicious activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg animate-pulse"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-300 rounded-full" />
                      <div className="space-y-1">
                        <div className="w-16 h-4 bg-slate-300 rounded" />
                        <div className="w-20 h-3 bg-slate-300 rounded" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="w-16 h-4 bg-slate-300 rounded" />
                      <div className="w-12 h-3 bg-slate-300 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topFlaggedTokens.length > 0 ? (
              topFlaggedTokens.map(token => (
                <div
                  key={token.symbol}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {token.symbol.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{token.symbol}</p>
                      <p className="text-sm text-slate-500">
                        {String(token.volume)} volume
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={token.riskScore > 80 ? 'destructive' : 'secondary'}
                      >
                        Risk: {token.riskScore}%
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {token.alerts} alerts
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <p>No flagged tokens at this time</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System status + processing bars */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Real-time monitoring and processing status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API backend status */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">API Backend</span>
                <span
                  className={`text-sm ${
                    systemHealth?.status === 'healthy'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {systemHealth?.status === 'healthy' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <Progress
                value={systemHealth?.status === 'healthy' ? 100 : 0}
                className="h-2"
              />
              <p className="text-xs text-slate-500">
                Version: {systemHealth?.version || 'Unknown'}
              </p>
            </div>

            {/* Detection engine */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Detection Engine</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <Progress
                value={dashboardData.alerts.length > 0 ? 85 : 50}
                className="h-2"
              />
              <p className="text-xs text-slate-500">
                {dashboardData.alerts.length} active alerts
              </p>
            </div>

            {/* Anomaly detection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Anomaly Detection</span>
                <span className="text-sm text-blue-600">Processing</span>
              </div>
              <Progress
                value={dashboardData.anomalies.length > 0 ? 75 : 25}
                className="h-2"
              />
              <p className="text-xs text-slate-500">
                {dashboardData.anomalies.length} anomalies detected
              </p>
            </div>

            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Last Update</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                {systemHealth
                  ? new Date(systemHealth.timestamp).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions row */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-medium">Generate Report</h3>
                  <p className="text-sm text-slate-500">
                    Create a wash-trade / market manipulation report
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <Eye className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-medium">Add Token</h3>
                  <p className="text-sm text-slate-500">Monitor a new asset</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-medium">Review Alerts</h3>
                  <p className="text-sm text-slate-500">
                    Process pending wash-trade alerts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
