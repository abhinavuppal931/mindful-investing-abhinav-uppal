
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  portfolio_id: string;
  ticker_symbol: string;
  company_name: string | null;
  action: 'buy' | 'sell';
  shares: number;
  price_per_share: number;
  trade_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const usePortfolios = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolios = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPortfolios(data || []);
    } catch (err) {
      console.error('Error fetching portfolios:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolios');
    } finally {
      setLoading(false);
    }
  };

  const createPortfolio = async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .insert([{ name, description }])
        .select()
        .single();

      if (error) throw error;
      
      setPortfolios(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating portfolio:', err);
      throw err;
    }
  };

  const deletePortfolio = async (id: string) => {
    try {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPortfolios(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting portfolio:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  return {
    portfolios,
    loading,
    error,
    createPortfolio,
    deletePortfolio,
    refetch: fetchPortfolios
  };
};

export const useTrades = (portfolioId?: string) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = async () => {
    if (!portfolioId) {
      setTrades([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('trade_date', { ascending: false });

      if (error) throw error;
      setTrades(data || []);
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };

  const createTrade = async (trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .insert([trade])
        .select()
        .single();

      if (error) throw error;
      
      setTrades(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating trade:', err);
      throw err;
    }
  };

  const deleteTrade = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTrades(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting trade:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [portfolioId]);

  return {
    trades,
    loading,
    error,
    createTrade,
    deleteTrade,
    refetch: fetchTrades
  };
};
