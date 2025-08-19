import OpenAI from 'openai';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import fetch from 'node-fetch';

class AIService {
  constructor() {
    this.initialized = false;
    this.aiProvider = null;
    this.ollamaModel = null;
    this.openaiModel = null;
    this.isAIAvailable = false;
  }

  initializeAI() {
    console.log('AI Service: initializeAI called, initialized:', this.initialized);
    if (this.initialized) {
      console.log('AI Service: Already initialized, returning early');
      return;
    }

    this.aiProvider = process.env.AI_PROVIDER || 'fallback';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';
    this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4';
    
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
            });
            
            this.chatModel = new ChatOpenAI({
              openAIApiKey: process.env.OPENAI_API_KEY,
              modelName: this.openaiModel,
              temperature: 0.3,
            });
            this.isAIAvailable = true;
            console.log(`AI Service: Successfully initialized OpenAI with model ${this.openaiModel}`);
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
  async analyzeData(csvData, question) {
    this.initializeAI();
    console.log('AI Service: analyzeData called with provider:', this.aiProvider, 'isAvailable:', this.isAIAvailable);
    console.log('AI Service: Environment check - AI_PROVIDER:', process.env.AI_PROVIDER, 'OLLAMA_HOST:', process.env.OLLAMA_HOST);
    console.log('AI Service: Instance variables - aiProvider:', this.aiProvider, 'isAIAvailable:', this.isAIAvailable, 'initialized:', this.initialized);

    if (!this.isAIAvailable) {
      console.log('AI Service: AI not available, returning fallback');
      console.log('AI Service: Debug - aiProvider:', this.aiProvider, 'isAIAvailable:', this.isAIAvailable);
      // Force AI to be available for testing
      console.log('AI Service: Forcing AI to be available for testing');
      this.isAIAvailable = true;
    }

    try {
      console.log('AI Service: Preparing data summary...');
      const dataSummary = this.prepareDataSummary(csvData);
      console.log('AI Service: Data summary prepared, length:', dataSummary.length);
      console.log('AI Service: Data summary preview:', dataSummary.substring(0, 200) + '...');
      
      const systemPrompt = `You are an expert data analyst specializing in FingerprintJS visitor identification data. 
      
Your task is to analyze visitor identification events and provide insightful, accurate answers to user questions.

Available data includes:
- Visitor identification events with timestamps
- Geographic information (country, city)
- Browser and operating system details
- Security indicators (VPN detection, bot detection)
- Confidence scores for identification accuracy
- IP addresses and user agents

Guidelines:
1. Provide specific, data-driven insights
2. Use exact numbers and percentages when available
3. Identify patterns, anomalies, and security concerns
4. Suggest actionable recommendations when relevant
5. Be concise but comprehensive
6. If the question cannot be answered with the available data, clearly state this

Data Summary:
${dataSummary}

Respond in a helpful, professional tone. Focus on providing actionable insights for security, user experience, and business intelligence.`;

      const userPrompt = `Question: ${question}

Please analyze the FingerprintJS data and provide a comprehensive answer. Include specific insights, patterns, and recommendations based on the data.`;

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
      return {
        success: true,
        answer: response,
        dataSummary: dataSummary,
        provider: this.aiProvider
      };

    } catch (error) {
      console.error('AI analysis error:', error);
      console.error('AI analysis error stack:', error.stack);
      return {
        success: false,
        error: error.message,
        fallbackAnswer: this.generateFallbackAnswer(csvData, question),
        provider: 'fallback'
      };
    }
  }

  async analyzeWithOllama(systemPrompt, userPrompt) {
    try {
      console.log('AI Service: Attempting Ollama analysis...');
      console.log('AI Service: Ollama host:', process.env.OLLAMA_HOST);
      console.log('AI Service: Ollama model:', this.ollamaModel);
      
      // Use a simpler prompt for testing
      const simplePrompt = `You are a data analyst. Please answer this question: ${userPrompt.replace('Question: ', '')}`;
      console.log('AI Service: Using simple prompt, length:', simplePrompt.length);
      
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
              role: 'user',
              content: simplePrompt
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
      
      return data.message.content;
    } catch (error) {
      console.error('Ollama analysis error:', error);
      console.error('Ollama analysis error stack:', error.stack);
      throw new Error(`Ollama analysis failed: ${error.message}`);
    }
  }

  async analyzeWithOpenAI(systemPrompt, userPrompt) {
    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ];

      const response = await this.chatModel.invoke(messages);
      return response.content;
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      throw new Error(`OpenAI analysis failed: ${error.message}`);
    }
  }

  // Prepare a comprehensive summary of the CSV data for AI analysis
  prepareDataSummary(csvData) {
    if (!csvData || csvData.length === 0) {
      return "No data available for analysis.";
    }

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
    }, {});
    const topCountries = Object.entries(countryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // Browser analysis
    const browserCounts = csvData.reduce((acc, event) => {
      const browser = event.browser || 'Unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});
    const topBrowsers = Object.entries(browserCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // OS analysis
    const osCounts = csvData.reduce((acc, event) => {
      const os = event.os || 'Unknown';
      acc[os] = (acc[os] || 0) + 1;
      return acc;
    }, {});
    const topOS = Object.entries(osCounts)
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
    }, {});
    const mostActiveVisitors = Object.entries(visitorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // IP analysis
    const ipCounts = csvData.reduce((acc, event) => {
      acc[event.ipAddress] = (acc[event.ipAddress] || 0) + 1;
      return acc;
    }, {});
    const mostActiveIPs = Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return `
DATASET OVERVIEW:
- Total Events: ${totalEvents}
- Unique Visitors: ${uniqueVisitors}
- Unique IP Addresses: ${uniqueIPs}
- Geographic Coverage: ${uniqueCountries} countries, ${uniqueCities} cities
- Time Range: ${startDate} to ${endDate}

SECURITY ANALYSIS:
- VPN Detections: ${vpnDetected} (${((vpnDetected/totalEvents)*100).toFixed(1)}%)
- Bot Detections: ${botDetected} (${((botDetected/totalEvents)*100).toFixed(1)}%)
- Clean Requests: ${cleanRequests} (${((cleanRequests/totalEvents)*100).toFixed(1)}%)

CONFIDENCE ANALYSIS:
- Average Confidence Score: ${avgConfidence.toFixed(3)}
- High Confidence (≥80%): ${highConfidence} events (${((highConfidence/totalEvents)*100).toFixed(1)}%)
- Low Confidence (<60%): ${lowConfidence} events (${((lowConfidence/totalEvents)*100).toFixed(1)}%)

TOP COUNTRIES:
${topCountries.map(([country, count]) => `- ${country}: ${count} events (${((count/totalEvents)*100).toFixed(1)}%)`).join('\n')}

TOP BROWSERS:
${topBrowsers.map(([browser, count]) => `- ${browser}: ${count} events (${((count/totalEvents)*100).toFixed(1)}%)`).join('\n')}

TOP OPERATING SYSTEMS:
${topOS.map(([os, count]) => `- ${os}: ${count} events (${((count/totalEvents)*100).toFixed(1)}%)`).join('\n')}

MOST ACTIVE VISITORS:
${mostActiveVisitors.map(([visitor, count]) => `- ${visitor.slice(0, 8)}...: ${count} events`).join('\n')}

MOST ACTIVE IP ADDRESSES:
${mostActiveIPs.map(([ip, count]) => `- ${ip}: ${count} events`).join('\n')}
`;
  }

  // Generate a fallback answer when AI is unavailable
  generateFallbackAnswer(csvData, question) {
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
    
    if (lowerQuestion.includes('location') || lowerQuestion.includes('country')) {
      const uniqueCountries = new Set(csvData.map(e => e.country).filter(Boolean)).size;
      return `Your data shows activity from ${uniqueCountries} different countries, indicating a geographically diverse user base. This distribution helps identify your global reach and detect unusual access patterns.`;
    }
    
    return `I've analyzed your FingerprintJS dataset with ${csvData.length} identification events. The data shows visitor patterns, geographic distribution, and security indicators that provide valuable insights into your user base and potential threats.`;
  }

  // Generate chart data based on AI analysis
  async generateChartData(csvData, question) {
    const lowerQuestion = question.toLowerCase();
    
    // This could be enhanced with AI to suggest the best chart type
    // For now, using the existing logic with some AI-driven improvements
    
    if (lowerQuestion.includes('visitor') || lowerQuestion.includes('activity')) {
      const visitorCounts = csvData.reduce((acc, event) => {
        acc[event.visitorId] = (acc[event.visitorId] || 0) + 1;
        return acc;
      }, {});
      
      return {
        type: 'bar',
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
        type: 'pie',
        data: securityData.filter(item => item.value > 0),
        title: 'Security Threat Analysis'
      };
    }
    
    if (lowerQuestion.includes('geographic') || lowerQuestion.includes('country')) {
      const countryCounts = csvData.reduce((acc, event) => {
        const country = event.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {});
      
      return {
        type: 'pie',
        data: Object.entries(countryCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8)
          .map(([name, value]) => ({ name, value })),
        title: 'Requests by Country'
      };
    }
    
    // Default chart
    const visitorCounts = csvData.reduce((acc, event) => {
      acc[event.visitorId] = (acc[event.visitorId] || 0) + 1;
      return acc;
    }, {});
    
    return {
      type: 'bar',
      data: Object.entries(visitorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([visitorId, count]) => ({ 
          visitor: visitorId.slice(0, 8) + '...', 
          requests: count 
        })),
      title: 'Visitor Activity Overview'
    };
  }

  // Get current AI provider status
  getStatus() {
    this.initializeAI();
    console.log('AI Service: getStatus called - provider:', this.aiProvider, 'isAvailable:', this.isAIAvailable);
    return {
      provider: this.aiProvider,
      isAvailable: this.isAIAvailable,
      model: this.aiProvider === 'ollama' ? this.ollamaModel : 
             this.aiProvider === 'openai' ? this.openaiModel : 'none'
    };
  }

  // Test method for debugging
  async testOllama() {
    try {
      console.log('AI Service: Testing Ollama connection...');
      
      // Exact same request as the working curl command
      const requestBody = {
        model: "llama3.2",
        messages: [
          {
            role: "user",
            content: "Hello"
          }
        ],
        stream: false
      };
      
      console.log('AI Service: Request body:', JSON.stringify(requestBody, null, 2));
      console.log('AI Service: Request URL:', `${process.env.OLLAMA_HOST}/api/chat`);
      
      const response = await fetch(`${process.env.OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('AI Service: Response status:', response.status);
      console.log('AI Service: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Service: Error response body:', errorText);
        throw new Error(`Ollama test failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('AI Service: Ollama test response:', JSON.stringify(data, null, 2));
      console.log('AI Service: Ollama test successful:', data.message?.content);
      return data.message?.content || 'No content in response';
    } catch (error) {
      console.error('AI Service: Ollama test failed:', error);
      throw error;
    }
  }
}

export default new AIService();
