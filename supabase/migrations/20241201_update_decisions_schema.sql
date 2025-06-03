
-- Update decisions table to support new multi-step wizard flow
ALTER TABLE public.decisions 
DROP COLUMN emotional_state,
ADD COLUMN anxious_level INTEGER DEFAULT 0 CHECK (anxious_level >= 0 AND anxious_level <= 2),
ADD COLUMN confident_level INTEGER DEFAULT 0 CHECK (confident_level >= 0 AND confident_level <= 2),
ADD COLUMN impulsive_level INTEGER DEFAULT 0 CHECK (impulsive_level >= 0 AND impulsive_level <= 2),
ADD COLUMN cautious_level INTEGER DEFAULT 0 CHECK (cautious_level >= 0 AND cautious_level <= 2),
ADD COLUMN overwhelmed_level INTEGER DEFAULT 0 CHECK (overwhelmed_level >= 0 AND overwhelmed_level <= 2),
ADD COLUMN reflection_answers JSONB,
ADD COLUMN decision_quality_score INTEGER CHECK (decision_quality_score >= 0 AND decision_quality_score <= 100),
ADD COLUMN is_draft BOOLEAN DEFAULT false;

-- Remove old boolean columns and replace with dynamic reflection answers
ALTER TABLE public.decisions 
DROP COLUMN based_on_fundamentals,
DROP COLUMN fits_strategy,
DROP COLUMN not_reacting_to_news;
