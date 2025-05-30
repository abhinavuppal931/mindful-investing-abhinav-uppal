
import { supabase } from '@/integrations/supabase/client';

// Health check function
export const healthCheck = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('health-check');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// Financial Modeling Prep API calls via Supabase Edge Functions
export const fmpAPI = {
  getQuote: async (symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'quote', symbol }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Quote error:', error);
      throw error;
    }
  },

  getFinancials: async (symbol: string, period = 'annual', statement = 'income') => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'financials', symbol, period, statement }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Financials error:', error);
      throw error;
    }
  },

  getMetrics: async (symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'metrics', symbol }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Metrics error:', error);
      throw error;
    }
  },

  getProfile: async (symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'profile', symbol }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Profile error:', error);
      throw error;
    }
  }
};

// Finnhub API calls via Supabase Edge Functions
export const finnhubAPI = {
  getCompanyNews: async (symbol: string, from: string, to: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('finnhub-api', {
        body: { action: 'company-news', symbol, from, to }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Finnhub News error:', error);
      throw error;
    }
  },

  getMarketNews: async (category = 'general') => {
    try {
      const { data, error } = await supabase.functions.invoke('finnhub-api', {
        body: { action: 'market-news', category }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Finnhub Market News error:', error);
      throw error;
    }
  },

  getEarningsCalendar: async (from: string, to: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('finnhub-api', {
        body: { action: 'earnings', from, to }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Finnhub Earnings error:', error);
      throw error;
    }
  }
};

// Gemini AI API calls via Supabase Edge Functions
export const geminiAPI = {
  analyzeCompany: async (symbol: string, financialData: any, newsData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { action: 'company-analysis', symbol, financialData, newsData }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Gemini Company Analysis error:', error);
      throw error;
    }
  },

  scoreNews: async (articles: any[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { action: 'news-scoring', articles }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Gemini News Scoring error:', error);
      throw error;
    }
  },

  detectBias: async (tradeData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { action: 'bias-detection', ...tradeData }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Gemini Bias Detection error:', error);
      throw error;
    }
  }
};

export default { healthCheck, fmpAPI, finnhubAPI, geminiAPI };
