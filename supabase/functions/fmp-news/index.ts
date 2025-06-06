
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

function isValidCache(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < entry.ttl;
}

async function retryRequest(url: string, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, symbols, from, to, page = 0, limit = 20 } = await req.json();
    
    if (!FMP_API_KEY) {
      throw new Error('FMP API key not configured');
    }

    let endpoint = '';
    let ttl = 30 * 60 * 1000; // 30 minutes default

    switch (action) {
      case 'general-news':
        // Use the correct FMP General News API endpoint
        endpoint = `${BASE_URL}/fmp/articles?page=${page}&size=${limit}&apikey=${FMP_API_KEY}`;
        if (from) endpoint += `&from=${from}`;
        if (to) endpoint += `&to=${to}`;
        ttl = 15 * 60 * 1000; // 15 minutes for news
        break;
        
      case 'stock-news':
        // FMP Stock News API  
        endpoint = `${BASE_URL}/stock_news?tickers=${symbols}&page=${page}&limit=${limit}&apikey=${FMP_API_KEY}`;
        if (from) endpoint += `&from=${from}`;
        if (to) endpoint += `&to=${to}`;
        ttl = 15 * 60 * 1000; // 15 minutes for news
        break;
        
      case 'search-stock-news':
        // FMP Search Stock News API
        if (!symbols) {
          throw new Error('Symbols parameter required for stock news search');
        }
        endpoint = `${BASE_URL}/stock_news?tickers=${symbols}&page=${page}&limit=${limit}&apikey=${FMP_API_KEY}`;
        if (from) endpoint += `&from=${from}`;
        if (to) endpoint += `&to=${to}`;
        ttl = 15 * 60 * 1000; // 15 minutes for news
        break;
        
      default:
        throw new Error('Invalid action. Use: general-news, stock-news, or search-stock-news');
    }

    const cacheKey = `fmp_news_${action}_${symbols || 'general'}_${from}_${to}_${page}_${limit}`;
    const cachedEntry = cache.get(cacheKey);

    if (cachedEntry && isValidCache(cachedEntry)) {
      console.log(`Cache hit for ${cacheKey}`);
      return new Response(JSON.stringify(cachedEntry.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching FMP news data: ${endpoint}`);
    const response = await retryRequest(endpoint);
    const data = await response.json();

    // Store in cache
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('FMP News API error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Failed to fetch news data. Please try again later.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
