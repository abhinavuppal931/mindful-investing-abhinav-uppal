
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
        // Check cache first
        const cacheKey = `price_driver_${ticker}`;
        const cachedData = openaiCache.get(cacheKey);
        
        if (cachedData) {
          console.log(`Using cached price driver for ${ticker}`);
          setInsight(cachedData);
          setLoading(false);
          return;
        }

        // Fetch new data if not cached
        console.log(`Fetching new price driver for ${ticker}`);
        const result = await openaiAPI.generateBriefInsight(ticker, financialData);
        
        if (result?.analysis) {
          setInsight(result.analysis);
          // Cache the result
          openaiCache.set(cacheKey, result.analysis);
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
            <span className="text-muted-foreground">Analyzing today's price drivers...</span>
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
          {insight}
        </p>
      </CardContent>
    </Card>
  );
};

export default TodaysPriceDriver;
