
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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
    const { action, symbol, period = 'annual', statement = 'income', limit = 5, query } = await req.json();
    
    if (!FMP_API_KEY) {
      throw new Error('FMP API key not configured');
    }

    let endpoint = '';
    let ttl = 30 * 60 * 1000; // 30 minutes default

    switch (action) {
      case 'quote':
        endpoint = `${BASE_URL}/quote/${symbol}?apikey=${FMP_API_KEY}`;
        ttl = 30 * 60 * 1000; // 30 minutes
        break;
      case 'profile':
        endpoint = `${BASE_URL}/profile/${symbol}?apikey=${FMP_API_KEY}`;
        ttl = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'financials':
        if (statement === 'income') {
          endpoint = `${BASE_URL}/income-statement/${symbol}?period=${period}&limit=${limit}&apikey=${FMP_API_KEY}`;
        } else if (statement === 'balance') {
          endpoint = `${BASE_URL}/balance-sheet-statement/${symbol}?period=${period}&limit=${limit}&apikey=${FMP_API_KEY}`;
        } else if (statement === 'cash') {
          endpoint = `${BASE_URL}/cash-flow-statement/${symbol}?period=${period}&limit=${limit}&apikey=${FMP_API_KEY}`;
        }
        ttl = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'metrics':
        endpoint = `${BASE_URL}/key-metrics/${symbol}?period=${period}&limit=${limit}&apikey=${FMP_API_KEY}`;
        ttl = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'ratios':
        endpoint = `${BASE_URL}/ratios/${symbol}?period=${period}&limit=${limit}&apikey=${FMP_API_KEY}`;
        ttl = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'historical-prices':
        endpoint = `${BASE_URL}/historical-price-full/${symbol}?from=${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}&apikey=${FMP_API_KEY}`;
        ttl = 30 * 60 * 1000; // 30 minutes
        break;
      case 'enterprise-values':
        endpoint = `${BASE_URL}/enterprise-values/${symbol}?period=${period}&limit=${limit}&apikey=${FMP_API_KEY}`;
        ttl = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'financial-growth':
        endpoint = `${BASE_URL}/financial-growth/${symbol}?period=${period}&limit=${limit}&apikey=${FMP_API_KEY}`;
        ttl = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'dividends':
        endpoint = `${BASE_URL}/historical-price-full/stock_dividend/${symbol}?apikey=${FMP_API_KEY}`;
        ttl = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'search-symbol':
        endpoint = `${BASE_URL}/search?query=${query}&limit=10&apikey=${FMP_API_KEY}`;
        ttl = 60 * 60 * 1000; // 1 hour
        break;
      case 'search-name':
        endpoint = `${BASE_URL}/search-name?query=${query}&limit=10&apikey=${FMP_API_KEY}`;
        ttl = 60 * 60 * 1000; // 1 hour
        break;
      case 'revenue-product-segmentation':
        endpoint = `${BASE_URL}/revenue-product-segmentation/${symbol}?period=${period}&structure=flat&apikey=${FMP_API_KEY}`;
        ttl = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'revenue-geographic-segmentation':
        endpoint = `${BASE_URL}/revenue-geographic-segmentation/${symbol}?period=${period}&structure=flat&apikey=${FMP_API_KEY}`;
        ttl = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'index-quote':
        endpoint = `${BASE_URL}/quote/${symbol}?apikey=${FMP_API_KEY}`;
        ttl = 30 * 60 * 1000; // 30 minutes
        break;
      default:
        throw new Error('Invalid action');
    }

    const cacheKey = `fmp_${action}_${symbol || query}_${period}_${statement}_${limit}`;
    const cachedEntry = cache.get(cacheKey);

    if (cachedEntry && isValidCache(cachedEntry)) {
      console.log(`Cache hit for ${cacheKey}`);
      return new Response(JSON.stringify(cachedEntry.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching data from FMP: ${endpoint}`);
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
    console.error('FMP API error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Failed to fetch financial data. Please try again later.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
