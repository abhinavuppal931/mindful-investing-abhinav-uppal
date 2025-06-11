
import { supabase } from '@/integrations/supabase/client';

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

// In-memory cache for analysis results (session-level caching)
const sessionCache = new Map<string, AnalysisResult>();

// Generate cache key for article (session-level)
function getSessionCacheKey(article: NewsArticle): string {
  return `${article.title}_${article.content.substring(0, 100)}_${article.ticker || ''}`.replace(/\s+/g, '_');
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
    
    // Enhanced keyword-based relevance using OpenAI criteria
    const highRelevanceKeywords = [
      'earnings', 'revenue', 'guidance', 'acquisition', 'merger', 'partnership', 
      'sec filing', 'fda approval', 'ceo', 'dividend', 'buyback', 'contract',
      'patent', 'regulatory', 'investigation', 'leadership', 'investment'
    ];
    
    const lowRelevanceKeywords = [
      'could', 'might', 'potentially', 'expected', 'rumored', 'analyst believes',
      'experts predict', 'sources suggest', 'trending', 'viral', 'shocking',
      'crashes', 'skyrockets', 'meme'
    ];
    
    const highCount = highRelevanceKeywords.filter(keyword => combinedText.includes(keyword)).length;
    const lowCount = lowRelevanceKeywords.filter(keyword => combinedText.includes(keyword)).length;
    
    const relevance: 'high' | 'low' = (highCount >= 2 && lowCount <= 1) ? 'high' : 'low';
    
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
      // Check session cache first
      const cachedResults: AnalysisResult[] = [];
      const uncachedArticles: NewsArticle[] = [];
      
      articles.forEach(article => {
        const cacheKey = getSessionCacheKey(article);
        const cached = sessionCache.get(cacheKey);
        if (cached) {
          cachedResults.push({ ...cached, id: article.id });
        } else {
          uncachedArticles.push(article);
        }
      });
      
      console.log(`Session cache: ${cachedResults.length} cached, ${uncachedArticles.length} uncached`);
      
      if (uncachedArticles.length === 0) {
        return cachedResults;
      }
      
      console.log(`Sending ${uncachedArticles.length} articles for AI analysis with OpenAI relevance classification`);
      
      // Prepare articles with additional metadata for caching
      const articlesWithMetadata = uncachedArticles.map(article => ({
        ...article,
        source: article.source || 'unknown'
      }));
      
      const { data, error } = await supabase.functions.invoke('ai-news-analysis', {
        body: { articles: articlesWithMetadata }
      });
      
      if (error) {
        console.error('AI Analysis API error:', error);
        throw error;
      }
      
      if (data && data.results && Array.isArray(data.results)) {
        console.log(`Received AI analysis results for ${data.results.length} articles (with OpenAI relevance)`);
        
        // Cache the new results in session cache
        data.results.forEach((result: AnalysisResult) => {
          const article = uncachedArticles.find(a => a.id === result.id);
          if (article) {
            const cacheKey = getSessionCacheKey(article);
            sessionCache.set(cacheKey, result);
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
  },

  // Method to clear session cache if needed
  clearSessionCache: () => {
    sessionCache.clear();
    console.log('Session cache cleared');
  }
};
