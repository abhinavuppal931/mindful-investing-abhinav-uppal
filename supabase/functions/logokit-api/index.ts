
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
      throw new Error('LogoKit API key not configured');
    }

    if (!symbol) {
      throw new Error('Symbol is required');
    }

    const logoUrl = `https://img.logokit.com/ticker/${symbol.toUpperCase()}?token=${LOGOKIT_API_KEY}`;
    
    console.log(`Fetching logo for ${symbol}: ${logoUrl}`);

    const response = await fetch(logoUrl);
    
    if (!response.ok) {
      throw new Error(`LogoKit API error: ${response.status}`);
    }

    // Return the logo URL instead of the image data
    return new Response(JSON.stringify({ 
      logoUrl,
      symbol: symbol.toUpperCase()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('LogoKit API error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      logoUrl: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
