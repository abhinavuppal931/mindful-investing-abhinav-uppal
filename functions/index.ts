
import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors({ origin: true }));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Financial Modeling Prep API endpoints
app.get('/api/fmp/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const apiKey = process.env.FMP_API_KEY;
    
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('FMP Quote error:', error);
    res.status(500).json({ error: 'Failed to fetch stock quote' });
  }
});

app.get('/api/fmp/financials/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'annual', statement = 'income' } = req.query;
    const apiKey = process.env.FMP_API_KEY;
    
    let endpoint = '';
    switch (statement) {
      case 'income':
        endpoint = `/income-statement/${symbol}`;
        break;
      case 'balance':
        endpoint = `/balance-sheet-statement/${symbol}`;
        break;
      case 'cash':
        endpoint = `/cash-flow-statement/${symbol}`;
        break;
      default:
        endpoint = `/income-statement/${symbol}`;
    }
    
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3${endpoint}?period=${period}&apikey=${apiKey}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('FMP Financials error:', error);
    res.status(500).json({ error: 'Failed to fetch financial data' });
  }
});

app.get('/api/fmp/metrics/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const apiKey = process.env.FMP_API_KEY;
    
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/key-metrics/${symbol}?period=annual&apikey=${apiKey}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('FMP Metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch key metrics' });
  }
});

// Finnhub API endpoints
app.get('/api/finnhub/news/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { from, to } = req.query;
    const apiKey = process.env.FINNHUB_API_KEY;
    
    const response = await axios.get(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Finnhub News error:', error);
    res.status(500).json({ error: 'Failed to fetch company news' });
  }
});

app.get('/api/finnhub/market-news', async (req, res) => {
  try {
    const { category = 'general' } = req.query;
    const apiKey = process.env.FINNHUB_API_KEY;
    
    const response = await axios.get(
      `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Finnhub Market News error:', error);
    res.status(500).json({ error: 'Failed to fetch market news' });
  }
});

app.get('/api/finnhub/earnings', async (req, res) => {
  try {
    const { from, to } = req.query;
    const apiKey = process.env.FINNHUB_API_KEY;
    
    const response = await axios.get(
      `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${apiKey}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Finnhub Earnings error:', error);
    res.status(500).json({ error: 'Failed to fetch earnings calendar' });
  }
});

// Gemini AI endpoints
app.post('/api/gemini/company-analysis', async (req, res) => {
  try {
    const { symbol, financialData, newsData } = req.body;
    
    const prompt = `Analyze ${symbol} based on this financial and news data:
    
    Financial Data: ${JSON.stringify(financialData)}
    News Data: ${JSON.stringify(newsData)}
    
    Provide a comprehensive analysis including:
    1. Company Moat (competitive advantages)
    2. Investment Risks
    3. Near-term Headwinds and Tailwinds
    4. Long-term Headwinds and Tailwinds
    
    Format the response as JSON with the following structure:
    {
      "moat": ["advantage1", "advantage2", ...],
      "risks": ["risk1", "risk2", ...],
      "nearTermHeadwinds": ["headwind1", "headwind2", ...],
      "nearTermTailwinds": ["tailwind1", "tailwind2", ...],
      "longTermHeadwinds": ["headwind1", "headwind2", ...],
      "longTermTailwinds": ["tailwind1", "tailwind2", ...]
    }`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const analysis = JSON.parse(text);
      res.json(analysis);
    } catch (parseError) {
      // If JSON parsing fails, return structured response
      res.json({
        moat: [text.substring(0, 200)],
        risks: ["Analysis parsing error - please try again"],
        nearTermHeadwinds: [],
        nearTermTailwinds: [],
        longTermHeadwinds: [],
        longTermTailwinds: []
      });
    }
  } catch (error) {
    console.error('Gemini Company Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze company data' });
  }
});

app.post('/api/gemini/news-scoring', async (req, res) => {
  try {
    const { articles } = req.body;
    
    const scoredArticles = [];
    
    for (const article of articles) {
      const prompt = `Score this news article based on investment relevance:
      
      Title: ${article.headline || article.title}
      Summary: ${article.summary || article.description || ''}
      Source: ${article.source}
      
      Scoring criteria:
      - Fundamentals focus (50%): How much does it discuss actual business metrics, earnings, revenue, market share, etc.?
      - Source credibility (30%): Is this from a reputable financial news source (Reuters, Bloomberg, WSJ, etc.)?
      - Tone analysis (20%): Is the language neutral and analytical vs sensational or emotional?
      
      Return JSON with:
      {
        "score": number (0-100),
        "breakdown": {
          "fundamentals": number (0-50),
          "credibility": number (0-30),
          "tone": number (0-20)
        },
        "reasoning": "Brief explanation"
      }`;
      
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const scoring = JSON.parse(text);
        
        scoredArticles.push({
          ...article,
          aiScore: scoring.score,
          scoreBreakdown: scoring.breakdown,
          reasoning: scoring.reasoning
        });
      } catch (error) {
        console.error('Error scoring article:', error);
        scoredArticles.push({
          ...article,
          aiScore: 50, // Default middle score if analysis fails
          scoreBreakdown: { fundamentals: 25, credibility: 15, tone: 10 },
          reasoning: "Scoring analysis failed"
        });
      }
    }
    
    res.json(scoredArticles);
  } catch (error) {
    console.error('Gemini News Scoring error:', error);
    res.status(500).json({ error: 'Failed to score news articles' });
  }
});

app.post('/api/gemini/bias-detection', async (req, res) => {
  try {
    const { ticker, action, shares, price, emotionalState, questions } = req.body;
    
    const prompt = `Analyze potential trading biases for this planned trade:
    
    Stock: ${ticker}
    Action: ${action}
    Shares: ${shares}
    Price: $${price}
    Emotional State: ${emotionalState}
    Reflection Questions: ${JSON.stringify(questions)}
    
    Detect potential cognitive biases such as:
    - FOMO (Fear of Missing Out)
    - Loss Aversion
    - Confirmation Bias
    - Recency Bias
    - Anchoring Bias
    - Herd Mentality
    
    Calculate a Decision Impact Score (0-100) where:
    - 50% based on emotional state (Calm = high score, Anxious/Fear = low score)
    - 50% based on rationality indicators from reflection questions
    
    Return JSON:
    {
      "biases": ["detected bias 1", "detected bias 2"],
      "score": number (0-100),
      "recommendation": "advice for the trader",
      "rationalityCheck": "assessment of decision quality"
    }`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const analysis = JSON.parse(text);
      res.json(analysis);
    } catch (parseError) {
      res.json({
        biases: ["Analysis error"],
        score: 50,
        recommendation: "Please review your trading decision carefully",
        rationalityCheck: "Unable to analyze at this time"
      });
    }
  } catch (error) {
    console.error('Gemini Bias Detection error:', error);
    res.status(500).json({ error: 'Failed to detect trading biases' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
