
-- Check if action column exists in trades table and add if missing
-- This will safely add the action column if it doesn't exist
DO $$ 
BEGIN
    -- Check if action column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'action'
        AND table_schema = 'public'
    ) THEN
        -- Add action column with default value 'buy'
        ALTER TABLE public.trades 
        ADD COLUMN action TEXT NOT NULL DEFAULT 'buy'
        CHECK (action IN ('buy', 'sell'));
        
        -- Add comment to document the column
        COMMENT ON COLUMN public.trades.action IS 'Trade action: buy or sell';
    END IF;
END $$;
