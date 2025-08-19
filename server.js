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
    

    
    // Transform the data to match your expected format
    const transformedEvents = data.events?.map(event => {
      const identification = event.products?.identification?.data;
      const ipInfo = event.products?.ipInfo?.data;
      const botd = event.products?.botd?.data;
      const vpn = event.products?.vpn?.data;
      
      return {
        visitorId: identification?.visitorId || 'Unknown',
        ipAddress: ipInfo?.v4?.address || identification?.ip || 'Unknown',
        requestId: identification?.requestId || 'Unknown',
        date: identification?.timestamp ? new Date(identification.timestamp) : new Date(),
        browser: identification?.browserDetails?.browserName || 'Unknown',
        os: identification?.browserDetails?.os || 'Unknown',
        country: ipInfo?.v4?.geolocation?.country?.name || 'Unknown',
        city: ipInfo?.v4?.geolocation?.city?.name || 'Unknown',
        confidence: identification?.confidence?.score || 0,
        vpnDetected: vpn?.result === true,
        botDetected: botd?.bot?.result === 'bad',
        linkedId: identification?.linkedId || '',
        url: identification?.url || '',
        userAgent: identification?.userAgent || ''
      };
    }) || [];
    

    
    res.json({
      success: true,
      data: transformedEvents,
      total: data.events?.length || 0
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
