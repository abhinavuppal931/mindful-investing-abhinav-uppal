
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HF_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  ticker?: string;
  source?: string;
}

interface AnalysisResult {
  id: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance: 'high' | 'low';
}

interface CacheEntry {
  article_hash: string;
  sentiment_result: {
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  relevance_result: {
    relevance: 'high' | 'low';
    confidence: number;
    reason?: string;
  };
}

// Initialize Supabase client
let supabase: any = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Generate consistent hash for article
function generateArticleHash(article: NewsArticle): string {
  const content = `${article.title}|${article.content}|${article.ticker || ''}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  return Array.from(new Uint8Array(crypto.getRandomValues(new Uint8Array(8))))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('') + 
    Array.from(data.slice(0, 24))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Check cache for existing analysis
async function checkCache(articles: NewsArticle[]): Promise<{
  cached: Map<string, CacheEntry>;
  uncached: NewsArticle[];
}> {
  if (!supabase) {
    return { cached: new Map(), uncached: articles };
  }

  const cached = new Map<string, CacheEntry>();
  const uncached: NewsArticle[] = [];

  try {
    const hashes = articles.map(article => generateArticleHash(article));
    
    const { data: cacheResults, error } = await supabase
      .from('news_analysis_cache')
      .select('article_hash, sentiment_result, relevance_result')
      .in('article_hash', hashes)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.warn('Cache lookup error:', error);
      return { cached: new Map(), uncached: articles };
    }

    // Map cache results by hash
    const cacheMap = new Map();
    if (cacheResults) {
      cacheResults.forEach((result: any) => {
        cacheMap.set(result.article_hash, result);
      });
    }

    // Separate cached and uncached articles
    articles.forEach(article => {
      const hash = generateArticleHash(article);
      const cacheEntry = cacheMap.get(hash);
      
      if (cacheEntry && cacheEntry.sentiment_result && cacheEntry.relevance_result) {
        cached.set(article.id, {
          article_hash: hash,
          sentiment_result: cacheEntry.sentiment_result,
          relevance_result: cacheEntry.relevance_result
        });
      } else {
        uncached.push(article);
      }
    });

    console.log(`Cache check: ${cached.size} cached, ${uncached.length} uncached`);
    
  } catch (error) {
    console.warn('Cache check failed:', error);
    return { cached: new Map(), uncached: articles };
  }

  return { cached, uncached };
}

// Store analysis results in cache
async function storeInCache(article: NewsArticle, sentimentResult: any, relevanceResult: any): Promise<void> {
  if (!supabase) return;

  try {
    const hash = generateArticleHash(article);
    
    const { error } = await supabase
      .from('news_analysis_cache')
      .upsert({
        article_hash: hash,
        headline: article.title,
        summary: article.content.substring(0, 500),
        ticker: article.ticker || null,
        sentiment_result: sentimentResult,
        relevance_result: relevanceResult,
        source: article.source || 'unknown',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      });

    if (error) {
      console.warn('Cache storage error:', error);
    }
  } catch (error) {
    console.warn('Cache storage failed:', error);
  }
}

// FinBERT sentiment analysis with increased timeout
async function analyzeFinBERTSentiment(text: string): Promise<{
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15 seconds

    const response = await fetch(
      "https://api-inference.huggingface.co/models/ProsusAI/finbert",
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: text.substring(0, 500),
          options: {
            wait_for_model: true
          }
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`FinBERT API error: ${response.status} - ${response.statusText}`);
      throw new Error(`FinBERT API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result && Array.isArray(result) && result.length > 0) {
      const sentiments = result[0];
      
      if (Array.isArray(sentiments)) {
        let maxScore = -1;
        let predictedSentiment = 'neutral';
        let confidence = 0;
        
        for (const sentiment of sentiments) {
          if (sentiment.score > maxScore) {
            maxScore = sentiment.score;
            confidence = sentiment.score;
            if (sentiment.label === 'positive') {
              predictedSentiment = 'positive';
            } else if (sentiment.label === 'negative') {
              predictedSentiment = 'negative';
            } else {
              predictedSentiment = 'neutral';
            }
          }
        }
        
        return {
          label: predictedSentiment as 'positive' | 'negative' | 'neutral',
          confidence: confidence
        };
      }
    }
    
