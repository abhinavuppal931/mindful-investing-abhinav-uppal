
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
        .eq('is_draft', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }
      
      setDecisions(data || []);
    } catch (err: any) {
      console.error('Error fetching decisions:', err);
      setError(err?.message || 'Failed to fetch decisions');
    } finally {
      setLoading(false);
    }
  };

  const createDecision = async (decision: Omit<Decision, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Ensure all required fields are present and properly formatted
      const decisionData = {
        ticker_symbol: decision.ticker_symbol.toUpperCase(),
        action: decision.action,
        shares: Number(decision.shares),
        price_per_share: Number(decision.price_per_share),
        anxious_level: Number(decision.anxious_level || 0),
        confident_level: Number(decision.confident_level || 0),
        impulsive_level: Number(decision.impulsive_level || 0),
        cautious_level: Number(decision.cautious_level || 0),
        overwhelmed_level: Number(decision.overwhelmed_level || 0),
        reflection_answers: decision.reflection_answers || {},
        decision_quality_score: decision.decision_quality_score ? Number(decision.decision_quality_score) : null,
        is_draft: Boolean(decision.is_draft),
        decision_date: decision.decision_date,
        user_id: user.id
      };

      console.log('Creating decision with data:', decisionData);

      const { data, error } = await supabase
        .from('decisions')
        .insert([decisionData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to create decision');
      }
      
      console.log('Decision created successfully:', data);
      
      // Only add to state if it's not a draft
      if (!decision.is_draft) {
        setDecisions(prev => [data, ...prev]);
      }
      return data;
    } catch (err: any) {
      console.error('Error creating decision:', err);
      throw new Error(err?.message || 'Failed to create decision');
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
