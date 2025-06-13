
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fmpAPI, logokitAPI } from '@/services/api';

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

// Enhanced hook with real-time prices, logos, and industry info
export const usePortfolioWithPrices = (portfolioId?: string) => {
  const { trades, loading: tradesLoading, error, createTrade, deleteTrade, refetch } = useTrades(portfolioId);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);

  useEffect(() => {
    if (trades.length > 0) {
      calculateHoldingsWithEnhancedData();
    } else {
      setHoldings([]);
    }
  }, [trades]);

  const calculateHoldingsWithEnhancedData = async () => {
    setPricesLoading(true);
    try {
      // Group trades by ticker and calculate holdings properly
      const holdingsMap = new Map();
      
      // Sort trades by date to process them chronologically
      const sortedTrades = [...trades].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
      
      sortedTrades.forEach(trade => {
        const key = trade.ticker_symbol;
        if (!holdingsMap.has(key)) {
          holdingsMap.set(key, {
            ticker: trade.ticker_symbol,
            companyName: trade.company_name || trade.ticker_symbol,
            totalShares: 0,
            totalCostBasis: 0,
            trades: []
          });
        }
        
        const holding = holdingsMap.get(key);
        
        if (trade.action === 'buy') {
          holding.totalShares += trade.shares;
          holding.totalCostBasis += trade.shares * trade.price_per_share;
        } else if (trade.action === 'sell') {
          // Only reduce shares, don't change cost basis for average price calculation
          holding.totalShares -= trade.shares;
          // Don't reduce cost basis - this maintains correct average price
        }
        
        holding.trades.push(trade);
      });

      // Filter out positions with zero or negative shares
      const validHoldings = Array.from(holdingsMap.values()).filter(h => h.totalShares > 0);

      // Fetch enhanced data for each ticker
      const holdingsWithEnhancedData = await Promise.all(
        validHoldings.map(async (holding) => {
          try {
            // Fetch current price, profile, and logo in parallel
            const [quoteData, profileData, logoData] = await Promise.all([
              fmpAPI.getQuote(holding.ticker),
              fmpAPI.getProfile(holding.ticker),
              logokitAPI.getLogo(holding.ticker)
            ]);

            const currentPrice = quoteData?.[0]?.price || holding.totalCostBasis / holding.totalShares;
            const profile = profileData?.[0];
            const industry = profile?.industry || 'Unknown';
            const logoUrl = logoData?.logoUrl || null;
            
            // Average price calculation: only based on cost basis of remaining shares
            const avgPrice = holding.totalCostBasis / holding.totalShares;
            const totalValue = holding.totalShares * currentPrice;
            const returnPct = ((currentPrice - avgPrice) / avgPrice) * 100;

            return {
              ticker: holding.ticker,
              companyName: holding.companyName,
              shares: holding.totalShares,
              avgPrice: Math.max(0, avgPrice), // Ensure never negative
              currentPrice,
              totalValue,
              return: returnPct,
              industry,
              logoUrl
            };
          } catch (error) {
            console.error(`Error fetching enhanced data for ${holding.ticker}:`, error);
            const avgPrice = Math.max(0, holding.totalCostBasis / holding.totalShares);
            return {
              ticker: holding.ticker,
              companyName: holding.companyName,
              shares: holding.totalShares,
              avgPrice,
              currentPrice: avgPrice,
              totalValue: holding.totalShares * avgPrice,
              return: 0,
              industry: 'Unknown',
              logoUrl: null
            };
          }
        })
      );

      setHoldings(holdingsWithEnhancedData);
    } catch (error) {
      console.error('Error calculating holdings with enhanced data:', error);
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
