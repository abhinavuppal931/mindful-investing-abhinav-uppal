
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

async function callOpenAI(messages: any[], model = 'gpt-4o-mini-search-preview', useSearch = true): Promise<any> {
  const requestBody: any = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
  };

  // Add web search tool for search-enabled models
  if (useSearch && model.includes('search')) {
    requestBody.tools = [{ "type": "web_search" }];
  }

  console.log(`Making OpenAI API call with model: ${model}, search enabled: ${useSearch}`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
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
    let ttl = 4 * 60 * 60 * 1000; // 4 hours for search-enabled analyses (shorter cache for real-time data)
    const cacheKey = `openai_${action}_${symbol}_search`;

    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry && isValidCache(cachedEntry)) {
      console.log(`Cache hit for ${cacheKey}`);
      return new Response(JSON.stringify(cachedEntry.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt: string;
    let userPrompt: string;

    switch (action) {
      case 'company-moat':
        systemPrompt = 'You are a professional investment analyst with access to real-time market data. Search for recent company developments and market conditions to provide current, comprehensive analysis of company competitive advantages.';
        userPrompt = `Search for recent company developments and market conditions for ${symbol}. Analyze the competitive moat for ${symbol} considering both the financial data: ${JSON.stringify(financialData?.slice(0, 3))} and the latest strategic initiatives, competitive changes, and industry trends. Provide a structured analysis covering: 1) Primary competitive advantages, 2) Moat strength (Wide/Narrow/None), 3) Sustainability factors based on current market conditions. Keep it under 200 words and format as bullet points.`;
        break;

      case 'investment-risks':
        systemPrompt = 'You are a professional investment analyst with access to real-time market data. Search for recent developments to identify and explain current investment risks objectively.';
        userPrompt = `Search for recent company developments and market conditions for ${symbol}. Identify the top investment risks for ${symbol} considering the financial data: ${JSON.stringify(financialData?.slice(0, 3))}, recent news: ${JSON.stringify(newsData?.slice(0, 5))}, and current market conditions. Structure as: 1) Financial risks, 2) Industry/Market risks, 3) Company-specific risks. Include any recent developments that may impact risk profile. Keep it under 200 words and format as bullet points.`;
        break;

      case 'near-term-tailwinds':
        systemPrompt = 'You are a professional investment analyst with access to real-time market data. Search for recent developments to analyze current factors that could drive or hinder company performance over the next 6-12 months.';
        userPrompt = `Search for recent company developments and market conditions for ${symbol}. Analyze near-term (6-12 months) tailwinds and headwinds for ${symbol} considering financial data: ${JSON.stringify(financialData?.slice(0, 3))}, news: ${JSON.stringify(newsData?.slice(0, 5))}, and current market trends and developments. Factor in the most recent quarter's financials and latest strategic initiatives. Structure as: Tailwinds: [bullet points], Headwinds: [bullet points]. Keep it under 150 words total.`;
        break;

      case 'long-term-tailwinds':
        systemPrompt = 'You are a professional investment analyst with access to real-time market data. Search for recent developments to analyze long-term factors that could drive or hinder company performance over the next 2-5 years.';
        userPrompt = `Search for recent company developments and market conditions for ${symbol}. Analyze long-term (2-5 years) tailwinds and headwinds for ${symbol} considering financial data: ${JSON.stringify(financialData?.slice(0, 3))}, current strategic positioning, and recent industry trends and competitive landscape changes. Structure as: Tailwinds: [bullet points], Headwinds: [bullet points]. Keep it under 150 words total.`;
        break;

      case 'brief-insight':
        systemPrompt = 'You are a financial market analyst with access to real-time market data and news. Search for the most current information to provide actionable insights about what is driving a stock today.';
        userPrompt = `Analyze what is driving ${symbol}'s stock price today by searching for the latest news, earnings reports, analyst upgrades/downgrades, and market sentiment from the past 24-48 hours. Consider recent financial performance: ${JSON.stringify(financialData?.slice(0, 1))}. Provide a brief 2-3 sentence summary focusing on the single most significant factor or combination of factors currently influencing the stock's momentum, whether positive or negative. Be specific and actionable for investors.`;
        break;

      case 'earnings-highlights':
        systemPrompt = 'You are a professional investment analyst. Extract key insights from earnings call transcripts and supplement with recent market context.';
        userPrompt = `Extract the top 5 key highlights from this earnings call transcript for ${symbol}: ${transcript}. Focus on: financial performance, guidance, strategic initiatives, and management commentary. Search for any recent market reactions or analyst commentary on these results. Present as numbered list.`;
        break;

      default:
        throw new Error('Invalid analysis action');
    }

    try {
      // Try with search-enabled model first
      analysisResult = await callOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 'gpt-4o-mini-search-preview', true);
      
      console.log(`Successfully generated ${action} analysis with web search for ${symbol}`);
    } catch (searchError) {
      console.error(`Search model failed for ${action}:`, searchError);
      
      // Fallback to standard model without search
      console.log(`Falling back to standard model for ${action}`);
      const fallbackSystemPrompt = systemPrompt.replace('with access to real-time market data', '').replace('Search for recent company developments and market conditions to provide current, comprehensive analysis', 'Provide comprehensive analysis');
      const fallbackUserPrompt = userPrompt.replace(/Search for recent company developments and market conditions for \S+\.\s*/g, '').replace(/by searching for the latest[^.]*\.\s*/g, '');
      
      analysisResult = await callOpenAI([
        { role: 'system', content: fallbackSystemPrompt },
        { role: 'user', content: fallbackUserPrompt }
      ], 'gpt-4o-mini', false);
      
      console.log(`Generated ${action} analysis with fallback model for ${symbol}`);
    }

    const result = { 
      analysis: analysisResult, 
      timestamp: new Date().toISOString(),
      model_used: analysisResult.includes('search') ? 'gpt-4o-mini-search-preview' : 'gpt-4o-mini'
    };

    // Store in cache with shorter TTL for search-enabled results
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
      message: 'Failed to generate AI analysis. Please try again later.',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
