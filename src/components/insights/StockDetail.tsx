import React, { useState, useEffect } from 'react';
import CompanyOverview from './CompanyOverview';
import TodaysPriceDriver from './TodaysPriceDriver';
import AIAnalysisGrid from './AIAnalysisGrid';
import AnalystCards from './AnalystCards';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { fmpAPI } from '@/services/api';
import { useStockData } from '@/hooks/useStockData';
import FinancialChart from './FinancialChart';
import CompanyNews from './CompanyNews';
import EarningsCalendar from './EarningsCalendar';

interface StockDetailProps {
  ticker: string;
  companyName: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const { stockData, loading, error } = useStockData(ticker);
  const [showBackButton, setShowBackButton] = useState(false);

  useEffect(() => {
    // Show back button after component mounts to allow returning to stock list
    setShowBackButton(true);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-mindful-600" />
        </div>
      </div>
    );
  }

  if (error || !stockData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error loading stock data: {error}</p>
            {showBackButton && (
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Stock List
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      {showBackButton && (
        <Button 
          variant="ghost" 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Stock List
        </Button>
      )}

      {/* Company Overview */}
      <CompanyOverview 
        stockData={stockData.quote}
        profile={stockData.profile}
      />

      {/* Today's Price Driver */}
      <TodaysPriceDriver 
        ticker={ticker}
        financialData={stockData}
      />

      {/* AI Analysis Grid */}
      <AIAnalysisGrid ticker={ticker} />

      {/* Analyst Cards */}
      <AnalystCards 
        ticker={ticker} 
        currentPrice={stockData.quote?.price || 0}
      />

      {/* Financial Charts Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Financial Charts</h2>
        <Card>
          <CardContent className="p-4">
            <FinancialChart ticker={ticker} />
          </CardContent>
        </Card>
      </div>

      {/* Company News Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Company News</h2>
        <Card>
          <CardContent className="p-4">
            <CompanyNews ticker={ticker} />
          </CardContent>
        </Card>
      </div>

      {/* Earnings Calendar Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Earnings Calendar</h2>
        <Card>
          <CardContent className="p-4">
            <EarningsCalendar ticker={ticker} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockDetail;
