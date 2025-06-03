
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setWatchlist([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Watchlist fetch error:', error);
        throw error;
      }
      
      setWatchlist(data || []);
    } catch (err: any) {
      console.error('Error fetching watchlist:', err);
      setError(err?.message || 'Failed to fetch watchlist');
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (tickerSymbol: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('watchlists')
        .insert([{ 
          ticker_symbol: tickerSymbol.toUpperCase(),
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) {
        console.error('Watchlist add error:', error);
        throw new Error(error.message || 'Failed to add to watchlist');
      }
      
      setWatchlist(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error adding to watchlist:', err);
      throw new Error(err?.message || 'Failed to add to watchlist');
    }
  };

  const removeFromWatchlist = async (tickerSymbol: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('ticker_symbol', tickerSymbol.toUpperCase())
        .eq('user_id', user.id);

      if (error) {
        console.error('Watchlist remove error:', error);
        throw new Error(error.message || 'Failed to remove from watchlist');
      }
      
      setWatchlist(prev => prev.filter(item => item.ticker_symbol !== tickerSymbol.toUpperCase()));
    } catch (err: any) {
      console.error('Error removing from watchlist:', err);
      throw new Error(err?.message || 'Failed to remove from watchlist');
    }
  };

  const isInWatchlist = (tickerSymbol: string) => {
    return watchlist.some(item => item.ticker_symbol === tickerSymbol.toUpperCase());
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
