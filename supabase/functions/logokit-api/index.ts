
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
        logoUrl: null
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!symbol) {
      console.error('Symbol is required');
      return new Response(JSON.stringify({ 
        error: 'Symbol is required',
        logoUrl: null
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const logoUrl = `https://img.logokit.com/ticker/${symbol.toUpperCase()}?token=${LOGOKIT_API_KEY}`;
    
    console.log(`Fetching logo for ${symbol}: ${logoUrl}`);

    // Test the logo URL first
    const response = await fetch(logoUrl, {
      method: 'HEAD', // Use HEAD to check if the image exists
    });
    
    if (!response.ok) {
      console.error(`LogoKit API error for ${symbol}: ${response.status} ${response.statusText}`);
      // Return fallback response instead of throwing error
      return new Response(JSON.stringify({ 
        logoUrl: null,
        symbol: symbol.toUpperCase(),
        error: `Logo not available for ${symbol}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return the logo URL if successful
    return new Response(JSON.stringify({ 
      logoUrl,
      symbol: symbol.toUpperCase()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('LogoKit API error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      logoUrl: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
