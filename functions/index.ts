
import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors({ origin: true }));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Financial Modeling Prep API endpoints
app.get('/api/fmp/stocks/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { metric } = req.query;
    
    const baseUrl = 'https://financialmodelingprep.com/api/v3';
    const apiKey = process.env.FMP_API_KEY;

    let endpoint = `/quote/${symbol}`;
    if (metric === 'financials') {
      endpoint = `/income-statement/${symbol}?period=quarter`;
    }

    const response = await axios.get(`${baseUrl}${endpoint}?apikey=${apiKey}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// Financial Datasets API endpoint
app.get('/api/earnings', async (req, res) => {
  try {
    const { from, to } = req.query;
    const apiKey = process.env.FINANCIAL_DATASETS_API_KEY;
    
    const response = await axios.get(
      `https://financial-datasets-api.example.com/earnings?from=${from}&to=${to}&apiKey=${apiKey}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch earnings data' });
  }
});

// News API endpoint
app.get('/api/news', async (req, res) => {
  try {
    const { symbol, from, to } = req.query;
    const apiKey = process.env.NEWS_API_KEY;
    
    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=${symbol}&from=${from}&to=${to}&apiKey=${apiKey}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Gemini API endpoints
app.post('/api/gemini/moat-risks', async (req, res) => {
  try {
    const { symbol, companyData } = req.body;
    
    const prompt = `Analyze the competitive moat and investment risks for ${symbol} based on this data: ${JSON.stringify(companyData)}. 
                   Format the response as JSON with 'moat' and 'risks' arrays.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json(JSON.parse(response.text()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze moat and risks' });
  }
});

app.post('/api/gemini/bias-detection', async (req, res) => {
  try {
    const { ticker, action, shares, price, emotionalState, questions } = req.body;
    
    const prompt = `Analyze potential trading biases for: ${ticker}, ${action}, ${shares} shares at $${price}. 
                   Emotional state: ${emotionalState}. Questions: ${JSON.stringify(questions)}. 
                   Return JSON with 'biases' array and 'score' number.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json(JSON.parse(response.text()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to detect biases' });
  }
});

app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const { symbol, quarter, year, transcript } = req.body;
    
    const prompt = `Summarize key points from ${symbol}'s ${quarter} ${year} earnings call transcript: ${transcript}. 
                   Return JSON with 'highlights' array and 'sentiment' string.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json(JSON.parse(response.text()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to summarize transcript' });
  }
});

app.post('/api/gemini/score', async (req, res) => {
  try {
    const { title, content, source } = req.body;
    
    const prompt = `Score this news article:
                   Title: ${title}
                   Content: ${content}
                   Source: ${source}
                   
                   Calculate score (0-100) based on:
                   - Fundamentals focus (50%): How much does it discuss actual business metrics and facts?
                   - Source credibility (30%): Is this a reputable financial news source?
                   - Tone (20%): Is the language neutral and analytical vs sensational?
                   
                   Return JSON with 'score' number and 'breakdown' object showing component scores.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json(JSON.parse(response.text()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to score article' });
  }
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
