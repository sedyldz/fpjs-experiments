import  { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MessageCircle, Send, X, BarChart3, PieChart, TrendingUp, Globe, Shield, Monitor } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CSVEvent {
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

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  chart?: {
    type: 'bar' | 'line' | 'pie';
    data: any[];
    title: string;
  };
  timestamp: Date;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ff6b6b', '#4ecdc4'];

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  csvData: CSVEvent[];
}

export function AIChat({ isOpen, onClose, csvData }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: `Hello! I'm your FingerprintJS AI analytics assistant. I can analyze your identification events and help you understand visitor patterns, security insights, and geographic distribution. Try asking me about visitor activity, browser analysis, geographic data, or security threats!`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateChartData = (question: string) => {
    const lowerQuestion = question.toLowerCase();

    // Visitor activity analysis
    if (lowerQuestion.includes('visitor') || lowerQuestion.includes('activity') || lowerQuestion.includes('patterns')) {
      const visitorCounts = csvData.reduce((acc, event) => {
        acc[event.visitorId] = (acc[event.visitorId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        type: 'bar' as const,
        data: Object.entries(visitorCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([visitorId, count]) => ({ 
            visitor: visitorId.slice(0, 8) + '...', 
            requests: count 
          })),
        title: 'Top 10 Visitors by Request Count'
      };
    }

    // Geographic analysis
    if (lowerQuestion.includes('location') || lowerQuestion.includes('country') || lowerQuestion.includes('city') || lowerQuestion.includes('geographic')) {
      const countryCounts = csvData.reduce((acc, event) => {
        const country = event.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        type: 'pie' as const,
        data: Object.entries(countryCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8)
          .map(([name, value]) => ({ name, value })),
        title: 'Requests by Country'
      };
    }

    // Browser analysis
    if (lowerQuestion.includes('browser') || lowerQuestion.includes('chrome') || lowerQuestion.includes('safari') || lowerQuestion.includes('firefox')) {
      const browserCounts = csvData.reduce((acc, event) => {
        const browser = event.browser || 'Unknown';
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        type: 'bar' as const,
        data: Object.entries(browserCounts)
          .sort(([,a], [,b]) => b - a)
          .map(([browser, count]) => ({ browser, requests: count })),
        title: 'Browser Distribution'
      };
    }

    // Operating system analysis
    if (lowerQuestion.includes('os') || lowerQuestion.includes('operating system') || lowerQuestion.includes('mac') || lowerQuestion.includes('windows')) {
      const osCounts = csvData.reduce((acc, event) => {
        const os = event.os || 'Unknown';
        acc[os] = (acc[os] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        type: 'pie' as const,
        data: Object.entries(osCounts)
          .sort(([,a], [,b]) => b - a)
          .map(([name, value]) => ({ name, value })),
        title: 'Operating System Distribution'
      };
    }

    // Security analysis
    if (lowerQuestion.includes('security') || lowerQuestion.includes('vpn') || lowerQuestion.includes('bot') || lowerQuestion.includes('threat') || lowerQuestion.includes('suspicious')) {
      const securityData = [
        { name: 'VPN Detected', value: csvData.filter(e => e.vpnDetected).length },
        { name: 'Bot Detected', value: csvData.filter(e => e.botDetected).length },
        { name: 'Clean Requests', value: csvData.filter(e => !e.vpnDetected && !e.botDetected).length }
      ];

      return {
        type: 'pie' as const,
        data: securityData.filter(item => item.value > 0),
        title: 'Security Threat Analysis'
      };
    }

    // Time-based analysis
    if (lowerQuestion.includes('time') || lowerQuestion.includes('hour') || lowerQuestion.includes('when') || lowerQuestion.includes('timeline')) {
      const hourlyData = csvData.reduce((acc, event) => {
        const hour = event.date.getHours();
        const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
        acc[hourLabel] = (acc[hourLabel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        type: 'line' as const,
        data: Object.entries(hourlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([hour, count]) => ({ hour, requests: count })),
        title: 'Hourly Request Activity'
      };
    }

    // IP address analysis
    if (lowerQuestion.includes('ip') || lowerQuestion.includes('address')) {
      const ipCounts = csvData.reduce((acc, event) => {
        acc[event.ipAddress] = (acc[event.ipAddress] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        type: 'bar' as const,
        data: Object.entries(ipCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8)
          .map(([ip, count]) => ({ ip: ip.slice(0, 12) + '...', requests: count })),
        title: 'Top IP Addresses by Request Count'
      };
    }

    // Confidence score analysis
    if (lowerQuestion.includes('confidence') || lowerQuestion.includes('score') || lowerQuestion.includes('accuracy')) {
      const confidenceRanges = csvData.reduce((acc, event) => {
        const score = event.confidence;
        let range = '';
        if (score >= 0.9) range = '90-100%';
        else if (score >= 0.8) range = '80-89%';
        else if (score >= 0.7) range = '70-79%';
        else if (score >= 0.6) range = '60-69%';
        else range = 'Below 60%';
        acc[range] = (acc[range] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        type: 'bar' as const,
        data: Object.entries(confidenceRanges)
          .sort(([a], [b]) => {
            const aNum = parseInt(a.split('-')[0]);
            const bNum = parseInt(b.split('-')[0]);
            return bNum - aNum;
          })
          .map(([range, count]) => ({ range, requests: count })),
        title: 'Confidence Score Distribution'
      };
    }

    // Default: visitor distribution
    const visitorCounts = csvData.reduce((acc, event) => {
      acc[event.visitorId] = (acc[event.visitorId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      type: 'pie' as const,
      data: Object.entries(visitorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([name, value]) => ({ 
          name: name.slice(0, 8) + '...', 
          value 
        })),
      title: 'Top Visitors by Request Count'
    };
  };

  const generateAIResponse = (question: string) => {
    const lowerQuestion = question.toLowerCase();
    
    const totalEvents = csvData.length;
    const uniqueVisitors = new Set(csvData.map(e => e.visitorId)).size;
    const uniqueIPs = new Set(csvData.map(e => e.ipAddress)).size;
    const uniqueCountries = new Set(csvData.map(e => e.country).filter(Boolean)).size;
    const vpnDetected = csvData.filter(e => e.vpnDetected).length;
    const botDetected = csvData.filter(e => e.botDetected).length;
    const avgConfidence = csvData.reduce((sum, e) => sum + e.confidence, 0) / totalEvents;
    
    if (lowerQuestion.includes('visitor') || lowerQuestion.includes('activity')) {
      const mostActiveVisitor = Object.entries(csvData.reduce((acc, event) => {
        acc[event.visitorId] = (acc[event.visitorId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)).sort(([,a], [,b]) => b - a)[0];
      
      return `Your FingerprintJS data shows ${totalEvents} identification events from ${uniqueVisitors} unique visitors. The most active visitor (${mostActiveVisitor[0].slice(0, 8)}...) has generated ${mostActiveVisitor[1]} requests. This represents concentrated activity patterns that could indicate regular users or potential bot activity.`;
    }
    
    if (lowerQuestion.includes('location') || lowerQuestion.includes('country') || lowerQuestion.includes('geographic')) {
      const topCountry = Object.entries(csvData.reduce((acc, event) => {
        const country = event.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)).sort(([,a], [,b]) => b - a)[0];
      
      return `Geographic analysis shows activity from ${uniqueCountries} countries across ${uniqueIPs} unique IP addresses. The majority of requests (${topCountry[1]} events) come from ${topCountry[0]}. This geographic distribution helps identify your user base and detect unusual access patterns.`;
    }
    
    if (lowerQuestion.includes('browser') || lowerQuestion.includes('chrome') || lowerQuestion.includes('safari')) {
      const topBrowser = Object.entries(csvData.reduce((acc, event) => {
        const browser = event.browser || 'Unknown';
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)).sort(([,a], [,b]) => b - a)[0];
      
      return `Browser analysis reveals that ${topBrowser[0]} is the most popular browser with ${topBrowser[1]} requests (${((topBrowser[1] / totalEvents) * 100).toFixed(1)}% of total). This browser distribution helps optimize your application for your most common user base.`;
    }
    
    if (lowerQuestion.includes('security') || lowerQuestion.includes('vpn') || lowerQuestion.includes('threat')) {
      const threatPercentage = ((vpnDetected + botDetected) / totalEvents * 100).toFixed(1);
      return `Security analysis shows ${vpnDetected} VPN connections and ${botDetected} bot detections out of ${totalEvents} total events (${threatPercentage}% potential threats). The average confidence score is ${avgConfidence.toFixed(2)}, indicating ${avgConfidence > 0.8 ? 'high' : avgConfidence > 0.6 ? 'moderate' : 'low'} identification accuracy.`;
    }
    
    if (lowerQuestion.includes('time') || lowerQuestion.includes('hour') || lowerQuestion.includes('when')) {
      const timeRange = csvData.reduce((acc, event) => {
        acc.min = Math.min(acc.min, event.date.getHours());
        acc.max = Math.max(acc.max, event.date.getHours());
        return acc;
      }, { min: 23, max: 0 });
      
      return `Activity occurs between ${timeRange.min.toString().padStart(2, '0')}:00 and ${timeRange.max.toString().padStart(2, '0')}:00. This temporal pattern helps identify peak usage hours and can assist in detecting unusual access patterns outside normal business hours.`;
    }
    
    if (lowerQuestion.includes('confidence') || lowerQuestion.includes('score')) {
      const highConfidence = csvData.filter(e => e.confidence >= 0.8).length;
      const highConfidencePercent = ((highConfidence / totalEvents) * 100).toFixed(1);
      
      return `Confidence score analysis shows ${highConfidence} events (${highConfidencePercent}%) with high confidence (≥80%). The average confidence score is ${avgConfidence.toFixed(2)}, indicating ${avgConfidence > 0.8 ? 'excellent' : avgConfidence > 0.6 ? 'good' : 'moderate'} identification accuracy across your dataset.`;
    }
    
    return `I've analyzed your FingerprintJS dataset with ${totalEvents} identification events. Key insights: ${uniqueVisitors} unique visitors, ${uniqueIPs} IP addresses, ${uniqueCountries} countries, ${vpnDetected} VPN detections, and ${botDetected} bot detections. The average confidence score is ${avgConfidence.toFixed(2)}. This data provides comprehensive visitor tracking and security insights for your application.`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(() => {
      const chartData = generateChartData(inputValue);
      const aiResponse = generateAIResponse(inputValue);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        chart: chartData,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const renderChart = (chart: ChatMessage['chart']) => {
    if (!chart || !chart.data || chart.data.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          {chart.type === 'bar' && <BarChart3 className="h-4 w-4 text-blue-600" />}
          {chart.type === 'line' && <TrendingUp className="h-4 w-4 text-green-600" />}
          {chart.type === 'pie' && <PieChart className="h-4 w-4 text-purple-600" />}
          <span className="text-sm font-medium">{chart.title}</span>
        </div>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            {chart.type === 'bar' ? (
              <BarChart data={chart.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={Object.keys(chart.data[0])[0]} 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey={Object.keys(chart.data[0])[1]} fill="#8884d8" />
              </BarChart>
            ) : chart.type === 'line' ? (
              <LineChart data={chart.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={Object.keys(chart.data[0])[0]} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey={Object.keys(chart.data[0])[1]} 
                  stroke="#8884d8" 
                  strokeWidth={2}
                />
              </LineChart>
            ) : (
              <RechartsPieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <Pie
                  data={chart.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent || 0 * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chart.data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-background border-l shadow-lg">
      <Card className="h-full rounded-none border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            FingerprintJS AI Assistant
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col h-[calc(100vh-5rem)]">
          <div className="flex-1 pr-4 overflow-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {message.chart && renderChart(message.chart)}
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground p-3 rounded-lg">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your FingerprintJS data..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isTyping}
            />
            <Button onClick={handleSendMessage} disabled={isTyping || !inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge 
              variant="secondary" 
              className="cursor-pointer text-xs" 
              onClick={() => setInputValue("Show me visitor activity patterns")}
            >
              <Monitor className="h-3 w-3 mr-1" />
              Visitors
            </Badge>
            <Badge 
              variant="secondary" 
              className="cursor-pointer text-xs"
              onClick={() => setInputValue("Analyze geographic distribution")}
            >
              <Globe className="h-3 w-3 mr-1" />
              Geography
            </Badge>
            <Badge 
              variant="secondary" 
              className="cursor-pointer text-xs"
              onClick={() => setInputValue("Show security threats and VPN usage")}
            >
              <Shield className="h-3 w-3 mr-1" />
              Security
            </Badge>
            <Badge 
              variant="secondary" 
              className="cursor-pointer text-xs"
              onClick={() => setInputValue("Analyze browser and device distribution")}
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Browsers
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
