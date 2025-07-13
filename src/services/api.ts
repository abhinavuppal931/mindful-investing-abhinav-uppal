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

  getMetricsTTM: async (symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'metrics-ttm', symbol }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Metrics TTM error:', error);
      throw error;
    }
  },

  getRatios: async (symbol: string, period = 'annual', limit = 10) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'ratios', symbol, period, limit }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Ratios error:', error);
      throw error;
    }
  },

  getRatiosTTM: async (symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'ratios-ttm', symbol }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Ratios TTM error:', error);
      throw error;
    }
  },

  getEnterpriseValues: async (symbol: string, period = 'annual', limit = 10) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'enterprise-values', symbol, period, limit }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Enterprise Values error:', error);
      throw error;
    }
  },

  getFinancialGrowth: async (symbol: string, period = 'annual', limit = 10) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'financial-growth', symbol, period, limit }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Financial Growth error:', error);
      throw error;
    }
  },

  getDividends: async (symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'dividends', symbol }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Dividends error:', error);
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
  },

  getHistoricalPrices: async (symbol: string, period = '1year') => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'historical-prices', symbol, period }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Historical Prices error:', error);
      throw error;
    }
  },

  searchSymbol: async (query: string) => {
    try {
      // Try symbol search first
      const { data: symbolData, error: symbolError } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'search-symbol', query }
      });
      
      if (!symbolError && symbolData && symbolData.length > 0) {
        return symbolData;
      }

      // If no results, try name search
      const { data: nameData, error: nameError } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'search-name', query }
      });
      
      if (nameError) throw nameError;
      return nameData || [];
    } catch (error) {
      console.error('FMP Symbol Search error:', error);
      throw error;
    }
  },

  searchByName: async (query: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'search-name', query }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Name Search error:', error);
      throw error;
    }
  },

  getRevenueProductSegmentation: async (symbol: string, period = 'annual') => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'revenue-product-segmentation', symbol, period }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Revenue Product Segmentation error:', error);
      throw error;
    }
  },

  getRevenueGeographicSegmentation: async (symbol: string, period = 'annual') => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'revenue-geographic-segmentation', symbol, period }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Revenue Geographic Segmentation error:', error);
      throw error;
    }
  },

  getIndexQuote: async (symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'index-quote', symbol }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Index Quote error:', error);
      throw error;
    }
  },

  getHistoricalChart: async (symbol: string, from: string, to: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'historical-chart', symbol, from, to }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Historical Chart error:', error);
      throw error;
    }
  },

  getEarningsTranscript: async (symbol: string, year: number, quarter: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'earnings-transcript', symbol, year, quarter }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Earnings Transcript error:', error);
      throw error;
    }
  },

  getAnalystRatings: async (symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'analyst-ratings', symbol }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Analyst Ratings error:', error);
      throw error;
    }
  },

  getPriceTarget: async (symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-api', {
        body: { action: 'price-target', symbol }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Price Target error:', error);
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

  analyzeNearTermTailwinds: async (symbol: string, financialData: any, newsData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('openai-analysis', {
        body: { action: 'near-term-tailwinds', symbol, financialData, newsData }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('OpenAI Near-term Tailwinds error:', error);
      throw error;
    }
  },

  analyzeLongTermTailwinds: async (symbol: string, financialData: any, newsData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('openai-analysis', {
        body: { action: 'long-term-tailwinds', symbol, financialData, newsData }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('OpenAI Long-term Tailwinds error:', error);
      throw error;
    }
  },

  generateBriefInsight: async (symbol: string, financialData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('openai-analysis', {
        body: { action: 'brief-insight', symbol, financialData }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('OpenAI Brief Insight error:', error);
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

export const logokitAPI = {
  getLogo: async (symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('logokit-api', {
        body: { symbol }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('LogoKit error:', error);
      throw error;
    }
  }
};

export default { healthCheck, fmpAPI, finnhubAPI, openaiAPI, logokitAPI };
