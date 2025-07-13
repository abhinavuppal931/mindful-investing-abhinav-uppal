
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOGOKIT_API_KEY = Deno.env.get('LOGOKIT_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!LOGOKIT_API_KEY) {
      console.error('LogoKit API key not configured');
      return new Response(JSON.stringify({ 
        error: 'LogoKit API key not configured',
        logoUrl: null,
        symbol: symbol?.toUpperCase() || null
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!symbol) {
      console.error('Symbol is required');
      return new Response(JSON.stringify({ 
        error: 'Symbol is required',
        logoUrl: null,
        symbol: null
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanSymbol = symbol.toUpperCase().trim();
    const logoUrl = `https://img.logokit.com/ticker/${cleanSymbol}?token=${LOGOKIT_API_KEY}`;
    
    console.log(`Testing logo availability for ${cleanSymbol}: ${logoUrl}`);

    // Test the logo URL with a HEAD request
    const response = await fetch(logoUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LogoKit-API)',
      },
    });
    
    console.log(`LogoKit response for ${cleanSymbol}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (response.ok) {
      // Logo is available, return the URL
      console.log(`Logo available for ${cleanSymbol}`);
      return new Response(JSON.stringify({ 
        logoUrl,
        symbol: cleanSymbol,
        error: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Logo not available
      console.log(`Logo not available for ${cleanSymbol}: ${response.status} ${response.statusText}`);
      return new Response(JSON.stringify({ 
        logoUrl: null,
        symbol: cleanSymbol,
        error: `Logo not available for ${cleanSymbol} (HTTP ${response.status})`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('LogoKit API error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      logoUrl: null,
      symbol: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
