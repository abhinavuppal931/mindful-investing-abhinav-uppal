
-- First, drop the existing foreign key constraint that might be causing issues
ALTER TABLE public.decisions 
DROP CONSTRAINT IF EXISTS decisions_user_id_fkey;

-- Recreate the table structure without the problematic foreign key to auth.users
-- (since RLS policies will handle security instead)
ALTER TABLE public.decisions 
ALTER COLUMN user_id DROP NOT NULL,
ADD CONSTRAINT decisions_user_id_not_null CHECK (user_id IS NOT NULL);

-- Ensure RLS is enabled
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own decisions" ON public.decisions;
DROP POLICY IF EXISTS "Users can create their own decisions" ON public.decisions;
DROP POLICY IF EXISTS "Users can update their own decisions" ON public.decisions;
DROP POLICY IF EXISTS "Users can delete their own decisions" ON public.decisions;

-- Create proper RLS policies
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
