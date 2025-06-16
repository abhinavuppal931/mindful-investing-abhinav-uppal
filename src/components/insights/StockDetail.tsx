
import React, { useState } from 'react';
import { useStockData } from '@/hooks/useStockData';
import CompanyOverview from './CompanyOverview';
import AIAnalysisGrid from './AIAnalysisGrid';
import TodaysPriceDriver from './TodaysPriceDriver';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LineChart from '@/components/charts/LineChart';
import { Loader2 } from 'lucide-react';

interface StockDetailProps {
  ticker: string;
  companyName: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const [period, setPeriod] = useState<'annual' | 'quarterly'>('annual');
  const [timeframe, setTimeframe] = useState<string>('5');
  const [isTTM, setIsTTM] = useState(false);

  const years = parseInt(timeframe);
  const { 
    quote, 
    profile, 
    incomeStatement, 
    balanceSheet, 
    cashFlow, 
    keyMetrics, 
    keyMetricsTTM,
    ratios, 
    ratiosTTM,
    loading, 
    error 
  } = useStockData(ticker, period, years);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!quote || !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No data available for {ticker}</p>
      </div>
    );
  }

  // Use TTM data when available and TTM is selected, otherwise use historical data
  const currentKeyMetrics = isTTM && keyMetricsTTM.length > 0 ? keyMetricsTTM : keyMetrics;
  const currentRatios = isTTM && ratiosTTM.length > 0 ? ratiosTTM : ratios;

  // Combine all financial data for AI analysis
  const financialData = {
    incomeStatement,
    balanceSheet,
    cashFlow,
    keyMetrics: currentKeyMetrics,
    ratios: currentRatios,
    quote,
    profile
  };

  // Mock news data for AI analysis - this should be replaced with actual news data
  const newsData: any[] = [];

  const handlePeriodChange = (newPeriod: 'annual' | 'quarterly') => {
    setPeriod(newPeriod);
    setIsTTM(false); // Reset TTM when changing period
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    if (newTimeframe === 'ttm') {
      setIsTTM(true);
    } else {
      setIsTTM(false);
    }
  };

  return (
    <div className="space-y-6">
      <CompanyOverview profile={profile} />
      
      <TodaysPriceDriver ticker={ticker} financialData={financialData} />
      
      <AIAnalysisGrid ticker={ticker} financialData={financialData} newsData={newsData} />

      <Tabs defaultValue="revenue" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <TabsList className="grid w-full grid-cols-4 sm:w-auto">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
            <TabsTrigger value="margins">Margins</TabsTrigger>
            <TabsTrigger value="ratios">Key Ratios</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={isTTM ? 'ttm' : timeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1Y</SelectItem>
                <SelectItem value="3">3Y</SelectItem>
                <SelectItem value="5">5Y</SelectItem>
                <SelectItem value="10">10Y</SelectItem>
                <SelectItem value="ttm">TTM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeStatement.length > 0 ? (
                  <LineChart
                    data={incomeStatement.slice(0, years)}
                    xKey="calendarYear"
                    yKey="revenue"
                    title="Revenue"
                    color="#8884d8"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No revenue data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Growth</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeStatement.length > 1 ? (
                  <LineChart
                    data={incomeStatement.slice(0, years).map((item, index, arr) => {
                      if (index === arr.length - 1) return { ...item, revenueGrowth: 0 };
                      const currentRevenue = item.revenue;
                      const previousRevenue = arr[index + 1].revenue;
                      const growth = previousRevenue ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
                      return { ...item, revenueGrowth: growth };
                    })}
                    xKey="calendarYear"
                    yKey="revenueGrowth"
                    title="Revenue Growth (%)"
                    color="#82ca9d"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">Insufficient data for growth calculation</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Net Income</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeStatement.length > 0 ? (
                  <LineChart
                    data={incomeStatement.slice(0, years)}
                    xKey="calendarYear"
                    yKey="netIncome"
                    title="Net Income"
                    color="#8884d8"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No net income data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>EBITDA</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeStatement.length > 0 ? (
                  <LineChart
                    data={incomeStatement.slice(0, years)}
                    xKey="calendarYear"
                    yKey="ebitda"
                    title="EBITDA"
                    color="#82ca9d"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No EBITDA data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operating Income</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeStatement.length > 0 ? (
                  <LineChart
                    data={incomeStatement.slice(0, years)}
                    xKey="calendarYear"
                    yKey="operatingIncome"
                    title="Operating Income"
                    color="#ffc658"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No operating income data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Earnings Per Share (EPS)</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeStatement.length > 0 ? (
                  <LineChart
                    data={incomeStatement.slice(0, years)}
                    xKey="calendarYear"
                    yKey="eps"
                    title="EPS"
                    color="#ff7300"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No EPS data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="margins" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gross Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                {currentRatios.length > 0 ? (
                  <LineChart
                    data={currentRatios.slice(0, isTTM ? 1 : years)}
                    xKey={isTTM ? "symbol" : "calendarYear"}
                    yKey="grossProfitMargin"
                    title="Gross Profit Margin (%)"
                    color="#8884d8"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No gross profit margin data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operating Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                {currentRatios.length > 0 ? (
                  <LineChart
                    data={currentRatios.slice(0, isTTM ? 1 : years)}
                    xKey={isTTM ? "symbol" : "calendarYear"}
                    yKey="operatingProfitMargin"
                    title="Operating Profit Margin (%)"
                    color="#82ca9d"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No operating profit margin data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Net Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                {currentRatios.length > 0 ? (
                  <LineChart
                    data={currentRatios.slice(0, isTTM ? 1 : years)}
                    xKey={isTTM ? "symbol" : "calendarYear"}
                    yKey="netProfitMargin"
                    title="Net Profit Margin (%)"
                    color="#ffc658"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No net profit margin data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>EBITDA Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeStatement.length > 0 ? (
                  <LineChart
                    data={incomeStatement.slice(0, years)}
                    xKey="calendarYear"
                    yKey="ebitdaratio"
                    title="EBITDA Ratio (%)"
                    color="#ff7300"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No EBITDA ratio data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>P/E Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                {currentKeyMetrics.length > 0 ? (
                  <LineChart
                    data={currentKeyMetrics.slice(0, isTTM ? 1 : years)}
                    xKey={isTTM ? "symbol" : "calendarYear"}
                    yKey="peRatio"
                    title="P/E Ratio"
                    color="#8884d8"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No P/E ratio data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Price to Sales Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                {currentKeyMetrics.length > 0 ? (
                  <LineChart
                    data={currentKeyMetrics.slice(0, isTTM ? 1 : years)}
                    xKey={isTTM ? "symbol" : "calendarYear"}
                    yKey="priceToSalesRatio"
                    title="Price to Sales Ratio"
                    color="#82ca9d"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No price to sales ratio data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Return on Equity (ROE)</CardTitle>
              </CardHeader>
              <CardContent>
                {currentKeyMetrics.length > 0 ? (
                  <LineChart
                    data={currentKeyMetrics.slice(0, isTTM ? 1 : years)}
                    xKey={isTTM ? "symbol" : "calendarYear"}
                    yKey="roe"
                    title="ROE (%)"
                    color="#ffc658"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No ROE data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Return on Investment Capital (ROIC)</CardTitle>
              </CardHeader>
              <CardContent>
                {currentKeyMetrics.length > 0 ? (
                  <LineChart
                    data={currentKeyMetrics.slice(0, isTTM ? 1 : years)}
                    xKey={isTTM ? "symbol" : "calendarYear"}
                    yKey="roic"
                    title="ROIC (%)"
                    color="#ff7300"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No ROIC data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Debt to Equity</CardTitle>
              </CardHeader>
              <CardContent>
                {currentKeyMetrics.length > 0 ? (
                  <LineChart
                    data={currentKeyMetrics.slice(0, isTTM ? 1 : years)}
                    xKey={isTTM ? "symbol" : "calendarYear"}
                    yKey="debtToEquity"
                    title="Debt to Equity"
                    color="#8884d8"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No debt to equity data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                {currentKeyMetrics.length > 0 ? (
                  <LineChart
                    data={currentKeyMetrics.slice(0, isTTM ? 1 : years)}
                    xKey={isTTM ? "symbol" : "calendarYear"}
                    yKey="currentRatio"
                    title="Current Ratio"
                    color="#82ca9d"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No current ratio data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockDetail;
