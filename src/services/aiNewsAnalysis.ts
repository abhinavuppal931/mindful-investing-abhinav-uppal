
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

// Fallback keyword-based analysis
function getFallbackAnalysis(articles: NewsArticle[]): AnalysisResult[] {
  return articles.map(article => {
    const combinedText = `${article.title} ${article.content}`.toLowerCase();
    
    // Simple keyword-based sentiment
    const positiveWords = ['growth', 'profit', 'gain', 'success', 'increase', 'rise', 'up', 'good', 'strong'];
    const negativeWords = ['loss', 'decline', 'fall', 'drop', 'down', 'weak', 'bad', 'concern', 'worry'];
    
    const positiveCount = positiveWords.filter(word => combinedText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => combinedText.includes(word)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
    }
    
    // Simple keyword-based relevance
    const financialKeywords = [
      'stock', 'market', 'trading', 'earnings', 'revenue', 'profit', 'investment', 
      'financial', 'economic', 'company', 'business', 'analyst', 'price', 'shares'
    ];
    
    const relevanceCount = financialKeywords.filter(keyword => combinedText.includes(keyword)).length;
    const relevance: 'high' | 'low' = relevanceCount >= 3 ? 'high' : 'low';
    
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
      console.log(`Sending ${articles.length} articles for AI analysis`);
      
      const { data, error } = await supabase.functions.invoke('ai-news-analysis', {
        body: { articles }
      });
      
      if (error) {
        console.error('AI Analysis API error:', error);
        throw error;
      }
      
      if (data && data.results && Array.isArray(data.results)) {
        console.log(`Received AI analysis results for ${data.results.length} articles`);
        return data.results;
      } else {
        console.warn('Invalid AI analysis response format, using fallback');
        return getFallbackAnalysis(articles);
      }
    } catch (error) {
      console.error('AI News Analysis error:', error);
      console.log('Using fallback keyword-based analysis');
      return getFallbackAnalysis(articles);
    }
  }
};
