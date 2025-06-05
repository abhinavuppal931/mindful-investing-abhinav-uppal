
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Calculator, Wallet, DollarSign, Target } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { fmpAPI } from '@/services/api';
import { useStockData } from '@/hooks/useStockData';

interface StockDetailProps {
  ticker: string;
  companyName: string;
}

// Helper function to format currency values
const formatCurrency = (value: number, decimals = 2): string => {
  if (Math.abs(value) >= 1e12) {
    return `$${(value / 1e12).toFixed(decimals)}T`;
  } else if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(decimals)}B`;
  } else if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(decimals)}M`;
  } else {
    return `$${value.toFixed(decimals)}`;
  }
};

// Helper function for Y-axis formatting
const formatYAxis = (value: number): string => {
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(0)}B`;
  } else if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(0)}M`;
  } else {
    return `$${value.toFixed(0)}`;
  }
};

// Helper function for percentage formatting
const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const { quote, profile, loading, error } = useStockData(ticker);
  const [activeTab, setActiveTab] = useState('price');
  const [activeMetric, setActiveMetric] = useState<{[key: string]: string}>({
    revenue: 'total',
    profitability: 'netIncome',
    cashFlow: 'operatingCashFlow',
    expenses: 'operating',
    cashDebt: 'comparison',
    margins: 'grossMargin',
    ratios: 'pe'
  });
  const [period, setPeriod] = useState<'1Y' | '3Y' | '5Y' | '10Y'>('5Y');
  const [dataType, setDataType] = useState<'annual' | 'quarterly'>('annual');
  const [ratioType, setRatioType] = useState<'annual' | 'ttm'>('annual');
  
  // Data states
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState<{[key: string]: boolean}>({});
  const [ratiosData, setRatiosData] = useState<any[]>([]);
  const [metricsData, setMetricsData] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any>(null);
  const [revenueSegmentData, setRevenueSegmentData] = useState<any[]>([]);
  const [historicalPrices, setHistoricalPrices] = useState<any[]>([]);

  // Period mapping for API calls
  const getPeriodLimit = (selectedPeriod: string) => {
    switch (selectedPeriod) {
      case '1Y': return dataType === 'quarterly' ? 4 : 1;
      case '3Y': return dataType === 'quarterly' ? 12 : 3;
      case '5Y': return dataType === 'quarterly' ? 20 : 5;
      case '10Y': return dataType === 'quarterly' ? 40 : 10;
      default: return 5;
    }
  };

  // Load chart data when tab/metric changes
  useEffect(() => {
    if (activeTab !== 'price') {
      loadChartData(activeTab, activeMetric[activeTab]);
    }
  }, [activeTab, activeMetric, period, dataType, ratioType, ticker]);

  // Load price data immediately
  useEffect(() => {
    if (ticker) {
      loadPriceData();
    }
  }, [ticker, period]);

  const loadPriceData = async () => {
    setChartLoading(prev => ({ ...prev, price: true }));
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '1Y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case '3Y':
          startDate.setFullYear(endDate.getFullYear() - 3);
          break;
        case '5Y':
          startDate.setFullYear(endDate.getFullYear() - 5);
          break;
        case '10Y':
          startDate.setFullYear(endDate.getFullYear() - 10);
          break;
      }

      const data = await fmpAPI.getHistoricalChart(
        ticker,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (data && data.length > 0) {
        const formattedData = data.map((item: any) => ({
          date: item.date,
          price: parseFloat(item.close.toFixed(2)),
          volume: item.volume
        })).reverse();
        setHistoricalPrices(formattedData);
      }
    } catch (error) {
      console.error('Error loading price data:', error);
    } finally {
      setChartLoading(prev => ({ ...prev, price: false }));
    }
  };

  const loadChartData = async (tab: string, metric: string) => {
    setChartLoading(prev => ({ ...prev, [tab]: true }));
    
    try {
      const limit = getPeriodLimit(period);
      let data: any[] = [];

      switch (tab) {
        case 'revenue':
          if (metric === 'total') {
            const incomeData = await fmpAPI.getFinancials(ticker, dataType, 'income', limit);
            data = incomeData.map((item: any) => ({
              year: new Date(item.date).getFullYear(),
              revenue: item.revenue || 0
            })).reverse();
          } else if (metric === 'productSegments') {
            const segmentData = await fmpAPI.getRevenueProductSegmentation(ticker, dataType);
            if (segmentData && segmentData.length > 0) {
              // Process product segmentation data
              const latestData = segmentData.slice(0, limit);
              data = latestData.map((item: any) => {
                const result: any = { year: new Date(item.date).getFullYear() };
                if (item.data) {
                  Object.keys(item.data).forEach(key => {
                    result[key] = item.data[key] || 0;
                  });
                }
                return result;
              }).reverse();
              setRevenueSegmentData(data);
            }
          } else if (metric === 'geographicSegments') {
            const geoData = await fmpAPI.getRevenueGeographicSegmentation(ticker, dataType);
            if (geoData && geoData.length > 0) {
              const latestData = geoData.slice(0, limit);
              data = latestData.map((item: any) => {
                const result: any = { year: new Date(item.date).getFullYear() };
                if (item.data) {
                  Object.keys(item.data).forEach(key => {
                    result[key] = item.data[key] || 0;
                  });
                }
                return result;
              }).reverse();
              setRevenueSegmentData(data);
            }
          }
          break;

        case 'profitability':
          const incomeData = await fmpAPI.getFinancials(ticker, dataType, 'income', limit);
          data = incomeData.map((item: any) => ({
            year: new Date(item.date).getFullYear(),
            netIncome: item.netIncome || 0,
            ebitda: item.ebitda || 0,
            eps: item.eps || 0
          })).reverse();
          break;

        case 'cashFlow':
          const cashData = await fmpAPI.getFinancials(ticker, dataType, 'cash', limit);
          const metricsForFCF = await fmpAPI.getMetrics(ticker, dataType, limit);
          data = cashData.map((item: any, index: number) => {
            const metrics = metricsForFCF[index] || {};
            return {
              year: new Date(item.date).getFullYear(),
              operatingCashFlow: item.operatingCashFlow || 0,
              freeCashFlow: item.freeCashFlow || 0,
              freeCashFlowPerShare: metrics.freeCashFlowPerShare || 0,
              stockBasedCompensation: item.stockBasedCompensation || 0,
              capitalExpenditure: Math.abs(item.capitalExpenditure) || 0,
              freeCashFlowYield: metrics.freeCashFlowYield || 0
            };
          }).reverse();
          break;

        case 'expenses':
          const expenseData = await fmpAPI.getFinancials(ticker, dataType, 'income', limit);
          data = expenseData.map((item: any) => ({
            year: new Date(item.date).getFullYear(),
            rdExpenses: item.researchAndDevelopmentExpenses || 0,
            sgaExpenses: item.sellingGeneralAndAdministrativeExpenses || 0,
            operatingExpenses: item.operatingExpenses || 0
          })).reverse();
          break;

        case 'cashDebt':
          const balanceData = await fmpAPI.getFinancials(ticker, dataType, 'balance', limit);
          data = balanceData.map((item: any) => ({
            year: new Date(item.date).getFullYear(),
            totalCash: item.cashAndCashEquivalents || 0,
            totalDebt: item.totalDebt || 0
          })).reverse();
          break;

        case 'margins':
          const ratiosForMargins = ratioType === 'ttm' 
            ? [await fmpAPI.getRatiosTTM(ticker)]
            : await fmpAPI.getRatios(ticker, dataType, limit);
          
          data = ratiosForMargins.map((item: any) => ({
            year: ratioType === 'ttm' ? 'TTM' : new Date(item.date).getFullYear(),
            grossMargin: item.grossProfitMargin || 0,
            operatingMargin: item.operatingProfitMargin || 0,
            netMargin: item.netProfitMargin || 0,
            ebitdaMargin: item.ebitdaMargin || 0
          })).reverse();
          break;

        case 'ratios':
          const ratiosSource = ratioType === 'ttm' 
            ? [await fmpAPI.getRatiosTTM(ticker)]
            : await fmpAPI.getRatios(ticker, dataType, limit);
          
          data = ratiosSource.map((item: any) => ({
            year: ratioType === 'ttm' ? 'TTM' : new Date(item.date).getFullYear(),
            pe: item.priceEarningsRatio || 0,
            ps: item.priceToSalesRatio || 0,
            pfcf: item.priceToFreeCashFlowsRatio || 0,
            pocf: item.priceToOperatingCashFlowsRatio || 0,
            roe: item.returnOnEquity || 0,
            roic: item.returnOnCapitalEmployed || 0
          })).reverse();
          setRatiosData(data);
          break;
      }

      setChartData(data);
    } catch (error) {
      console.error(`Error loading ${tab} data:`, error);
    } finally {
      setChartLoading(prev => ({ ...prev, [tab]: false }));
    }
  };

  // Load growth data
  useEffect(() => {
    const loadGrowthData = async () => {
      try {
        const data = await fmpAPI.getFinancialGrowth(ticker, 'annual', 10);
        if (data && data.length > 0) {
          const latest = data[0];
          setGrowthData({
            revenue: {
              threeYear: latest.revenueGrowth || 0,
              fiveYear: latest.fiveYRevenueGrowthPerShare || 0,
              tenYear: latest.tenYRevenueGrowthPerShare || 0
            },
            netIncome: {
              threeYear: latest.netIncomeGrowth || 0,
              fiveYear: latest.fiveYNetIncomeGrowthPerShare || 0,
              tenYear: latest.tenYNetIncomeGrowthPerShare || 0
            },
            operatingCF: {
              threeYear: latest.operatingCashFlowGrowth || 0,
              fiveYear: latest.fiveYOperatingCFGrowthPerShare || 0,
              tenYear: latest.tenYOperatingCFGrowthPerShare || 0
            }
          });
        }
      } catch (error) {
        console.error('Error loading growth data:', error);
      }
    };

    if (ticker) {
      loadGrowthData();
    }
  }, [ticker]);

  const renderChart = () => {
    if (chartLoading[activeTab]) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    const data = activeTab === 'price' ? historicalPrices : 
                 (activeTab === 'revenue' && (activeMetric.revenue === 'productSegments' || activeMetric.revenue === 'geographicSegments')) ? revenueSegmentData : chartData;

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No data available
        </div>
      );
    }

    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
            <p className="font-medium">{label}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.name}: {
                  entry.name.includes('$') || entry.dataKey.includes('cash') || entry.dataKey.includes('revenue') || entry.dataKey.includes('income') || entry.dataKey.includes('expense') || entry.dataKey.includes('flow') || entry.dataKey.includes('price') || entry.dataKey.includes('debt')
                    ? formatCurrency(entry.value)
                    : entry.name.includes('%') || entry.dataKey.includes('margin') || entry.dataKey.includes('yield')
                    ? formatPercentage(entry.value)
                    : entry.value.toFixed(2)
                }
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    switch (activeTab) {
      case 'price':
        return (
          <ChartContainer config={{}} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                <ChartTooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                  name="Price ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'revenue':
        if (activeMetric.revenue === 'productSegments' || activeMetric.revenue === 'geographicSegments') {
          const keys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'year') : [];
          const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
          
          return (
            <ChartContainer config={{}} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                  <ChartTooltip content={<CustomTooltip />} />
                  {keys.map((key, index) => (
                    <Bar 
                      key={key} 
                      dataKey={key} 
                      stackId="segments" 
                      fill={colors[index % colors.length]}
                      name={key}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          );
        }
        return (
          <ChartContainer config={{}} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                <ChartTooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'profitability':
        return (
          <ChartContainer config={{}} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                <ChartTooltip content={<CustomTooltip />} />
                {activeMetric.profitability === 'netIncome' && <Bar dataKey="netIncome" fill="#3b82f6" name="Net Income ($)" />}
                {activeMetric.profitability === 'ebitda' && <Bar dataKey="ebitda" fill="#8b5cf6" name="EBITDA ($)" />}
                {activeMetric.profitability === 'eps' && <Bar dataKey="eps" fill="#f59e0b" name="EPS ($)" />}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'cashFlow':
        if (activeMetric.cashFlow === 'comparison') {
          return (
            <ChartContainer config={{}} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Bar dataKey="freeCashFlow" fill="#22c55e" name="Free Cash Flow ($)" />
                  <Bar dataKey="stockBasedCompensation" fill="#f59e0b" name="Stock-Based Compensation ($)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          );
        }
        return (
          <ChartContainer config={{}} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                <ChartTooltip content={<CustomTooltip />} />
                {activeMetric.cashFlow === 'operatingCashFlow' && <Bar dataKey="operatingCashFlow" fill="#06b6d4" name="Operating Cash Flow ($)" />}
                {activeMetric.cashFlow === 'freeCashFlow' && <Bar dataKey="freeCashFlow" fill="#22c55e" name="Free Cash Flow ($)" />}
                {activeMetric.cashFlow === 'freeCashFlowPerShare' && <Bar dataKey="freeCashFlowPerShare" fill="#8b5cf6" name="FCF Per Share ($)" />}
                {activeMetric.cashFlow === 'freeCashFlowYield' && <Bar dataKey="freeCashFlowYield" fill="#f59e0b" name="FCF Yield (%)" />}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'expenses':
        return (
          <ChartContainer config={{}} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                <ChartTooltip content={<CustomTooltip />} />
                <Bar dataKey="rdExpenses" fill="#ef4444" name="R&D ($)" />
                <Bar dataKey="sgaExpenses" fill="#f59e0b" name="Sales & Marketing ($)" />
                <Bar dataKey="operatingExpenses" fill="#8b5cf6" name="Operating Expenses ($)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'cashDebt':
        return (
          <ChartContainer config={{}} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                <ChartTooltip content={<CustomTooltip />} />
                <Bar dataKey="totalCash" fill="#22c55e" name="Total Cash ($)" />
                <Bar dataKey="totalDebt" fill="#ef4444" name="Total Debt ($)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'margins':
        return (
          <ChartContainer config={{}} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} stroke="#6b7280" />
                <ChartTooltip content={<CustomTooltip />} />
                {activeMetric.margins === 'grossMargin' && <Line type="monotone" dataKey="grossMargin" stroke="#22c55e" strokeWidth={2} name="Gross Margin (%)" />}
                {activeMetric.margins === 'operatingMargin' && <Line type="monotone" dataKey="operatingMargin" stroke="#3b82f6" strokeWidth={2} name="Operating Margin (%)" />}
                {activeMetric.margins === 'netMargin' && <Line type="monotone" dataKey="netMargin" stroke="#8b5cf6" strokeWidth={2} name="Net Margin (%)" />}
                {activeMetric.margins === 'ebitdaMargin' && <Line type="monotone" dataKey="ebitdaMargin" stroke="#f59e0b" strokeWidth={2} name="EBITDA Margin (%)" />}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'ratios':
        return (
          <ChartContainer config={{}} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratiosData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <ChartTooltip content={<CustomTooltip />} />
                {activeMetric.ratios === 'pe' && <Line type="monotone" dataKey="pe" stroke="#3b82f6" strokeWidth={2} name="P/E Ratio" />}
                {activeMetric.ratios === 'ps' && <Line type="monotone" dataKey="ps" stroke="#22c55e" strokeWidth={2} name="P/S Ratio" />}
                {activeMetric.ratios === 'pfcf' && <Line type="monotone" dataKey="pfcf" stroke="#f59e0b" strokeWidth={2} name="P/FCF Ratio" />}
                {activeMetric.ratios === 'pocf' && <Line type="monotone" dataKey="pocf" stroke="#8b5cf6" strokeWidth={2} name="P/OCF Ratio" />}
                {activeMetric.ratios === 'roe' && <Line type="monotone" dataKey="roe" stroke="#ef4444" strokeWidth={2} name="ROE (%)" />}
                {activeMetric.ratios === 'roic' && <Line type="monotone" dataKey="roic" stroke="#06b6d4" strokeWidth={2} name="ROIC (%)" />}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      default:
        return null;
    }
  };

  const renderGrowthMetrics = (type: 'revenue' | 'netIncome' | 'operatingCF') => {
    if (!growthData || !growthData[type]) return null;

    const data = growthData[type];
    const titles = {
      revenue: 'Revenue Growth',
      netIncome: 'Net Income Growth', 
      operatingCF: 'Operating CF Growth'
    };

    return (
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">10Y Growth</div>
          <div className={`text-sm font-medium ${data.tenYear >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.tenYear >= 0 ? '+' : ''}{(data.tenYear * 100).toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">5Y Growth</div>
          <div className={`text-sm font-medium ${data.fiveYear >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.fiveYear >= 0 ? '+' : ''}{(data.fiveYear * 100).toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">3Y Growth</div>
          <div className={`text-sm font-medium ${data.threeYear >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.threeYear >= 0 ? '+' : ''}{(data.threeYear * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            Error loading stock data: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{ticker}</CardTitle>
              <CardDescription>{companyName}</CardDescription>
            </div>
            {quote && (
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(quote.price, 2)}</div>
                <div className={`flex items-center ${quote.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {quote.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {quote.change >= 0 ? '+' : ''}{formatCurrency(quote.change, 2)} ({quote.changesPercentage >= 0 ? '+' : ''}{quote.changesPercentage.toFixed(2)}%)
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Global Period Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={dataType} onValueChange={(value: 'annual' | 'quarterly') => setDataType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Financial Metrics Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-8 w-full">
              <TabsTrigger value="price" className="flex items-center">
                <Activity className="h-4 w-4 mr-1" />
                Price
              </TabsTrigger>
              <TabsTrigger value="revenue" className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-1" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="profitability" className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Profitability
              </TabsTrigger>
              <TabsTrigger value="cashFlow" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Cash Flow
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex items-center">
                <Target className="h-4 w-4 mr-1" />
                Expenses
              </TabsTrigger>
              <TabsTrigger value="cashDebt" className="flex items-center">
                <Wallet className="h-4 w-4 mr-1" />
                Cash & Debt
              </TabsTrigger>
              <TabsTrigger value="margins" className="flex items-center">
                <PieChart className="h-4 w-4 mr-1" />
                Margins
              </TabsTrigger>
              <TabsTrigger value="ratios" className="flex items-center">
                <Calculator className="h-4 w-4 mr-1" />
                Key Ratios
              </TabsTrigger>
            </TabsList>

            {/* Price Tab */}
            <TabsContent value="price" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Historical Price Performance</h3>
                <Select value={period} onValueChange={(value: '1Y' | '3Y' | '5Y' | '10Y') => setPeriod(value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1Y">1Y</SelectItem>
                    <SelectItem value="3Y">3Y</SelectItem>
                    <SelectItem value="5Y">5Y</SelectItem>
                    <SelectItem value="10Y">10Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderChart()}
            </TabsContent>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant={activeMetric.revenue === 'total' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, revenue: 'total' }))}
                  >
                    Total Revenue
                  </Button>
                  <Button
                    variant={activeMetric.revenue === 'productSegments' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, revenue: 'productSegments' }))}
                  >
                    Product Segments
                  </Button>
                  <Button
                    variant={activeMetric.revenue === 'geographicSegments' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, revenue: 'geographicSegments' }))}
                  >
                    Geographic Segments
                  </Button>
                </div>
                <Select value={period} onValueChange={(value: '1Y' | '3Y' | '5Y' | '10Y') => setPeriod(value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1Y">{dataType === 'quarterly' ? '4Q' : '1Y'}</SelectItem>
                    <SelectItem value="3Y">{dataType === 'quarterly' ? '12Q' : '3Y'}</SelectItem>
                    <SelectItem value="5Y">{dataType === 'quarterly' ? '20Q' : '5Y'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderChart()}
              {activeMetric.revenue === 'total' && renderGrowthMetrics('revenue')}
            </TabsContent>

            {/* Profitability Tab */}
            <TabsContent value="profitability" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant={activeMetric.profitability === 'netIncome' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, profitability: 'netIncome' }))}
                  >
                    Net Income
                  </Button>
                  <Button
                    variant={activeMetric.profitability === 'ebitda' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, profitability: 'ebitda' }))}
                  >
                    EBITDA
                  </Button>
                  <Button
                    variant={activeMetric.profitability === 'eps' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, profitability: 'eps' }))}
                  >
                    EPS
                  </Button>
                </div>
                <Select value={period} onValueChange={(value: '1Y' | '3Y' | '5Y' | '10Y') => setPeriod(value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1Y">{dataType === 'quarterly' ? '4Q' : '1Y'}</SelectItem>
                    <SelectItem value="3Y">{dataType === 'quarterly' ? '12Q' : '3Y'}</SelectItem>
                    <SelectItem value="5Y">{dataType === 'quarterly' ? '20Q' : '5Y'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderChart()}
              {renderGrowthMetrics('netIncome')}
            </TabsContent>

            {/* Cash Flow Tab */}
            <TabsContent value="cashFlow" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant={activeMetric.cashFlow === 'operatingCashFlow' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, cashFlow: 'operatingCashFlow' }))}
                  >
                    Operating CF
                  </Button>
                  <Button
                    variant={activeMetric.cashFlow === 'freeCashFlow' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, cashFlow: 'freeCashFlow' }))}
                  >
                    Free CF
                  </Button>
                  <Button
                    variant={activeMetric.cashFlow === 'freeCashFlowPerShare' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, cashFlow: 'freeCashFlowPerShare' }))}
                  >
                    FCF Per Share
                  </Button>
                  <Button
                    variant={activeMetric.cashFlow === 'freeCashFlowYield' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, cashFlow: 'freeCashFlowYield' }))}
                  >
                    FCF Yield
                  </Button>
                  <Button
                    variant={activeMetric.cashFlow === 'comparison' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, cashFlow: 'comparison' }))}
                  >
                    FCF vs SBC
                  </Button>
                </div>
                <Select value={period} onValueChange={(value: '1Y' | '3Y' | '5Y' | '10Y') => setPeriod(value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1Y">{dataType === 'quarterly' ? '4Q' : '1Y'}</SelectItem>
                    <SelectItem value="3Y">{dataType === 'quarterly' ? '12Q' : '3Y'}</SelectItem>
                    <SelectItem value="5Y">{dataType === 'quarterly' ? '20Q' : '5Y'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderChart()}
              {renderGrowthMetrics('operatingCF')}
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Operating Expenses</h3>
                <Select value={period} onValueChange={(value: '1Y' | '3Y' | '5Y' | '10Y') => setPeriod(value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1Y">{dataType === 'quarterly' ? '4Q' : '1Y'}</SelectItem>
                    <SelectItem value="3Y">{dataType === 'quarterly' ? '12Q' : '3Y'}</SelectItem>
                    <SelectItem value="5Y">{dataType === 'quarterly' ? '20Q' : '5Y'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderChart()}
            </TabsContent>

            {/* Cash & Debt Tab */}
            <TabsContent value="cashDebt" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Cash vs Debt Analysis</h3>
                <Select value={period} onValueChange={(value: '1Y' | '3Y' | '5Y' | '10Y') => setPeriod(value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1Y">{dataType === 'quarterly' ? '4Q' : '1Y'}</SelectItem>
                    <SelectItem value="3Y">{dataType === 'quarterly' ? '12Q' : '3Y'}</SelectItem>
                    <SelectItem value="5Y">{dataType === 'quarterly' ? '20Q' : '5Y'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderChart()}
            </TabsContent>

            {/* Margins Tab */}
            <TabsContent value="margins" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant={activeMetric.margins === 'grossMargin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, margins: 'grossMargin' }))}
                  >
                    Gross Margin
                  </Button>
                  <Button
                    variant={activeMetric.margins === 'operatingMargin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, margins: 'operatingMargin' }))}
                  >
                    Operating Margin
                  </Button>
                  <Button
                    variant={activeMetric.margins === 'netMargin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, margins: 'netMargin' }))}
                  >
                    Net Margin
                  </Button>
                  <Button
                    variant={activeMetric.margins === 'ebitdaMargin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, margins: 'ebitdaMargin' }))}
                  >
                    EBITDA Margin
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Select value={ratioType} onValueChange={(value: 'annual' | 'ttm') => setRatioType(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="ttm">TTM</SelectItem>
                    </SelectContent>
                  </Select>
                  {ratioType === 'annual' && (
                    <Select value={period} onValueChange={(value: '1Y' | '3Y' | '5Y' | '10Y') => setPeriod(value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1Y">{dataType === 'quarterly' ? '4Q' : '1Y'}</SelectItem>
                        <SelectItem value="3Y">{dataType === 'quarterly' ? '12Q' : '3Y'}</SelectItem>
                        <SelectItem value="5Y">{dataType === 'quarterly' ? '20Q' : '5Y'}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              {renderChart()}
            </TabsContent>

            {/* Key Ratios Tab */}
            <TabsContent value="ratios" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2 flex-wrap">
                  <Button
                    variant={activeMetric.ratios === 'pe' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, ratios: 'pe' }))}
                  >
                    P/E
                  </Button>
                  <Button
                    variant={activeMetric.ratios === 'ps' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, ratios: 'ps' }))}
                  >
                    P/S
                  </Button>
                  <Button
                    variant={activeMetric.ratios === 'pfcf' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, ratios: 'pfcf' }))}
                  >
                    P/FCF
                  </Button>
                  <Button
                    variant={activeMetric.ratios === 'pocf' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, ratios: 'pocf' }))}
                  >
                    P/OCF
                  </Button>
                  <Button
                    variant={activeMetric.ratios === 'roe' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, ratios: 'roe' }))}
                  >
                    ROE
                  </Button>
                  <Button
                    variant={activeMetric.ratios === 'roic' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMetric(prev => ({ ...prev, ratios: 'roic' }))}
                  >
                    ROIC
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Select value={ratioType} onValueChange={(value: 'annual' | 'ttm') => setRatioType(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="ttm">TTM</SelectItem>
                    </SelectContent>
                  </Select>
                  {ratioType === 'annual' && (
                    <Select value={period} onValueChange={(value: '1Y' | '3Y' | '5Y' | '10Y') => setPeriod(value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1Y">{dataType === 'quarterly' ? '4Q' : '1Y'}</SelectItem>
                        <SelectItem value="3Y">{dataType === 'quarterly' ? '12Q' : '3Y'}</SelectItem>
                        <SelectItem value="5Y">{dataType === 'quarterly' ? '20Q' : '5Y'}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              {renderChart()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockDetail;
