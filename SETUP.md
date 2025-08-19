# Quick Setup Guide - Dual AI Provider System

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Choose Your AI Provider

#### Option A: Local AI (Ollama) - Recommended for Privacy
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama server
ollama serve

# Pull a model (in another terminal)
ollama pull llama3.2

# Create .env file
echo "FP_SECRET_KEY=your_fingerprintjs_key
AI_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2" > .env
```

#### Option B: Cloud AI (ChatGPT) - Recommended for Accuracy
```bash
# Create .env file
echo "FP_SECRET_KEY=your_fingerprintjs_key
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4" > .env
```

#### Option C: Fallback Mode - No External Dependencies
```bash
# Create .env file
echo "FP_SECRET_KEY=your_fingerprintjs_key
AI_PROVIDER=fallback" > .env
```

### 3. Start the Application
```bash
npm run dev:full
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AI_PROVIDER` | AI provider choice | `ollama`, `openai`, `fallback` |
| `OLLAMA_HOST` | Ollama server URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3.2`, `mistral`, `codellama` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `OPENAI_MODEL` | OpenAI model name | `gpt-4`, `gpt-3.5-turbo` |

### Popular Ollama Models
- `llama3.2` - Good balance of speed and quality
- `mistral` - Fast and efficient
- `codellama` - Great for technical analysis
- `llama3.1` - High quality but slower

## 🧪 Testing Your Setup

### Check AI Status
```bash
curl http://localhost:3001/api/ai/status
```

### Test AI Analysis
```bash
curl -X POST http://localhost:3001/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the security threats in my data?",
    "csvData": []
  }'
```

## 🎯 Usage Examples

### Security Analysis
- "What are the security threats in my data and how should I address them?"
- "Identify potential fraud patterns in visitor activity"
- "Analyze VPN usage and bot detection patterns"

### Visitor Intelligence
- "Analyze visitor activity patterns and identify unusual behavior"
- "What are the most active users and their characteristics?"
- "Identify patterns in user sessions and interactions"

### Geographic Insights
- "Analyze geographic distribution and identify potential fraud patterns"
- "What countries show unusual activity patterns?"
- "Cross-reference location data with security indicators"

## 🔍 Troubleshooting

### Ollama Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
pkill ollama && ollama serve

# Check available models
ollama list
```

### OpenAI Issues
```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### General Issues
```bash
# Check server logs
npm run server

# Test health endpoint
curl http://localhost:3001/api/health
```

## 📊 Performance Comparison

| Provider | Speed | Cost | Privacy | Accuracy |
|----------|-------|------|---------|----------|
| Ollama | Fast | Free | High | Good |
| OpenAI | Medium | Paid | Low | Excellent |
| Fallback | Instant | Free | High | Basic |

## 🎉 You're Ready!

Your FingerprintJS AI Analytics Assistant is now configured with your preferred AI provider. Open the application and start asking questions about your data!
