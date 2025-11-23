// src/components/TokenMonitoring.tsx
import React, { useState, useEffect } from 'react';
import {
  Search,
  AlertTriangle,
  Eye,
  TrendingUp,
  TrendingDown,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

import { apiClient, type TokenSummary, type Alert } from '../utils/api';

export function TokenMonitoring() {
  const [tokens, setTokens] = useState<TokenSummary[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high_risk' | 'medium_risk' | 'low_risk'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<'riskScore' | 'alerts' | 'volume'>('riskScore');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load live data from backend on mount
  useEffect(() => {
    loadTokenData();
  }, []);

  const loadTokenData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [tokenSummaries, alertsResponse] = await Promise.all([
        apiClient.getTokenSummaries(),
        apiClient.detectSelfTrades({ timeframe: '24h' }),
      ]);

      setTokens(tokenSummaries || []);
      setAlerts(alertsResponse.alerts || []);
    } catch (err: any) {
      console.error('Failed to load token monitoring data:', err);
      setError(err.message || 'Failed to load token data');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskBadgeVariant = (status: string) => {
    switch (status) {
      case 'high_risk':
        return 'destructive';
      case 'medium_risk':
        return 'secondary';
      case 'low_risk':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getChangeColor = (change: string | number | undefined) => {
    const c = String(change || '');
    return c.startsWith('+') ? 'text-green-600' : 'text-red-600';
  };

  const parseVolume = (volume: string | number | undefined): number => {
    if (typeof volume === 'number') return volume;
    if (!volume) return 0;
    const numeric = Number(String(volume).replace(/[^0-9.]/g, ''));
    return isNaN(numeric) ? 0 : numeric;
  };

  const filteredTokens = tokens
    .filter((token) => {
      const term = searchTerm.toLowerCase();
      const symbol = token.symbol?.toLowerCase() || '';
      const name = token.name?.toLowerCase() || '';
      return symbol.includes(term) || name.includes(term);
    })
    .filter((token) => (filterRisk === 'all' ? true : token.status === filterRisk))
    .sort((a, b) => {
      if (sortBy === 'riskScore') {
        return (b.riskScore || 0) - (a.riskScore || 0);
      }
      if (sortBy === 'alerts') {
        return (b.alerts || 0) - (a.alerts || 0);
      }
      if (sortBy === 'volume') {
        return parseVolume(b.volume24h) - parseVolume(a.volume24h);
      }
      return 0;
    });

  // Helper for robust timestamp sorting/parsing
  const getAlertTime = (alert: Alert): number => {
    if (!alert.timestamp) return 0;
    const t = new Date(alert.timestamp).getTime();
    return isNaN(t) ? 0 : t;
  };

  // Build recent activity list from live alerts (last 24h)
  const recentActivity = alerts
    .slice()
    .sort((a, b) => getAlertTime(b) - getAlertTime(a))
    .slice(0, 10)
    .map((alert) => ({
      token: alert.token,
      type: alert.type,
      severity: alert.severity,
      description: alert.description,
      timestamp: alert.timestamp
        ? new Date(alert.timestamp).toLocaleString()
        : 'Unknown time',
      volume: alert.volume,
    }));

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Token Monitoring</h2>
          <p className="text-slate-600">
            Track suspicious wash trades and market manipulation across digital assets
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="w-fit"
            onClick={loadTokenData}
            disabled={isLoading}
          >
            Refresh
          </Button>

          {/* One-click Binance wash detection */}
          <Button
            className="w-fit"
            onClick={async () => {
              try {
                setError(null);
                setIsLoading(true);
                // Backend: Binance → ingestion/detection → wash_trading alerts
                const washAlerts = await apiClient.detectWashTradingFromBinance(
                  'BTCUSDT',
                  500
                );
                // Merge with existing alerts so Activity tab & dashboard can show them
                setAlerts((prev) => [...washAlerts, ...prev]);
              } catch (err: any) {
                console.error('Binance wash detection failed:', err);
                setError(err.message || 'Binance wash detection failed');
              } finally {
                setIsLoading(false);
              }
            }}
          >
            Run Binance Wash Scan (BTCUSDT)
          </Button>

          <Button className="w-fit">
            <Plus className="h-4 w-4 mr-2" />
            Add Token
          </Button>
        </div>
      </div>

      {/* Error banner (if any) */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-sm text-red-700">
            Failed to load data: {error}
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search tokens..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select
              value={filterRisk}
              onValueChange={(v) =>
                setFilterRisk(v as 'all' | 'high_risk' | 'medium_risk' | 'low_risk')
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="high_risk">High Risk</SelectItem>
                <SelectItem value="medium_risk">Medium Risk</SelectItem>
                <SelectItem value="low_risk">Low Risk</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as 'riskScore' | 'alerts' | 'volume')}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="riskScore">Risk Score</SelectItem>
                <SelectItem value="alerts">Alert Count</SelectItem>
                <SelectItem value="volume">24h Volume</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Monitored Tokens {isLoading ? '' : `(${filteredTokens.length})`}
              </CardTitle>
              <CardDescription>
                Real-time monitoring of digital asset trading patterns and wash trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-slate-500">Loading tokens…</div>
              ) : filteredTokens.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No tokens available. Start ingesting trades or adjust your filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>24h Change</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Risk Score</TableHead>
                        <TableHead>Alerts</TableHead>
                        <TableHead>Last Alert</TableHead>
                        <TableHead>Exchanges</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTokens.map((token) => (
                        <TableRow key={token.symbol} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {token.symbol?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {token.symbol || 'UNKNOWN'}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {token.name || ''}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {token.price ?? '-'}
                          </TableCell>
                          <TableCell>
                            <div
                              className={`flex items-center space-x-1 ${getChangeColor(
                                token.change24h
                              )}`}
                            >
                              {String(token.change24h || '').startsWith('+') ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span>{token.change24h ?? '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{token.volume24h ?? '-'}</TableCell>
                          <TableCell>
                            <Badge variant={getRiskBadgeVariant(token.status)}>
                              {token.riskScore != null ? `${token.riskScore}%` : 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span>{token.alerts ?? 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {token.lastAlert ? token.lastAlert : 'No recent alerts'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(token.exchanges || []).slice(0, 2).map((exchange) => (
                                <Badge
                                  key={exchange}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {exchange}
                                </Badge>
                              ))}
                              {token.exchanges && token.exchanges.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{token.exchanges.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Configure Alerts
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Generate Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Detection Activity</CardTitle>
              <CardDescription>
                Latest suspicious trading patterns and wash trades identified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="py-8 text-center text-slate-500">Loading alerts…</div>
              ) : recentActivity.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No alerts in the selected timeframe.
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="p-4 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {activity.token.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-900">
                              {activity.token}
                            </span>
                            <Badge
                              variant={
                                activity.severity === 'high'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {activity.type === 'wash_trading' ||
                              activity.type === 'self_trade'
                                ? 'Wash Trade'
                                : activity.severity}
                            </Badge>
                          </div>
                          <p className="text-slate-600 mt-1">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                            <span>{activity.timestamp}</span>
                            <span>Volume: {activity.volume}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Investigate
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYSIS TAB */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deep Analysis Tools</CardTitle>
              <CardDescription>
                Advanced analytics for comprehensive token & wash-trade investigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Transaction Graph</h3>
                  <p className="text-sm text-slate-500">
                    Visualize transaction flows and circular wash trade patterns.
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Wallet Clustering</h3>
                  <p className="text-sm text-slate-500">
                    Identify related wallet addresses acting as one entity.
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Volume Analysis</h3>
                  <p className="text-sm text-slate-500">
                    Detect artificial volume inflation consistent with wash trading.
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Price Manipulation</h3>
                  <p className="text-sm text-slate-500">
                    Identify coordinated price movements (pump-and-dump behavior).
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Cross-Exchange Analysis</h3>
                  <p className="text-sm text-slate-500">
                    Monitor suspicious activity across centralized and DeFi venues.
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Compliance Check</h3>
                  <p className="text-sm text-slate-500">
                    Validate patterns against SEC Rule 10b-5 style market manipulation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
