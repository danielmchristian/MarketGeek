import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Filter,
  Search,
  Clock,
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

import { type Alert as ApiAlert } from '../utils/api';

const alertTypes = {
  wash_trading: { icon: Activity, color: 'text-red-500', bgColor: 'bg-red-50' },
  volume_spike: { icon: TrendingUp, color: 'text-orange-500', bgColor: 'bg-orange-50' },
  circular_trading: { icon: Activity, color: 'text-red-500', bgColor: 'bg-red-50' },
  price_manipulation: { icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-50' },
  cluster_activity: { icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  cross_exchange: { icon: Activity, color: 'text-green-500', bgColor: 'bg-green-50' },
};

// Fallback demo alerts if there is no live data
const mockAlerts = [
  {
    id: 'ALT_001',
    type: 'wash_trading',
    title: 'Wash Trading Pattern Detected',
    description: 'Circular trading activity identified between 4 wallet addresses on SHIB token',
    token: 'SHIB',
    severity: 'high',
    confidence: 96.5,
    timestamp: '2024-01-31T14:23:15Z',
    status: 'active',
    volume: '$45,230',
    exchanges: ['Uniswap', 'SushiSwap'],
    affectedWallets: 4,
    investigationNotes: '',
  },
  {
    id: 'ALT_002',
    type: 'volume_spike',
    title: 'Abnormal Volume Increase',
    description: 'Trading volume 340% above normal baseline for PEPE token',
    token: 'PEPE',
    severity: 'medium',
    confidence: 89.2,
    timestamp: '2024-01-31T14:15:08Z',
    status: 'investigating',
    volume: '$89,450',
    exchanges: ['Binance', 'KuCoin'],
    affectedWallets: 12,
    investigationNotes: 'Analyst reviewing transaction patterns',
  },
  {
    id: 'ALT_003',
    type: 'price_manipulation',
    title: 'Coordinated Price Movement',
    description: 'Synchronized buy orders across multiple exchanges detected',
    token: 'DOGE',
    severity: 'high',
    confidence: 92.8,
    timestamp: '2024-01-31T13:45:22Z',
    status: 'resolved',
    volume: '$127,890',
    exchanges: ['Coinbase', 'Binance', 'Kraken'],
    affectedWallets: 8,
    investigationNotes: 'Confirmed manipulation scheme. Report generated.',
  },
  {
    id: 'ALT_004',
    type: 'cluster_activity',
    title: 'Suspicious Wallet Cluster',
    description: 'New high-risk wallet cluster identified with coordinated trading patterns',
    token: 'FLOKI',
    severity: 'medium',
    confidence: 85.7,
    timestamp: '2024-01-31T12:30:45Z',
    status: 'active',
    volume: '$34,560',
    exchanges: ['Gate.io', 'MEXC'],
    affectedWallets: 23,
    investigationNotes: '',
  },
  {
    id: 'ALT_005',
    type: 'cross_exchange',
    title: 'Cross-Exchange Arbitrage',
    description: 'Rapid arbitrage trading detected across multiple platforms',
    token: 'ETH',
    severity: 'low',
    confidence: 76.3,
    timestamp: '2024-01-31T11:15:33Z',
    status: 'dismissed',
    volume: '$234,670',
    exchanges: ['Coinbase', 'Binance', 'Uniswap'],
    affectedWallets: 3,
    investigationNotes: 'Legitimate arbitrage activity confirmed',
  },
];

// 👉 Normalized alert shape for the UI
type UiAlert = {
  id: string;
  type: keyof typeof alertTypes | string;
  title: string;
  description: string;
  token: string;
  severity: 'high' | 'medium' | 'low' | string;
  confidence: number;
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved' | 'dismissed' | string;
  volume: string;
  exchanges: string[];
  affectedWallets: number;
  investigationNotes: string;
};

interface AlertsPanelProps {
  alerts: ApiAlert[]; // live alerts from backend (App passes liveAlerts here)
}

// 🔁 Map back-end Alert → UiAlert, with safe defaults
function mapApiAlert(alert: ApiAlert): UiAlert {
  return {
    id:
      (alert as any).alert_id ||
      (alert as any).id ||
      `${alert.token || 'ALERT'}-${alert.timestamp || Date.now()}`,
    type: (alert.type as any) || 'wash_trading',
    title:
      (alert as any).title ||
      (alert.type === 'self_trade'
        ? 'Self-Trade Detected'
        : 'Suspicious Trading Activity'),
    description:
      alert.description || 'Suspicious trading activity detected by detection engine.',
    token: alert.token || 'UNKNOWN',
    severity: (alert.severity as any) || 'medium',
    confidence:
      typeof (alert as any).confidence === 'number'
        ? (alert as any).confidence
        : 80,
    timestamp: alert.timestamp || new Date().toISOString(),
    status: 'active', // you can upgrade this later when you add workflow states
    volume:
      typeof (alert as any).volume === 'string'
        ? (alert as any).volume
        : (alert as any).volume != null
        ? String((alert as any).volume)
        : 'N/A',
    exchanges: (alert as any).exchanges
      ? (alert as any).exchanges
      : (alert as any).exchange
      ? [(alert as any).exchange]
      : [],
    affectedWallets: Array.isArray((alert as any).affected_addresses)
      ? (alert as any).affected_addresses.length
      : (alert as any).affectedWallets || 0,
    investigationNotes: (alert as any).investigationNotes || '',
  };
}

export function AlertsPanel({ alerts: liveAlerts }: AlertsPanelProps) {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<UiAlert | null>(null);

  // ✅ Use live alerts if we have them; otherwise fall back to mockAlerts
  const uiAlerts: UiAlert[] =
    liveAlerts && liveAlerts.length > 0
      ? liveAlerts.map(mapApiAlert)
      : mockAlerts;

  const filteredAlerts = uiAlerts.filter((alert) => {
    const matchesSeverity =
      filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesStatus =
      filterStatus === 'all' || alert.status === filterStatus;
    const matchesType = filterType === 'all' || alert.type === filterType;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      alert.title.toLowerCase().includes(term) ||
      alert.token.toLowerCase().includes(term) ||
      alert.id.toLowerCase().includes(term);
    return matchesSeverity && matchesStatus && matchesType && matchesSearch;
  });

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'destructive';
      case 'investigating':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'dismissed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const alertCounts = {
    total: uiAlerts.length,
    active: uiAlerts.filter((a) => a.status === 'active').length,
    high: uiAlerts.filter((a) => a.severity === 'high').length,
    investigating: uiAlerts.filter((a) => a.status === 'investigating').length,
  };

  // Live feed = same data source, just a different layout
  const liveFeedAlerts = uiAlerts.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Alert Management</h2>
          <p className="text-slate-600">
            Monitor and investigate suspicious trading activity alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Configure Alerts
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCounts.total}</div>
            <p className="text-xs text-slate-500">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alertCounts.active}
            </div>
            <p className="text-xs text-slate-500">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertCounts.high}</div>
            <p className="text-xs text-slate-500">Critical issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Investigation</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {alertCounts.investigating}
            </div>
            <p className="text-xs text-slate-500">Being reviewed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="investigating">Under Investigation</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="live">Live Feed</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search alerts..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Alert Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="wash_trading">Wash Trading</SelectItem>
                  <SelectItem value="volume_spike">Volume Spike</SelectItem>
                  <SelectItem value="price_manipulation">Price Manipulation</SelectItem>
                  <SelectItem value="cluster_activity">Cluster Activity</SelectItem>
                  <SelectItem value="cross_exchange">Cross Exchange</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="active" className="space-y-4">
          {filteredAlerts
            .filter((alert) => alert.status === 'active')
            .map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onSelect={setSelectedAlert}
              />
            ))}
        </TabsContent>

        <TabsContent value="investigating" className="space-y-4">
          {filteredAlerts
            .filter((alert) => alert.status === 'investigating')
            .map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onSelect={setSelectedAlert}
              />
            ))}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {filteredAlerts
            .filter((alert) => alert.status === 'resolved')
            .map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onSelect={setSelectedAlert}
              />
            ))}
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Alert Feed</CardTitle>
              <CardDescription>Real-time alerts as they are detected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {liveFeedAlerts.length > 0 ? (
                liveFeedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 border border-slate-200 rounded-lg bg-red-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {alert.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="destructive">
                              {alert.type.toString().toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{alert.token}</Badge>
                            <span className="text-sm text-slate-500">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Investigate
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p>No new alerts in the live feed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AlertCardProps {
  alert: UiAlert;
  onSelect: (alert: UiAlert) => void;
}

function AlertCard({ alert, onSelect }: AlertCardProps) {
  const AlertIcon = (alertTypes as any)[alert.type]?.icon || AlertTriangle;
  const iconColor = (alertTypes as any)[alert.type]?.color || 'text-slate-500';
  const bgColor = (alertTypes as any)[alert.type]?.bgColor || 'bg-slate-50';

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'destructive';
      case 'investigating':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'dismissed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-lg ${bgColor}`}>
              <AlertIcon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-slate-900">{alert.title}</h3>
                <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                  {alert.severity}
                </Badge>
                <Badge variant={getStatusBadgeVariant(alert.status)}>
                  {alert.status}
                </Badge>
              </div>
              <p className="text-slate-600 mb-3">{alert.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Token</p>
                  <p className="font-medium">{alert.token}</p>
                </div>
                <div>
                  <p className="text-slate-500">Volume</p>
                  <p className="font-medium">{alert.volume}</p>
                </div>
                <div>
                  <p className="text-slate-500">Confidence</p>
                  <p className="font-medium">{alert.confidence}%</p>
                </div>
                <div>
                  <p className="text-slate-500">Wallets</p>
                  <p className="font-medium">{alert.affectedWallets}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-500">
                  {formatTimestamp(alert.timestamp)} • Exchanges:{' '}
                  {alert.exchanges.join(', ')}
                </p>
              </div>
              {alert.investigationNotes && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                  <p className="text-blue-800">
                    Notes: {alert.investigationNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => onSelect(alert)}>
              Investigate
            </Button>
            {alert.status === 'active' && (
              <Button variant="outline" size="sm">
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
