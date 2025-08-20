import OpenAI from 'openai';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import fetch from 'node-fetch';

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

interface AIAnalysisResult {
  success: boolean;
  answer?: string;
  chart?: any;
  dataSummary?: string;
  provider?: string;
  error?: string;
}

interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: Array<{ name: string; value: number }>;
}

class AIService {
  private initialized: boolean = false;
  private aiProvider: string | null = null;
  private ollamaModel: string | null = null;
  private openaiModel: string | null = null;
  private isAIAvailable: boolean = false;
  private openai: OpenAI | null = null;
  private chatModel: ChatOpenAI | null = null;

  initializeAI(): void {
    console.log('AI Service: initializeAI called, initialized:', this.initialized);
    if (this.initialized) {
      console.log('AI Service: Already initialized, returning early');
      return;
    }

    this.aiProvider = process.env.AI_PROVIDER || 'fallback';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';
    // Use GPT-4o-mini for fastest response (faster than GPT-3.5-turbo)
    this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    console.log('AI Service: Initializing with provider:', this.aiProvider);
    console.log('AI Service: Environment variables:', {
      AI_PROVIDER: process.env.AI_PROVIDER,
      OLLAMA_HOST: process.env.OLLAMA_HOST,
      OLLAMA_MODEL: process.env.OLLAMA_MODEL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'
    });

    try {
      switch (this.aiProvider) {
        case 'ollama':
          if (process.env.OLLAMA_HOST) {
            this.isAIAvailable = true;
            console.log(`AI Service: Successfully initialized Ollama with model ${this.ollamaModel}`);
            console.log('AI Service: isAIAvailable set to:', this.isAIAvailable);
          } else {
            console.warn('AI Service: OLLAMA_HOST not set, falling back to rule-based analysis');
            this.isAIAvailable = false;
          }
          break;

        case 'openai':
          if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
              apiKey: process.env.OPENAI_API_KEY,
              timeout: 15000, // 15 second timeout for faster failure
              maxRetries: 1, // Reduce retries for faster response
            });
            
            this.chatModel = new ChatOpenAI({
              openAIApiKey: process.env.OPENAI_API_KEY,
              modelName: this.openaiModel,
              temperature: 0.3, // Lower temperature for faster, more focused responses
              maxTokens: 1000, // Limit tokens for faster response
              timeout: 15000, // 15 second timeout
              maxRetries: 1, // Reduce retries
            });
            this.isAIAvailable = true;
            console.log(`AI Service: Successfully initialized OpenAI with model ${this.openaiModel} (optimized for speed)`);
          } else {
            console.warn('AI Service: OPENAI_API_KEY not set, falling back to rule-based analysis');
            this.isAIAvailable = false;
          }
          break;

