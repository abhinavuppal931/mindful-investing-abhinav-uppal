
import React, { useState, useEffect } from 'react';
import { useStockData } from '@/hooks/useStockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import CompanyOverview from './CompanyOverview';
import TodaysPriceDriver from './TodaysPriceDriver';
import AIAnalysisGrid from './AIAnalysisGrid';
import AnalystCards from './AnalystCards';
import FinancialChart from './FinancialChart';
import CompanyNews from './CompanyNews';
import EarningsCalendar from './EarningsCalendar';

interface StockDetailProps {
  ticker: string;
  companyName: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('1Y');
  const [newsTimeFrame, setNewsTimeFrame] = useState('7');
  const { quote, financials, profile, loading, error } = useStockData(ticker);

  const handleTimeFrameChange = (timeFrame: string) => {
    setSelectedTimeFrame(timeFrame);
  };

  const handleNewsTimeFrameChange = (days: string) => {
    setNewsTimeFrame(days);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!quote || !profile) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No data available for {ticker}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stock Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{companyName}</h2>
          <p className="text-muted-foreground">{ticker}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">
            ${quote.price?.toFixed(2)}
          </p>
          <p className={`text-sm ${quote.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {quote.change >= 0 ? '+' : ''}
            {quote.change?.toFixed(2)} ({quote.changesPercentage?.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Company Overview */}
      <CompanyOverview profile={profile} />

      {/* Today's Price Driver */}
      <TodaysPriceDriver ticker={ticker} financialData={financials} />

      {/* Financial Charts */}
      <div className="grid grid-cols-1 gap-6">
        <FinancialChart ticker={ticker} />
      </div>

      {/* AI Analysis Grid */}
      <AIAnalysisGrid 
        ticker={ticker} 
        financialData={financials} 
        newsData={[]} 
      />

      {/* Analyst Cards - NEW ADDITION */}
      <AnalystCards 
        ticker={ticker} 
        currentPrice={quote.price || 0} 
      />

      {/* Company News */}
      <CompanyNews ticker={ticker} />

      {/* Earnings Calendar */}
      <EarningsCalendar ticker={ticker} />
    </div>
  );
};

export default StockDetail;
