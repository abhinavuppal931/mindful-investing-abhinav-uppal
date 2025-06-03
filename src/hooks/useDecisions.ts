
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Decision {
  id: string;
  user_id: string;
  ticker_symbol: string;
  action: 'buy' | 'sell';
  shares: number;
  price_per_share: number;
  anxious_level: number;
  confident_level: number;
  impulsive_level: number;
  cautious_level: number;
  overwhelmed_level: number;
  reflection_answers: Record<string, string>;
  decision_quality_score: number | null;
  is_draft: boolean;
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
        .eq('is_draft', false) // Only fetch completed decisions
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
      
      // Only add to state if it's not a draft
      if (!decision.is_draft) {
        setDecisions(prev => [data, ...prev]);
      }
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

    // Calculate rational decisions based on quality score
    const rationalDecisions = weeklyDecisions.filter(d => 
      (d.decision_quality_score || 0) > 50
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
