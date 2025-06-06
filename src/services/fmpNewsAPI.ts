
import { supabase } from '@/integrations/supabase/client';

export const fmpNewsAPI = {
  getGeneralNews: async (from?: string, to?: string, page = 0, limit = 20) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-news', {
        body: { action: 'general-news', from, to, page, limit }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP General News error:', error);
      throw error;
    }
  },

  getStockNews: async (symbols: string, from?: string, to?: string, page = 0, limit = 20) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-news', {
        body: { action: 'stock-news', symbols, from, to, page, limit }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Stock News error:', error);
      throw error;
    }
  },

  searchStockNews: async (symbols: string, from?: string, to?: string, page = 0, limit = 20) => {
    try {
      const { data, error } = await supabase.functions.invoke('fmp-news', {
        body: { action: 'search-stock-news', symbols, from, to, page, limit }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FMP Search Stock News error:', error);
      throw error;
    }
  }
};
