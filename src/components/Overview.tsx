import { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,

} from 'recharts';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { 
  ChevronDown, 
  Calendar,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Eye,

  RefreshCw
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

interface OverviewProps {
  events: FingerprintEvent[];
  onOpenChat?: (insight: string) => void;
}

export function Overview({ events, onOpenChat }: OverviewProps) {
  const [timeGranularity, setTimeGranularity] = useState<'hourly' | 'daily' | 'monthly'>('daily');
  const [environment, setEnvironment] = useState('Any environment');
  const [dateRange, setDateRange] = useState('Last 7 days');
  const [smartInsight, setSmartInsight] = useState<string>('');
  const [insightLoading, setInsightLoading] = useState<boolean>(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [hasGeneratedInsight, setHasGeneratedInsight] = useState<boolean>(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [eyeContainerRef, setEyeContainerRef] = useState<HTMLDivElement | null>(null);

  // Track cursor position
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setCursorPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate eye movement based on cursor position
  const getEyeMovement = () => {
    if (!eyeContainerRef) return { left: 0, right: 0 };
    
    const rect = eyeContainerRef.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate distance from center (max 3px movement)
    const deltaX = (cursorPosition.x - centerX) / 50;
    const deltaY = (cursorPosition.y - centerY) / 50;
    
    // Clamp the movement to reasonable bounds
    const maxMovement = 1.5;
    const leftX = Math.max(-maxMovement, Math.min(maxMovement, deltaX));
    const rightX = Math.max(-maxMovement, Math.min(maxMovement, deltaX));
    const leftY = Math.max(-maxMovement, Math.min(maxMovement, deltaY));
    const rightY = Math.max(-maxMovement, Math.min(maxMovement, deltaY));
    
    return { leftX, leftY, rightX, rightY };
  };

  const eyeMovement = getEyeMovement();

  // Generate smart insight when component loads (only once)
  useEffect(() => {
    const generateInsight = async () => {
      if (events.length > 0 && !hasGeneratedInsight && !insightLoading) {
        setInsightLoading(true);
        setInsightError(null);
        
        try {
          const response = await fetch('http://localhost:3001/api/smart-insight', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ events: events }) // Send all events
          });
          
          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }
          
          const result = await response.json();
          
          if (result.success) {
            setSmartInsight(result.insight);
            setHasGeneratedInsight(true);
          } else {
            setInsightError(result.error || 'Failed to generate insight');
          }
        } catch (error) {
          console.error('Error generating smart insight:', error);
          setInsightError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
          setInsightLoading(false);
        }
      }
    };

    generateInsight();
  }, [events.length, hasGeneratedInsight, insightLoading]);

  // Calculate insights from events data
  const totalUsage = events.length;
  const uniqueVisitors = new Set(events.map(e => e.visitorId).filter(Boolean)).size;
  const eventsPerVisitor = uniqueVisitors > 0 ? totalUsage / uniqueVisitors : 0;

  // Calculate changes (mock data for now)
  const usageChange = -64;
  const visitorsChange = -48;
  const eventsPerVisitorChange = -31;

  // Generate chart data for API usage based on actual data
  const chartData = useMemo(() => {
    const now = new Date();
    const data = [];
    
    // Group events by date
    const eventsByDate = events.reduce((acc, event) => {
      const eventDate = new Date(event.date);
      const dateKey = eventDate.toDateString();
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate average daily usage for realistic defaults
    const totalEvents = events.length;
    const averageDailyUsage = Math.max(10, Math.floor(totalEvents / 7));
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toDateString();
      
      // Get actual usage for this date, or use a realistic default
      const currentUsage = eventsByDate[dateKey] || Math.floor(averageDailyUsage * (0.5 + Math.random() * 0.5));
      
      // For previous period, use a consistent variation
      const variation = 0.7 + (Math.sin(i * 0.5) * 0.3); // Smooth variation
      const previousUsage = Math.floor(currentUsage * variation);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        current: currentUsage,
        previous: previousUsage,
      });
    }
    
    return data;
  }, [events.length]); // Only recalculate when events change

  // Generate top origins data
  const getTopOrigins = () => {
    const origins = events.reduce((acc, event) => {
      try {
        // Skip empty or invalid URLs
        if (!event.url || event.url.trim() === '') {
          return acc;
        }
        
        const origin = new URL(event.url).origin;
        acc[origin] = (acc[origin] || 0) + 1;
      } catch (error) {
        // Skip invalid URLs
        console.warn('Skipping invalid URL:', event.url);
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(origins)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([origin, count]) => ({ origin, count }));
  };

  // Generate top browsers data
  const getTopBrowsers = () => {
    const browsers = events.reduce((acc, event) => {
      const browser = event.browser || 'Unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(browsers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([browser, count]) => ({ browser, count }));
  };

  // Generate top countries data
  const getTopCountries = () => {
    const countries = events.reduce((acc, event) => {
      const country = event.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));
  };

  const topOrigins = useMemo(() => getTopOrigins(), [events]);
  const topBrowsers = useMemo(() => getTopBrowsers(), [events]);
  const topCountries = useMemo(() => getTopCountries(), [events]);

  // Debug logging
  console.log('Chart Data Debug:', {
    totalEvents: events.length,
    uniqueVisitors,
    eventsPerVisitor,
    chartDataLength: chartData.length,
    sampleChartData: chartData.slice(0, 3)
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Overview</h1>
      </div>

    

      {/* Subscription Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-900 mb-1">Status</div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">Active</span>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-900 mb-1">Plan</div>
          <div className="text-sm text-gray-700">Pro Plus</div>
          <a href="#" className="text-xs text-blue-600 hover:text-blue-800">View plans &gt;</a>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-900 mb-1">Usage</div>
          <div className="text-sm text-gray-700">{totalUsage.toLocaleString()}</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-900 mb-1">Next payment on</div>
          <div className="text-sm text-gray-700">Sep 13, 2025</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-900 mb-1">Health</div>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Minor issues found
            </Badge>
           
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="mb-8">
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Insights</h2>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              {environment}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" size="sm" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              <Calendar className="h-4 w-4 mr-2" />
              {dateRange}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

  {/* Smart Insight Section */}
  <div className="mb-8">
        <Card className=" relative overflow-hidden border-transparent shadow-none">
          {/* Grained gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-orange-100 to-orange-50 opacity-70"></div>
          {/* Grain overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px'
          }}></div>
          {/* Content wrapper */}
          <div className="relative z-10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Clippy Mascot */}
                <div className="relative" ref={setEyeContainerRef}>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center ">
                {/* Eyes */}
                    <div className={`flex space-x-1 ${insightLoading ? 'animate-look-around' : ''}`}>
                      <div 
                        className="w-1.5 h-1.5 bg-black rounded-full animate-natural-blink relative"
                        style={{
                          transform: `translate(${eyeMovement.leftX}px, ${eyeMovement.leftY}px)`,
                          transition: 'transform 0.1s ease-out'
                        }}
                      ></div>
                      <div 
                        className="w-1.5 h-1.5 bg-black rounded-full animate-natural-blink relative"
                        style={{
                          transform: `translate(${eyeMovement.rightX}px, ${eyeMovement.rightY}px)`,
                          transition: 'transform 0.1s ease-out'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                 
                  <CardTitle className="text-lg font-semibold text-gray-900">Insights by Fingerprint AI</CardTitle>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setInsightLoading(true);
                  setInsightError(null);
                  setHasGeneratedInsight(false);
                  
                  try {
                    const response = await fetch('http://localhost:3001/api/smart-insight', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ events: events })
                    });
                    
                    if (!response.ok) {
                      throw new Error(`Server error: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    
                    if (result.success) {
                      setSmartInsight(result.insight);
                      setHasGeneratedInsight(true);
                    } else {
                      setInsightError(result.error || 'Failed to generate insight');
                    }
                  } catch (error) {
                    console.error('Error generating smart insight:', error);
                    setInsightError(error instanceof Error ? error.message : 'Unknown error');
                  } finally {
                    setInsightLoading(false);
                  }
                }}
                disabled={insightLoading}
                className="flex items-center space-x-1 bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 hover:border-orange-300"
              >
                <RefreshCw className={`h-4 w-4 ${insightLoading ? 'animate-spin' : ''}`} />
                <span>Generate New Insight</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {insightLoading ? (
              <div className="flex items-center space-x-2 text-gray-700">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generating insight...</span>
              </div>
            ) : insightError ? (
              <div className="text-red-300 bg-red-900/20 p-3 rounded-md border border-red-500/30">
                <div className="font-medium">Error generating insight:</div>
                <div className="text-sm">{insightError}</div>
              </div>
            ) : smartInsight ? (
              <div className="space-y-4">
                <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{smartInsight}</ReactMarkdown>
                </div>
                
                {/* Follow-up Questions */}
                {onOpenChat && (
                  <div className="pt-3 border-t border-orange-200">
                    <div className="text-sm font-medium text-gray-800 mb-3">Ask me more about this:</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onOpenChat(`Analyze the security threats in detail: ${smartInsight}`)}
                        className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors border border-orange-200"
                      >
                        Analyze threats
                      </button>
                      <button
                        onClick={() => onOpenChat(`Show me VPN and bot detection patterns: ${smartInsight}`)}
                        className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors border border-orange-200"
                      >
                        VPN & Bot patterns
                      </button>
                      <button
                        onClick={() => onOpenChat(`What security measures should I implement? ${smartInsight}`)}
                        className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors border border-orange-200"
                      >
                        Security measures
                      </button>
                      <button
                        onClick={() => onOpenChat(`Show me geographic fraud patterns: ${smartInsight}`)}
                        className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors border border-orange-200"
                      >
                        Geographic patterns
                      </button>
                      <button
                        onClick={() => onOpenChat(`What are the risk levels and recommendations? ${smartInsight}`)}
                        className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors border border-orange-200" 
                      >
                        Risk assessment
                      </button>
                      <button
                        onClick={() => onOpenChat(`Compare with previous security incidents: ${smartInsight}`)}
                        className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors border border-orange-200"
                      >
                        Historical comparison
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-600 italic">
                No insight available. Click refresh to generate a new insight.
              </div>
            )}
          </CardContent>
          </div>
        </Card>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-gray-900">{totalUsage.toLocaleString()}</div>
                <Badge variant="secondary" className={`${usageChange < 0 ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                  {usageChange < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                  {Math.abs(usageChange)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unique visitors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-gray-900">{uniqueVisitors}</div>
                <Badge variant="secondary" className={`${visitorsChange < 0 ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                  {visitorsChange < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                  {Math.abs(visitorsChange)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Events per visitor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-gray-900">{eventsPerVisitor.toFixed(4)}</div>
                <Badge variant="secondary" className={`${eventsPerVisitorChange < 0 ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                  {eventsPerVisitorChange < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                  {Math.abs(eventsPerVisitorChange)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* API Usage Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">API usage</h2>
            <p className="text-sm text-gray-500">Shows API usage over time for the selected period.</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{totalUsage.toLocaleString()}</div>
            <div className="text-sm text-gray-500">-64% compared to Aug 6, 2025 - Aug 12, 2025</div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                <Button
                  variant={timeGranularity === 'hourly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeGranularity('hourly')}
                >
                  Hourly
                </Button>
                <Button
                  variant={timeGranularity === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeGranularity('daily')}
                >
                  Daily
                </Button>
                <Button
                  variant={timeGranularity === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeGranularity('monthly')}
                >
                  Monthly
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => value >= 1000 ? `${value/1000}K` : value.toString()}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f9fafb'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="current" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="previous" 
                    stroke="#d1d5db" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#d1d5db', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-600">Current period</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">Previous period</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Origins */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Top origins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topOrigins.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 truncate">{item.origin}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Browsers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Top browsers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topBrowsers.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 truncate">{item.browser}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Top countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCountries.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 truncate">{item.country}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
