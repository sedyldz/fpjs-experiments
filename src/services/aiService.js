import fetch from 'node-fetch';

class AIService {
  constructor() {
    // Initialize with defaults, will be updated when needed
    this.provider = 'fallback';
    this.ollamaHost = 'http://localhost:11434';
    this.ollamaModel = 'llama3.2';
    this.openaiApiKey = null;
    this.openaiModel = 'gpt-4';
    
    // Load environment variables
    this.loadEnvironment();
  }

  loadEnvironment() {
    // Force Ollama for now since environment variables aren't loading properly
    this.provider = 'ollama';
    this.ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4';
    
    console.log('AIService environment loaded:', {
      provider: this.provider,
      ollamaHost: this.ollamaHost,
      ollamaModel: this.ollamaModel,
      hasOpenAIKey: !!this.openaiApiKey
    });
  }

  getStatus() {
    return {
      provider: this.provider,
      isAvailable: true, // We'll check availability when needed
      model: this.getCurrentModel()
    };
  }

  getCurrentModel() {
    switch (this.provider) {
      case 'ollama':
        return this.ollamaModel;
      case 'openai':
        return this.openaiModel;
      default:
        return 'fallback';
    }
  }

  async checkAvailability() {
    try {
      switch (this.provider) {
        case 'ollama':
          return await this.testOllama();
        case 'openai':
          return !!this.openaiApiKey;
        default:
          return true; // Fallback is always available
      }
    } catch (error) {
      console.error('Error checking AI availability:', error);
      return false;
    }
  }

