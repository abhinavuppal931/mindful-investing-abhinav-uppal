import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Activity } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import CompanyOverview from './CompanyOverview';
import AIAnalysisGrid from './AIAnalysisGrid';
import AnalystRatingsCard from './AnalystRatingsCard';
import StockLogo from './StockLogo';
import TodaysPriceDriver from './TodaysPriceDriver';
import { fmpAPI, finnhubAPI } from '@/services/api';
import { useNews } from '@/hooks/useStockData';

interface StockDetailProps {
  ticker: string;
  companyName: string;
}

interface FinancialData {
  date: string;
  revenue: number;
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  totalDebt: number;
  totalCash: number;
  freeCashFlow: number;
  operatingCashFlow: number;
  ebitda: number;
}

interface GradesConsensus {
  symbol: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const { quote, financials, profile, loading: stockLoading } = useStockData(ticker);
  const { news, loading: newsLoading } = useNews(ticker);
  const [gradesData, setGradesData] = useState<GradesConsensus | null>(null);
  const [gradesLoading, setGradesLoading] = useState(false);

  useEffect(() => {
    const fetchGradesData = async () => {
      if (!ticker) return;
      
      setGradesLoading(true);
      try {
        const data = await fmpAPI.getGradesConsensus(ticker);
        if (data && data.length > 0) {
          setGradesData(data[0]);
        }
      } catch (error) {
        console.error('Error fetching grades data:', error);
      } finally {
        setGradesLoading(false);
      }
    };

    fetchGradesData();
  }, [ticker]);

  if (stockLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!quote || !profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No data available for {ticker}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <StockLogo ticker={ticker} className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">{ticker}</h1>
            <p className="text-lg text-muted-foreground">{companyName}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">${quote.price?.toFixed(2)}</div>
          <div className={`text-lg ${quote.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {quote.change >= 0 ? '+' : ''}{quote.change?.toFixed(2)} ({quote.changesPercentage?.toFixed(2)}%)
          </div>
        </div>
      </div>

      <CompanyOverview 
        ticker={ticker}
        companyName={companyName}
        stockData={quote}
        profile={profile}
      />

      <TodaysPriceDriver ticker={ticker} />

      <AIAnalysisGrid 
        ticker={ticker} 
        financialData={financials}
        newsData={news}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalystRatingsCard 
          data={gradesData} 
          loading={gradesLoading} 
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Additional analyst insights will be available here soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockDetail;
