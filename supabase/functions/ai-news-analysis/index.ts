
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
          inputs: text.substring(0, 512), // Limit text length for processing
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`FinBERT API error: ${response.status}`);
    }

    const result = await response.json();
    
    // FinBERT returns an array with sentiment scores
    if (result && result[0] && Array.isArray(result[0])) {
      const sentiments = result[0];
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
    
    return 'neutral';
  } catch (error) {
    console.error('FinBERT analysis error:', error);
    return 'neutral'; // Default fallback
  }
}

// RoBERTa relevance classification
async function analyzeRoBERTaRelevance(text: string): Promise<'high' | 'low'> {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/roberta-base",
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: text.substring(0, 512), // Limit text length for processing
          parameters: {
            candidate_labels: ["relevant financial news", "irrelevant news"],
            hypothesis_template: "This text is {}."
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`RoBERTa API error: ${response.status}`);
    }

    const result = await response.json();
    
    // RoBERTa zero-shot classification returns labels and scores
    if (result && result.labels && result.scores) {
      const relevantIndex = result.labels.indexOf("relevant financial news");
      if (relevantIndex !== -1 && result.scores[relevantIndex] > 0.6) {
        return 'high';
      }
    }
    
    return 'low';
  } catch (error) {
    console.error('RoBERTa analysis error:', error);
    // Fallback based on financial keywords
    const financialKeywords = ['stock', 'market', 'trading', 'earnings', 'revenue', 'profit', 'investment', 'financial', 'economic', 'company', 'business', 'analyst', 'price', 'shares'];
    const lowercaseText = text.toLowerCase();
    const keywordCount = financialKeywords.filter(keyword => lowercaseText.includes(keyword)).length;
    return keywordCount >= 2 ? 'high' : 'low';
  }
}

// Process articles in batches
async function processArticlesBatch(articles: NewsArticle[]): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];
  
  for (const article of articles) {
    const combinedText = `${article.title} ${article.content}`;
    
    // Run sentiment and relevance analysis in parallel
    const [sentiment, relevance] = await Promise.all([
      analyzeFinBERTSentiment(combinedText),
      analyzeRoBERTaRelevance(combinedText)
    ]);
    
    results.push({
      id: article.id,
      sentiment,
      relevance
    });
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

    console.log(`Processing ${articles.length} articles for AI analysis`);
    
    // Process articles in smaller batches to avoid timeouts
    const batchSize = 10;
    const allResults: AnalysisResult[] = [];
    
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const batchResults = await processArticlesBatch(batch);
      allResults.push(...batchResults);
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
