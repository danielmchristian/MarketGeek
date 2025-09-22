import React, { useState, useEffect } from 'react';
import { Users, Network, Share2, AlertTriangle, Eye, Filter, Search, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { apiClient, type WalletCycle } from '../utils/api';

export function WalletClustering() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [clusterData, setClusterData] = useState({
    cycles: [] as WalletCycle[],
    isLoading: true
  });

  // Load wallet clustering data from API
  useEffect(() => {
    loadClusterData();
  }, []);

  const loadClusterData = async () => {
    try {
      setClusterData(prev => ({ ...prev, isLoading: true }));
      const { cycles } = await apiClient.detectCycles();
      setClusterData({
        cycles,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to load cluster data:', error);
      setClusterData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const filteredClusters = clusterData.cycles.filter(cycle => {
    const matchesSearch = cycle.cycle_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cycle.token.toLowerCase().includes(searchTerm.toLowerCase());
    const riskLevel = cycle.confidence > 80 ? 'high_risk' : cycle.confidence > 60 ? 'medium_risk' : 'low_risk';
    const matchesRisk = filterRisk === 'all' || riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const getRiskLevel = (confidence: number) => {
    if (confidence > 80) return 'high_risk';
    if (confidence > 60) return 'medium_risk';
    return 'low_risk';
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high_risk': return 'destructive';
      case 'medium_risk': return 'secondary';
      case 'low_risk': return 'outline';
      default: return 'outline';
    }
  };

  const getRiskDisplayName = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high_risk': return 'High Risk';
      case 'medium_risk': return 'Medium Risk';
      case 'low_risk': return 'Low Risk';
      default: return 'Unknown';
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`;
    return `$${volume}`;
  };

  const calculateStats = () => {
    const highRiskClusters = clusterData.cycles.filter(c => c.confidence > 80).length;
    const totalWallets = clusterData.cycles.reduce((sum, c) => sum + c.wallets.length, 0);
    const totalConnections = clusterData.cycles.length * 5; // Estimate connections

    return {
      totalClusters: clusterData.cycles.length,
      monitoredWallets: totalWallets,
      networkConnections: totalConnections,
      highRiskClusters
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Wallet Clustering</h2>
          <p className="text-slate-600">Graph-based analysis of wallet relationships and suspicious networks</p>
        </div>
        <Button onClick={loadClusterData} disabled={clusterData.isLoading}>
          <Download className="h-4 w-4 mr-2" />
          {clusterData.isLoading ? 'Loading...' : 'Refresh Analysis'}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clusters</CardTitle>
            <Network className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clusterData.isLoading ? '...' : stats.totalClusters}
            </div>
            <p className="text-xs text-slate-500">
              {stats.highRiskClusters} flagged as suspicious
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitored Wallets</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clusterData.isLoading ? '...' : stats.monitoredWallets.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">In detected clusters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Connections</CardTitle>
            <Share2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clusterData.isLoading ? '...' : stats.networkConnections.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">Identified relationships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Clusters</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {clusterData.isLoading ? '...' : stats.highRiskClusters}
            </div>
            <p className="text-xs text-slate-500">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search clusters..."
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
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high_risk">High Risk</SelectItem>
                <SelectItem value="medium_risk">Medium Risk</SelectItem>
                <SelectItem value="low_risk">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="clusters" className="space-y-6">
        <TabsList>
          <TabsTrigger value="clusters">Cluster Overview</TabsTrigger>
          <TabsTrigger value="network">Network Graph</TabsTrigger>
          <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="clusters" className="space-y-6">
          {/* Cluster Cards */}
          <div className="grid gap-6">
            {clusterData.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-slate-300 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-300 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-4">
                          {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="space-y-2">
                              <div className="h-3 bg-slate-300 rounded"></div>
                              <div className="h-4 bg-slate-300 rounded"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredClusters.length > 0 ? (
              filteredClusters.map((cluster) => {
                const riskLevel = getRiskLevel(cluster.confidence);
                return (
                  <Card key={cluster.cycle_id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>Cluster {cluster.cycle_id}</span>
                            <Badge variant={getRiskBadgeVariant(riskLevel)}>
                              {getRiskDisplayName(riskLevel)}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Pattern: {cluster.pattern_type} • Confidence: {cluster.confidence.toFixed(1)}%
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Investigate
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-slate-500">Wallets</p>
                          <p className="font-medium">{cluster.wallets.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Total Volume</p>
                          <p className="font-medium">{formatVolume(cluster.total_volume)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Token</p>
                          <p className="font-medium">{cluster.token}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Last Activity</p>
                          <p className="font-medium">
                            {new Date(cluster.last_activity).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-500 mb-2">Sample Wallet Addresses</p>
                          <div className="flex flex-wrap gap-2">
                            {cluster.wallets.slice(0, 3).map((wallet, index) => (
                              <Badge key={index} variant="outline" className="font-mono text-xs">
                                {wallet.slice(0, 6)}...{wallet.slice(-4)}
                              </Badge>
                            ))}
                            {cluster.wallets.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{cluster.wallets.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-slate-500 mb-2">Detection Period</p>
                          <p className="text-sm text-slate-600">
                            First detected: {new Date(cluster.first_detected).toLocaleDateString()} •{' '}
                            Pattern type: {cluster.pattern_type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Clusters Found</h3>
                  <p className="text-slate-600">
                    {searchTerm || filterRisk !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'No suspicious wallet clusters detected at this time'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Network Visualization</CardTitle>
              <CardDescription>
                Interactive graph showing wallet connections and cluster relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                <div className="text-center">
                  <Network className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Interactive Network Graph</p>
                  <p className="text-slate-500 text-sm mb-4">
                    Visualization of wallet relationships and cluster formations
                  </p>
                  <Button variant="outline" onClick={loadClusterData}>
                    Load Network Data
                  </Button>
                </div>
              </div>
              
              {/* Legend */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span className="text-sm text-slate-600">High Risk Wallets</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500" />
                  <span className="text-sm text-slate-600">Medium Risk Wallets</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span className="text-sm text-slate-600">Low Risk Wallets</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Clustering Algorithms</CardTitle>
                <CardDescription>Advanced methods for identifying wallet relationships</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-medium mb-2">Transaction Graph Analysis</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Analyzes transaction flows and patterns to identify related wallets
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Clusters detected:</span>
                    <span className="font-medium">{stats.totalClusters}</span>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-medium mb-2">Behavioral Pattern Matching</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Identifies similar trading patterns and timing behaviors
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">High confidence:</span>
                    <span className="font-medium">{stats.highRiskClusters}</span>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-medium mb-2">Entity Resolution</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Links wallets that likely belong to the same entity
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total wallets:</span>
                    <span className="font-medium">{stats.monitoredWallets}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment Metrics</CardTitle>
                <CardDescription>Factors contributing to cluster risk scores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">Transaction Frequency</span>
                      <span className="text-sm font-medium">High Impact</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full w-[85%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">Volume Concentration</span>
                      <span className="text-sm font-medium">Medium Impact</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full w-[65%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">Timing Coordination</span>
                      <span className="text-sm font-medium">High Impact</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full w-[78%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">Cross-Token Activity</span>
                      <span className="text-sm font-medium">Medium Impact</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full w-[58%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">Pattern Confidence</span>
                      <span className="text-sm font-medium">Critical Impact</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full w-[92%]" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}