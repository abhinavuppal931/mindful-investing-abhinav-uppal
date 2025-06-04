
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

  getFinancials: async (symbol: string, period = 'annual', statement = 'income', limit = 10) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'financials', symbol, period, statement, limit }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Financials error:', error);
      throw error;
    }
  },

  getMetrics: async (symbol: string, period = 'annual', limit = 10) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'metrics', symbol, period, limit }
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
  },

  getPressReleases: async (symbol: string, from: string, to: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('finnhub-api', {
        body: { action: 'press-releases', symbol, from, to }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Finnhub Press Releases error:', error);
      throw error;
    }
  }
};

// OpenAI Analysis API calls via Supabase Edge Functions
export const openaiAPI = {
  analyzeCompanyMoat: async (symbol: string, financialData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('openai-analysis', {
        body: { action: 'company-moat', symbol, financialData }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('OpenAI Moat Analysis error:', error);
      throw error;
    }
  },

  analyzeInvestmentRisks: async (symbol: string, financialData: any, newsData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('openai-analysis', {
        body: { action: 'investment-risks', symbol, financialData, newsData }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('OpenAI Risk Analysis error:', error);
      throw error;
    }
  },

  analyzeTailwindsHeadwinds: async (symbol: string, financialData: any, newsData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('openai-analysis', {
        body: { action: 'tailwinds-headwinds', symbol, financialData, newsData }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('OpenAI Tailwinds/Headwinds Analysis error:', error);
      throw error;
    }
  },

  analyzeEarningsHighlights: async (symbol: string, transcript: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('openai-analysis', {
        body: { action: 'earnings-highlights', symbol, transcript }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('OpenAI Earnings Highlights error:', error);
      throw error;
    }
  }
};

// API Ninjas calls via Supabase Edge Functions
export const apiNinjasAPI = {
  getEarningsTranscript: async (symbol: string, year?: number, quarter?: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('api-ninjas', {
        body: { action: 'earnings-transcript', symbol, year, quarter }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('API Ninjas Transcript error:', error);
      throw error;
    }
  }
};

export default { healthCheck, fmpAPI, finnhubAPI, openaiAPI, apiNinjasAPI };
