
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';
import { openaiAPI } from '@/services/api';
import { openaiCache } from '@/utils/openaiCache';

interface TodaysPriceDriverProps {
  ticker: string;
  financialData: any;
}

const TodaysPriceDriver: React.FC<TodaysPriceDriverProps> = ({ ticker, financialData }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceDriver = async () => {
      if (!ticker) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Clear cache for real-time data
        const cacheKey = `price_driver_${ticker}`;
        openaiCache.clear(cacheKey);

        // Fetch new data
        console.log(`Fetching current price driver for ${ticker}`);
        const result = await openaiAPI.generateBriefInsight(ticker, financialData);
        
        if (result?.analysis) {
          // Clean up the analysis text to remove debugging information
          let cleanedAnalysis = result.analysis;
          
          // Remove data_period references and debugging dates
          cleanedAnalysis = cleanedAnalysis.replace(/\*\*data_period\*\*[^.]*\./gi, '');
          cleanedAnalysis = cleanedAnalysis.replace(/data_period[^.]*\./gi, '');
          cleanedAnalysis = cleanedAnalysis.replace(/\("start_date"[^)]*\)/gi, '');
          cleanedAnalysis = cleanedAnalysis.replace(/As of [^,]*, /gi, '');
          cleanedAnalysis = cleanedAnalysis.replace(/\s+/g, ' ').trim();
          
          setInsight(cleanedAnalysis);
        } else {
          setError('Unable to generate price driver analysis');
        }
      } catch (err) {
        console.error('Error fetching price driver:', err);
        setError('Unable to load price driver analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchPriceDriver();
  }, [ticker, financialData]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Analyzing current market drivers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Today's Price Driver
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-foreground leading-relaxed text-sm">
          {insight || 'No analysis available'}
        </p>
      </CardContent>
    </Card>
  );
};

export default TodaysPriceDriver;
