import { useState, useEffect } from 'react';
import { AIChat } from './components/AIChat';
import { Button } from './components/ui/button';
import { 
  Compass, 
  Home, 
  FileText, 
  Zap, 
  Key, 
  Heart, 
  Lock, 
  Link as LinkIcon, 
  Puzzle, 
  FileBarChart, 
  Settings,
  Filter,
  Calendar,
  Download,
  Copy,
  ChevronDown,
} from 'lucide-react';

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
  suspectScore: number;
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

  const navigationItems = [
    { icon: Compass, label: 'Get started', active: false },
    { icon: Home, label: 'Overview', active: false },
    { icon: FileText, label: 'Identification', active: true },
    { icon: Zap, label: 'Smart Signals', active: false },
    { icon: Key, label: 'API keys', active: false },
    { icon: Heart, label: 'Health', active: false },
    { icon: Lock, label: 'Security', active: false },
    { icon: LinkIcon, label: 'Webhooks', active: false },
    { icon: Puzzle, label: 'Libraries & integrations', active: false },
    { icon: FileBarChart, label: 'Plan & usage', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

  const getCountryFlag = (country: string) => {
    const flagMap: { [key: string]: string } = {
      'United States': '🇺🇸',
      'Germany': '🇩🇪',
      'Sweden': '🇸🇪',
      'Turkey': '🇹🇷',
      'United Kingdom': '🇬🇧',
      'Canada': '🇨🇦',
      'France': '🇫🇷',
      'Netherlands': '🇳🇱',
      'Australia': '🇦🇺',
      'Japan': '🇯🇵',
    };
    return flagMap[country] || '🌍';
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex items-center justify-center w-full">
          <div className="text-lg text-gray-600">Loading live events...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex items-center justify-center w-full">
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
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Subscription Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Staging subscription</div>
              <div className="text-xs text-gray-500">Pro Plus</div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <a
                    href="#"
                    className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      item.active
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mr-3 ${item.active ? 'text-gray-900' : 'text-gray-500'}`} />
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
          <div className="flex items-center space-x-6 text-sm">
            <a href="#" className="text-gray-600 hover:text-gray-900">Share feedback</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Ask AI</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Docs</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Support</a>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
              S
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 bg-white p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Identification events</h1>
              <p className="text-sm text-gray-500">
                Select a row for details. Events data is also available by{' '}
                <a href="#" className="text-blue-600 hover:text-blue-800 underline">server API</a>.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline" size="sm" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                  <Calendar className="h-4 w-4 mr-2" />
                  Today
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={() => setIsChatOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.16.21 2.76.21 3.92 0C20.16 27 24 22.55 24 17V7l-10-5z"/>
                    <path d="M8 12h8"/>
                    <path d="M12 8v8"/>
                  </svg>
                  Analyze with AI
                </Button>
                <Button variant="outline" size="sm" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy link
                </Button>
              </div>
            </div>

            {/* Event Count */}
            <div className="text-sm text-gray-700 mb-4">
              {events.length} events matching
            </div>

            {/* Events Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      VISITOR ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      IP ADDRESS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      REQUEST ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      DATE
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.slice(0, 11).map((event, index) => (
                    <tr 
                      key={`${event.requestId}-${index}`} 
                      className="hover:bg-gray-50 cursor-pointer bg-white"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {event.visitorId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="mr-2">{getCountryFlag(event.country)}</span>
                          {event.ipAddress}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {event.requestId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric'
                        })}{' '}
                        {new Date(event.date).toLocaleTimeString('en-US', {
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* AI Chat */}
      <AIChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        csvData={events}
      />
    </div>
  );
}

export default App;
