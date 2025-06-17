
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import CompanyOverview from './CompanyOverview';
import AIAnalysisGrid from './AIAnalysisGrid';
import AnalystRatingsCard from './AnalystRatingsCard';
import PriceTargetCard from './PriceTargetCard';
import TodaysPriceDriver from './TodaysPriceDriver';
import { fmpAPI } from '@/services/api';
import { useStockData } from '@/hooks/useStockData';

interface StockDetailProps {
  ticker: string;
  companyName: string;
  onBack?: () => void;
}

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName, onBack }) => {
  const { quote, financials, profile, loading: stockDataLoading, error } = useStockData(ticker);
  const [loading, setLoading] = useState(true);
  const [stockQuote, setStockQuote] = useState<any>(null);

  useEffect(() => {
    const fetchStockQuote = async () => {
      if (!ticker) return;
      
      setLoading(true);
      try {
        const quoteData = await fmpAPI.getQuote(ticker);
        if (quoteData && quoteData.length > 0) {
          setStockQuote(quoteData[0]);
        }
      } catch (err) {
        console.error('Error fetching stock quote:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStockQuote();
  }, [ticker]);

  if (stockDataLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mindful-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-600">
            Error loading stock data: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPrice = stockQuote?.price || quote?.price || 0;

  return (
    <div className="space-y-6">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Stock List
        </Button>
      )}

      {/* Company Overview */}
      <CompanyOverview 
        ticker={ticker}
        companyName={companyName}
        stockData={quote || stockQuote}
        profile={profile}
      />

      {/* Today's Price Driver */}
      <TodaysPriceDriver 
        ticker={ticker}
        financialData={financials}
      />

      {/* AI Analysis Grid */}
      <AIAnalysisGrid 
        ticker={ticker}
        financialData={financials}
      />

      {/* Analyst Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalystRatingsCard ticker={ticker} />
        <PriceTargetCard ticker={ticker} currentPrice={currentPrice} />
      </div>
    </div>
  );
};

export default StockDetail;
