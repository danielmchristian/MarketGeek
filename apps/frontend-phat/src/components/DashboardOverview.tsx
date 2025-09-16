import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, TrendingUp, Eye, Activity, Users, BarChart3, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiClient, type SystemHealth, type Alert, type VolumeAnomaly } from '../utils/api';

interface DashboardOverviewProps {
  systemHealth: SystemHealth | null;
}

export function DashboardOverview({ systemHealth }: DashboardOverviewProps) {
  const [dashboardData, setDashboardData] = useState({
    alerts: [] as Alert[],
    anomalies: [] as VolumeAnomaly[],
    isLoading: true
  });

  // Load dashboard data from API
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [alertsResponse, anomaliesResponse] = await Promise.all([
        apiClient.detectSelfTrades(),
        apiClient.detectVolumeAnomalies()
      ]);

      setDashboardData({
        alerts: alertsResponse.alerts,
        anomalies: anomaliesResponse.anomalies,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Generate charts data from API responses
  const transactionData = dashboardData.anomalies.map((anomaly, index) => ({
    time: new Date(anomaly.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    volume: Math.round(anomaly.actual_volume / 1000), // Convert to K
    alerts: Math.floor(anomaly.z_score * 2), // Derive alert count from z-score
    normal: Math.round(anomaly.normal_volume / 1000),
    threshold: Math.round(anomaly.threshold / 1000)
  }));

  // Calculate risk distribution from alerts
  const riskCounts = dashboardData.alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskDistribution = [
    { name: 'High Risk', value: riskCounts.high || 0, color: '#ef4444' },
    { name: 'Medium Risk', value: riskCounts.medium || 0, color: '#f59e0b' },
    { name: 'Low Risk', value: riskCounts.low || 0, color: '#10b981' }
  ];

  // Get top flagged tokens from alerts
  const tokenAlertCounts = dashboardData.alerts.reduce((acc, alert) => {
    if (!acc[alert.token]) {
      acc[alert.token] = { count: 0, totalConfidence: 0, volume: alert.volume };
    }
    acc[alert.token].count++;
    acc[alert.token].totalConfidence += alert.confidence;
    return acc;
  }, {} as Record<string, { count: number; totalConfidence: number; volume: string }>);

  const topFlaggedTokens = Object.entries(tokenAlertCounts)
    .map(([symbol, data]) => ({
      symbol,
      alerts: data.count,
      riskScore: Math.round(data.totalConfidence / data.count),
      volume: data.volume
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 4);
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              High severity: {dashboardData.alerts.filter(a => a.severity === 'high').length}
            </p>
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Tokens</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.isLoading ? '...' : new Set(dashboardData.alerts.map(a => a.token)).size}
            </div>
            <p className="text-xs text-slate-500">Under investigation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              systemHealth?.status === 'healthy' ? 'text-green-600' : 'text-red-600'
            }`}>
              {systemHealth?.status === 'healthy' ? '✓ OK' : '✗ ERROR'}
            </div>
            <p className="text-xs text-slate-500">
              {systemHealth ? new Date(systemHealth.timestamp).toLocaleTimeString() : 'Checking...'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trading Volume & Alerts (24h)</CardTitle>
            <CardDescription>Transaction volume and alert generation over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {transactionData.length > 0 ? (
                <AreaChart data={transactionData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.1}
                    name="Actual Volume ($K)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="normal" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.05}
                    name="Normal Volume ($K)"
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
                  {dashboardData.isLoading ? 'Loading chart data...' : 'No anomaly data available'}
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Current risk assessment across all monitored assets</CardDescription>
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
                  <Tooltip formatter={(value) => [`${value}`, 'Count']} />
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  {dashboardData.isLoading ? 'Loading risk data...' : 'No risk data available'}
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

      {/* Top Flagged Tokens & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Flagged Tokens</CardTitle>
            <CardDescription>Tokens with highest suspicious activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-300 rounded-full"></div>
                      <div className="space-y-1">
                        <div className="w-16 h-4 bg-slate-300 rounded"></div>
                        <div className="w-20 h-3 bg-slate-300 rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="w-16 h-4 bg-slate-300 rounded"></div>
                      <div className="w-12 h-3 bg-slate-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topFlaggedTokens.length > 0 ? (
              topFlaggedTokens.map((token, index) => (
                <div key={token.symbol} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {token.symbol.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{token.symbol}</p>
                      <p className="text-sm text-slate-500">{token.volume} volume</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Badge variant={token.riskScore > 80 ? 'destructive' : 'secondary'}>
                        Risk: {token.riskScore}%
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{token.alerts} alerts</p>
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

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Real-time monitoring and processing status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">API Backend</span>
                <span className={`text-sm ${systemHealth?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                  {systemHealth?.status === 'healthy' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <Progress value={systemHealth?.status === 'healthy' ? 100 : 0} className="h-2" />
              <p className="text-xs text-slate-500">
                Version: {systemHealth?.version || 'Unknown'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Detection Engine</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <Progress value={dashboardData.alerts.length > 0 ? 85 : 50} className="h-2" />
              <p className="text-xs text-slate-500">
                {dashboardData.alerts.length} active alerts
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Anomaly Detection</span>
                <span className="text-sm text-blue-600">Processing</span>
              </div>
              <Progress value={dashboardData.anomalies.length > 0 ? 75 : 25} className="h-2" />
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
                {systemHealth ? new Date(systemHealth.timestamp).toLocaleString() : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
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
                  <p className="text-sm text-slate-500">Create compliance report</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <Eye className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-medium">Add Token</h3>
                  <p className="text-sm text-slate-500">Monitor new asset</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-medium">Review Alerts</h3>
                  <p className="text-sm text-slate-500">Process pending alerts</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}