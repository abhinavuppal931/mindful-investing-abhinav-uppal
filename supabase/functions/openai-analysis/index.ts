
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

async function callOpenAIWithWebSearch(messages: any[], useWebSearch = false): Promise<any> {
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  console.log(`📡 Making OpenAI API call with web search: ${useWebSearch}`);

  if (useWebSearch) {
    // Use Responses API with web search tool for gpt-4o-mini
    console.log(`🔍 Using Responses API with web search tool`);
    
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        tools: [{ type: "web_search" }],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI Responses API error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`OpenAI Responses API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Log web search activity
    if (data.choices && data.choices[0]) {
      const choice = data.choices[0];
      
      if (choice.message && choice.message.tool_calls) {
        console.log(`🔧 Tool calls made:`, JSON.stringify(choice.message.tool_calls, null, 2));
        choice.message.tool_calls.forEach((tool: any, index: number) => {
          if (tool.type === 'web_search') {
            console.log(`🌐 Web search ${index + 1}:`, tool.web_search || 'No search details logged');
          }
        });
      } else {
        console.log(`⚠️ No tool calls detected in Responses API response`);
      }
      
      const content = choice.message.content;
      if (content && (content.includes('2025') || content.includes('June') || content.includes('recent') || content.includes('latest'))) {
        console.log(`✅ Response appears to contain current information`);
      } else {
        console.log(`⚠️ Response may not contain current information`);
      }
    }

    return data.choices[0].message.content;
  } else {
    // Fallback to standard Chat Completions API
    console.log(`📞 Using standard Chat Completions API`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI Chat API error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`OpenAI Chat API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
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
    let ttl = 30 * 60 * 1000; // 30 minutes for web search results
    let dataSource = 'web_search';
    let searchUsed = true;
    
    const cacheKey = `openai_${action}_${symbol}_websearch_v3`;

    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry && isValidCache(cachedEntry)) {
      console.log(`💾 Cache hit for ${cacheKey}`);
      return new Response(JSON.stringify(cachedEntry.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt: string;
    let userPrompt: string;
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    switch (action) {
      case 'company-moat':
        systemPrompt = `You are a professional investment analyst. Today is ${currentDate}. Use web search to find the most recent company developments, strategic initiatives, and competitive landscape changes for comprehensive analysis.`;
        userPrompt = `Search the web for the latest developments and strategic positioning for ${symbol} and analyze the competitive moat considering current market conditions and recent strategic moves. Focus on: 1) Primary competitive advantages based on recent developments, 2) Moat strength (Wide/Narrow/None) considering current market position, 3) Sustainability factors. Keep under 200 words, format as bullet points.`;
        break;

      case 'investment-risks':
        systemPrompt = `You are a professional investment analyst. Today is ${currentDate}. Use web search to identify current investment risks, recent regulatory changes, and market developments.`;
        userPrompt = `Search the web for current investment risks and recent market developments for ${symbol}. Identify risks considering recent financial performance and latest market conditions. Structure as: 1) Financial risks from recent performance, 2) Industry/Market risks from current conditions, 3) Company-specific risks from recent developments. Keep under 200 words, format as bullet points.`;
        break;

      case 'near-term-tailwinds':
        systemPrompt = `You are a professional investment analyst. Today is ${currentDate}. Use web search to analyze current market trends and recent company catalysts.`;
        userPrompt = `Search the web for current market trends and recent catalysts for ${symbol}. Analyze 6-12 month prospects considering latest strategic developments. Structure as: Tailwinds: [current positive factors], Headwinds: [current challenges]. Keep under 150 words total.`;
        break;

      case 'long-term-tailwinds':
        systemPrompt = `You are a professional investment analyst. Today is ${currentDate}. Use web search to analyze long-term industry trends and strategic positioning.`;
        userPrompt = `Search the web for long-term industry trends and strategic positioning updates for ${symbol}. Analyze 2-5 year prospects considering latest strategic positioning from recent developments. Structure as: Tailwinds: [long-term positive factors], Headwinds: [long-term challenges]. Keep under 150 words total.`;
        break;

      case 'brief-insight':
        systemPrompt = `You are a financial market analyst. Today is ${currentDate}. Use web search to find what is driving the stock price TODAY and in the past 24-48 hours.`;
        userPrompt = `Search the web for what is driving ${symbol}'s stock price today (${currentDate}) and in the past 24-48 hours. Look for: latest news, earnings reports, analyst upgrades/downgrades, market sentiment, and breaking developments. Provide a 2-3 sentence summary focusing on the PRIMARY factor currently influencing stock momentum. Be specific about current market drivers.`;
        break;

      case 'earnings-highlights':
        systemPrompt = 'You are a professional investment analyst. Extract key insights from earnings call transcripts.';
        userPrompt = `Extract the top 5 key highlights from this earnings call transcript for ${symbol}: ${transcript}. Focus on: financial performance, guidance, strategic initiatives, and management commentary. Present as numbered list.`;
        searchUsed = false; // No web search needed for transcript analysis
        break;

      default:
        throw new Error('Invalid analysis action');
    }

    try {
      // Try with web search first (except for earnings-highlights)
      if (action !== 'earnings-highlights') {
        console.log(`🚀 Attempting web search analysis for ${action} on ${symbol}`);
        analysisResult = await callOpenAIWithWebSearch([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ], true);
        
        console.log(`✅ Successfully generated ${action} analysis with web search for ${symbol}`);
      } else {
        // Use standard API for earnings transcript analysis
        analysisResult = await callOpenAIWithWebSearch([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ], false);
        
        dataSource = 'standard';
        searchUsed = false;
      }
    } catch (searchError) {
      console.error(`❌ Web search analysis failed for ${action}:`, searchError);
      
      // Fallback to standard model without search
      console.log(`🔄 Falling back to standard model for ${action}`);
      
      analysisResult = await callOpenAIWithWebSearch([
        { role: 'system', content: systemPrompt.replace(/Use web search to /g, '').replace(/Search the web for /g, 'Analyze ') },
        { role: 'user', content: userPrompt.replace(/Search the web for /g, 'Analyze ') }
      ], false);
      
      dataSource = 'fallback_standard';
      searchUsed = false;
      console.log(`⚠️ Generated ${action} analysis with fallback model for ${symbol}`);
    }

    const result = { 
      analysis: analysisResult, 
      timestamp: new Date().toISOString(),
      data_source: dataSource,
      search_enabled: searchUsed
    };

    // Store in cache
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl
    });

    console.log(`📊 Analysis completed for ${symbol} - Source: ${dataSource}, Search: ${searchUsed}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ OpenAI Analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Failed to generate AI analysis. Please try again later.',
      timestamp: new Date().toISOString(),
      data_source: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
