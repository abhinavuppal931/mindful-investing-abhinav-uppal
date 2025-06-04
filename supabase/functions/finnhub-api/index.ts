
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');
const BASE_URL = 'https://finnhub.io/api/v1';

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
    const { action, symbol, from, to, category = 'general' } = await req.json();
    
    if (!FINNHUB_API_KEY) {
      throw new Error('Finnhub API key not configured');
    }

    let endpoint = '';
    let ttl = 30 * 60 * 1000; // 30 minutes default

    switch (action) {
      case 'company-news':
        endpoint = `${BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
        ttl = 30 * 60 * 1000; // 30 minutes
        break;
      case 'market-news':
        endpoint = `${BASE_URL}/news?category=${category}&token=${FINNHUB_API_KEY}`;
        ttl = 30 * 60 * 1000; // 30 minutes
        break;
      case 'earnings':
        endpoint = `${BASE_URL}/calendar/earnings?from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
        ttl = 60 * 60 * 1000; // 1 hour
        break;
      case 'press-releases':
        endpoint = `${BASE_URL}/press-releases?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
        ttl = 30 * 60 * 1000; // 30 minutes
        break;
      default:
        throw new Error('Invalid action');
    }

    const cacheKey = `finnhub_${action}_${symbol || category}_${from}_${to}`;
    const cachedEntry = cache.get(cacheKey);

    if (cachedEntry && isValidCache(cachedEntry)) {
      console.log(`Cache hit for ${cacheKey}`);
      return new Response(JSON.stringify(cachedEntry.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching data from Finnhub: ${endpoint}`);
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
    console.error('Finnhub API error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Failed to fetch news data. Please try again later.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
