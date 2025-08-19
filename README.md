# FingerprintJS AI Analytics Assistant

A powerful AI-powered analytics dashboard for FingerprintJS visitor identification data. This application provides intelligent insights into visitor patterns, security threats, geographic distribution, and more using advanced AI analysis.

## Features

### 🤖 Dual AI Provider System
- **Local AI (Ollama)**: Run AI analysis locally with Ollama models
- **Cloud AI (ChatGPT)**: Use OpenAI's GPT models for analysis
- **Smart Fallback**: Automatic fallback to rule-based analysis
- **Provider Selection**: Choose AI provider via environment variables

### 📊 Advanced Analytics
- **Visitor Behavior Analysis**: Track user patterns and identify unusual activity
- **Security Threat Detection**: VPN usage, bot activity, and fraud patterns
- **Geographic Intelligence**: Location-based insights and fraud detection
- **Device & Browser Analysis**: Technology stack insights
- **Confidence Scoring**: Identification accuracy evaluation
- **Time-based Patterns**: Peak usage and suspicious timing detection

### 🎨 Interactive Visualizations
- **Dynamic Charts**: Bar charts, pie charts, and line graphs
- **Real-time Updates**: Live data visualization
- **Responsive Design**: Works on all device sizes
- **Interactive Elements**: Click-to-analyze functionality

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory with the following variables:

#### Basic Configuration
```env
# FingerprintJS API Key
FP_SECRET_KEY=your_fingerprintjs_secret_key_here

# AI Provider Configuration
# Options: 'ollama', 'openai', or 'fallback' (default: 'fallback')
AI_PROVIDER=ollama
```

#### For Local AI (Ollama)
```env
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

#### For Cloud AI (ChatGPT)
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
```

### 3. AI Provider Setup

#### Option A: Local AI with Ollama
1. **Install Ollama**: Follow instructions at [ollama.ai](https://ollama.ai)
2. **Start Ollama Server**: `ollama serve`
3. **Pull a Model**: `ollama pull llama3.2` (or any other model)
4. **Set Environment**: 
   ```env
   AI_PROVIDER=ollama
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   ```

#### Option B: Cloud AI with ChatGPT
1. **Get OpenAI API Key**: Sign up at [platform.openai.com](https://platform.openai.com)
2. **Set Environment**:
   ```env
   AI_PROVIDER=openai
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4
   ```

#### Option C: Fallback Mode
```env
AI_PROVIDER=fallback
```

### 4. Start the Application
```bash
# Start both server and frontend
npm run dev:full

# Or start them separately
npm run server  # Backend server on port 3001
npm run dev     # Frontend on port 5173
```

## AI System Architecture

### Multi-Provider AI Pipeline
The AI system supports multiple providers with automatic fallback:

1. **AI Service** (`src/services/aiService.js`)
   - Supports Ollama (local) and OpenAI (cloud) providers
   - Automatic provider selection based on environment
   - Graceful fallback to rule-based analysis
   - Comprehensive data summarization for AI analysis

2. **AI Endpoints**
   - `/api/ai/analyze`: Main analysis endpoint
   - `/api/ai/status`: AI provider status and configuration
   - `/api/health`: System health with AI status

3. **Frontend Integration** (`src/components/AIChat.tsx`)
   - Real-time AI chat interface
   - Provider status indicators (Local AI, ChatGPT, Fallback)
   - Interactive chart generation
   - Error handling and fallback responses

### AI Capabilities

#### Security Analysis
- VPN detection patterns
- Bot activity identification
- Threat assessment and scoring
- Security recommendations

#### Visitor Intelligence
- User behavior patterns
- Session analysis
- Anomaly detection
- Activity clustering

#### Geographic Insights
- Location-based fraud detection
- Geographic distribution analysis
- Cross-border activity patterns
- Regional threat assessment

#### Technical Analysis
- Browser and OS distribution
- Device fingerprinting insights
- Confidence score evaluation
- Technology stack optimization

## Usage Examples

### Security Questions
- "What are the security threats in my data and how should I address them?"
- "Identify potential fraud patterns in visitor activity"
- "Analyze VPN usage and bot detection patterns"

### Visitor Analysis
- "Analyze visitor activity patterns and identify unusual behavior"
- "What are the most active users and their characteristics?"
- "Identify patterns in user sessions and interactions"

### Geographic Intelligence
- "Analyze geographic distribution and identify potential fraud patterns"
- "What countries show unusual activity patterns?"
- "Cross-reference location data with security indicators"

### Technical Insights
- "What insights can you provide about browser and device usage patterns?"
- "Analyze confidence scores and identification accuracy"
- "Identify technology trends in my user base"

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server status, API key availability, and AI provider status.

### AI Status
```
GET /api/ai/status
```
Returns current AI provider configuration and availability.

### FingerprintJS Events
```
GET /api/events?startDate=&endDate=&limit=
```
Fetches visitor identification events from FingerprintJS API.

### AI Analysis
```
POST /api/ai/analyze
Content-Type: application/json

{
  "question": "Your analysis question",
  "csvData": [...]
}
```
Performs AI analysis on the provided data and question.

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `FP_SECRET_KEY` | FingerprintJS API key | - | Yes |
| `AI_PROVIDER` | AI provider: 'ollama', 'openai', 'fallback' | 'fallback' | No |
| `OLLAMA_HOST` | Ollama server URL | 'http://localhost:11434' | For Ollama |
| `OLLAMA_MODEL` | Ollama model name | 'llama3.2' | For Ollama |
| `OPENAI_API_KEY` | OpenAI API key | - | For OpenAI |
| `OPENAI_MODEL` | OpenAI model name | 'gpt-4' | For OpenAI |

## Error Handling

The system includes comprehensive error handling:

- **Provider Unavailable**: Falls back to rule-based analysis
- **API Errors**: Graceful degradation with helpful messages
- **Data Issues**: Validation and error reporting
- **Network Problems**: Retry logic and offline support

## Performance Considerations

- **Local AI**: Faster response times, no API costs, privacy-focused
- **Cloud AI**: More powerful models, higher accuracy, requires internet
- **Fallback Mode**: Always available, basic insights, no external dependencies
- **Caching**: AI responses are not cached to ensure fresh insights
- **Rate Limiting**: Respects API rate limits for cloud providers

## Security Features

- **API Key Protection**: Environment variable storage
- **Data Privacy**: No data stored permanently
- **Local Processing**: Option to run AI locally for enhanced privacy
- **Input Validation**: Comprehensive request validation
- **Error Sanitization**: Safe error message handling

## Troubleshooting

### Ollama Issues
- Ensure Ollama server is running: `ollama serve`
- Check model availability: `ollama list`
- Verify host configuration in `.env`
- Test connection: `curl http://localhost:11434/api/tags`

### OpenAI Issues
- Verify API key is valid and has credits
- Check model availability in your OpenAI account
- Ensure internet connectivity
- Review API rate limits

### General Issues
- Check environment variable configuration
- Review server logs for detailed error messages
- Verify all dependencies are installed
- Test individual endpoints with curl

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

---

**Note**: This system supports multiple AI providers. Choose the one that best fits your needs:
- **Ollama**: For privacy, cost-effectiveness, and offline operation
- **OpenAI**: For maximum accuracy and advanced capabilities
- **Fallback**: For basic analysis without external dependencies
