import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  ChevronDown, 
  Calendar,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Eye,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import AIService from '../services/aiService';

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
}

export function Overview({ events }: OverviewProps) {
  const [timeGranularity, setTimeGranularity] = useState<'hourly' | 'daily' | 'monthly'>('daily');
  const [environment, setEnvironment] = useState('Any environment');
  const [dateRange, setDateRange] = useState('Last 7 days');

  // Calculate insights from events data
  const totalUsage = events.length;
  const uniqueVisitors = new Set(events.map(e => e.visitorId)).size;
  const eventsPerVisitor = totalUsage / uniqueVisitors;

  // Calculate changes (mock data for now)
  const usageChange = -64;
  const visitorsChange = -48;
  const eventsPerVisitorChange = -31;

  // Generate chart data for API usage
  const generateChartData = () => {
    const now = new Date();
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate realistic usage data
      const baseUsage = Math.floor(Math.random() * 200) + 100;
      const currentPeriodUsage = Math.floor(baseUsage * (1 + Math.random() * 0.5));
      const previousPeriodUsage = Math.floor(baseUsage * (1 + Math.random() * 0.3));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        current: currentPeriodUsage,
        previous: previousPeriodUsage,
      });
    }
    
    return data;
  };

  const chartData = generateChartData();

  // Generate top origins data
  const getTopOrigins = () => {
    const origins = events.reduce((acc, event) => {
      const origin = new URL(event.url).origin;
      acc[origin] = (acc[origin] || 0) + 1;
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
      acc[event.browser] = (acc[event.browser] || 0) + 1;
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
      acc[event.country] = (acc[event.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));
  };

  const topOrigins = getTopOrigins();
  const topBrowsers = getTopBrowsers();
  const topCountries = getTopCountries();

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
            <a href="#" className="text-xs text-blue-600 hover:text-blue-800">View health &gt;</a>
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