  async testOllama() {
    try {
      const response = await fetch(`${this.ollamaHost}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('Ollama test failed:', error);
      return false;
    }
  }

  async analyzeData(events, question) {
    try {
      console.log(`Analyzing data with provider: ${this.provider}`);
      
      switch (this.provider) {
        case 'ollama':
          console.log('Attempting Ollama analysis...');
          return await this.analyzeWithOllama(events, question);
        case 'openai':
          console.log('Attempting OpenAI analysis...');
          return await this.analyzeWithOpenAI(events, question);
        default:
          console.log('Using fallback analysis...');
          return await this.analyzeWithFallback(events, question);
      }
    } catch (error) {
      console.error('Error in analyzeData:', error);
      console.log('Falling back to fallback analysis due to error');
      return await this.analyzeWithFallback(events, question);
    }
  }

  async analyzeWithOllama(events, question) {
    try {
      console.log(`Ollama analysis: Using model ${this.ollamaModel} at ${this.ollamaHost}`);
      const prompt = this.buildPrompt(events, question);
      console.log(`Ollama analysis: Prompt length: ${prompt.length} characters`);
      
      const response = await fetch(`${this.ollamaHost}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.ollamaModel,
          prompt: prompt,
          stream: false
        })
      });

      console.log(`Ollama response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Ollama API error: ${response.status} - ${errorText}`);
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`Ollama analysis completed successfully. Response length: ${data.response?.length || 0} characters`);
      
      return {
        success: true,
        answer: data.response,
        provider: 'ollama'
      };
    } catch (error) {
      console.error('Ollama analysis failed:', error);
      throw error;
    }
  }

  async analyzeWithOpenAI(events, question) {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const prompt = this.buildPrompt(events, question);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: this.openaiModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert data analyst specializing in FingerprintJS visitor identification data. Provide clear, actionable insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        answer: data.choices[0].message.content,
        provider: 'openai'
      };
    } catch (error) {
      console.error('OpenAI analysis failed:', error);
      throw error;
    }
  }

  async analyzeWithFallback(events, question) {
    try {
      const analysis = this.performFallbackAnalysis(events, question);
      return {
        success: true,
        answer: analysis,
        provider: 'fallback'
      };
    } catch (error) {
      console.error('Fallback analysis failed:', error);
      return {
        success: false,
        answer: 'Unable to analyze data at this time.',
        error: error.message
      };
    }
  }

  buildPrompt(events, question) {
    const summary = this.summarizeData(events);
    
    return `You are analyzing FingerprintJS visitor identification data. Here's a summary of the data:

${summary}

Question: ${question}

Please provide a comprehensive analysis focusing on:
1. Key patterns and trends
2. Security insights (VPN usage, bot detection)
3. Geographic distribution
4. Visitor behavior patterns
5. Actionable recommendations

Provide your analysis in a clear, professional format.`;
  }

  summarizeData(events) {
    if (!events || events.length === 0) {
      return 'No data available for analysis.';
    }

    const totalEvents = events.length;
    const uniqueVisitors = new Set(events.map(e => e.visitorId).filter(Boolean)).size;
    const uniqueCountries = new Set(events.map(e => e.country).filter(Boolean)).size;
    const uniqueBrowsers = new Set(events.map(e => e.browser).filter(Boolean)).size;
    
    const vpnDetected = events.filter(e => e.vpnDetected).length;
    const botDetected = events.filter(e => e.botDetected).length;
    
    const countries = events.reduce((acc, event) => {
      if (event.country) {
        acc[event.country] = (acc[event.country] || 0) + 1;
      }
      return acc;
    }, {});

    const browsers = events.reduce((acc, event) => {
      if (event.browser) {
        acc[event.browser] = (acc[event.browser] || 0) + 1;
      }
      return acc;
    }, {});

    const topCountries = Object.entries(countries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => `${country}: ${count}`)
      .join(', ');

    const topBrowsers = Object.entries(browsers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([browser, count]) => `${browser}: ${count}`)
      .join(', ');

    const dateRange = this.getDateRange(events);

    return `Data Summary:
- Total Events: ${totalEvents}
- Unique Visitors: ${uniqueVisitors}
- Date Range: ${dateRange}
- Countries: ${uniqueCountries} (Top: ${topCountries})
- Browsers: ${uniqueBrowsers} (Top: ${topBrowsers})
- VPN Detected: ${vpnDetected} events
- Bot Detected: ${botDetected} events
- Average Events per Visitor: ${(totalEvents / uniqueVisitors).toFixed(2)}`;
  }

  getDateRange(events) {
    if (!events || events.length === 0) return 'No data';
    
    const dates = events.map(e => new Date(e.date)).sort((a, b) => a - b);
    const start = dates[0].toLocaleDateString();
    const end = dates[dates.length - 1].toLocaleDateString();
    
    return `${start} to ${end}`;
  }

  performFallbackAnalysis(events, question) {
    const summary = this.summarizeData(events);
    
    // Generate insights based on the data
    const insights = this.generateFallbackInsights(events);
    
    return `Based on the analysis of your FingerprintJS data:

${summary}

Key Insights:
${insights}

This analysis was generated using our fallback system. For more detailed AI-powered insights, consider configuring Ollama or OpenAI.`;
  }

  generateFallbackInsights(events) {
    const insights = [];
    
    const totalEvents = events.length;
    const uniqueVisitors = new Set(events.map(e => e.visitorId).filter(Boolean)).size;
    const vpnDetected = events.filter(e => e.vpnDetected).length;
    const botDetected = events.filter(e => e.botDetected).length;
    
    // Geographic insights
    const countries = events.reduce((acc, event) => {
      if (event.country) {
        acc[event.country] = (acc[event.country] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topCountry = Object.entries(countries)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCountry) {
      insights.push(`• Geographic concentration: ${topCountry[0]} accounts for ${topCountry[1]} events (${((topCountry[1] / totalEvents) * 100).toFixed(1)}%)`);
    }
    
    // Security insights
    if (vpnDetected > 0) {
      insights.push(`• Security alert: ${vpnDetected} events detected VPN usage (${((vpnDetected / totalEvents) * 100).toFixed(1)}%)`);
    }
    
    if (botDetected > 0) {
      insights.push(`• Security alert: ${botDetected} events detected bot activity (${((botDetected / totalEvents) * 100).toFixed(1)}%)`);
    }
    
    // Behavioral insights
    const eventsPerVisitor = totalEvents / uniqueVisitors;
    if (eventsPerVisitor > 5) {
      insights.push(`• High engagement: Average of ${eventsPerVisitor.toFixed(1)} events per visitor`);
    }
    
    // Browser insights
    const browsers = events.reduce((acc, event) => {
      if (event.browser) {
        acc[event.browser] = (acc[event.browser] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topBrowser = Object.entries(browsers)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topBrowser) {
      insights.push(`• Browser preference: ${topBrowser[0]} is most popular (${topBrowser[1]} events)`);
    }
    
    return insights.join('\n');
  }

  generateFollowUpQuestions(response, events) {
    const lowerResponse = response.toLowerCase();
    const questions = [];
    
    if (lowerResponse.includes('security') || lowerResponse.includes('vpn') || lowerResponse.includes('bot')) {
      questions.push("Show me detailed security threats");
      questions.push("Analyze VPN usage patterns");
      questions.push("Which browsers are most commonly used by bots?");
      questions.push("How do device types correlate with security threats?");
    } else {
      questions.push("What are the most significant data patterns?");
      questions.push("How do these insights compare to benchmarks?");
    }
    
    if (lowerResponse.includes('geographic') || lowerResponse.includes('country') || lowerResponse.includes('location')) {
      questions.push("Show me geographic distribution");
      questions.push("Analyze location patterns");
    } else if (lowerResponse.includes('visitor') || lowerResponse.includes('activity') || lowerResponse.includes('behavior')) {
      questions.push("Show me visitor patterns");
      questions.push("Analyze user behavior");
    } else if (lowerResponse.includes('browser') || lowerResponse.includes('device') || lowerResponse.includes('technology')) {
      questions.push("Show me browser usage");
      questions.push("Analyze device patterns");
    } else {
      questions.push("Show me data patterns");
      questions.push("Analyze insights");
    }

    return questions.slice(0, 2);
  }

  async generateSmartInsight(events) {
    try {
      // Use all events for analysis (10,847 events from Elvo CSV)
      const recentEvents = events;
      
      console.log(`Processing ${recentEvents.length} events for smart insight generation`);
      
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

  generateInsightQuestion(events) {
    const totalEvents = events.length;
    const uniqueVisitors = new Set(events.map(e => e.visitorId)).size;
    const vpnDetected = events.filter(e => e.vpnDetected).length;
    const botDetected = events.filter(e => e.botDetected).length;
    const uniqueCountries = new Set(events.map(e => e.country).filter(Boolean)).size;
    
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
