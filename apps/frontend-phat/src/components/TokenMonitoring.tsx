import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, Eye, TrendingUp, TrendingDown, Plus, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const mockTokens = [
  {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    price: '$0.000008',
    change24h: '+12.3%',
    volume24h: '$2.4M',
    riskScore: 89,
    alerts: 47,
    status: 'high_risk',
    lastAlert: '2 min ago',
    exchanges: ['Binance', 'Uniswap', 'KuCoin']
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    price: '$0.074',
    change24h: '-2.1%',
    volume24h: '$1.8M',
    riskScore: 76,
    alerts: 32,
    status: 'medium_risk',
    lastAlert: '8 min ago',
    exchanges: ['Coinbase', 'Binance', 'Kraken']
  },
  {
    symbol: 'PEPE',
    name: 'Pepe',
    price: '$0.0000012',
    change24h: '+45.7%',
    volume24h: '$1.2M',
    riskScore: 71,
    alerts: 28,
    status: 'medium_risk',
    lastAlert: '15 min ago',
    exchanges: ['Uniswap', 'SushiSwap']
  },
  {
    symbol: 'FLOKI',
    name: 'Floki Inu',
    price: '$0.000015',
    change24h: '+8.9%',
    volume24h: '$890K',
    riskScore: 64,
    alerts: 19,
    status: 'medium_risk',
    lastAlert: '32 min ago',
    exchanges: ['Gate.io', 'MEXC']
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: '$43,267',
    change24h: '+1.2%',
    volume24h: '$12.5M',
    riskScore: 23,
    alerts: 3,
    status: 'low_risk',
    lastAlert: '2 hours ago',
    exchanges: ['Coinbase', 'Binance', 'Kraken', 'Gemini']
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: '$2,421',
    change24h: '+0.8%',
    volume24h: '$8.7M',
    riskScore: 18,
    alerts: 2,
    status: 'low_risk',
    lastAlert: '3 hours ago',
    exchanges: ['Coinbase', 'Binance', 'Uniswap']
  }
];

const recentActivity = [
  {
    token: 'SHIB',
    type: 'wash_trading',
    severity: 'high',
    description: 'Circular trading pattern detected between 3 wallets',
    timestamp: '2 minutes ago',
    volume: '$45K'
  },
  {
    token: 'PEPE',
    type: 'volume_spike',
    severity: 'medium',
    description: 'Unusual volume increase (340% above average)',
    timestamp: '8 minutes ago',
    volume: '$89K'
  },
  {
    token: 'DOGE',
    type: 'self_trading',
    severity: 'high',
    description: 'Same entity trading across multiple exchanges',
    timestamp: '15 minutes ago',
    volume: '$23K'
  }
];

export function TokenMonitoring() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [sortBy, setSortBy] = useState('riskScore');

  const filteredTokens = mockTokens
    .filter(token => 
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(token => filterRisk === 'all' || token.status === filterRisk)
    .sort((a, b) => {
      if (sortBy === 'riskScore') return b.riskScore - a.riskScore;
      if (sortBy === 'alerts') return b.alerts - a.alerts;
      if (sortBy === 'volume') return parseFloat(b.volume24h.replace(/[$MK,]/g, '')) - parseFloat(a.volume24h.replace(/[$MK,]/g, ''));
      return 0;
    });

  const getRiskBadgeVariant = (status: string) => {
    switch (status) {
      case 'high_risk': return 'destructive';
      case 'medium_risk': return 'secondary';
      case 'low_risk': return 'outline';
      default: return 'outline';
    }
  };

  const getChangeColor = (change: string) => {
    return change.startsWith('+') ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Token Monitoring</h2>
          <p className="text-slate-600">Track suspicious trading activity across digital assets</p>
        </div>
        <Button className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Add Token
        </Button>
      </div>

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
            <Select value={filterRisk} onValueChange={setFilterRisk}>
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
            <Select value={sortBy} onValueChange={setSortBy}>
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

        <TabsContent value="overview" className="space-y-6">
          {/* Tokens Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monitored Tokens ({filteredTokens.length})</CardTitle>
              <CardDescription>Real-time monitoring of digital asset trading patterns</CardDescription>
            </CardHeader>
            <CardContent>
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
                              {token.symbol.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{token.symbol}</p>
                              <p className="text-sm text-slate-500">{token.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{token.price}</TableCell>
                        <TableCell>
                          <div className={`flex items-center space-x-1 ${getChangeColor(token.change24h)}`}>
                            {token.change24h.startsWith('+') ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span>{token.change24h}</span>
                          </div>
                        </TableCell>
                        <TableCell>{token.volume24h}</TableCell>
                        <TableCell>
                          <Badge variant={getRiskBadgeVariant(token.status)}>
                            {token.riskScore}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span>{token.alerts}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500">{token.lastAlert}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {token.exchanges.slice(0, 2).map((exchange) => (
                              <Badge key={exchange} variant="outline" className="text-xs">
                                {exchange}
                              </Badge>
                            ))}
                            {token.exchanges.length > 2 && (
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Detection Activity</CardTitle>
              <CardDescription>Latest suspicious trading patterns identified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {activity.token.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-900">{activity.token}</span>
                          <Badge variant={activity.severity === 'high' ? 'destructive' : 'secondary'}>
                            {activity.severity}
                          </Badge>
                        </div>
                        <p className="text-slate-600 mt-1">{activity.description}</p>
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
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deep Analysis Tools</CardTitle>
              <CardDescription>Advanced analytics for comprehensive token investigation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Transaction Graph</h3>
                  <p className="text-sm text-slate-500">Visualize transaction flows and patterns</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Wallet Clustering</h3>
                  <p className="text-sm text-slate-500">Identify related wallet addresses</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Volume Analysis</h3>
                  <p className="text-sm text-slate-500">Detect artificial volume inflation</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Price Manipulation</h3>
                  <p className="text-sm text-slate-500">Identify coordinated price movements</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Cross-Exchange Analysis</h3>
                  <p className="text-sm text-slate-500">Monitor activity across platforms</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <h3 className="font-medium mb-2">Compliance Check</h3>
                  <p className="text-sm text-slate-500">Validate against SEC regulations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}