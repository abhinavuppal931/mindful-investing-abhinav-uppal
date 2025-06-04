
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

function isValidCache(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < entry.ttl;
}

async function callOpenAI(messages: any[], model = 'gpt-4o-mini'): Promise<any> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, symbol, financialData, newsData, transcript } = await req.json();
    
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    let analysisResult: string;
    let ttl = 24 * 60 * 60 * 1000; // 24 hours default
    const cacheKey = `openai_${action}_${symbol}`;

    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry && isValidCache(cachedEntry)) {
      console.log(`Cache hit for ${cacheKey}`);
      return new Response(JSON.stringify(cachedEntry.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'company-moat':
        analysisResult = await callOpenAI([
          {
            role: 'system',
            content: 'You are a professional investment analyst. Provide clear, concise analysis of company competitive advantages (moats).'
          },
          {
            role: 'user',
            content: `Analyze the competitive moat for ${symbol}. Consider the financial data: ${JSON.stringify(financialData?.slice(0, 3))}. Provide a structured analysis covering: 1) Primary competitive advantages, 2) Moat strength (Wide/Narrow/None), 3) Sustainability factors. Keep it under 200 words.`
          }
        ]);
        break;

      case 'investment-risks':
        analysisResult = await callOpenAI([
          {
            role: 'system',
            content: 'You are a professional investment analyst. Identify and explain key investment risks objectively.'
          },
          {
            role: 'user',
            content: `Identify the top investment risks for ${symbol}. Consider the financial data: ${JSON.stringify(financialData?.slice(0, 3))} and recent news: ${JSON.stringify(newsData?.slice(0, 5))}. Structure as: 1) Financial risks, 2) Industry/Market risks, 3) Company-specific risks. Keep it under 200 words.`
          }
        ]);
        break;

      case 'tailwinds-headwinds':
        analysisResult = await callOpenAI([
          {
            role: 'system',
            content: 'You are a professional investment analyst. Analyze factors that could drive or hinder company performance.'
          },
          {
            role: 'user',
            content: `Analyze tailwinds and headwinds for ${symbol}. Consider financial data: ${JSON.stringify(financialData?.slice(0, 3))} and news: ${JSON.stringify(newsData?.slice(0, 5))}. Structure as: Near-term (6-12 months): Tailwinds & Headwinds, Long-term (2-5 years): Tailwinds & Headwinds. Keep it under 250 words.`
          }
        ]);
        break;

      case 'earnings-highlights':
        analysisResult = await callOpenAI([
          {
            role: 'system',
            content: 'You are a professional investment analyst. Extract key insights from earnings call transcripts.'
          },
          {
            role: 'user',
            content: `Extract the top 5 key highlights from this earnings call transcript for ${symbol}: ${transcript}. Focus on: financial performance, guidance, strategic initiatives, and management commentary. Present as numbered list.`
          }
        ]);
        break;

      default:
        throw new Error('Invalid analysis action');
    }

    const result = { analysis: analysisResult, timestamp: new Date().toISOString() };

    // Store in cache
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OpenAI Analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Failed to generate AI analysis. Please try again later.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
