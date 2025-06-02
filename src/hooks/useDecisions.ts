
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Decision {
  id: string;
  user_id: string;
  ticker_symbol: string;
  action: 'buy' | 'sell';
  shares: number;
  price_per_share: number;
  emotional_state: number;
  based_on_fundamentals: boolean;
  fits_strategy: boolean;
  not_reacting_to_news: boolean;
  decision_date: string;
  created_at: string;
}

export const useDecisions = () => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDecisions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDecisions([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('decisions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDecisions(data || []);
    } catch (err) {
      console.error('Error fetching decisions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch decisions');
    } finally {
      setLoading(false);
    }
  };

  const createDecision = async (decision: Omit<Decision, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('decisions')
        .insert([{ 
          ...decision, 
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      
      setDecisions(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating decision:', err);
      throw err;
    }
  };

  const getWeeklyStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyDecisions = decisions.filter(d => 
      new Date(d.created_at) >= oneWeekAgo
    );

    const rationalDecisions = weeklyDecisions.filter(d => 
      d.based_on_fundamentals && d.fits_strategy && d.not_reacting_to_news
    );

    const rationalPercentage = weeklyDecisions.length > 0 
      ? Math.round((rationalDecisions.length / weeklyDecisions.length) * 100)
      : 0;

    return {
      totalDecisions: weeklyDecisions.length,
      rationalDecisions: rationalDecisions.length,
      rationalPercentage
    };
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  return {
    decisions,
    loading,
    error,
    createDecision,
    getWeeklyStats,
    refetch: fetchDecisions
  };
};
