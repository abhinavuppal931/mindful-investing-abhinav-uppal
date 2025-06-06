
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HF_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');

interface NewsArticle {
  id: string;
  title: string;
  content: string;
}

interface AnalysisResult {
  id: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance: 'high' | 'low';
}

// FinBERT sentiment analysis
async function analyzeFinBERTSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/ProsusAI/finbert",
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: text.substring(0, 500), // Limit text length for processing
          options: {
            wait_for_model: true
          }
        }),
      }
    );

    if (!response.ok) {
      console.error(`FinBERT API error: ${response.status} - ${response.statusText}`);
      throw new Error(`FinBERT API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('FinBERT response:', result);
    
    // FinBERT returns an array with sentiment scores
    if (result && Array.isArray(result) && result.length > 0) {
      const sentiments = result[0];
      
      if (Array.isArray(sentiments)) {
        let maxScore = -1;
        let predictedSentiment = 'neutral';
        
        for (const sentiment of sentiments) {
          if (sentiment.score > maxScore) {
            maxScore = sentiment.score;
            // Map FinBERT labels to our format
            if (sentiment.label === 'positive') {
              predictedSentiment = 'positive';
            } else if (sentiment.label === 'negative') {
              predictedSentiment = 'negative';
            } else {
              predictedSentiment = 'neutral';
            }
          }
        }
        
        return predictedSentiment as 'positive' | 'negative' | 'neutral';
      }
    }
    
    return 'neutral';
  } catch (error) {
    console.error('FinBERT analysis error:', error);
    return 'neutral'; // Default fallback
  }
}

// Simplified relevance classification using keyword analysis as backup
function analyzeRelevanceKeywords(text: string): 'high' | 'low' {
  const financialKeywords = [
    'stock', 'market', 'trading', 'earnings', 'revenue', 'profit', 'investment', 
    'financial', 'economic', 'company', 'business', 'analyst', 'price', 'shares',
    'dividend', 'quarter', 'growth', 'loss', 'income', 'cash flow', 'debt',
    'acquisition', 'merger', 'ipo', 'buyback', 'forecast', 'guidance'
  ];
  
  const lowercaseText = text.toLowerCase();
  const keywordCount = financialKeywords.filter(keyword => lowercaseText.includes(keyword)).length;
  
  // If 3 or more financial keywords, consider high relevance
  return keywordCount >= 3 ? 'high' : 'low';
}

// Alternative RoBERTa-based relevance using zero-shot classification
async function analyzeRoBERTaRelevance(text: string): Promise<'high' | 'low'> {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: text.substring(0, 500),
          parameters: {
            candidate_labels: ["financial news", "business news", "irrelevant news"],
          },
          options: {
            wait_for_model: true
          }
        }),
      }
    );

    if (!response.ok) {
      console.error(`RoBERTa API error: ${response.status} - ${response.statusText}`);
      throw new Error(`RoBERTa API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('RoBERTa response:', result);
    
    // Check if financial or business news has high confidence
    if (result && result.labels && result.scores) {
      const financialIndex = result.labels.findIndex((label: string) => 
        label.includes("financial") || label.includes("business")
      );
      
      if (financialIndex !== -1 && result.scores[financialIndex] > 0.5) {
        return 'high';
      }
    }
    
    // Fallback to keyword analysis
    return analyzeRelevanceKeywords(text);
  } catch (error) {
    console.error('RoBERTa analysis error:', error);
    // Fallback to keyword-based analysis
    return analyzeRelevanceKeywords(text);
  }
}

// Process articles with rate limiting
async function processArticlesBatch(articles: NewsArticle[]): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const combinedText = `${article.title} ${article.content}`;
    
    try {
      // Add delay between requests to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
      
      // Run sentiment and relevance analysis in sequence to avoid rate limits
      const sentiment = await analyzeFinBERTSentiment(combinedText);
      
      // Add another small delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const relevance = await analyzeRoBERTaRelevance(combinedText);
      
      results.push({
        id: article.id,
        sentiment,
        relevance
      });
      
      console.log(`Processed article ${i + 1}/${articles.length}: ${article.id}`);
    } catch (error) {
      console.error(`Error processing article ${article.id}:`, error);
      // Add fallback result
      results.push({
        id: article.id,
        sentiment: 'neutral',
        relevance: analyzeRelevanceKeywords(combinedText)
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
    
    // Process articles in smaller batches to avoid timeouts and rate limits
    const batchSize = 5; // Reduced batch size
    const allResults: AnalysisResult[] = [];
    
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(articles.length / batchSize)}`);
      
      const batchResults = await processArticlesBatch(batch);
      allResults.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between batches
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
