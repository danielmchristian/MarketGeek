import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, Search, AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

const complianceReports = [
  {
    id: 'RPT_2024_001',
    title: 'Q1 2024 Wash Trading Analysis',
    type: 'quarterly',
    status: 'completed',
    generatedBy: 'System Auto-Generate',
    createdDate: '2024-01-31',
    period: 'Q1 2024',
    tokensAnalyzed: 2847,
    violationsFound: 89,
    riskLevel: 'medium',
    downloadUrl: '#'
  },
  {
    id: 'RPT_2024_002',
    title: 'SHIB Token Compliance Review',
    type: 'token_specific',
    status: 'completed',
    generatedBy: 'John Analyst',
    createdDate: '2024-01-28',
    period: 'Jan 1-28, 2024',
    tokensAnalyzed: 1,
    violationsFound: 47,
    riskLevel: 'high',
    downloadUrl: '#'
  },
  {
    id: 'RPT_2024_003',
    title: 'Cross-Exchange Activity Report',
    type: 'exchange_analysis',
    status: 'in_progress',
    generatedBy: 'Sarah Compliance',
    createdDate: '2024-01-30',
    period: 'January 2024',
    tokensAnalyzed: 156,
    violationsFound: 23,
    riskLevel: 'medium',
    downloadUrl: null
  },
  {
    id: 'RPT_2024_004',
    title: 'High-Risk Wallet Cluster Analysis',
    type: 'wallet_analysis',
    status: 'pending',
    generatedBy: 'System Scheduled',
    createdDate: '2024-02-01',
    period: 'Feb 1-7, 2024',
    tokensAnalyzed: 0,
    violationsFound: 0,
    riskLevel: 'unknown',
    downloadUrl: null
  }
];

const reportTemplates = [
  {
    id: 'TMPL_001',
    name: 'SEC 10b-5 Compliance Report',
    description: 'Standard report for SEC Rule 10b-5 violations including wash trading and market manipulation',
    sections: ['Executive Summary', 'Methodology', 'Findings', 'Risk Assessment', 'Recommendations'],
    estimatedTime: '15-20 minutes'
  },
  {
    id: 'TMPL_002',
    name: 'Token-Specific Analysis',
    description: 'Detailed analysis of a specific digital asset including trading patterns and anomalies',
    sections: ['Token Overview', 'Trading Analysis', 'Anomaly Detection', 'Compliance Assessment'],
    estimatedTime: '10-15 minutes'
  },
  {
    id: 'TMPL_003',
    name: 'Wallet Cluster Investigation',
    description: 'Comprehensive report on wallet relationships and suspicious network activity',
    sections: ['Network Analysis', 'Entity Resolution', 'Risk Scoring', 'Violation Summary'],
    estimatedTime: '20-30 minutes'
  }
];

const auditTrail = [
  {
    timestamp: '2024-01-31 09:23:15',
    user: 'System',
    action: 'Report Generated',
    details: 'Q1 2024 Wash Trading Analysis completed',
    reportId: 'RPT_2024_001'
  },
  {
    timestamp: '2024-01-30 14:45:22',
    user: 'John Analyst',
    action: 'Report Downloaded',
    details: 'SHIB Token Compliance Review downloaded',
    reportId: 'RPT_2024_002'
  },
  {
    timestamp: '2024-01-30 11:12:08',
    user: 'Sarah Compliance',
    action: 'Report Initiated',
    details: 'Cross-Exchange Activity Report generation started',
    reportId: 'RPT_2024_003'
  },
  {
    timestamp: '2024-01-29 16:30:45',
    user: 'Admin',
    action: 'Template Modified',
    details: 'SEC 10b-5 Compliance Report template updated',
    reportId: null
  }
];

export function ComplianceReports() {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  const filteredReports = complianceReports.filter(report => {
    const matchesType = selectedType === 'all' || report.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Compliance Reports</h2>
          <p className="text-slate-600">Generate and manage regulatory compliance documentation</p>
        </div>
        <Button onClick={() => setShowGenerateForm(true)}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-slate-500">+3 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violations Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">159</div>
            <p className="text-xs text-slate-500">Across all reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">3</div>
            <p className="text-xs text-slate-500">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94.4%</div>
            <p className="text-xs text-slate-500">This quarter</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports">Report Library</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="generate">Generate New</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search reports..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="token_specific">Token Specific</SelectItem>
                    <SelectItem value="exchange_analysis">Exchange Analysis</SelectItem>
                    <SelectItem value="wallet_analysis">Wallet Analysis</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle>Reports ({filteredReports.length})</CardTitle>
              <CardDescription>Compliance reports and analysis documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Violations</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Generated By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{report.title}</p>
                            <p className="text-sm text-slate-500">{report.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(report.status)}
                            <Badge variant={getStatusBadgeVariant(report.status)}>
                              {report.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{report.period}</TableCell>
                        <TableCell>
                          {report.violationsFound > 0 ? (
                            <span className="text-red-600 font-medium">{report.violationsFound}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRiskBadgeVariant(report.riskLevel)}>
                            {report.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">{report.generatedBy}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {report.downloadUrl && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>Pre-configured templates for different types of compliance reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {reportTemplates.map((template) => (
                <div key={template.id} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-slate-900">{template.name}</h3>
                      <p className="text-slate-600 mt-1">{template.description}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Use Template
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-2">Included Sections</p>
                      <div className="flex flex-wrap gap-1">
                        {template.sections.map((section) => (
                          <Badge key={section} variant="outline" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Estimated Generation Time</p>
                      <p className="font-medium">{template.estimatedTime}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Complete history of report generation and access activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditTrail.map((entry, index) => (
                  <div key={index} className="flex items-start space-x-4 p-3 bg-slate-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-slate-900">{entry.action}</span>
                        <span className="text-slate-500">by {entry.user}</span>
                        {entry.reportId && (
                          <Badge variant="outline" className="text-xs">
                            {entry.reportId}
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 mb-1">{entry.details}</p>
                      <p className="text-xs text-slate-500">{entry.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>Create a custom compliance report based on your requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="report-title">Report Title</Label>
                    <Input id="report-title" placeholder="Enter report title" />
                  </div>
                  <div>
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quarterly">Quarterly Analysis</SelectItem>
                        <SelectItem value="token_specific">Token-Specific Review</SelectItem>
                        <SelectItem value="exchange_analysis">Exchange Analysis</SelectItem>
                        <SelectItem value="wallet_analysis">Wallet Investigation</SelectItem>
                        <SelectItem value="custom">Custom Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date-range">Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" placeholder="Start date" />
                      <Input type="date" placeholder="End date" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tokens">Tokens to Analyze (Optional)</Label>
                    <Input id="tokens" placeholder="BTC, ETH, SHIB (leave empty for all)" />
                  </div>
                  <div>
                    <Label htmlFor="exchanges">Exchanges (Optional)</Label>
                    <Input id="exchanges" placeholder="Binance, Coinbase, Uniswap" />
                  </div>
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea id="notes" placeholder="Special requirements or focus areas..." rows={3} />
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <Button className="flex-1">Generate Report</Button>
                <Button variant="outline" className="flex-1">
                  Save as Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}