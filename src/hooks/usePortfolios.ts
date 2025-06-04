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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPortfolios([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('portfolios')
        .insert([{ 
          name, 
          description, 
          user_id: user.id 
        }])
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

// Enhanced hook to fetch real-time stock prices for portfolio holdings
export const usePortfolioWithPrices = (portfolioId?: string) => {
  const { trades, loading: tradesLoading, error, createTrade, deleteTrade, refetch } = useTrades(portfolioId);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);

  useEffect(() => {
    if (trades.length > 0) {
      calculateHoldingsWithRealPrices();
    } else {
      setHoldings([]);
    }
  }, [trades]);

  const calculateHoldingsWithRealPrices = async () => {
    setPricesLoading(true);
    console.log('Calculating holdings with real prices for trades:', trades);
    
    try {
      // Group trades by ticker
      const holdingsMap = new Map();
      
      trades.forEach(trade => {
        const key = trade.ticker_symbol;
        if (!holdingsMap.has(key)) {
          holdingsMap.set(key, {
            ticker: trade.ticker_symbol,
            companyName: trade.company_name || trade.ticker_symbol,
            totalShares: 0,
            totalCost: 0,
            trades: []
          });
        }
        
        const holding = holdingsMap.get(key);
        if (trade.action === 'buy') {
          holding.totalShares += trade.shares;
          holding.totalCost += trade.shares * trade.price_per_share;
        } else {
          holding.totalShares -= trade.shares;
          holding.totalCost -= trade.shares * trade.price_per_share;
        }
        holding.trades.push(trade);
      });

      // Filter out positions with zero or negative shares
      const validHoldings = Array.from(holdingsMap.values()).filter(h => h.totalShares > 0);
      console.log('Valid holdings before price fetch:', validHoldings);

      // Fetch current prices for each ticker
      const holdingsWithPrices = await Promise.all(
        validHoldings.map(async (holding) => {
          try {
            console.log(`Fetching current price for ${holding.ticker}...`);
            const { fmpAPI } = await import('@/services/api');
            const quoteData = await fmpAPI.getQuote(holding.ticker);
            
            let currentPrice = holding.totalCost / holding.totalShares; // fallback to avg price
            
            if (quoteData && quoteData.length > 0 && quoteData[0].price) {
              currentPrice = quoteData[0].price;
              console.log(`Successfully fetched price for ${holding.ticker}: $${currentPrice}`);
            } else {
              console.warn(`No current price available for ${holding.ticker}, using average cost`);
            }
            
            const avgPrice = holding.totalCost / holding.totalShares;
            const totalValue = holding.totalShares * currentPrice;
            const returnPct = ((currentPrice - avgPrice) / avgPrice) * 100;

            return {
              ticker: holding.ticker,
              companyName: holding.companyName,
              shares: holding.totalShares,
              avgPrice,
              currentPrice,
              totalValue,
              return: returnPct
            };
          } catch (error) {
            console.error(`Error fetching price for ${holding.ticker}:`, error);
            // Fallback to average price if API fails
            const avgPrice = holding.totalCost / holding.totalShares;
            return {
              ticker: holding.ticker,
              companyName: holding.companyName,
              shares: holding.totalShares,
              avgPrice,
              currentPrice: avgPrice,
              totalValue: holding.totalShares * avgPrice,
              return: 0
            };
          }
        })
      );

      console.log('Holdings with prices calculated:', holdingsWithPrices);
      setHoldings(holdingsWithPrices);
    } catch (error) {
      console.error('Error calculating holdings with real prices:', error);
    } finally {
      setPricesLoading(false);
    }
  };

  return {
    holdings,
    trades,
    loading: tradesLoading || pricesLoading,
    error,
    createTrade,
    deleteTrade,
    refetch
  };
};