    return { label: 'neutral', confidence: 0.5 };
  } catch (error) {
    console.error('FinBERT analysis error:', error);
    return { label: 'neutral', confidence: 0.5 };
  }
}

// OpenAI relevance analysis with GPT-4.1 Mini
async function analyzeOpenAIRelevance(text: string, ticker?: string): Promise<{
  relevance: 'high' | 'low';
  confidence: number;
  reason: string;
}> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not available, falling back to keyword analysis');
    return analyzeRelevanceKeywords(text);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const systemPrompt = `You are an expert investment analyst with over 3 decades of experience and learnings from legendary investors such as Warren Buffett and Charlie Munger, with a specialization in distinguishing high-impact news from market noise for serious investors focused on the fundamentals.

CLASSIFICATION CRITERIA (reference guide):

HIGH RELEVANCE (Score 0.7-1.0) - Fundamental Business Impact:
✅ QUANTIFIABLE METRICS: Earnings, revenue, guidance with specific numbers
✅ CONCRETE ACTIONS: Acquisitions, partnerships, product launches with data/metrics  
✅ REGULATORY/OFFICIAL: SEC filings, FDA approvals, compliance actions, investigations
✅ STRATEGIC CHANGES: Leadership appointments, business model shifts, major investments
✅ MARKET EVENTS: Significant contracts, patents, dividends, buybacks with amounts
✅ OPERATIONAL DATA: Customer growth, market share, capacity changes with figures

LOW RELEVANCE (Score 0.0-0.6) - Speculation & Market Noise:
❌ SPECULATIVE LANGUAGE: "could," "might," "potentially," "expected," "rumored"
❌ OPINION CONTENT: "Analyst believes," "experts predict," "sources suggest"  
❌ SOCIAL BUZZ: Trending topics, meme stocks, viral content, influencer opinions
❌ SENSATIONAL LANGUAGE: "Shocking," "crashes," "skyrockets," emotional terms
❌ GENERIC COMMENTARY: Market sentiment without specific company impact
❌ CLICKBAIT: Headlines designed for engagement over information

SCORING METHODOLOGY:
- 0.9-1.0: Official earnings/financial reports with concrete data
- 0.8-0.9: Major strategic moves (M&A, partnerships) with quantifiable impact
- 0.7-0.8: Regulatory actions, significant contracts, leadership changes
- 0.5-0.7: Mixed content with some concrete elements but also speculation
- 0.3-0.5: Mostly speculation with minimal concrete information
- 0.0-0.3: Pure speculation, rumors, or social media driven content

SPECIAL INSTRUCTIONS:
When evaluating articles reporting official strategic changes (e.g., business model shifts, monetization initiatives, executive changes):  
- Assign a baseline score of 0.8 to articles citing an official company announcement (e.g., press releases, CEO statements)  
- Adjust the score downward only if speculative or opinion-based content (e.g., "could," "might," "analysts believe") exceeds 50% of the article  
- Focus on the official announcement’s core details over speculative framing, especially across multiple reports of the same event

RESPONSE FORMAT:
RELEVANCE: [HIGH/LOW]  
CONFIDENCE: [0.00-1.00]
REASON: [Specific factors that determined the score]`;

    const userPrompt = `Analyze this financial news article for investment relevance${ticker ? ` (ticker: ${ticker})` : ''}:

"${text}"

Provide your analysis in the exact format specified.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        temperature: 0.1,
        max_tokens: 250,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status} - ${response.statusText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || '';
    
    // Parse the response
    const relevanceMatch = content.match(/RELEVANCE:\s*(HIGH|LOW)/i);
    const confidenceMatch = content.match(/CONFIDENCE:\s*([\d.]+)/);
    const reasonMatch = content.match(/REASON:\s*(.+?)(?=\n|$)/s);
    
    const relevance = relevanceMatch ? relevanceMatch[1].toLowerCase() as 'high' | 'low' : 'low';
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;
    const reason = reasonMatch ? reasonMatch[1].trim() : 'Analysis completed';
    
    return {
      relevance,
      confidence: Math.min(Math.max(confidence, 0), 1), // Ensure confidence is between 0 and 1
      reason
    };

  } catch (error) {
    console.error('OpenAI relevance analysis error:', error);
    // Fallback to keyword analysis
    return analyzeRelevanceKeywords(text);
  }
}

// Financial keyword-based relevance analysis as fallback
function analyzeRelevanceKeywords(text: string): {
  relevance: 'high' | 'low';
  confidence: number;
  reason: string;
} {
  const financialKeywords = [
    'stock', 'market', 'trading', 'earnings', 'revenue', 'profit', 'investment', 
    'financial', 'economic', 'company', 'business', 'analyst', 'price', 'shares',
    'dividend', 'quarter', 'growth', 'loss', 'income', 'cash flow', 'debt',
    'acquisition', 'merger', 'ipo', 'buyback', 'forecast', 'guidance', 'SEC',
    'exchange', 'portfolio', 'fund', 'bond', 'equity', 'derivatives', 'hedge'
  ];
  
  const lowercaseText = text.toLowerCase();
  const matchedKeywords = financialKeywords.filter(keyword => lowercaseText.includes(keyword));
  const keywordCount = matchedKeywords.length;
  
  const relevance = keywordCount >= 4 ? 'high' : 'low';
  const confidence = Math.min(0.9, 0.3 + (keywordCount * 0.1));
  const reason = relevance === 'high' 
    ? `Contains ${keywordCount} financial keywords: ${matchedKeywords.slice(0, 3).join(', ')}`
    : `Limited financial relevance (${keywordCount} keywords)`;
  
  return { relevance, confidence, reason };
}

// Process articles with sequential delays and caching
async function processArticlesBatch(articles: NewsArticle[]): Promise<AnalysisResult[]> {
  // Check cache first
  const { cached, uncached } = await checkCache(articles);
  const results: AnalysisResult[] = [];
  
  // Add cached results
  articles.forEach(article => {
    const cacheEntry = cached.get(article.id);
    if (cacheEntry) {
      results.push({
        id: article.id,
        sentiment: cacheEntry.sentiment_result.label,
        relevance: cacheEntry.relevance_result.relevance
      });
    }
  });
  
  // Process uncached articles
  for (let i = 0; i < uncached.length; i++) {
    const article = uncached[i];
    const combinedText = `${article.title} ${article.content}`;
    
    try {
      console.log(`Processing uncached article ${i + 1}/${uncached.length}: ${article.id}`);
      
      // Add delay between requests to avoid rate limiting (except for first request)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay for rate limiting
      }
      
      // Run sentiment analysis
      const sentimentResult = await analyzeFinBERTSentiment(combinedText);
      
      // Add delay before relevance analysis
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Run OpenAI relevance analysis
      const relevanceResult = await analyzeOpenAIRelevance(combinedText, article.ticker);
      
      // Store in cache
      await storeInCache(article, sentimentResult, relevanceResult);
      
      results.push({
        id: article.id,
        sentiment: sentimentResult.label,
        relevance: relevanceResult.relevance
      });
      
      console.log(`Completed analysis for article ${article.id}: sentiment=${sentimentResult.label}, relevance=${relevanceResult.relevance}`);
    } catch (error) {
      console.error(`Error processing article ${article.id}:`, error);
      // Add fallback result
      const fallbackRelevance = analyzeRelevanceKeywords(combinedText);
      results.push({
        id: article.id,
        sentiment: 'neutral',
        relevance: fallbackRelevance.relevance
      });
    }
  }
  
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!HF_API_KEY) {
      throw new Error('Hugging Face API key not configured');
    }

    const { articles } = await req.json();
    
    if (!articles || !Array.isArray(articles)) {
      throw new Error('Invalid articles data provided');
    }

    console.log(`Starting AI analysis for ${articles.length} articles`);
    
    // Process articles in batches with caching
    const batchSize = 5;
    const allResults: AnalysisResult[] = [];
    
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(articles.length / batchSize)}`);
      
      const batchResults = await processArticlesBatch(batch);
      allResults.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between batches
      }
    }

    console.log(`Completed AI analysis for ${allResults.length} articles`);

    return new Response(JSON.stringify({ results: allResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI News Analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Failed to analyze news articles. Using fallback analysis.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
