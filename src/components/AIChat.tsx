import  { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MessageCircle, Send, X, BarChart3, PieChart, TrendingUp, Globe, Shield, Monitor, Brain, AlertCircle, Server, Cloud } from 'lucide-react';
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
  isFallback?: boolean;
  provider?: string;
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
      content: `Hello! I'm your FingerprintJS AI analytics assistant. I can analyze your identification events and provide deep insights into visitor patterns, security threats, geographic distribution, and more. Ask me anything about your data!`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiStatus, setAiStatus] = useState<{
    provider: string;
    isAvailable: boolean;
    model: string;
  }>({
    provider: 'fallback',
    isAvailable: false,
    model: 'none'
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check AI availability on component mount
  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/status');
      const data = await response.json();
      if (data.success) {
        setAiStatus({
          provider: data.provider,
          isAvailable: data.isAvailable,
          model: data.model
        });
      }
    } catch (error) {
      console.error('Error checking AI status:', error);
      setAiStatus({
        provider: 'fallback',
        isAvailable: false,
        model: 'none'
      });
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'ollama':
        return <Server className="h-3 w-3 text-green-600" />;
      case 'openai':
        return <Cloud className="h-3 w-3 text-blue-600" />;
      default:
        return <AlertCircle className="h-3 w-3 text-yellow-600" />;
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'ollama':
        return 'Local AI';
      case 'openai':
        return 'ChatGPT';
      default:
        return 'Fallback';
    }
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

    try {
      // Call the AI analysis endpoint
      const response = await fetch('http://localhost:3001/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputValue,
          csvData: csvData
        })
      });

      const result = await response.json();

      if (result.success) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: result.answer,
          chart: result.chart,
          timestamp: new Date(),
          isFallback: result.isFallback,
          provider: result.provider
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Handle error with fallback response
        const fallbackMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: result.fallbackAnswer || 'I apologize, but I encountered an error while analyzing your data. Please try rephrasing your question.',
          timestamp: new Date(),
          isFallback: true,
          provider: 'fallback'
        };

        setMessages(prev => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error('Error calling AI service:', error);
      
      // Generate fallback response
      const fallbackResponse = generateFallbackResponse(inputValue);
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: fallbackResponse,
        chart: generateFallbackChart(inputValue),
        timestamp: new Date(),
        isFallback: true,
        provider: 'fallback'
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Fallback response generator for when AI is unavailable
  const generateFallbackResponse = (question: string) => {
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
    
    if (lowerQuestion.includes('security') || lowerQuestion.includes('vpn') || lowerQuestion.includes('threat')) {
      const threatPercentage = ((vpnDetected + botDetected) / totalEvents * 100).toFixed(1);
      return `Security analysis shows ${vpnDetected} VPN connections and ${botDetected} bot detections out of ${totalEvents} total events (${threatPercentage}% potential threats). The average confidence score is ${avgConfidence.toFixed(2)}, indicating ${avgConfidence > 0.8 ? 'high' : avgConfidence > 0.6 ? 'moderate' : 'low'} identification accuracy.`;
    }
    
    return `I've analyzed your FingerprintJS dataset with ${totalEvents} identification events. Key insights: ${uniqueVisitors} unique visitors, ${uniqueIPs} IP addresses, ${uniqueCountries} countries, ${vpnDetected} VPN detections, and ${botDetected} bot detections. The average confidence score is ${avgConfidence.toFixed(2)}. This data provides comprehensive visitor tracking and security insights for your application.`;
  };

  // Fallback chart generator
  const generateFallbackChart = (question: string) => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('visitor') || lowerQuestion.includes('activity')) {
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

    if (lowerQuestion.includes('security') || lowerQuestion.includes('threat')) {
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

    // Default chart
    const visitorCounts = csvData.reduce((acc, event) => {
      acc[event.visitorId] = (acc[event.visitorId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      type: 'bar' as const,
      data: Object.entries(visitorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([visitorId, count]) => ({ 
          visitor: visitorId.slice(0, 8) + '...', 
          requests: count 
        })),
      title: 'Visitor Activity Overview'
    };
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
            <Brain className="h-5 w-5" />
            AI Analytics Assistant
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col h-[calc(100vh-5rem)]">
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 text-gray-800">
              {getProviderIcon(aiStatus.provider)}
              <span className="text-sm font-medium">
                {getProviderLabel(aiStatus.provider)} {aiStatus.isAvailable ? '(Active)' : '(Unavailable)'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Model: {aiStatus.model} | Provider: {aiStatus.provider}
            </p>
          </div>
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
                    <div className="flex items-center gap-2 mb-2">
                      {message.type === 'ai' && (
                        <>
                          {message.provider && getProviderIcon(message.provider)}
                          <span className="text-xs opacity-70">
                            {getProviderLabel(message.provider || 'fallback')}
                          </span>
                        </>
                      )}
                    </div>
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
                    <div className="flex items-center gap-2">
                      <Brain className="h-3 w-3 animate-pulse" />
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
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
              onClick={() => setInputValue("Analyze visitor activity patterns and identify unusual behavior")}
            >
              <Monitor className="h-3 w-3 mr-1" />
              Visitors
            </Badge>
            <Badge 
              variant="secondary" 
              className="cursor-pointer text-xs"
              onClick={() => setInputValue("What are the security threats in my data and how should I address them?")}
            >
              <Shield className="h-3 w-3 mr-1" />
              Security
            </Badge>
            <Badge 
              variant="secondary" 
              className="cursor-pointer text-xs"
              onClick={() => setInputValue("Analyze geographic distribution and identify potential fraud patterns")}
            >
              <Globe className="h-3 w-3 mr-1" />
              Geography
            </Badge>
            <Badge 
              variant="secondary" 
              className="cursor-pointer text-xs"
              onClick={() => setInputValue("What insights can you provide about browser and device usage patterns?")}
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
