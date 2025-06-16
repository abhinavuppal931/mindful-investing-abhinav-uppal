import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TimeframeToggle } from '@/components/ui/timeframe-toggle';
import { TotalChangeIndicator } from '@/components/ui/total-change-indicator';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { fmpAPI } from '@/services/api';
import CompanyOverview from './CompanyOverview';

interface StockDetailProps {
  ticker: string;
  companyName: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockData, setStockData] = useState<any>(null);
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [balanceSheetData, setBalanceSheetData] = useState<any[]>([]);
  const [ratiosData, setRatiosData] = useState<any[]>([]);
  const [metricsData, setMetricsData] = useState<any[]>([]);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [productSegmentationData, setProductSegmentationData] = useState<any[]>([]);
  const [geographicSegmentationData, setGeographicSegmentationData] = useState<any[]>([]);
  const [period, setPeriod] = useState<'annual' | 'quarterly'>('annual');
  const [timeframe, setTimeframe] = useState('10Y');
  const [activeMetric, setActiveMetric] = useState({
    price: 'price',
    revenue: 'revenue',
    profitability: 'netIncome',
    expenses: 'operatingExpenses',
    cashFlow: 'operatingCashFlow',
    cashDebt: 'totalCash',
    margins: 'netProfitMargin',
    ratios: 'pe'
  });

  const timeframeOptions = [
    { value: '1Y', label: '1Y' },
    { value: '3Y', label: '3Y' },
    { value: '5Y', label: '5Y' },
    { value: '10Y', label: '10Y' }
  ];

  const metricColors = {
    price: '#3b82f6',
    revenue: '#22c55e',
    revenueGrowth: '#16a34a',
    netIncome: '#3b82f6',
    ebitda: '#22c55e',
    eps: '#8b5cf6',
    operatingExpenses: '#ef4444',
    researchAndDevelopmentExpenses: '#f97316',
    sellingGeneralAndAdministrativeExpenses: '#84cc16',
    operatingCashFlow: '#06b6d4',
    freeCashFlow: '#22c55e',
    capitalExpenditure: '#ef4444',
    freeCashFlowYield: '#8b5cf6',
    totalCash: '#22c55e',
    totalDebt: '#ef4444',
    netDebt: '#f97316',
    grossProfitMargin: '#22c55e',
    operatingMargin: '#3b82f6',
    netProfitMargin: '#8b5cf6',
    pe: '#3b82f6',
    ps: '#22c55e',
    pb: '#f97316',
    roe: '#8b5cf6',
    roic: '#ef4444',
    currentRatio: '#06b6d4',
    debtToEquity: '#f59e0b'
  };

  const getTimeframeLimit = (timeframe: string) => {
    switch (timeframe) {
      case '1Y': return 1;
      case '3Y': return 3;
      case '5Y': return 5;
      case '10Y': return 10;
      default: return 10;
    }
  };

  const getMetricData = (metricKey: string, data: any[]) => {
    const limit = getTimeframeLimit(timeframe);
    const limitedData = data.slice(0, limit);
    if (limitedData.length === 0) return [];
    return limitedData.map(item => ({
      year: new Date(item.date).getFullYear(),
      [metricKey]: item[metricKey] || 0
    })).reverse();
  };

  const getTotalChange = (data: any[], metricKey: string) => {
    if (data.length < 2) return { startValue: 0, endValue: 0 };
    return {
      startValue: data[0][metricKey] || 0,
      endValue: data[data.length - 1][metricKey] || 0
    };
  };

  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      setError(null);
      try {
        const limit = getTimeframeLimit(timeframe);
        const [quote, profile, income, cashFlow, balance] = await Promise.all([
          fmpAPI.getQuote(ticker),
          fmpAPI.getProfile(ticker),
          fmpAPI.getFinancials(ticker, period, 'income', limit),
          fmpAPI.getFinancials(ticker, period, 'cash', limit),
          fmpAPI.getFinancials(ticker, period, 'balance', limit),
        ]);
        if (quote && quote.length > 0 && profile && profile.length > 0) {
          setStockData({ ...quote[0], ...profile[0] });
        }
        setIncomeData(income || []);
        setCashFlowData(cashFlow || []);
        setBalanceSheetData(balance || []);
        let ratios, metrics;
        if (period === 'annual') {
          [ratios, metrics] = await Promise.all([
            fmpAPI.getRatios(ticker, period, limit),
            fmpAPI.getMetrics(ticker, period, limit),
          ]);
        } else {
          [ratios, metrics] = await Promise.all([
            fmpAPI.getRatiosTTMStable(ticker),
            fmpAPI.getMetricsTTMStable(ticker),
          ]);
        }
        setRatiosData(ratios || []);
        setMetricsData(metrics || []);
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        const today = new Date();
        const historicalData = await fmpAPI.getHistoricalChart(
          ticker,
          fiveYearsAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        if (historicalData && historicalData.length > 0) {
          const yearlyPrices = historicalData.reduce((acc: any, item: any) => {
            const year = new Date(item.date).getFullYear();
            if (!acc[year] || new Date(item.date) > new Date(acc[year].date)) {
              acc[year] = item;
            }
            return acc;
          }, {});
          const priceChartData = Object.values(yearlyPrices)
            .map((item: any) => ({
              year: new Date(item.date).getFullYear(),
              price: parseFloat(item.close)
            }))
            .sort((a, b) => a.year - b.year)
            .slice(-limit);
          setPriceData(priceChartData);
        }
        try {
          const [productSeg, geoSeg] = await Promise.all([
            fmpAPI.getRevenueProductSegmentation(ticker, 'annual'),
            fmpAPI.getRevenueGeographicSegmentation(ticker, 'annual')
          ]);
          setProductSegmentationData(productSeg || []);
          setGeographicSegmentationData(geoSeg || []);
        } catch (segError) {
          console.warn('Segmentation data not available for', ticker);
        }
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to fetch stock data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (ticker) {
      fetchStockData();
    }
  }, [ticker, period, timeframe]);

  const formatCurrency = (value: number, decimals = 0) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(decimals)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(decimals)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(decimals)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(decimals)}K`;
    return `$${value.toFixed(decimals)}`;
  };

  const formatNumber = (value: number, decimals = 2) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(decimals)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`;
    return value.toFixed(decimals);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatYAxis = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(0)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`Year: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${
                entry.name.includes('Yield') || entry.name.includes('Margin') || entry.name.includes('ROE') || entry.name.includes('ROIC')
                  ? formatPercentage(entry.value)
                  : entry.name.includes('$') || entry.dataKey.includes('cash') || entry.dataKey.includes('revenue') || entry.dataKey.includes('income') || entry.dataKey.includes('expense') || entry.dataKey.includes('flow') || entry.dataKey.includes('price') || entry.dataKey.includes('debt') || entry.dataKey.includes('Expenses') || entry.dataKey.includes('Cash') || entry.dataKey.includes('Debt') || entry.dataKey.includes('Compensation')
                  ? formatCurrency(entry.value, 2)
                  : entry.name.includes('%') || entry.dataKey.includes('margin') || entry.dataKey.includes('yield') || entry.dataKey.includes('roe') || entry.dataKey.includes('roic')
                  ? formatPercentage(entry.value)
                  : entry.value.toFixed(2)
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const MetricButton = ({ 
    isActive, 
    onClick, 
    children, 
    color 
  }: { 
    isActive: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
    color: string;
  }) => (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={`text-xs flex items-center gap-2 ${isActive ? 'bg-mindful-600 text-white' : ''}`}
    >
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: color }}
      />
      {children}
    </Button>
  );

  if (loading) {
    return (
      <Card className="w-full max-w-7xl mx-auto">
        <CardContent className="p-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mindful-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-7xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stockData) {
    return (
      <Card className="w-full max-w-7xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center text-gray-600">
            <p>No data available for {ticker}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const companyOverviewData = {
    ticker: stockData.symbol,
    companyName: stockData.companyName,
    sector: stockData.sector,
    industry: stockData.industry,
    country: stockData.country,
    website: stockData.website,
    ipoDate: stockData.ipoDate,
    description: stockData.description,
    ceo: stockData.ceo
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <CompanyOverview profile={companyOverviewData} />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Financial Analysis</CardTitle>
            <CardDescription>Comprehensive financial metrics and charts</CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <TimeframeToggle
              value={timeframe}
              onValueChange={setTimeframe}
              options={timeframeOptions}
            />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Annual</span>
              <Switch
                checked={period === 'quarterly'}
                onCheckedChange={(checked) => setPeriod(checked ? 'quarterly' : 'annual')}
              />
              <span className="text-sm font-medium">TTM</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="price" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="price">📈 Price</TabsTrigger>
              <TabsTrigger value="revenue">📊 Revenue</TabsTrigger>
              <TabsTrigger value="profitability">💰 Profitability</TabsTrigger>
              <TabsTrigger value="expenses">💸 Expenses</TabsTrigger>
              <TabsTrigger value="cashflow">💵 Cash Flow</TabsTrigger>
              <TabsTrigger value="cashdebt">🏦 Cash & Debt</TabsTrigger>
              <TabsTrigger value="margins">📐 Margins</TabsTrigger>
              <TabsTrigger value="ratios">📋 Key Ratios</TabsTrigger>
            </TabsList>

            <TabsContent value="price" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetricButton
                  isActive={activeMetric.price === 'price'}
                  onClick={() => setActiveMetric({...activeMetric, price: 'price'})}
                  color={metricColors.price}
                >
                  Stock Price
                </MetricButton>
              </div>
              
              <ChartContainer config={{ price: { label: "Stock Price", color: metricColors.price } }} className="h-[400px]">
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="price" stroke={metricColors.price} strokeWidth={2} name="Stock Price ($)" />
                </LineChart>
              </ChartContainer>
              
              {priceData.length > 0 && (
                <TotalChangeIndicator 
                  {...getTotalChange(priceData, 'price')}
                  className="mt-4"
                />
              )}
            </TabsContent>

            <TabsContent value="revenue" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetricButton
                  isActive={activeMetric.revenue === 'revenue'}
                  onClick={() => setActiveMetric({...activeMetric, revenue: 'revenue'})}
                  color={metricColors.revenue}
                >
                  Revenue
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.revenue === 'revenueGrowth'}
                  onClick={() => setActiveMetric({...activeMetric, revenue: 'revenueGrowth'})}
                  color={metricColors.revenueGrowth}
                >
                  Revenue Growth
                </MetricButton>
              </div>

              <ChartContainer config={{
                revenue: { label: "Revenue", color: metricColors.revenue },
                revenueGrowth: { label: "Revenue Growth", color: metricColors.revenueGrowth }
              }} className="h-[400px]">
                <BarChart data={getMetricData(activeMetric.revenue, incomeData)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis 
                    tickFormatter={activeMetric.revenue === 'revenueGrowth' ? 
                      (value) => `${(value * 100).toFixed(0)}%` : formatYAxis} 
                    stroke="#6b7280" 
                  />
                  <ChartTooltip content={<CustomTooltip />} />
                  {activeMetric.revenue === 'revenue' && <Bar dataKey="revenue" fill={metricColors.revenue} name="Revenue ($)" />}
                  {activeMetric.revenue === 'revenueGrowth' && <Bar dataKey="revenueGrowth" fill={metricColors.revenueGrowth} name="Revenue Growth (%)" />}
                </BarChart>
              </ChartContainer>

              {getMetricData(activeMetric.revenue, incomeData).length > 0 && (
                <TotalChangeIndicator 
                  {...getTotalChange(getMetricData(activeMetric.revenue, incomeData), activeMetric.revenue)}
                  className="mt-4"
                />
              )}
            </TabsContent>

            <TabsContent value="profitability" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetricButton
                  isActive={activeMetric.profitability === 'netIncome'}
                  onClick={() => setActiveMetric({...activeMetric, profitability: 'netIncome'})}
                  color={metricColors.netIncome}
                >
                  Net Income
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.profitability === 'ebitda'}
                  onClick={() => setActiveMetric({...activeMetric, profitability: 'ebitda'})}
                  color={metricColors.ebitda}
                >
                  EBITDA
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.profitability === 'eps'}
                  onClick={() => setActiveMetric({...activeMetric, profitability: 'eps'})}
                  color={metricColors.eps}
                >
                  EPS
                </MetricButton>
              </div>

              <ChartContainer config={{
                netIncome: { label: "Net Income", color: metricColors.netIncome },
                ebitda: { label: "EBITDA", color: metricColors.ebitda },
                eps: { label: "EPS", color: metricColors.eps }
              }} className="h-[400px]">
                <BarChart data={getMetricData(activeMetric.profitability, incomeData)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                  <ChartTooltip content={<CustomTooltip />} />
                  {activeMetric.profitability === 'netIncome' && <Bar dataKey="netIncome" fill={metricColors.netIncome} name="Net Income ($)" />}
                  {activeMetric.profitability === 'ebitda' && <Bar dataKey="ebitda" fill={metricColors.ebitda} name="EBITDA ($)" />}
                  {activeMetric.profitability === 'eps' && <Bar dataKey="eps" fill={metricColors.eps} name="EPS ($)" />}
                </BarChart>
              </ChartContainer>

              {getMetricData(activeMetric.profitability, incomeData).length > 0 && (
                <TotalChangeIndicator 
                  {...getTotalChange(getMetricData(activeMetric.profitability, incomeData), activeMetric.profitability)}
                  className="mt-4"
                />
              )}
            </TabsContent>

            <TabsContent value="expenses" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetricButton
                  isActive={activeMetric.expenses === 'operatingExpenses'}
                  onClick={() => setActiveMetric({...activeMetric, expenses: 'operatingExpenses'})}
                  color={metricColors.operatingExpenses}
                >
                  Operating Expenses
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.expenses === 'researchAndDevelopmentExpenses'}
                  onClick={() => setActiveMetric({...activeMetric, expenses: 'researchAndDevelopmentExpenses'})}
                  color={metricColors.researchAndDevelopmentExpenses}
                >
                  R&D Expenses
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.expenses === 'sellingGeneralAndAdministrativeExpenses'}
                  onClick={() => setActiveMetric({...activeMetric, expenses: 'sellingGeneralAndAdministrativeExpenses'})}
                  color={metricColors.sellingGeneralAndAdministrativeExpenses}
                >
                  SG&A Expenses
                </MetricButton>
              </div>

              <ChartContainer config={{
                operatingExpenses: { label: "Operating Expenses", color: metricColors.operatingExpenses },
                researchAndDevelopmentExpenses: { label: "R&D Expenses", color: metricColors.researchAndDevelopmentExpenses },
                sellingGeneralAndAdministrativeExpenses: { label: "SG&A Expenses", color: metricColors.sellingGeneralAndAdministrativeExpenses }
              }} className="h-[400px]">
                <BarChart data={getMetricData(activeMetric.expenses, incomeData)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                  <ChartTooltip content={<CustomTooltip />} />
                  {activeMetric.expenses === 'operatingExpenses' && <Bar dataKey="operatingExpenses" fill={metricColors.operatingExpenses} name="Operating Expenses ($)" />}
                  {activeMetric.expenses === 'researchAndDevelopmentExpenses' && <Bar dataKey="researchAndDevelopmentExpenses" fill={metricColors.researchAndDevelopmentExpenses} name="R&D Expenses ($)" />}
                  {activeMetric.expenses === 'sellingGeneralAndAdministrativeExpenses' && <Bar dataKey="sellingGeneralAndAdministrativeExpenses" fill={metricColors.sellingGeneralAndAdministrativeExpenses} name="SG&A Expenses ($)" />}
                </BarChart>
              </ChartContainer>

              {getMetricData(activeMetric.expenses, incomeData).length > 0 && (
                <TotalChangeIndicator 
                  {...getTotalChange(getMetricData(activeMetric.expenses, incomeData), activeMetric.expenses)}
                  className="mt-4"
                />
              )}
            </TabsContent>

            <TabsContent value="cashflow" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetricButton
                  isActive={activeMetric.cashFlow === 'operatingCashFlow'}
                  onClick={() => setActiveMetric({...activeMetric, cashFlow: 'operatingCashFlow'})}
                  color={metricColors.operatingCashFlow}
                >
                  Operating Cash Flow
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.cashFlow === 'freeCashFlow'}
                  onClick={() => setActiveMetric({...activeMetric, cashFlow: 'freeCashFlow'})}
                  color={metricColors.freeCashFlow}
                >
                  Free Cash Flow
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.cashFlow === 'capitalExpenditure'}
                  onClick={() => setActiveMetric({...activeMetric, cashFlow: 'capitalExpenditure'})}
                  color={metricColors.capitalExpenditure}
                >
                  Capital Expenditure
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.cashFlow === 'freeCashFlowYield'}
                  onClick={() => setActiveMetric({...activeMetric, cashFlow: 'freeCashFlowYield'})}
                  color={metricColors.freeCashFlowYield}
                >
                  FCF Yield
                </MetricButton>
              </div>

              <ChartContainer config={{
                operatingCashFlow: { label: "Operating Cash Flow", color: metricColors.operatingCashFlow },
                freeCashFlow: { label: "Free Cash Flow", color: metricColors.freeCashFlow },
                capitalExpenditure: { label: "Capital Expenditure", color: metricColors.capitalExpenditure },
                freeCashFlowYield: { label: "FCF Yield", color: metricColors.freeCashFlowYield }
              }} className="h-[400px]">
                <BarChart data={getMetricData(activeMetric.cashFlow, activeMetric.cashFlow === 'freeCashFlowYield' ? metricsData : cashFlowData)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis 
                    tickFormatter={activeMetric.cashFlow === 'freeCashFlowYield' ? 
                      (value) => `${(value * 100).toFixed(0)}%` : formatYAxis} 
                    stroke="#6b7280" 
                  />
                  <ChartTooltip content={<CustomTooltip />} />
                  {activeMetric.cashFlow === 'operatingCashFlow' && <Bar dataKey="operatingCashFlow" fill={metricColors.operatingCashFlow} name="Operating Cash Flow ($)" />}
                  {activeMetric.cashFlow === 'freeCashFlow' && <Bar dataKey="freeCashFlow" fill={metricColors.freeCashFlow} name="Free Cash Flow ($)" />}
                  {activeMetric.cashFlow === 'capitalExpenditure' && <Bar dataKey="capitalExpenditure" fill={metricColors.capitalExpenditure} name="Capital Expenditure ($)" />}
                  {activeMetric.cashFlow === 'freeCashFlowYield' && <Bar dataKey="freeCashFlowYield" fill={metricColors.freeCashFlowYield} name="FCF Yield (%)" />}
                </BarChart>
              </ChartContainer>

              {getMetricData(activeMetric.cashFlow, activeMetric.cashFlow === 'freeCashFlowYield' ? metricsData : cashFlowData).length > 0 && (
                <TotalChangeIndicator 
                  {...getTotalChange(getMetricData(activeMetric.cashFlow, activeMetric.cashFlow === 'freeCashFlowYield' ? metricsData : cashFlowData), activeMetric.cashFlow)}
                  className="mt-4"
                />
              )}
            </TabsContent>

            <TabsContent value="cashdebt" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetricButton
                  isActive={activeMetric.cashDebt === 'totalCash'}
                  onClick={() => setActiveMetric({...activeMetric, cashDebt: 'totalCash'})}
                  color={metricColors.totalCash}
                >
                  Total Cash
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.cashDebt === 'totalDebt'}
                  onClick={() => setActiveMetric({...activeMetric, cashDebt: 'totalDebt'})}
                  color={metricColors.totalDebt}
                >
                  Total Debt
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.cashDebt === 'netDebt'}
                  onClick={() => setActiveMetric({...activeMetric, cashDebt: 'netDebt'})}
                  color={metricColors.netDebt}
                >
                  Net Debt
                </MetricButton>
              </div>

              <ChartContainer config={{
                totalCash: { label: "Total Cash", color: metricColors.totalCash },
                totalDebt: { label: "Total Debt", color: metricColors.totalDebt },
                netDebt: { label: "Net Debt", color: metricColors.netDebt }
              }} className="h-[400px]">
                <BarChart data={getMetricData(activeMetric.cashDebt, balanceSheetData)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                  <ChartTooltip content={<CustomTooltip />} />
                  {activeMetric.cashDebt === 'totalCash' && <Bar dataKey="totalCash" fill={metricColors.totalCash} name="Total Cash ($)" />}
                  {activeMetric.cashDebt === 'totalDebt' && <Bar dataKey="totalDebt" fill={metricColors.totalDebt} name="Total Debt ($)" />}
                  {activeMetric.cashDebt === 'netDebt' && <Bar dataKey="netDebt" fill={metricColors.netDebt} name="Net Debt ($)" />}
                </BarChart>
              </ChartContainer>

              {getMetricData(activeMetric.cashDebt, balanceSheetData).length > 0 && (
                <TotalChangeIndicator 
                  {...getTotalChange(getMetricData(activeMetric.cashDebt, balanceSheetData), activeMetric.cashDebt)}
                  className="mt-4"
                />
              )}
            </TabsContent>

            <TabsContent value="margins" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetricButton
                  isActive={activeMetric.margins === 'grossProfitMargin'}
                  onClick={() => setActiveMetric({...activeMetric, margins: 'grossProfitMargin'})}
                  color={metricColors.grossProfitMargin}
                >
                  Gross Margin
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.margins === 'operatingMargin'}
                  onClick={() => setActiveMetric({...activeMetric, margins: 'operatingMargin'})}
                  color={metricColors.operatingMargin}
                >
                  Operating Margin
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.margins === 'netProfitMargin'}
                  onClick={() => setActiveMetric({...activeMetric, margins: 'netProfitMargin'})}
                  color={metricColors.netProfitMargin}
                >
                  Net Margin
                </MetricButton>
              </div>

              <ChartContainer config={{
                grossProfitMargin: { label: "Gross Margin", color: metricColors.grossProfitMargin },
                operatingMargin: { label: "Operating Margin", color: metricColors.operatingMargin },
                netProfitMargin: { label: "Net Margin", color: metricColors.netProfitMargin }
              }} className="h-[400px]">
                <LineChart data={getMetricData(activeMetric.margins, incomeData)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis 
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} 
                    stroke="#6b7280" 
                  />
                  <ChartTooltip content={<CustomTooltip />} />
                  {activeMetric.margins === 'grossProfitMargin' && <Line type="monotone" dataKey="grossProfitMargin" stroke={metricColors.grossProfitMargin} strokeWidth={2} name="Gross Margin (%)" />}
                  {activeMetric.margins === 'operatingMargin' && <Line type="monotone" dataKey="operatingMargin" stroke={metricColors.operatingMargin} strokeWidth={2} name="Operating Margin (%)" />}
                  {activeMetric.margins === 'netProfitMargin' && <Line type="monotone" dataKey="netProfitMargin" stroke={metricColors.netProfitMargin} strokeWidth={2} name="Net Margin (%)" />}
                </LineChart>
              </ChartContainer>

              {getMetricData(activeMetric.margins, incomeData).length > 0 && (
                <TotalChangeIndicator 
                  {...getTotalChange(getMetricData(activeMetric.margins, incomeData), activeMetric.margins)}
                  className="mt-4"
                />
              )}
            </TabsContent>

            <TabsContent value="ratios" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetricButton
                  isActive={activeMetric.ratios === 'pe'}
                  onClick={() => setActiveMetric({...activeMetric, ratios: 'pe'})}
                  color={metricColors.pe}
                >
                  P/E Ratio
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.ratios === 'ps'}
                  onClick={() => setActiveMetric({...activeMetric, ratios: 'ps'})}
                  color={metricColors.ps}
                >
                  P/S Ratio
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.ratios === 'pb'}
                  onClick={() => setActiveMetric({...activeMetric, ratios: 'pb'})}
                  color={metricColors.pb}
                >
                  P/B Ratio
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.ratios === 'roe'}
                  onClick={() => setActiveMetric({...activeMetric, ratios: 'roe'})}
                  color={metricColors.roe}
                >
                  ROE
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.ratios === 'roic'}
                  onClick={() => setActiveMetric({...activeMetric, ratios: 'roic'})}
                  color={metricColors.roic}
                >
                  ROIC
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.ratios === 'currentRatio'}
                  onClick={() => setActiveMetric({...activeMetric, ratios: 'currentRatio'})}
                  color={metricColors.currentRatio}
                >
                  Current Ratio
                </MetricButton>
                <MetricButton
                  isActive={activeMetric.ratios === 'debtToEquity'}
                  onClick={() => setActiveMetric({...activeMetric, ratios: 'debtToEquity'})}
                  color={metricColors.debtToEquity}
                >
                  Debt/Equity
                </MetricButton>
              </div>

              <ChartContainer config={{
                pe: { label: "P/E Ratio", color: metricColors.pe },
                ps: { label: "P/S Ratio", color: metricColors.ps },
                pb: { label: "P/B Ratio", color: metricColors.pb },
                roe: { label: "ROE", color: metricColors.roe },
                roic: { label: "ROIC", color: metricColors.roic },
                currentRatio: { label: "Current Ratio", color: metricColors.currentRatio },
                debtToEquity: { label: "Debt/Equity", color: metricColors.debtToEquity }
              }} className="h-[400px]">
                <LineChart data={getMetricData(activeMetric.ratios, ratiosData)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis 
                    tickFormatter={
                      (activeMetric.ratios === 'roe' || activeMetric.ratios === 'roic') ? 
                      (value) => `${(value * 100).toFixed(0)}%` : 
                      (value) => value.toFixed(1)
                    } 
                    stroke="#6b7280" 
                  />
                  <ChartTooltip content={<CustomTooltip />} />
                  {activeMetric.ratios === 'pe' && <Line type="monotone" dataKey="pe" stroke={metricColors.pe} strokeWidth={2} name="P/E Ratio" />}
                  {activeMetric.ratios === 'ps' && <Line type="monotone" dataKey="ps" stroke={metricColors.ps} strokeWidth={2} name="P/S Ratio" />}
                  {activeMetric.ratios === 'pb' && <Line type="monotone" dataKey="pb" stroke={metricColors.pb} strokeWidth={2} name="P/B Ratio" />}
                  {activeMetric.ratios === 'roe' && <Line type="monotone" dataKey="roe" stroke={metricColors.roe} strokeWidth={2} name="ROE (%)" />}
                  {activeMetric.ratios === 'roic' && <Line type="monotone" dataKey="roic" stroke={metricColors.roic} strokeWidth={2} name="ROIC (%)" />}
                  {activeMetric.ratios === 'currentRatio' && <Line type="monotone" dataKey="currentRatio" stroke={metricColors.currentRatio} strokeWidth={2} name="Current Ratio" />}
                  {activeMetric.ratios === 'debtToEquity' && <Line type="monotone" dataKey="debtToEquity" stroke={metricColors.debtToEquity} strokeWidth={2} name="Debt/Equity" />}
                </LineChart>
              </ChartContainer>

              {getMetricData(activeMetric.ratios, ratiosData).length > 0 && (
                <TotalChangeIndicator 
                  {...getTotalChange(getMetricData(activeMetric.ratios, ratiosData), activeMetric.ratios)}
                  className="mt-4"
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockDetail;
