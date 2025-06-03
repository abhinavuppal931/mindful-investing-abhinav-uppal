
-- First, ensure the decisions table exists with all required columns
CREATE TABLE IF NOT EXISTS public.decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticker_symbol TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
  shares NUMERIC NOT NULL CHECK (shares > 0),
  price_per_share NUMERIC NOT NULL CHECK (price_per_share > 0),
  anxious_level INTEGER DEFAULT 0 CHECK (anxious_level >= 0 AND anxious_level <= 2),
  confident_level INTEGER DEFAULT 0 CHECK (confident_level >= 0 AND confident_level <= 2),
  impulsive_level INTEGER DEFAULT 0 CHECK (impulsive_level >= 0 AND impulsive_level <= 2),
  cautious_level INTEGER DEFAULT 0 CHECK (cautious_level >= 0 AND cautious_level <= 2),
  overwhelmed_level INTEGER DEFAULT 0 CHECK (overwhelmed_level >= 0 AND overwhelmed_level <= 2),
  reflection_answers JSONB DEFAULT '{}',
  decision_quality_score INTEGER CHECK (decision_quality_score >= 0 AND decision_quality_score <= 100),
  is_draft BOOLEAN DEFAULT false,
  decision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on decisions table
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own decisions" ON public.decisions;
DROP POLICY IF EXISTS "Users can create their own decisions" ON public.decisions;
DROP POLICY IF EXISTS "Users can update their own decisions" ON public.decisions;
DROP POLICY IF EXISTS "Users can delete their own decisions" ON public.decisions;

-- Create proper RLS policies for decisions
CREATE POLICY "Users can view their own decisions" 
  ON public.decisions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decisions" 
  ON public.decisions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decisions" 
  ON public.decisions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decisions" 
  ON public.decisions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable RLS on watchlists table
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Drop existing watchlist policies if they exist
DROP POLICY IF EXISTS "Users can view their own watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "Users can create their own watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "Users can update their own watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "Users can delete their own watchlists" ON public.watchlists;

-- Create proper RLS policies for watchlists
CREATE POLICY "Users can view their own watchlists" 
  ON public.watchlists 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watchlists" 
  ON public.watchlists 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlists" 
  ON public.watchlists 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlists" 
  ON public.watchlists 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add update trigger for decisions table if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_decisions_updated_at ON public.decisions;

-- Create trigger for decisions
CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON public.decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
