
-- Create news_analysis_cache table for storing sentiment and relevance analysis results
CREATE TABLE public.news_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_hash VARCHAR(64) NOT NULL UNIQUE,
  headline TEXT NOT NULL,
  summary TEXT,
  ticker VARCHAR(10),
  sentiment_result JSONB,
  relevance_result JSONB,
  source VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Create indexes for performance
CREATE INDEX idx_news_analysis_cache_article_hash ON public.news_analysis_cache(article_hash);
CREATE INDEX idx_news_analysis_cache_expires_at ON public.news_analysis_cache(expires_at);
CREATE INDEX idx_news_analysis_cache_ticker ON public.news_analysis_cache(ticker) WHERE ticker IS NOT NULL;

-- Create automatic cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_news_analysis()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.news_analysis_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup activity
  INSERT INTO public.system_logs (action, details, created_at)
  VALUES ('news_cache_cleanup', jsonb_build_object('deleted_count', deleted_count), now())
  ON CONFLICT DO NOTHING; -- Ignore if system_logs table doesn't exist
  
  RETURN deleted_count;
END;
$$;

-- Create system_logs table for monitoring (optional, for cleanup logging)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Schedule daily cleanup using pg_cron (if available)
-- This will be attempted but may fail if pg_cron extension is not enabled
DO $$
BEGIN
  -- Try to schedule the cleanup job
  PERFORM cron.schedule(
    'news-cache-cleanup',
    '0 2 * * *', -- Run daily at 2 AM
    'SELECT public.cleanup_expired_news_analysis();'
  );
EXCEPTION WHEN OTHERS THEN
  -- If pg_cron is not available, just log that manual cleanup will be needed
  RAISE NOTICE 'pg_cron extension not available. Manual cleanup will be needed.';
END;
$$;
