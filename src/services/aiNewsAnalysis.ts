
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

export const aiNewsAnalysis = {
  analyzeArticles: async (articles: NewsArticle[]): Promise<AnalysisResult[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-news-analysis', {
        body: { articles }
      });
      
      if (error) throw error;
      
      return data.results || [];
    } catch (error) {
      console.error('AI News Analysis error:', error);
      // Return fallback analysis if AI fails
      return articles.map(article => ({
        id: article.id,
        sentiment: 'neutral' as const,
        relevance: 'low' as const
      }));
    }
  }
};
