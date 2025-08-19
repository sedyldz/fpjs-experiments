import  { useState, useEffect } from 'react';
import { AnalyticsTable } from './components/AnalyticsTable';
import { AIChat } from './components/AIChat';

interface FingerprintEvent {
  visitorId: string;
  ipAddress: string;
  requestId: string;
  date: Date;
  browser: string;
  os: string;
  country: string;
  city: string;
  confidence: number;
  vpnDetected: boolean;
  botDetected: boolean;
  linkedId: string;
  url: string;
  userAgent: string;
}

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [events, setEvents] = useState<FingerprintEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch live events from our server-side API
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('http://localhost:3001/api/events?limit=100');
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setEvents(result.data);
          setError(null);
        } else {
          throw new Error(result.error || 'Failed to fetch events');
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="App p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">FingerprintJS Analytics Dashboard</h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading live events...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">FingerprintJS Analytics Dashboard</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              <strong>Error loading events:</strong> {error}
            </div>
            <div className="text-sm text-red-600 mt-2">
              Make sure VITE_FP_SECRET_KEY is set in your .env file.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">FingerprintJS Analytics Dashboard</h1>
        
        {/* Analytics Table */}
        <AnalyticsTable 
          csvData={events}
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        {/* AI Chat */}
        <AIChat 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)}
          csvData={events}
        />
      </div>
    </div>
  );
}

export default App;
