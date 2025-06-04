
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_NINJAS_KEY = Deno.env.get('API_NINJAS_KEY');
const BASE_URL = 'https://api.api-ninjas.com/v1';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

function isValidCache(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < entry.ttl;
}

async function retryRequest(url: string, headers: any, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { headers });
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
    const { action, symbol, year, quarter } = await req.json();
    
    if (!API_NINJAS_KEY) {
      throw new Error('API Ninjas key not configured');
    }

    let endpoint = '';
    let ttl = 7 * 24 * 60 * 60 * 1000; // 7 days default

    switch (action) {
      case 'earnings-transcript':
        endpoint = `${BASE_URL}/earningscalltranscript?ticker=${symbol}`;
        if (year) endpoint += `&year=${year}`;
        if (quarter) endpoint += `&quarter=${quarter}`;
        ttl = 7 * 24 * 60 * 60 * 1000; // 7 days
        break;
      default:
        throw new Error('Invalid action');
    }

    const cacheKey = `ninjas_${action}_${symbol}_${year}_${quarter}`;
    const cachedEntry = cache.get(cacheKey);

    if (cachedEntry && isValidCache(cachedEntry)) {
      console.log(`Cache hit for ${cacheKey}`);
      return new Response(JSON.stringify(cachedEntry.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching data from API Ninjas: ${endpoint}`);
    const response = await retryRequest(endpoint, {
      'X-Api-Key': API_NINJAS_KEY,
      'Content-Type': 'application/json'
    });
    
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
    console.error('API Ninjas error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Failed to fetch earnings transcript. Please try again later.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
