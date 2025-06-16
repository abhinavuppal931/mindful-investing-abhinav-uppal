import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Calculator, Brain, MessageSquare } from 'lucide-react';
import MultiLineChart from '@/components/charts/MultiLineChart';
import CompanyOverview from '@/components/insights/CompanyOverview';
import TodaysPriceDriver from '@/components/insights/TodaysPriceDriver';
import AIAnalysisGrid from '@/components/insights/AIAnalysisGrid';
import { useStockData, useNews } from '@/hooks/useStockData';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/formatUtils';

interface StockDetailProps {
  ticker: string;
  companyName: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const [timeframe, setTimeframe] = useState('5Y');
  const { 
    quote, 
    incomeStatement, 
    balanceSheet, 
    cashFlow, 
    keyMetrics, 
    keyMetricsTTM, 
    ratios, 
    ratiosTTM, 
    profile, 
    loading, 
    error 
  } = useStockData(ticker, timeframe);
  
  const { news, loading: newsLoading, error: newsError } = useNews(ticker);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mindful-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-600">Error loading stock data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!quote || !profile) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <p className="text-yellow-600">No data available for {ticker}</p>
        </CardContent>
      </Card>
    );
  }

  // Convert financialData object to array format for AIAnalysisGrid
  const financialDataArray = [
    { incomeStatement, balanceSheet, cashFlow, keyMetrics, keyMetricsTTM, ratios, ratiosTTM }
  ];

  const prepareChartData = (data: any[], fields: string[], labels: string[]) => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => {
      const chartItem: any = { date: item.date };
      fields.forEach((field, index) => {
        chartItem[labels[index]] = item[field];
      });
      return chartItem;
    }).reverse();
  };

  const prepareTTMChartData = (data: any, fields: string[], labels: string[]) => {
    if (!data) return [];
    
    const chartItem: any = { date: 'TTM' };
    fields.forEach((field, index) => {
      chartItem[labels[index]] = data[field];
    });
    return [chartItem];
  };

  // Revenue chart data
  const revenueData = prepareChartData(
    incomeStatement,
    ['revenue', 'grossProfit', 'operatingIncome', 'netIncome'],
    ['Revenue', 'Gross Profit', 'Operating Income', 'Net Income']
  );

  // Cash flow chart data
  const cashFlowData = prepareChartData(
    cashFlow,
    ['operatingCashFlow', 'freeCashFlow'],
    ['Operating Cash Flow', 'Free Cash Flow']
  );

  // Balance sheet chart data
  const balanceSheetData = prepareChartData(
    balanceSheet,
    ['totalCash', 'totalDebt'],
    ['Cash', 'Debt']
  );

  // Margins data - combining annual and TTM based on timeframe
  const getMarginData = () => {
    if (timeframe === 'TTM' && ratiosTTM) {
      return prepareTTMChartData(
        ratiosTTM,
        ['grossProfitMargin', 'operatingProfitMargin', 'netProfitMargin'],
        ['Gross Margin', 'Operating Margin', 'Net Margin']
      );
    }
    return prepareChartData(
      ratios,
      ['grossProfitMargin', 'operatingProfitMargin', 'netProfitMargin'],
      ['Gross Margin', 'Operating Margin', 'Net Margin']
    );
  };

  // Key ratios data - combining annual and TTM based on timeframe
  const getKeyRatiosData = () => {
    if (timeframe === 'TTM' && ratiosTTM && keyMetricsTTM) {
      const combinedData = { ...ratiosTTM, ...keyMetricsTTM };
      return prepareTTMChartData(
        combinedData,
        ['priceEarningsRatio', 'priceToSalesRatio', 'pfcfRatio', 'priceToOperatingCashFlowsRatio', 'roe', 'roic'],
        ['P/E', 'P/S', 'P/FCF', 'P/OCF', 'ROE', 'ROIC']
      );
    }
    
    // For annual data, combine ratios and keyMetrics
    const combinedAnnualData = ratios.map((ratio, index) => ({
      ...ratio,
      ...keyMetrics[index]
    }));
    
    return prepareChartData(
      combinedAnnualData,
      ['priceEarningsRatio', 'priceToSalesRatio', 'pfcfRatio', 'priceToOperatingCashFlowsRatio', 'roe', 'roic'],
      ['P/E', 'P/S', 'P/FCF', 'P/OCF', 'ROE', 'ROIC']
    );
  };

  const marginData = getMarginData();
  const keyRatiosData = getKeyRatiosData();

  return (
    <div className="space-y-6">
      {/* Company Overview */}
      <CompanyOverview profile={profile} />

      {/* Today's Price Driver */}
      <TodaysPriceDriver ticker={ticker} financialData={financialDataArray[0]} />

      {/* Charts Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">Financial Charts</h2>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1Y">1 Year</SelectItem>
              <SelectItem value="3Y">3 Years</SelectItem>
              <SelectItem value="5Y">5 Years</SelectItem>
              <SelectItem value="10Y">10 Years</SelectItem>
              <SelectItem value="TTM">TTM</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
            <TabsTrigger value="margins">Margins</TabsTrigger>
            <TabsTrigger value="ratios">Key Ratios</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Revenue & Profitability
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueData.length > 0 ? (
                  <MultiLineChart
                    data={revenueData}
                    lines={[
                      { key: 'Revenue', color: '#3b82f6', name: 'Revenue' },
                      { key: 'Gross Profit', color: '#10b981', name: 'Gross Profit' },
                      { key: 'Operating Income', color: '#f59e0b', name: 'Operating Income' },
                      { key: 'Net Income', color: '#ef4444', name: 'Net Income' }
                    ]}
                    height={400}
                    showTooltip={true}
                    formatValue={(value) => formatCurrency(value)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No revenue data available for the selected timeframe
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Cash Flow Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cashFlowData.length > 0 ? (
                  <MultiLineChart
                    data={cashFlowData}
                    lines={[
                      { key: 'Operating Cash Flow', color: '#3b82f6', name: 'Operating Cash Flow' },
                      { key: 'Free Cash Flow', color: '#10b981', name: 'Free Cash Flow' }
                    ]}
                    height={400}
                    showTooltip={true}
                    formatValue={(value) => formatCurrency(value)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No cash flow data available for the selected timeframe
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Cash & Debt
                </CardTitle>
              </CardHeader>
              <CardContent>
                {balanceSheetData.length > 0 ? (
                  <MultiLineChart
                    data={balanceSheetData}
                    lines={[
                      { key: 'Cash', color: '#10b981', name: 'Cash' },
                      { key: 'Debt', color: '#ef4444', name: 'Debt' }
                    ]}
                    height={400}
                    showTooltip={true}
                    formatValue={(value) => formatCurrency(value)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No balance sheet data available for the selected timeframe
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="margins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  Profit Margins
                </CardTitle>
              </CardHeader>
              <CardContent>
                {marginData.length > 0 ? (
                  <MultiLineChart
                    data={marginData}
                    lines={[
                      { key: 'Gross Margin', color: '#3b82f6', name: 'Gross Margin' },
                      { key: 'Operating Margin', color: '#10b981', name: 'Operating Margin' },
                      { key: 'Net Margin', color: '#ef4444', name: 'Net Margin' }
                    ]}
                    height={400}
                    showTooltip={true}
                    formatValue={(value) => formatPercent(value)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No margin data available for the selected timeframe
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ratios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  Key Financial Ratios
                </CardTitle>
              </CardHeader>
              <CardContent>
                {keyRatiosData.length > 0 ? (
                  <MultiLineChart
                    data={keyRatiosData}
                    lines={[
                      { key: 'P/E', color: '#3b82f6', name: 'P/E Ratio' },
                      { key: 'P/S', color: '#10b981', name: 'P/S Ratio' },
                      { key: 'P/FCF', color: '#f59e0b', name: 'P/FCF Ratio' },
                      { key: 'P/OCF', color: '#ef4444', name: 'P/OCF Ratio' },
                      { key: 'ROE', color: '#8b5cf6', name: 'ROE' },
                      { key: 'ROIC', color: '#06b6d4', name: 'ROIC' }
                    ]}
                    height={400}
                    showTooltip={true}
                    formatValue={(value) => formatNumber(value)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No ratios data available for the selected timeframe
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Analysis Grid */}
      <AIAnalysisGrid 
        ticker={ticker} 
        financialData={financialDataArray}
        newsData={news || []}
      />
    </div>
  );
};

export default StockDetail;
