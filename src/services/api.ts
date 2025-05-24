
import axios from 'axios';

// Get the Firebase Functions URL - update this with your actual Firebase project URL
const FUNCTIONS_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5001/your-project-id/us-central1/api'
  : 'https://us-central1-your-project-id.cloudfunctions.net/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: FUNCTIONS_BASE_URL,
  timeout: 30000,
});

// Financial Modeling Prep API calls
export const getStockQuote = async (symbol: string) => {
  try {
    const response = await api.get(`/fmp/quote/${symbol}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    throw error;
  }
};

export const getFinancialStatements = async (
  symbol: string, 
  statement: 'income' | 'balance' | 'cash' = 'income',
  period: 'annual' | 'quarter' = 'annual'
) => {
  try {
    const response = await api.get(`/fmp/financials/${symbol}`, {
      params: { statement, period }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching financial statements:', error);
    throw error;
  }
};

export const getKeyMetrics = async (symbol: string) => {
  try {
    const response = await api.get(`/fmp/metrics/${symbol}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching key metrics:', error);
    throw error;
  }
};

// Finnhub API calls
export const getCompanyNews = async (
  symbol: string, 
  from: string, 
  to: string
) => {
  try {
    const response = await api.get(`/finnhub/news/${symbol}`, {
      params: { from, to }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching company news:', error);
    throw error;
  }
};

export const getMarketNews = async (category: string = 'general') => {
  try {
    const response = await api.get('/finnhub/market-news', {
      params: { category }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching market news:', error);
    throw error;
  }
};

export const getEarningsCalendar = async (from: string, to: string) => {
  try {
    const response = await api.get('/finnhub/earnings', {
      params: { from, to }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    throw error;
  }
};

// Gemini AI calls
export const getCompanyAnalysis = async (
  symbol: string, 
  financialData: any, 
  newsData: any
) => {
  try {
    const response = await api.post('/gemini/company-analysis', {
      symbol,
      financialData,
      newsData
    });
    return response.data;
  } catch (error) {
    console.error('Error getting company analysis:', error);
    throw error;
  }
};

export const scoreNewsArticles = async (articles: any[]) => {
  try {
    const response = await api.post('/gemini/news-scoring', {
      articles
    });
    return response.data;
  } catch (error) {
    console.error('Error scoring news articles:', error);
    throw error;
  }
};

export const detectTradingBias = async (tradeData: {
  ticker: string;
  action: 'buy' | 'sell';
  shares: number;
  price: number;
  emotionalState: string;
  questions: Record<string, boolean>;
}) => {
  try {
    const response = await api.post('/gemini/bias-detection', tradeData);
    return response.data;
  } catch (error) {
    console.error('Error detecting trading bias:', error);
    throw error;
  }
};

// Health check
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};
