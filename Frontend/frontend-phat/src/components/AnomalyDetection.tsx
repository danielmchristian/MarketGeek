import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Activity,
  BarChart3,
  Zap,
  Target,
  Users,
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
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import { apiClient, type VolumeAnomaly, type Alert } from '../utils/api';

/* ------------------------ SAMPLE / DEMO DATA (fallback) ------------------------ */

const sampleVolumeAnomalies = [
  { time: '00:00', normal: 100, actual: 120, threshold: 150 },
  { time: '02:00', normal: 80, actual: 90, threshold: 120 },
  { time: '04:00', normal: 60, actual: 280, threshold: 90 },
  { time: '06:00', normal: 90, actual: 310, threshold: 135 },
  { time: '08:00', normal: 150, actual: 480, threshold: 225 },
  { time: '10:00', normal: 200, actual: 220, threshold: 300 },
  { time: '12:00', normal: 180, actual: 190, threshold: 270 },
  { time: '14:00', normal: 160, actual: 170, threshold: 240 },
  { time: '16:00', normal: 140, actual: 350, threshold: 210 },
  { time: '18:00', normal: 120, actual: 130, threshold: 180 },
  { time: '20:00', normal: 100, actual: 110, threshold: 150 },
  { time: '22:00', normal: 90, actual: 95, threshold: 135 },
];

const samplePriceManipulation = [
  { time: '09:00', price: 100, volume: 50 },
  { time: '09:15', price: 102, volume: 80 },
  { time: '09:30', price: 98, volume: 120 },
  { time: '09:45', price: 105, volume: 200 },
  { time: '10:00', price: 110, volume: 350 },
  { time: '10:15', price: 108, volume: 180 },
  { time: '10:30', price: 112, volume: 90 },
  { time: '10:45', price: 115, volume: 60 },
  { time: '11:00', price: 109, volume: 40 },
];

const sampleWalletConnections = [
  { x: 10, y: 20, size: 50, cluster: 'A' },
  { x: 15, y: 25, size: 30, cluster: 'A' },
  { x: 12, y: 22, size: 40, cluster: 'A' },
  { x: 40, y: 60, size: 80, cluster: 'B' },
  { x: 45, y: 65, size: 60, cluster: 'B' },
  { x: 42, y: 58, size: 70, cluster: 'B' },
  { x: 80, y: 30, size: 90, cluster: 'C' },
  { x: 85, y: 35, size: 50, cluster: 'C' },
  { x: 78, y: 28, size: 60, cluster: 'C' },
];

const sampleDetectionAlgorithms = [
  {
    name: 'Wash Trading Detection',
    description: 'Identifies circular trading patterns between related entities',
    accuracy: 94.7,
    detections: 127,
    falsePositives: 3,
    status: 'active',
  },
  {
    name: 'Volume Inflation',
    description: 'Detects artificially inflated trading volumes',
    accuracy: 91.2,
    detections: 89,
    falsePositives: 8,
    status: 'active',
  },
  {
    name: 'Price Manipulation',
    description: 'Identifies coordinated price movement schemes',
    accuracy: 88.5,
    detections: 56,
    falsePositives: 7,
    status: 'active',
  },
  {
    name: 'Cross-Exchange Arbitrage',
    description: 'Monitors suspicious arbitrage patterns',
    accuracy: 85.1,
    detections: 34,
    falsePositives: 6,
    status: 'training',
  },
];

const sampleRecentAnomalies = [
  {
    type: 'Volume Spike',
    token: 'SHIB',
    severity: 'high',
    confidence: 96.5,
    description: 'Trading volume 480% above normal baseline',
    timestamp: '3 minutes ago',
    affectedExchanges: ['Binance', 'Uniswap'],
  },
  {
    type: 'Wash Trading',
    token: 'PEPE',
    severity: 'high',
    confidence: 94.2,
    description: 'Circular trading detected between 4 wallet addresses',
    timestamp: '8 minutes ago',
    affectedExchanges: ['Uniswap', 'SushiSwap'],
  },
  {
    type: 'Price Manipulation',
    token: 'DOGE',
    severity: 'medium',
    confidence: 87.3,
    description: 'Coordinated buy orders across multiple exchanges',
    timestamp: '15 minutes ago',
    affectedExchanges: ['Coinbase', 'Kraken', 'Binance'],
  },
];

/* ----------------------------- HELPER FUNCTIONS ----------------------------- */

function formatTimeAgo(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return date.toLocaleDateString();
}

const getClusterColor = (cluster: string) => {
  const colors: Record<string, string> = {
    A: '#3b82f6',
    B: '#ef4444',
    C: '#10b981',
  };
  return colors[cluster] || '#6b7280';
};

/* -------------------------------- COMPONENT -------------------------------- */

