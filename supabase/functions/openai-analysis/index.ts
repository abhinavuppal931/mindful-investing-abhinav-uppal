
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

function isValidCache(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < entry.ttl;
}

async function fetchRealtimeNews(symbol: string): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  console.log(`Fetching real-time news for ${symbol} from ${yesterday} to ${today}`);
  
  const newsPromises = [];
  
  try {
    // FMP Stock News
    if (FMP_API_KEY) {
      const fmpStockNewsUrl = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${symbol}&from=${yesterday}&to=${today}&limit=10&apikey=${FMP_API_KEY}`;
      newsPromises.push(
        fetch(fmpStockNewsUrl)
          .then(res => res.json())
          .then(data => ({ source: 'FMP_STOCK', data: Array.isArray(data) ? data : [] }))
          .catch(err => {
            console.error('FMP Stock News error:', err);
            return { source: 'FMP_STOCK', data: [] };
          })
      );
    }

    // FMP General News
    if (FMP_API_KEY) {
      const fmpGeneralNewsUrl = `https://financialmodelingprep.com/api/v3/fmp/articles?from=${yesterday}&to=${today}&limit=10&apikey=${FMP_API_KEY}`;
      newsPromises.push(
        fetch(fmpGeneralNewsUrl)
          .then(res => res.json())
          .then(data => ({ source: 'FMP_GENERAL', data: Array.isArray(data) ? data : [] }))
          .catch(err => {
            console.error('FMP General News error:', err);
            return { source: 'FMP_GENERAL', data: [] };
          })
      );
    }

    // Finnhub Company News
    if (FINNHUB_API_KEY) {
      const finnhubCompanyNewsUrl = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${yesterday}&to=${today}&token=${FINNHUB_API_KEY}`;
      newsPromises.push(
        fetch(finnhubCompanyNewsUrl)
          .then(res => res.json())
          .then(data => ({ source: 'FINNHUB_COMPANY', data: Array.isArray(data) ? data : [] }))
          .catch(err => {
            console.error('Finnhub Company News error:', err);
            return { source: 'FINNHUB_COMPANY', data: [] };
          })
      );
    }

    // Finnhub Market News
    if (FINNHUB_API_KEY) {
      const finnhubMarketNewsUrl = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`;
      newsPromises.push(
        fetch(finnhubMarketNewsUrl)
          .then(res => res.json())
          .then(data => ({ source: 'FINNHUB_MARKET', data: Array.isArray(data) ? data.slice(0, 10) : [] }))
          .catch(err => {
            console.error('Finnhub Market News error:', err);
            return { source: 'FINNHUB_MARKET', data: [] };
          })
      );
    }

    const newsResults = await Promise.all(newsPromises);
    console.log(`Fetched news from ${newsResults.length} sources`);
    
    // Combine and filter news
    const allNews = newsResults.flatMap(result => 
      result.data.map((item: any) => ({
        source: result.source,
        title: item.title || item.headline,
        summary: item.summary || item.text || '',
        publishedDate: item.publishedDate || item.datetime || item.date,
        url: item.url || item.source,
        symbol: item.symbol || symbol
      }))
    );

    // Filter for symbol-specific news and recent news
    const symbolSpecificNews = allNews.filter(news => 
      news.title && (
        news.title.toLowerCase().includes(symbol.toLowerCase()) ||
        news.summary.toLowerCase().includes(symbol.toLowerCase()) ||
        news.symbol === symbol
      )
    );

    console.log(`Found ${symbolSpecificNews.length} symbol-specific news items for ${symbol}`);
    return symbolSpecificNews.slice(0, 15); // Limit to top 15 most relevant news items

  } catch (error) {
    console.error('Error fetching real-time news:', error);
    return [];
  }
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
    let cacheKey = `openai_${action}_${symbol}`;

    // For brief-insight, include today's date in cache key for daily refresh
    if (action === 'brief-insight') {
      const today = new Date().toISOString().split('T')[0];
      cacheKey = `openai_${action}_${symbol}_${today}`;
      ttl = 24 * 60 * 60 * 1000; // 24 hours cache for brief insights
    }

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
            content: `Analyze the competitive moat for ${symbol}. Consider the financial data: ${JSON.stringify(financialData?.slice(0, 3))}. Provide a structured analysis covering: 1) Primary competitive advantages, 2) Moat strength (Wide/Narrow/None), 3) Sustainability factors. Keep it under 200 words and format as bullet points.`
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
            content: `Identify the top investment risks for ${symbol}. Consider the financial data: ${JSON.stringify(financialData?.slice(0, 3))} and recent news: ${JSON.stringify(newsData?.slice(0, 5))}. Structure as: 1) Financial risks, 2) Industry/Market risks, 3) Company-specific risks. Keep it under 200 words and format as bullet points.`
          }
        ]);
        break;

      case 'near-term-tailwinds':
        analysisResult = await callOpenAI([
          {
            role: 'system',
            content: 'You are a professional investment analyst. Analyze near-term factors that could drive or hinder company performance over the next 6-12 months.'
          },
          {
            role: 'user',
            content: `Analyze near-term (6-12 months) tailwinds and headwinds for ${symbol}. Consider financial data: ${JSON.stringify(financialData?.slice(0, 3))} and news: ${JSON.stringify(newsData?.slice(0, 5))}. Structure as: Tailwinds: [bullet points], Headwinds: [bullet points]. Keep it under 150 words total.`
          }
        ]);
        break;

      case 'long-term-tailwinds':
        analysisResult = await callOpenAI([
          {
            role: 'system',
            content: 'You are a professional investment analyst. Analyze long-term factors that could drive or hinder company performance over the next 2-5 years.'
          },
          {
            role: 'user',
            content: `Analyze long-term (2-5 years) tailwinds and headwinds for ${symbol}. Consider financial data: ${JSON.stringify(financialData?.slice(0, 3))} and strategic positioning. Structure as: Tailwinds: [bullet points], Headwinds: [bullet points]. Keep it under 150 words total.`
          }
        ]);
        break;

      case 'brief-insight':
        // Fetch real-time news for enhanced analysis
        console.log(`Fetching real-time news for brief-insight analysis of ${symbol}`);
        const realtimeNews = await fetchRealtimeNews(symbol);
        
        let newsContext = '';
        if (realtimeNews.length > 0) {
          newsContext = `Recent news (past 24 hours): ${JSON.stringify(realtimeNews.slice(0, 10))}`;
          console.log(`Using ${realtimeNews.length} news items for enhanced analysis`);
        } else {
          console.log('No recent news found, falling back to basic analysis');
          newsContext = 'No recent company-specific news available in the past 24 hours.';
        }

        analysisResult = await callOpenAI([
          {
            role: 'system',
            content: 'You are a financial market analyst specializing in real-time stock analysis. Provide brief, actionable insights about what is driving a stock today based on the latest news, market developments, and financial data.'
          },
          {
            role: 'user',
            content: `Analyze what is driving ${symbol}'s stock price today by examining the latest news, earnings reports, analyst upgrades/downgrades, and market sentiment from the past 24 hours. ${newsContext} Financial context: ${JSON.stringify(financialData?.slice(0, 1))}. Provide a brief 2-3 sentence summary focusing on the single most significant factor or combination of factors currently influencing the stock's momentum, whether positive or negative. If no recent news is available, focus on recent financial performance and market conditions.`
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

    console.log(`Cached ${action} analysis for ${symbol} with TTL: ${ttl}ms`);

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
