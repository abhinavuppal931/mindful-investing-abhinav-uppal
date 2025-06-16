
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

async function callOpenAI(messages: any[], model = 'gpt-4o-mini', useSearch = false): Promise<any> {
  const requestBody: any = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: 2000,
  };

  // Add web search tool for search-enabled models - using correct format from OpenAI docs
  if (useSearch && model.includes('search')) {
    requestBody.tools = [{ "type": "web_search" }];
    console.log(`🔍 Web search enabled for model: ${model}`);
  }

  console.log(`📡 Making OpenAI API call with model: ${model}, search enabled: ${useSearch}`);
  console.log(`📝 Request body tools:`, JSON.stringify(requestBody.tools, null, 2));

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
    console.error(`❌ OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Log search activity and tool usage
  if (data.choices && data.choices[0]) {
    const choice = data.choices[0];
    
    // Check if tools were used
    if (choice.message && choice.message.tool_calls) {
      console.log(`🔧 Tool calls made:`, JSON.stringify(choice.message.tool_calls, null, 2));
      choice.message.tool_calls.forEach((tool: any, index: number) => {
        if (tool.type === 'web_search') {
          console.log(`🌐 Web search ${index + 1} query:`, tool.function?.arguments || 'No query logged');
        }
      });
    } else {
      console.log(`⚠️ No tool calls detected in response for search-enabled model`);
    }
    
    // Log if search results are included
    if (choice.message && choice.message.content) {
      const content = choice.message.content;
      if (content.includes('2025') || content.includes('June') || content.includes('current') || content.includes('recent')) {
        console.log(`✅ Response appears to contain current/recent information`);
      } else {
        console.log(`⚠️ Response may not contain current information`);
      }
    }
  }

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
    let ttl = 2 * 60 * 60 * 1000; // 2 hours for search-enabled analyses (shorter cache for real-time data)
    let dataSource = 'cached';
    let searchUsed = false;
    
    const cacheKey = `openai_${action}_${symbol}_search_v2`;

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
        systemPrompt = `You are a professional investment analyst with real-time market access. Today is ${currentDate}. You MUST search for and incorporate the most recent company developments, strategic initiatives, competitive landscape changes, and market conditions from the past 3-6 months.`;
        userPrompt = `Search for the latest company developments, strategic initiatives, competitive landscape changes, and market conditions for ${symbol} from ${currentDate} and recent months. Analyze the competitive moat considering both financial data: ${JSON.stringify(financialData?.slice(0, 3))} and current strategic positioning from your search results. Provide analysis covering: 1) Primary competitive advantages based on recent developments, 2) Moat strength (Wide/Narrow/None) considering current market position, 3) Sustainability factors based on latest strategic moves and market conditions. Keep under 200 words, format as bullet points. Include data_period field showing the time range of your analysis.`;
        break;

      case 'investment-risks':
        systemPrompt = `You are a professional investment analyst with real-time market access. Today is ${currentDate}. You MUST search for and analyze current investment risks, recent regulatory changes, market developments, and company-specific issues from recent months.`;
        userPrompt = `Search for current investment risks, recent regulatory changes, market developments, and company-specific issues for ${symbol} as of ${currentDate}. Identify risks considering financial data: ${JSON.stringify(financialData?.slice(0, 3))}, recent news: ${JSON.stringify(newsData?.slice(0, 5))}, and latest market developments from your search. Structure as: 1) Financial risks from recent performance, 2) Industry/Market risks from current conditions, 3) Company-specific risks from recent developments. Keep under 200 words, format as bullet points. Include data_period field.`;
        break;

      case 'near-term-tailwinds':
        systemPrompt = `You are a professional investment analyst with real-time market access. Today is ${currentDate}. You MUST search for and analyze current market trends, recent company catalysts, and near-term growth drivers from the past few months and upcoming quarters.`;
        userPrompt = `Search for current market trends, recent company catalysts, and near-term growth opportunities for ${symbol} as of ${currentDate}. Analyze 6-12 month prospects considering financial data: ${JSON.stringify(financialData?.slice(0, 3))}, recent news: ${JSON.stringify(newsData?.slice(0, 5))}, and latest strategic developments from your search. Structure as: Tailwinds: [current positive factors], Headwinds: [current challenges]. Keep under 150 words total. Include data_period field.`;
        break;

      case 'long-term-tailwinds':
        systemPrompt = `You are a professional investment analyst with real-time market access. Today is ${currentDate}. You MUST search for and analyze long-term industry trends, company strategic positioning, and secular growth drivers affecting the 2-5 year outlook.`;
        userPrompt = `Search for long-term industry trends, strategic positioning updates, and secular growth drivers for ${symbol} as of ${currentDate}. Analyze 2-5 year prospects considering financial data: ${JSON.stringify(financialData?.slice(0, 3))} and latest strategic positioning from recent developments found in your search. Structure as: Tailwinds: [long-term positive factors], Headwinds: [long-term challenges]. Keep under 150 words total. Include data_period field.`;
        break;

      case 'brief-insight':
        systemPrompt = `You are a financial market analyst with real-time market access. Today is ${currentDate}. You MUST search for what is driving the stock price TODAY and in the past 24-48 hours - recent news, earnings, analyst updates, market sentiment.`;
        userPrompt = `Search for what is driving ${symbol}'s stock price today (${currentDate}) and in the past 24-48 hours. Look for: latest news, earnings reports, analyst upgrades/downgrades, market sentiment, and any breaking developments. Consider recent financial performance: ${JSON.stringify(financialData?.slice(0, 1))}. Provide a 2-3 sentence summary focusing on the PRIMARY factor currently influencing stock momentum (positive or negative). Be specific about timing and current market drivers. Include data_period field showing analysis date range.`;
        break;

      case 'earnings-highlights':
        systemPrompt = 'You are a professional investment analyst. Extract key insights from earnings call transcripts and supplement with recent market context if available.';
        userPrompt = `Extract the top 5 key highlights from this earnings call transcript for ${symbol}: ${transcript}. Focus on: financial performance, guidance, strategic initiatives, and management commentary. Present as numbered list. Include data_period field.`;
        break;

      default:
        throw new Error('Invalid analysis action');
    }

    try {
      // Try with search-enabled model first
      console.log(`🚀 Attempting search-enabled analysis for ${action} on ${symbol}`);
      analysisResult = await callOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 'gpt-4o-mini-search-preview', true);
      
      dataSource = 'search_enabled';
      searchUsed = true;
      console.log(`✅ Successfully generated ${action} analysis with web search for ${symbol}`);
    } catch (searchError) {
      console.error(`❌ Search model failed for ${action}:`, searchError);
      
      // Fallback to standard model without search
      console.log(`🔄 Falling back to standard model for ${action}`);
      const fallbackSystemPrompt = systemPrompt.replace(/You MUST search for and /g, '').replace(/from your search results/g, '').replace(/from your search/g, '');
      const fallbackUserPrompt = userPrompt.replace(/Search for[^.]*\.\s*/g, '').replace(/from your search[^.]*\.\s*/g, '');
      
      analysisResult = await callOpenAI([
        { role: 'system', content: fallbackSystemPrompt },
        { role: 'user', content: fallbackUserPrompt }
      ], 'gpt-4o-mini', false);
      
      dataSource = 'fallback_standard';
      searchUsed = false;
      console.log(`⚠️ Generated ${action} analysis with fallback model for ${symbol}`);
    }

    const result = { 
      analysis: analysisResult, 
      timestamp: new Date().toISOString(),
      data_source: dataSource,
      search_enabled: searchUsed,
      analysis_date: currentDate
    };

    // Store in cache with shorter TTL for search-enabled results
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
