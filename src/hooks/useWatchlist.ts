
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WatchlistItem {
  id: string;
  user_id: string;
  ticker_symbol: string;
  added_at: string;
}

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlist = async () => {
    try {
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) throw error;
      setWatchlist(data || []);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch watchlist');
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (tickerSymbol: string) => {
    try {
      const { data, error } = await supabase
        .from('watchlists')
        .insert([{ ticker_symbol: tickerSymbol }])
        .select()
        .single();

      if (error) throw error;
      
      setWatchlist(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      throw err;
    }
  };

  const removeFromWatchlist = async (tickerSymbol: string) => {
    try {
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('ticker_symbol', tickerSymbol);

      if (error) throw error;
      
      setWatchlist(prev => prev.filter(item => item.ticker_symbol !== tickerSymbol));
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      throw err;
    }
  };

  const isInWatchlist = (tickerSymbol: string) => {
    return watchlist.some(item => item.ticker_symbol === tickerSymbol);
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refetch: fetchWatchlist
  };
};
