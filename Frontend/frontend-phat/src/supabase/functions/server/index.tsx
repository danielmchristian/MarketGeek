import { createClient } from 'npm:@supabase/supabase-js@^2.39.0';
import { Hono } from 'npm:hono@^4.0.0';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
}));

app.use('*', logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Routes
app.get('/make-server-6a524163/', (c) => {
  return c.json({ 
    message: 'WashGuard Pro API Server',
    version: '1.0.0',
    status: 'active'
  });
});

// User signup route
app.post('/make-server-6a524163/signup', async (c) => {
  try {
    const { email, password, name, organization } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        organization: organization || '',
        role: 'analyst'
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name,
      organization: organization || '',
      role: 'analyst',
      created_at: new Date().toISOString()
    });

    return c.json({ 
      message: 'User created successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Transaction data ingestion endpoint
app.post('/make-server-6a524163/transactions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const transactionData = await c.req.json();
    
    // Store transaction data
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(`transaction:${transactionId}`, {
      ...transactionData,
      id: transactionId,
      processed_at: new Date().toISOString(),
      processed_by: user.id
    });

    // Run anomaly detection
    const anomalies = await detectAnomalies(transactionData);
    
    if (anomalies.length > 0) {
      for (const anomaly of anomalies) {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await kv.set(`alert:${alertId}`, {
          id: alertId,
          type: anomaly.type,
          severity: anomaly.severity,
          confidence: anomaly.confidence,
          transaction_id: transactionId,
          description: anomaly.description,
          created_at: new Date().toISOString(),
          status: 'active'
        });
      }
    }

    return c.json({ 
      success: true,
      transaction_id: transactionId,
      anomalies_detected: anomalies.length
    });
  } catch (error) {
    console.error('Transaction processing error:', error);
    return c.json({ error: 'Failed to process transaction data' }, 500);
  }
});

// Get alerts endpoint
app.get('/make-server-6a524163/alerts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const alerts = await kv.getByPrefix('alert:');
    const sortedAlerts = alerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json({ alerts: sortedAlerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    return c.json({ error: 'Failed to retrieve alerts' }, 500);
  }
});

// Update alert status
app.put('/make-server-6a524163/alerts/:alertId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const alertId = c.req.param('alertId');
    const { status, notes } = await c.req.json();

    const alertKey = `alert:${alertId}`;
    const alert = await kv.get(alertKey);
    
    if (!alert) {
      return c.json({ error: 'Alert not found' }, 404);
    }

    const updatedAlert = {
      ...alert,
      status,
      notes: notes || alert.notes,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    };

    await kv.set(alertKey, updatedAlert);

    return c.json({ success: true, alert: updatedAlert });
  } catch (error) {
    console.error('Update alert error:', error);
    return c.json({ error: 'Failed to update alert' }, 500);
  }
});

// Generate compliance report
app.post('/make-server-6a524163/reports', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, type, dateRange, tokens, exchanges, notes } = await c.req.json();

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get relevant data for the report
    const alerts = await kv.getByPrefix('alert:');
    const transactions = await kv.getByPrefix('transaction:');
    
    // Filter data based on report parameters
    const filteredAlerts = alerts.filter(alert => {
      if (dateRange?.start && dateRange?.end) {
        const alertDate = new Date(alert.created_at);
        return alertDate >= new Date(dateRange.start) && alertDate <= new Date(dateRange.end);
      }
      return true;
    });

    const reportData = {
      id: reportId,
      title,
      type,
      status: 'completed',
      generated_by: user.id,
      generated_at: new Date().toISOString(),
      parameters: {
        dateRange,
        tokens: tokens?.split(',').map(t => t.trim()) || [],
        exchanges: exchanges?.split(',').map(e => e.trim()) || [],
        notes
      },
      summary: {
        total_alerts: filteredAlerts.length,
        high_severity: filteredAlerts.filter(a => a.severity === 'high').length,
        violations_found: filteredAlerts.filter(a => a.confidence > 90).length,
        tokens_analyzed: tokens ? tokens.split(',').length : 'all'
      },
      alerts: filteredAlerts.slice(0, 100) // Limit to 100 alerts for the report
    };

    await kv.set(`report:${reportId}`, reportData);

    return c.json({ 
      success: true,
      report_id: reportId,
      summary: reportData.summary
    });
  } catch (error) {
    console.error('Generate report error:', error);
    return c.json({ error: 'Failed to generate report' }, 500);
  }
});

// Get reports
app.get('/make-server-6a524163/reports', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const reports = await kv.getByPrefix('report:');
    const sortedReports = reports.sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());

    return c.json({ reports: sortedReports });
  } catch (error) {
    console.error('Get reports error:', error);
    return c.json({ error: 'Failed to retrieve reports' }, 500);
  }
});

// Wallet clustering analysis
app.post('/make-server-6a524163/analyze-wallets', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { wallets } = await c.req.json();

    // Simulate wallet clustering analysis
    const clusters = await performWalletClustering(wallets);

    return c.json({ 
      success: true,
      clusters,
      analysis_timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Wallet analysis error:', error);
    return c.json({ error: 'Failed to analyze wallets' }, 500);
  }
});

// Helper functions
async function detectAnomalies(transactionData: any) {
  const anomalies = [];

  // Volume spike detection
  if (transactionData.volume > 1000000) { // $1M threshold
    anomalies.push({
      type: 'volume_spike',
      severity: 'high',
      confidence: 85.5,
      description: `Unusual volume spike detected: $${transactionData.volume.toLocaleString()}`
    });
  }

  // Wash trading pattern detection
  if (transactionData.from_address === transactionData.to_address) {
    anomalies.push({
      type: 'wash_trading',
      severity: 'high',
      confidence: 95.0,
      description: 'Self-trading detected: same address as sender and receiver'
    });
  }

  // Rapid trading detection
  if (transactionData.frequency && transactionData.frequency > 100) {
    anomalies.push({
      type: 'rapid_trading',
      severity: 'medium',
      confidence: 78.2,
      description: `High frequency trading detected: ${transactionData.frequency} transactions/hour`
    });
  }

  return anomalies;
}

async function performWalletClustering(wallets: string[]) {
  // Simulate clustering algorithm
  const clusters = [
    {
      id: 'cluster_1',
      wallets: wallets.slice(0, Math.ceil(wallets.length / 3)),
      risk_score: 85.2,
      confidence: 92.1,
      pattern: 'circular_trading'
    },
    {
      id: 'cluster_2',
      wallets: wallets.slice(Math.ceil(wallets.length / 3), Math.ceil(2 * wallets.length / 3)),
      risk_score: 62.8,
      confidence: 78.5,
      pattern: 'coordinated_timing'
    }
  ];

  return clusters;
}

// Start the server
Deno.serve(app.fetch);