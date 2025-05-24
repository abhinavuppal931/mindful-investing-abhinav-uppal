
import axios from 'axios';

// Use the deployed Firebase Functions URL for production
const FUNCTIONS_BASE_URL = 'https://us-central1-mindfulinvestingcompanion.cloudfunctions.net';

const api = axios.create({
  baseURL: FUNCTIONS_BASE_URL,
  timeout: 30000,
});

// Financial Modeling Prep API calls
export const fmpAPI = {
  getQuote: async (symbol: string) => {
    const response = await api.get(`/api/fmp/quote/${symbol}`);
    return response.data;
  },

  getFinancials: async (symbol: string, period = 'annual', statement = 'income') => {
    const response = await api.get(`/api/fmp/financials/${symbol}?period=${period}&statement=${statement}`);
    return response.data;
  },

  getMetrics: async (symbol: string) => {
    const response = await api.get(`/api/fmp/metrics/${symbol}`);
    return response.data;
  },

  getProfile: async (symbol: string) => {
    const response = await api.get(`/api/fmp/profile/${symbol}`);
    return response.data;
  }
};

// Finnhub API calls
export const finnhubAPI = {
  getCompanyNews: async (symbol: string, from: string, to: string) => {
    const response = await api.get(`/api/finnhub/news/${symbol}?from=${from}&to=${to}`);
    return response.data;
  },

  getMarketNews: async (category = 'general') => {
    const response = await api.get(`/api/finnhub/market-news?category=${category}`);
    return response.data;
  },

  getEarningsCalendar: async (from: string, to: string) => {
    const response = await api.get(`/api/finnhub/earnings?from=${from}&to=${to}`);
    return response.data;
  }
};

// Gemini AI API calls
export const geminiAPI = {
  analyzeCompany: async (symbol: string, financialData: any, newsData: any) => {
    const response = await api.post('/api/gemini/company-analysis', {
      symbol,
      financialData,
      newsData
    });
    return response.data;
  },

  scoreNews: async (articles: any[]) => {
    const response = await api.post('/api/gemini/news-scoring', {
      articles
    });
    return response.data;
  },

  detectBias: async (tradeData: any) => {
    const response = await api.post('/api/gemini/bias-detection', tradeData);
    return response.data;
  }
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

export default api;
