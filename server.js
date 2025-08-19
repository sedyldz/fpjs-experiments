import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// FingerprintJS API endpoint to get events
app.get('/api/events', async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    // Get secret API key from environment
    const apiKey = process.env.FP_SECRET_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'FP_SECRET_KEY not found in environment variables'
      });
    }
    
    // Construct the FingerprintJS API URL (Global region for US)
    const baseUrl = 'https://api.stage.fpjs.sh';
    const endpoint = '/events/search';
    
    const params = new URLSearchParams({
      limit: limit.toString()
    });
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const url = `${baseUrl}${endpoint}?${params.toString()}`;
    
    console.log('Fetching events from:', url);
    console.log('Using API key:', apiKey.substring(0, 10) + '...');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Auth-API-Key': apiKey  // Use header authentication instead of query param
      }
    });
    
    if (!response.ok) {
      throw new Error(`FingerprintJS API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Debug: Log the raw response
    console.log('Raw API response:', JSON.stringify(data, null, 2));
    console.log('Data structure:', {
      hasData: !!data.data,
      dataLength: data.data?.length,
      dataKeys: data.data ? Object.keys(data.data[0] || {}) : 'no data'
    });
    
    // Transform the data to match your expected format
    const transformedEvents = data.events?.map(event => ({
      visitorId: event.visitorId,
      ipAddress: event.ipInfo?.v4?.address || event.ip,
      requestId: event.requestId,
      date: new Date(event.timestamp),
      browser: event.browserDetails?.browserName || 'Unknown',
      os: event.browserDetails?.os || 'Unknown',
      country: event.ipLocation?.country?.name || 'Unknown',
      city: event.ipLocation?.city?.name || 'Unknown',
      confidence: event.confidence?.score || 0,
      vpnDetected: event.vpn?.result === 'detected',
      botDetected: event.bot?.result === 'detected',
      linkedId: event.linkedId || '',
      url: event.url || '',
      userAgent: event.userAgent || ''
    })) || [];
    
    // Debug: Log the transformed data
    console.log('Transformed events:', transformedEvents.length, 'events');
    console.log('First transformed event:', transformedEvents[0]);
    
    res.json({
      success: true,
      data: transformedEvents,
      total: data.data?.length || 0
    });
    
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    apiKey: process.env.FP_SECRET_KEY ? '***' : 'NOT SET'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Environment variables loaded:', {
    FP_SECRET_KEY: process.env.FP_SECRET_KEY ? '***' : 'NOT SET'
  });
});