        default:
          console.log('AI Service: Using rule-based fallback analysis');
          this.isAIAvailable = false;
          break;
      }
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      this.isAIAvailable = false;
    }

    this.initialized = true;
  }

  // Analyze CSV data and generate insights
  async analyzeData(csvData: FingerprintEvent[], question: string): Promise<AIAnalysisResult> {
    this.initializeAI();
    console.log('AI Service: analyzeData called with provider:', this.aiProvider, 'isAvailable:', this.isAIAvailable);
    
    // Always check for previous context in the question
    const hasPreviousContext = question.includes('Previous AI response:');
    let originalQuestion = question;
    let previousContext = '';
    
    if (hasPreviousContext) {
      // Extract the original question and previous context
      const contextMatch = question.match(/Previous AI response: "([^"]+)"\. User question: (.+)/);
      if (contextMatch) {
        previousContext = contextMatch[1];
        originalQuestion = contextMatch[2];
      }
    }
    
    // Fast mode for simple questions
    const isFastMode = this.isFastModeQuestion(originalQuestion);
    if (isFastMode) {
      console.log('AI Service: Using fast mode for simple question');
    }

    if (!this.isAIAvailable) {
      console.log('AI Service: AI not available, returning fallback');
      console.log('AI Service: Debug - aiProvider:', this.aiProvider, 'isAIAvailable:', this.isAIAvailable);
      const fallbackChart = this.generateFallbackChart(csvData, originalQuestion);
      return {
        success: false,
        error: 'AI service not available',
        answer: this.generateFallbackAnswer(csvData, originalQuestion),
        chart: fallbackChart,
        provider: 'fallback'
      };
    }

    try {
      console.log('AI Service: Preparing data summary...');
      const dataSummary = isFastMode ? this.prepareFastDataSummary(csvData) : this.prepareDataSummary(csvData);
      console.log('AI Service: Data summary prepared, length:', dataSummary.length);
      
      // Determine if the question requires a chart
      const requiresChart = this.questionRequiresChart(originalQuestion);
      
      const systemPrompt = `You are a data analyst for FingerprintJS visitor data. Provide concise, accurate insights.

Data includes: visitor events, geography, browsers, security (VPN/bot detection), confidence scores.

IMPORTANT: Provide only the analysis. Do NOT include follow-up questions, suggestions, or recommendations in your response. Focus solely on answering the user's question with data insights.

${hasPreviousContext ? `
IMPORTANT: The user is asking a follow-up question. Consider the context from your previous response when providing this analysis.
Previous response: "${previousContext}"
` : ''}

${requiresChart ? `
RESPOND IN JSON FORMAT:
{
  "analysis": "Brief analysis text...",
  "chart": {
    "type": "bar|line|pie",
    "title": "Chart title",
    "data": [{"name": "Category", "value": 123}]
  }
}
- Use "bar" for categories, "line" for trends, "pie" for proportions
- Max 8 data points, use exact values from data
` : `
RESPOND IN PLAIN TEXT - be concise and specific.
`}

Data: ${dataSummary}`;

      const userPrompt = `Q: ${originalQuestion}

Analyze the data. ${requiresChart ? 'Include chart data.' : 'Be concise.'}`;

      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      console.log('AI Service: Full prompt length:', fullPrompt.length);
      console.log('AI Service: Calling AI provider:', this.aiProvider);
      let response;
      
      if (this.aiProvider === 'ollama') {
        console.log('AI Service: About to call analyzeWithOllama');
        try {
          response = await this.analyzeWithOllama(systemPrompt, userPrompt);
          console.log('AI Service: analyzeWithOllama completed successfully');
        } catch (error) {
          console.error('AI Service: analyzeWithOllama failed:', error);
          throw error;
        }
      } else if (this.aiProvider === 'openai') {
        response = await this.analyzeWithOpenAI(systemPrompt, userPrompt);
      } else {
        throw new Error('No AI provider configured');
      }
      
      console.log('AI Service: AI analysis successful, response length:', response.length);
      
      // Parse the response to extract chart data if present
      const parsedResponse = this.parseAIResponse(response, requiresChart);
      
      return {
        success: true,
        answer: parsedResponse.analysis,
        chart: parsedResponse.chart,
        dataSummary: dataSummary,
        provider: this.aiProvider
      };

    } catch (error) {
      console.error('AI analysis error:', error);
      console.error('AI analysis error stack:', error.stack);
      const fallbackChart = this.generateFallbackChart(csvData, originalQuestion);
      const fallbackAnswer = this.generateFallbackAnswer(csvData, originalQuestion);
      
      return {
        success: false,
        error: error.message,
        answer: fallbackAnswer || 'Analysis completed with fallback data.',
        chart: fallbackChart,
        provider: 'fallback'
      };
    }
  }

  async analyzeWithOllama(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      console.log('AI Service: Attempting Ollama analysis...');
      console.log('AI Service: Ollama host:', process.env.OLLAMA_HOST);
      console.log('AI Service: Ollama model:', this.ollamaModel);
      
      // Use the full system prompt for better results
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      console.log('AI Service: Using full prompt, length:', fullPrompt.length);
      
      // Use fetch with proper error handling and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${process.env.OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama3.2",
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          stream: false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('AI Service: Ollama response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Service: Ollama API error response:', errorText);
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('AI Service: Ollama response data keys:', Object.keys(data));
      console.log('AI Service: Ollama analysis successful');
      
      // Ensure we get a clean response
      const content = data.message?.content || data.content || 'Analysis completed successfully.';
      return content.trim();
    } catch (error) {
      console.error('Ollama analysis error:', error);
      console.error('Ollama analysis error stack:', error.stack);
      throw new Error(`Ollama analysis failed: ${error.message}`);
    }
  }

  async analyzeWithOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ];

      // Use streaming for faster response
      const response = await this.chatModel!.invoke(messages, {
        timeout: 15000,
        maxRetries: 1
      });
      return response.content;
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      throw new Error(`OpenAI analysis failed: ${error.message}`);
    }
  }

  // Prepare a comprehensive summary of the CSV data for AI analysis
  prepareDataSummary(csvData: FingerprintEvent[]): string {
    if (!csvData || csvData.length === 0) {
      return "No data available for analysis.";
    }

    // Debug: Log data structure to help identify issues
    console.log('AI Service: Data sample:', {
      totalEvents: csvData.length,
      sampleEvent: csvData[0],
      browserSample: csvData.slice(0, 5).map(e => e.browser),
      countrySample: csvData.slice(0, 5).map(e => e.country)
    });

    const totalEvents = csvData.length;
    const uniqueVisitors = new Set(csvData.map(e => e.visitorId)).size;
    const uniqueIPs = new Set(csvData.map(e => e.ipAddress)).size;
    const uniqueCountries = new Set(csvData.map(e => e.country).filter(Boolean)).size;
    const uniqueCities = new Set(csvData.map(e => e.city).filter(Boolean)).size;
    
    // Security analysis
    const vpnDetected = csvData.filter(e => e.vpnDetected).length;
    const botDetected = csvData.filter(e => e.botDetected).length;
    const cleanRequests = csvData.filter(e => !e.vpnDetected && !e.botDetected).length;
    
    // Confidence analysis
    const avgConfidence = csvData.reduce((sum, e) => sum + e.confidence, 0) / totalEvents;
    const highConfidence = csvData.filter(e => e.confidence >= 0.8).length;
    const lowConfidence = csvData.filter(e => e.confidence < 0.6).length;
    
    // Geographic analysis
    const countryCounts = csvData.reduce((acc, event) => {
      const country = event.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topCountries = Object.entries(countryCounts)
      .filter(([country, count]) => country && country !== 'Unknown')
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // Browser analysis
    const browserCounts = csvData.reduce((acc, event) => {
      const browser = event.browser || 'Unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topBrowsers = Object.entries(browserCounts)
      .filter(([browser, count]) => browser && browser !== 'Unknown')
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // OS analysis
    const osCounts = csvData.reduce((acc, event) => {
      const os = event.os || 'Unknown';
      acc[os] = (acc[os] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topOS = Object.entries(osCounts)
      .filter(([os, count]) => os && os !== 'Unknown')
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // Time analysis
    const timeRange = csvData.reduce((acc, event) => {
      const eventTime = new Date(event.date).getTime();
      acc.min = Math.min(acc.min, eventTime);
      acc.max = Math.max(acc.max, eventTime);
      return acc;
    }, { min: Date.now(), max: 0 });
    
    const startDate = new Date(timeRange.min).toISOString();
    const endDate = new Date(timeRange.max).toISOString();
    
    // Visitor activity analysis
    const visitorCounts = csvData.reduce((acc, event) => {
      acc[event.visitorId] = (acc[event.visitorId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostActiveVisitors = Object.entries(visitorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // IP analysis
    const ipCounts = csvData.reduce((acc, event) => {
      acc[event.ipAddress] = (acc[event.ipAddress] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostActiveIPs = Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return `Events: ${totalEvents}, Visitors: ${uniqueVisitors}, IPs: ${uniqueIPs}, Countries: ${uniqueCountries}
Security: VPN ${vpnDetected}, Bot ${botDetected}, Clean ${cleanRequests}
Confidence: Avg ${avgConfidence.toFixed(2)}, High ${highConfidence}, Low ${lowConfidence}
Top Countries: ${topCountries.map(([c, n]) => `${c}(${n})`).join(', ')}
Top Browsers: ${topBrowsers.map(([b, n]) => `${b}(${n})`).join(', ')}
Top Visitors: ${mostActiveVisitors.map(([v, n]) => `${v.slice(0,6)}(${n})`).join(', ')}`;
  }

  // Generate a fallback answer when AI is unavailable
  generateFallbackAnswer(csvData: FingerprintEvent[], question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('visitor') || lowerQuestion.includes('activity')) {
      const uniqueVisitors = new Set(csvData.map(e => e.visitorId)).size;
      return `I can see ${csvData.length} total events from ${uniqueVisitors} unique visitors. The most active visitor patterns show concentrated activity that could indicate regular users or potential automated behavior.`;
    }
    
    if (lowerQuestion.includes('security') || lowerQuestion.includes('vpn') || lowerQuestion.includes('bot')) {
      const vpnDetected = csvData.filter(e => e.vpnDetected).length;
      const botDetected = csvData.filter(e => e.botDetected).length;
      return `Security analysis shows ${vpnDetected} VPN connections and ${botDetected} bot detections out of ${csvData.length} total events. This represents ${(((vpnDetected + botDetected) / csvData.length) * 100).toFixed(1)}% potential security threats.`;
    }
    
    if (lowerQuestion.includes('geograph') || lowerQuestion.includes('location') || lowerQuestion.includes('country')) {
      const uniqueCountries = new Set(csvData.map(e => e.country).filter(Boolean)).size;
      const countryCounts = csvData.reduce((acc, event) => {
        const country = event.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topCountries = Object.entries(countryCounts)
        .filter(([country, count]) => country && country !== 'Unknown')
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      
      return `Geographic analysis shows activity from ${uniqueCountries} different countries. The top countries by request volume are: ${topCountries.map(([c, n]) => `${c} (${n} requests)`).join(', ')}. This distribution helps identify your global reach and detect unusual access patterns.`;
    }
    
    if (lowerQuestion.includes('browser') || lowerQuestion.includes('device')) {
      const browserCounts = csvData.reduce((acc, event) => {
        const browser = event.browser || 'Unknown';
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topBrowsers = Object.entries(browserCounts)
        .filter(([browser, count]) => browser && browser !== 'Unknown')
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      
      return `Browser analysis shows ${Object.keys(browserCounts).filter(b => b !== 'Unknown').length} different browsers in use. The most popular browsers are: ${topBrowsers.map(([b, n]) => `${b} (${n} requests)`).join(', ')}. This helps understand your user's technology preferences and detect potential bot activity.`;
    }
    
    return `I've analyzed your FingerprintJS dataset with ${csvData.length} identification events. The data shows visitor patterns, geographic distribution, and security indicators that provide valuable insights into your user base and potential threats.`;
  }

  // Determine if a question requires a chart
  questionRequiresChart(question: string): boolean {
    const lowerQuestion = question.toLowerCase();
    const chartKeywords = [
      'chart', 'graph', 'visualize', 'show me', 'display', 'plot', 'trend',
      'compare', 'distribution', 'percentage', 'proportion', 'breakdown',
      'top', 'most', 'highest', 'lowest', 'activity', 'pattern'
    ];
    
    return chartKeywords.some(keyword => lowerQuestion.includes(keyword));
  }

  // Determine if question can use fast mode
  isFastModeQuestion(question: string): boolean {
    const lowerQuestion = question.toLowerCase();
    const fastKeywords = [
      'total', 'count', 'how many', 'number of', 'summary', 'overview',
      'basic', 'simple', 'quick', 'fast'
    ];
    
    return fastKeywords.some(keyword => lowerQuestion.includes(keyword));
  }

  // Prepare minimal data summary for fast mode
  prepareFastDataSummary(csvData: FingerprintEvent[]): string {
    if (!csvData || csvData.length === 0) {
      return "No data available.";
    }

    const totalEvents = csvData.length;
    const uniqueVisitors = new Set(csvData.map(e => e.visitorId)).size;
    const vpnDetected = csvData.filter(e => e.vpnDetected).length;
    const botDetected = csvData.filter(e => e.botDetected).length;
    
    return `Total: ${totalEvents} events, ${uniqueVisitors} visitors. Security: ${vpnDetected} VPN, ${botDetected} bots.`;
  }

  // Parse AI response to extract chart data if present
  parseAIResponse(response: string, requiresChart: boolean): { analysis: string; chart: ChartData | null } {
    if (!requiresChart) {
      return {
        analysis: response,
        chart: null
      };
    }

    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        if (parsed.analysis && parsed.chart) {
          return {
            analysis: parsed.analysis,
            chart: parsed.chart
          };
        }
      }
    } catch (error) {
      console.log('AI Service: Failed to parse JSON from AI response, using fallback');
    }

    // If no valid JSON found or response is garbled, return a clean fallback
    const cleanResponse = response ? response.trim() : 'Analysis completed successfully.';
    
    return {
      analysis: cleanResponse,
      chart: null
    };
  }

  // Generate fallback chart when AI is unavailable
  generateFallbackChart(csvData: FingerprintEvent[], question: string): ChartData | null {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('visitor') || lowerQuestion.includes('activity')) {
      const visitorCounts = csvData.reduce((acc, event) => {
        acc[event.visitorId] = (acc[event.visitorId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        type: 'bar',
        data: Object.entries(visitorCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([visitorId, count]) => ({ 
            name: visitorId.slice(0, 8) + '...', 
            value: count 
          })),
        title: 'Top 10 Visitors by Request Count'
      };
    }

    if (lowerQuestion.includes('location') || lowerQuestion.includes('country') || lowerQuestion.includes('geographic') || lowerQuestion.includes('geograph')) {
      const countryCounts = csvData.reduce((acc, event) => {
        const country = event.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Filter out empty countries and sort by count
      const validCountryData = Object.entries(countryCounts)
        .filter(([country, count]) => country && country !== 'Unknown' && count > 0)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([country, count]) => ({ 
          name: country, 
          value: count 
        }));

      return {
        type: 'bar',
        data: validCountryData.length > 0 ? validCountryData : [{ name: 'No Data', value: 1 }],
        title: 'Geographic Distribution by Country'
      };
    }

    if (lowerQuestion.includes('security') || lowerQuestion.includes('threat') || lowerQuestion.includes('vpn') || lowerQuestion.includes('bot')) {
      const securityData = [
        { name: 'VPN Detected', value: csvData.filter(e => e.vpnDetected).length },
        { name: 'Bot Detected', value: csvData.filter(e => e.botDetected).length },
        { name: 'Clean Requests', value: csvData.filter(e => !e.vpnDetected && !e.botDetected).length }
      ];

      return {
        type: 'pie',
        data: securityData.filter(item => item.value > 0),
        title: 'Security Threat Analysis'
      };
    }

    if (lowerQuestion.includes('browser') || lowerQuestion.includes('device') || lowerQuestion.includes('os')) {
      const browserCounts = csvData.reduce((acc, event) => {
        const browser = event.browser || 'Unknown';
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Filter out empty browsers and sort by count
      const validBrowserData = Object.entries(browserCounts)
        .filter(([browser, count]) => browser && browser !== 'Unknown' && count > 0)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([browser, count]) => ({ 
          name: browser, 
          value: count 
        }));

      return {
        type: 'bar',
        data: validBrowserData.length > 0 ? validBrowserData : [{ name: 'No Data', value: 1 }],
        title: 'Browser Usage Distribution'
      };
    }

    // Only return a chart for specific data analysis questions
    if (lowerQuestion.includes('chart') || lowerQuestion.includes('graph') || lowerQuestion.includes('visualize') || lowerQuestion.includes('show me')) {
      const visitorCounts = csvData.reduce((acc, event) => {
        acc[event.visitorId] = (acc[event.visitorId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        type: 'bar',
        data: Object.entries(visitorCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8)
          .map(([visitorId, count]) => ({ 
            name: visitorId.slice(0, 8) + '...', 
            value: count 
          })),
        title: 'Visitor Activity Overview'
      };
    }

    // Return null for general questions that don't need charts
    return null;
  }

  // Get current AI provider status
  getStatus(): { provider: string | null; isAvailable: boolean; model: string | null } {
    this.initializeAI();
    console.log('AI Service: getStatus called - provider:', this.aiProvider, 'isAvailable:', this.isAIAvailable);
    return {
      provider: this.aiProvider,
      isAvailable: this.isAIAvailable,
      model: this.aiProvider === 'ollama' ? this.ollamaModel : 
             this.aiProvider === 'openai' ? this.openaiModel : 'none'
    };
  }

  // Generate smart insight for overview page
  async generateSmartInsight(events: FingerprintEvent[]): Promise<{ insight: string; loading: boolean; error?: string }> {
    try {
      // Take the last 100 events for analysis
      const recentEvents = events.slice(-100);
      
      if (recentEvents.length === 0) {
        return {
          insight: "No recent events available for analysis.",
          loading: false
        };
      }

      // Generate a smart insight question based on the data
      const insightQuestion = this.generateInsightQuestion(recentEvents);
      
      const result = await this.analyzeData(recentEvents, insightQuestion);
      
      if (result.success && result.answer) {
        return {
          insight: result.answer,
          loading: false
        };
      } else {
        return {
          insight: result.answer || "Unable to generate insight at this time.",
          loading: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Error generating smart insight:', error);
      return {
        insight: "Unable to generate insight due to an error.",
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Generate an appropriate insight question based on the data
  private generateInsightQuestion(events: FingerprintEvent[]): string {
    const totalEvents = events.length;
    const uniqueVisitors = new Set(events.map(e => e.visitorId)).size;
    const vpnDetected = events.filter(e => e.vpnDetected).length;
    const botDetected = events.filter(e => e.botDetected).length;
    const uniqueCountries = new Set(events.map(e => e.country).filter(Boolean)).size;
    
    // Determine what type of insight would be most valuable
    if (vpnDetected > 0 || botDetected > 0) {
      return "What are the key security insights from the recent visitor data? Focus on any suspicious patterns, VPN usage, or bot activity.";
    }
    
    if (uniqueCountries > 3) {
      return "What are the geographic patterns and visitor distribution insights from the recent data?";
    }
    
    if (totalEvents > uniqueVisitors * 2) {
      return "What visitor behavior patterns and activity insights can you identify from the recent data?";
    }
    
    return "What are the most important insights and patterns in the recent visitor data?";
  }
}

export default new AIService();