export function AnomalyDetection() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [anomalyData, setAnomalyData] = useState<{
    anomalies: VolumeAnomaly[];
    alerts: Alert[];
    isLoading: boolean;
  }>({
    anomalies: [],
    alerts: [],
    isLoading: true,
  });

  // Load anomaly data from API
  useEffect(() => {
    loadAnomalyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeframe]);

  const loadAnomalyData = async () => {
    try {
      setAnomalyData((prev) => ({ ...prev, isLoading: true }));

      // If your apiClient doesn’t take timeframe params, just call without args.
      const [anomaliesResponse, alertsResponse] = await Promise.all([
        apiClient.detectVolumeAnomalies(),
        apiClient.detectSelfTrades(),
      ]);

      setAnomalyData({
        anomalies: anomaliesResponse.anomalies || [],
        alerts: alertsResponse.alerts || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load anomaly data, using demo fallback:', error);
      setAnomalyData((prev) => ({ ...prev, isLoading: false }));
    }
  };

  /* ------------ Build data for charts from API (or fallback to samples) ------------ */

  const volumeChartData =
    anomalyData.anomalies.length > 0
      ? anomalyData.anomalies.map((anomaly) => ({
          time: new Date(anomaly.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          normal: Math.round((anomaly as any).normal_volume / 1000),
          actual: Math.round((anomaly as any).actual_volume / 1000),
          threshold: Math.round((anomaly as any).threshold / 1000),
          z_score: (anomaly as any).z_score,
        }))
      : sampleVolumeAnomalies;

  // Recent anomalies list (3 most recent from API, else sample list)
  const recentFromApi =
    anomalyData.anomalies.length > 0
      ? [...anomalyData.anomalies]
          .slice(-3)
          .reverse()
          .map((a) => {
            const ratio =
              (a as any).normal_volume > 0
                ? ((a as any).actual_volume / (a as any).normal_volume) * 100
                : 0;
            const severity =
              (a as any).severity ||
              ((a as any).z_score > 3
                ? 'high'
                : (a as any).z_score > 2
                ? 'medium'
                : 'low');

            return {
              type: 'Volume Spike',
              token: (a as any).token || 'TOKEN',
              severity,
              confidence: Math.min(99, Math.max(60, ((a as any).z_score || 0) * 15)),
              description: `Trading volume ${ratio.toFixed(0)}% above normal baseline`,
              timestamp: formatTimeAgo(a.timestamp),
              affectedExchanges: [(a as any).exchange || 'Binance'],
            };
          })
      : [];

  const recentToRender =
    recentFromApi.length > 0 ? recentFromApi : sampleRecentAnomalies;

  // Algorithm performance: if we have real data, compute dynamic metrics; else use sample
  const algorithmPerformance =
    anomalyData.anomalies.length > 0 || anomalyData.alerts.length > 0
      ? [
          {
            name: 'Volume Anomaly Detection',
            description:
              'Identifies unusual trading volume spikes using statistical analysis',
            accuracy:
              anomalyData.anomalies.length > 0
                ? (
                    (anomalyData.anomalies.filter(
                      (a) => (a as any).z_score > 2
                    ).length /
                      anomalyData.anomalies.length) *
                    100
                  ).toFixed(1)
                : '0.0',
            detections: anomalyData.anomalies.filter(
              (a) => (a as any).severity === 'high'
            ).length,
            falsePositives: Math.max(
              0,
              anomalyData.anomalies.filter(
                (a) => (a as any).z_score && (a as any).z_score < 2
              ).length
            ),
            status: 'active',
          },
          {
            name: 'Self-Trade Detection',
            description:
              'Detects trades where sender and receiver are the same entity',
            accuracy:
              anomalyData.alerts.length > 0
                ? (
                    (anomalyData.alerts.filter(
                      (a) => (a as any).confidence > 90
                    ).length /
                      anomalyData.alerts.length) *
                    100
                  ).toFixed(1)
                : '0.0',
            detections: anomalyData.alerts.filter(
              (a) => a.type === 'self_trade'
            ).length,
            falsePositives: anomalyData.alerts.filter(
              (a) => (a as any).confidence && (a as any).confidence < 70
            ).length,
            status: 'active',
          },
          {
            name: 'Wash Trading Detection',
            description:
              'Identifies circular trading patterns between related entities',
            accuracy:
              anomalyData.alerts.filter((a) => a.type === 'wash_trading')
                .length > 0
                ? (
                    (anomalyData.alerts.filter(
                      (a) =>
                        a.type === 'wash_trading' &&
                        (a as any).confidence > 85
                    ).length /
                      Math.max(
                        1,
                        anomalyData.alerts.filter(
                          (a) => a.type === 'wash_trading'
                        ).length
                      )) *
                    100
                  ).toFixed(1)
                : '0.0',
            detections: anomalyData.alerts.filter(
              (a) => a.type === 'wash_trading'
            ).length,
            falsePositives: anomalyData.alerts.filter(
              (a) =>
                a.type === 'wash_trading' &&
                (a as any).confidence &&
                (a as any).confidence < 70
            ).length,
            status: 'active',
          },
        ]
      : sampleDetectionAlgorithms;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Anomaly Detection
          </h2>
          <p className="text-slate-600">
            Advanced algorithms for identifying suspicious trading patterns
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedTimeframe}
            onValueChange={setSelectedTimeframe}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Detections
            </CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {anomalyData.isLoading
                ? '...'
                : anomalyData.anomalies.filter(
                    (a) => (a as any).severity === 'high'
                  ).length}
            </div>
            <p className="text-xs text-slate-500">High severity anomalies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Z-Score
            </CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {anomalyData.isLoading
                ? '...'
                : anomalyData.anomalies.length > 0
                ? (
                    anomalyData.anomalies.reduce(
                      (sum, a) => sum + ((a as any).z_score || 0),
                      0
                    ) / anomalyData.anomalies.length
                  ).toFixed(1)
                : '0.0'}
            </div>
            <p className="text-xs text-slate-500">Statistical significance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Tokens</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {anomalyData.isLoading
                ? '...'
                : new Set(
                    anomalyData.anomalies.map((a) => (a as any).token)
                  ).size}
            </div>
            <p className="text-xs text-slate-500">With anomalies detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {anomalyData.isLoading
                ? '...'
                : anomalyData.anomalies.length > 0
                ? `${(
                    (anomalyData.anomalies.filter(
                      (a) => (a as any).z_score > 2
                    ).length /
                      anomalyData.anomalies.length) *
                    100
                  ).toFixed(0)}%`
                : '0%'}
            </div>
            <p className="text-xs text-slate-500">
              Above threshold detections
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="realtime" className="space-y-6">
        <TabsList>
          <TabsTrigger value="realtime">Real-time Detection</TabsTrigger>
          <TabsTrigger value="algorithms">Algorithm Performance</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Analysis</TabsTrigger>
        </TabsList>

        {/* REAL-TIME TAB */}
        <TabsContent value="realtime" className="space-y-6">
          {/* Volume Anomaly Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Volume Anomaly Detection</CardTitle>
              <CardDescription>
                Real-time monitoring of trading volume against normal baselines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={volumeChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="normal"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.1}
                    name="Normal Volume"
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    name="Actual Volume"
                  />
                  <Line
                    type="monotone"
                    dataKey="threshold"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Alert Threshold"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Anomalies */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Anomalies</CardTitle>
              <CardDescription>
                Latest suspicious patterns detected by our algorithms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentToRender.map((anomaly, index) => (
                <div
                  key={index}
                  className="p-4 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {anomaly.token.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-slate-900">
                            {anomaly.token}
                          </span>
                          <Badge
                            variant={
                              anomaly.severity === 'high'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {anomaly.type}
                          </Badge>
                          <Badge variant="outline">
                            {anomaly.confidence.toFixed
                              ? anomaly.confidence.toFixed(1)
                              : anomaly.confidence}
                            % confidence
                          </Badge>
                        </div>
                        <p className="text-slate-600 mb-2">
                          {anomaly.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{anomaly.timestamp}</span>
                          </span>
                          <span>
                            Exchanges:{' '}
                            {anomaly.affectedExchanges.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Investigate
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALGORITHMS TAB */}
        <TabsContent value="algorithms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detection Algorithms</CardTitle>
              <CardDescription>
                Performance metrics for active detection systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {algorithmPerformance.map((algorithm, index) => (
                <div
                  key={index}
                  className="p-4 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          algorithm.status === 'active'
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}
                      />
                      <h3 className="font-medium text-slate-900">
                        {algorithm.name}
                      </h3>
                      <Badge variant="outline">{algorithm.status}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">
                        {algorithm.accuracy}%
                      </p>
                      <p className="text-sm text-slate-500">Accuracy</p>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-3">
                    {algorithm.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Detections (24h)</p>
                      <p className="font-medium text-green-600">
                        {algorithm.detections}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">False Positives</p>
                      <p className="font-medium text-red-600">
                        {algorithm.falsePositives}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PATTERNS TAB */}
        <TabsContent value="patterns" className="space-y-6">
          {/* Price vs Volume Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Price Manipulation Detection</CardTitle>
              <CardDescription>
                Correlation analysis between price movements and trading volume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={samplePriceManipulation}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="price" orientation="left" />
                  <YAxis yAxisId="volume" orientation="right" />
                  <Tooltip />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Price ($)"
                  />
                  <Line
                    yAxisId="volume"
                    type="monotone"
                    dataKey="volume"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Volume (K)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Wallet Clustering Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Clustering Analysis</CardTitle>
              <CardDescription>
                Suspicious wallet groups identified through transaction analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart data={sampleWalletConnections}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="x" name="Transaction Frequency" />
                  <YAxis dataKey="y" name="Volume Concentration" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter
                    dataKey="size"
                    name="Wallet Clusters"
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={Math.max(4, payload.size / 10)}
                          fill={getClusterColor(payload.cluster)}
                          opacity={0.8}
                        />
                      );
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-slate-600">
                    Cluster A (Low Risk)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-slate-600">
                    Cluster B (High Risk)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-slate-600">
                    Cluster C (Medium Risk)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
