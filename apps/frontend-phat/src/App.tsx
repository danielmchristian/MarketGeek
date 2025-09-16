import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, TrendingUp, Users, Eye, BarChart3, Activity, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { Separator } from './components/ui/separator';
import { DashboardOverview } from './components/DashboardOverview';
import { TokenMonitoring } from './components/TokenMonitoring';
import { AnomalyDetection } from './components/AnomalyDetection';
import { WalletClustering } from './components/WalletClustering';
import { ComplianceReports } from './components/ComplianceReports';
import { AlertsPanel } from './components/AlertsPanel';
import { apiClient, type SystemHealth, type Alert as ApiAlert } from './utils/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<ApiAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data and setup real-time monitoring
  useEffect(() => {
    loadDashboardData();
    
    // Poll for new alerts every 30 seconds
    const alertInterval = setInterval(() => {
      refreshAlerts();
    }, 30000);

    // Check system health every 60 seconds
    const healthInterval = setInterval(() => {
      checkSystemHealth();
    }, 60000);

    return () => {
      clearInterval(alertInterval);
      clearInterval(healthInterval);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const dashboardData = await apiClient.getDashboardData();
      setSystemHealth(dashboardData.health);
      setLiveAlerts(dashboardData.alerts.slice(0, 5)); // Keep latest 5 alerts
    } catch (error) {
      console.warn('API unavailable, using demo mode with mock data:', error);
      // Set mock data directly when API fails
      setSystemHealth({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(), 
        version: 'demo-mode' 
      });
      // The apiClient will return mock data, so we can still call it
      try {
        const mockData = await apiClient.getDashboardData();
        setLiveAlerts(mockData.alerts.slice(0, 5));
      } catch (mockError) {
        console.warn('Mock data fallback failed, using empty state');
        setLiveAlerts([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAlerts = async () => {
    try {
      const { alerts } = await apiClient.detectSelfTrades();
      setLiveAlerts(alerts.slice(0, 5)); // Keep latest 5 alerts
    } catch (error) {
      console.warn('Failed to refresh alerts, continuing with current data:', error);
      // Don't update alerts if refresh fails, keep current state
    }
  };

  const checkSystemHealth = async () => {
    try {
      const health = await apiClient.getHealth();
      setSystemHealth(health);
    } catch (error) {
      console.warn('API health check failed, running in demo mode:', error);
      setSystemHealth({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(), 
        version: 'demo-mode' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-slate-900">Loading WashGuard Pro</h2>
          <p className="text-slate-600">Connecting to detection systems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="font-semibold text-slate-900">WashGuard Pro</h1>
                  <p className="text-xs text-slate-500">Digital Asset Compliance Platform</p>
                </div>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  systemHealth?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-slate-600">
                  {systemHealth?.version === 'demo-mode' ? 'Demo Mode' : 
                   systemHealth?.status === 'healthy' ? 'System Healthy' : 'Issues Detected'}
                </span>
                {systemHealth?.version === 'demo-mode' && (
                  <Badge variant="outline" className="text-xs">
                    Mock Data
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">Demo User</p>
                <p className="text-xs text-slate-500">Compliance Analyst</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadDashboardData}
                disabled={isLoading}
              >
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Mode Banner */}
      {systemHealth?.version === 'demo-mode' && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Demo Mode: Displaying mock data - FastAPI backend not connected
              </span>
              <Badge variant="outline" className="ml-2 text-blue-700 border-blue-300">
                Mock Data Active
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Live Alerts Bar */}
      {liveAlerts.length > 0 && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">
                Latest Alert: {liveAlerts[0]?.description}
              </span>
              <Badge variant="destructive" className="ml-2">
                {liveAlerts[0]?.severity?.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="ml-2">
                {liveAlerts[0]?.token}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-6 bg-white">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="tokens" className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Tokens</span>
              </TabsTrigger>
              <TabsTrigger value="anomalies" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Anomalies</span>
              </TabsTrigger>
              <TabsTrigger value="clustering" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Clustering</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Reports</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Alerts</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <DashboardOverview systemHealth={systemHealth} />
          </TabsContent>

          <TabsContent value="tokens" className="space-y-6">
            <TokenMonitoring />
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-6">
            <AnomalyDetection />
          </TabsContent>

          <TabsContent value="clustering" className="space-y-6">
            <WalletClustering />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ComplianceReports />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <AlertsPanel alerts={liveAlerts} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}