
import { supabase } from '@/integrations/supabase/client';

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

// In-memory cache for analysis results
const analysisCache = new Map<string, AnalysisResult>();

// Generate cache key for article
function getCacheKey(article: NewsArticle): string {
  // Use title and first 100 chars of content for cache key
  return `${article.title}_${article.content.substring(0, 100)}`.replace(/\s+/g, '_');
}

// Fallback keyword-based analysis
function getFallbackAnalysis(articles: NewsArticle[]): AnalysisResult[] {
  return articles.map(article => {
    const combinedText = `${article.title} ${article.content}`.toLowerCase();
    
    // Enhanced keyword-based sentiment
    const positiveWords = ['growth', 'profit', 'gain', 'success', 'increase', 'rise', 'up', 'good', 'strong', 'beat', 'exceed', 'outperform'];
    const negativeWords = ['loss', 'decline', 'fall', 'drop', 'down', 'weak', 'bad', 'concern', 'worry', 'miss', 'disappoint', 'struggle'];
    
    const positiveCount = positiveWords.filter(word => combinedText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => combinedText.includes(word)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
    }
    
    // Enhanced keyword-based relevance
    const financialKeywords = [
      'stock', 'market', 'trading', 'earnings', 'revenue', 'profit', 'investment', 
      'financial', 'economic', 'company', 'business', 'analyst', 'price', 'shares',
      'dividend', 'quarter', 'growth', 'loss', 'income', 'cash flow', 'debt',
      'acquisition', 'merger', 'ipo', 'buyback', 'forecast', 'guidance', 'SEC'
    ];
    
    const relevanceCount = financialKeywords.filter(keyword => combinedText.includes(keyword)).length;
    const relevance: 'high' | 'low' = relevanceCount >= 4 ? 'high' : 'low';
    
    return {
      id: article.id,
      sentiment,
      relevance
    };
  });
}

export const aiNewsAnalysis = {
  analyzeArticles: async (articles: NewsArticle[]): Promise<AnalysisResult[]> => {
    try {
      // Check cache first
      const cachedResults: AnalysisResult[] = [];
      const uncachedArticles: NewsArticle[] = [];
      
      articles.forEach(article => {
        const cacheKey = getCacheKey(article);
        const cached = analysisCache.get(cacheKey);
        if (cached) {
          cachedResults.push({ ...cached, id: article.id });
        } else {
          uncachedArticles.push(article);
        }
      });
      
      console.log(`Found ${cachedResults.length} cached results, processing ${uncachedArticles.length} new articles`);
      
      if (uncachedArticles.length === 0) {
        return cachedResults;
      }
      
      console.log(`Sending ${uncachedArticles.length} articles for AI analysis`);
      
      const { data, error } = await supabase.functions.invoke('ai-news-analysis', {
        body: { articles: uncachedArticles }
      });
      
      if (error) {
        console.error('AI Analysis API error:', error);
        throw error;
      }
      
      if (data && data.results && Array.isArray(data.results)) {
        console.log(`Received AI analysis results for ${data.results.length} articles`);
        
        // Cache the new results
        data.results.forEach((result: AnalysisResult) => {
          const article = uncachedArticles.find(a => a.id === result.id);
          if (article) {
            const cacheKey = getCacheKey(article);
            analysisCache.set(cacheKey, result);
          }
        });
        
        // Combine cached and new results
        const allResults = [...cachedResults, ...data.results];
        
        // Sort to match original order
        return articles.map(article => 
          allResults.find(result => result.id === article.id) || {
            id: article.id,
            sentiment: 'neutral' as const,
            relevance: 'low' as const
          }
        );
      } else {
        console.warn('Invalid AI analysis response format, using fallback');
        const fallbackResults = getFallbackAnalysis(uncachedArticles);
        return [...cachedResults, ...fallbackResults];
      }
    } catch (error) {
      console.error('AI News Analysis error:', error);
      console.log('Using fallback keyword-based analysis');
      return getFallbackAnalysis(articles);
    }
  }
};
