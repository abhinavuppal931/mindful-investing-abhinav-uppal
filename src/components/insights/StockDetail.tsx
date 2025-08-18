
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Calculator, Wallet, DollarSign, Target, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { fmpAPI } from '@/services/api';
import { useStockData } from '@/hooks/useStockData';
import TodaysPriceDriver from './TodaysPriceDriver';
import CompanyOverview from './CompanyOverview';
import AIAnalysisGrid from './AIAnalysisGrid';
import StockLogo from './StockLogo';
import Analyst from './Analyst';

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

// Helper function for X-axis date formatting
const formatXAxisDate = (tickItem: any, period: string): string => {
  const date = new Date(tickItem);
  
  // For shorter timeframes (1Y and below), use monthly format
  if (period === '1Y' || period === '6months' || period === '3months' || period === '1month') {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  
  // For longer timeframes, use quarterly format with better spacing
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  const year = date.getFullYear();
  return `Q${quarter} ${year}`;
};

// Generate custom ticks for clean quarterly display
const generateQuarterlyTicks = (data: any[], period: string) => {
  if (!data || data.length === 0) return [];
  
  const firstDate = new Date(data[0].date);
  const lastDate = new Date(data[data.length - 1].date);
  
  const ticks = [];
  const current = new Date(firstDate);
  
  // Start from the beginning of the quarter
  current.setMonth(Math.floor(current.getMonth() / 3) * 3);
  current.setDate(1);
  
  while (current <= lastDate) {
    // Find the closest data point to this quarter start
    const quarterStart = new Date(current);
    let closestDataPoint = data[0];
    let minDiff = Math.abs(new Date(data[0].date).getTime() - quarterStart.getTime());
    
    for (const point of data) {
      const diff = Math.abs(new Date(point.date).getTime() - quarterStart.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestDataPoint = point;
      }
    }
    
    ticks.push(closestDataPoint.date);
    
    // Move to next quarter
    current.setMonth(current.getMonth() + 3);
  }
  
  return ticks;
};

// Custom tick formatter for price charts
const formatPriceXAxis = (tickItem: any) => {
  const date = new Date(tickItem);
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  const year = date.getFullYear();
  return `Q${quarter} ${year}`;
};

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const { quote, profile, financials, loading, error } = useStockData(ticker);
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
  
  // Segment filtering states
  const [visibleSegments, setVisibleSegments] = useState<{[key: string]: boolean}>({});
  
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

  // Load chart data when tab/metric changes (except for Today's Price Driver)
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
            console.log('Fetching product segmentation data for:', ticker);
            const segmentData = await fmpAPI.getRevenueProductSegmentation(ticker, dataType);
            console.log('Product segmentation response:', segmentData);
            
            if (segmentData && Array.isArray(segmentData) && segmentData.length > 0) {
              // Process the correct stable API response format
              const latestData = segmentData.slice(0, limit);
              data = latestData.map((item: any) => {
                const result: any = { 
                  year: item.date ? new Date(item.date).getFullYear() : 'N/A'
                };
                
                // Handle the stable API response format - data is nested in 'data' property
                if (item.data && typeof item.data === 'object') {
                  // Format: { date: "2024-12-31", data: { "Automotive": 77070000000, "Energy Generation And Storage Segment": 10086000000, "Services And Other": 10534000000 } }
                  Object.keys(item.data).forEach(key => {
                    if (typeof item.data[key] === 'number') {
                      result[key] = item.data[key];
                    }
                  });
                } else if (item.segmentValues && Array.isArray(item.segmentValues)) {
                  // Fallback format: { date: "2023-12-31", segmentValues: [{ segment: "Product A", value: 1000 }] }
                  item.segmentValues.forEach((segment: any) => {
                    if (segment.segment && segment.value !== undefined) {
                      result[segment.segment] = segment.value;
                    }
                  });
                } else if (typeof item === 'object') {
                  // Handle alternative formats
                  Object.keys(item).forEach(key => {
                    if (key !== 'date' && key !== 'year' && typeof item[key] === 'number') {
                      result[key] = item[key];
                    }
                  });
                }
                return result;
              }).reverse();
              
              console.log('Processed product segmentation data:', data);
              setRevenueSegmentData(data);
              
              // Initialize visible segments for product segments
              if (data.length > 0) {
                const segments = Object.keys(data[0]).filter(k => k !== 'year' && k !== 'date');
                const initialVisibility: {[key: string]: boolean} = {};
                segments.forEach(segment => {
                  initialVisibility[segment] = true;
                });
                setVisibleSegments(initialVisibility);
              }
            } else {
              console.log('No product segmentation data available or incorrect format');
              data = [];
            }
          } else if (metric === 'geographicSegments') {
            console.log('Fetching geographic segmentation data for:', ticker);
            const geoData = await fmpAPI.getRevenueGeographicSegmentation(ticker, dataType);
            console.log('Geographic segmentation response:', geoData);
            
            if (geoData && Array.isArray(geoData) && geoData.length > 0) {
              const latestData = geoData.slice(0, limit);
              data = latestData.map((item: any) => {
                const result: any = { 
                  year: item.date ? new Date(item.date).getFullYear() : 'N/A'
                };
                
                // Handle the stable API response format - data is nested in 'data' property
                if (item.data && typeof item.data === 'object') {
                  // Format: { date: "2024-09-28", data: { "Americas Segment": 167045000000, "Europe Segment": 101328000000, "Greater China Segment": 66952000000, "Japan Segment": 25052000000, "Rest of Asia Pacific Segment": 30658000000 } }
                  Object.keys(item.data).forEach(key => {
                    if (typeof item.data[key] === 'number') {
                      result[key] = item.data[key];
                    }
                  });
                } else if (item.segmentValues && Array.isArray(item.segmentValues)) {
                  // Fallback format
                  item.segmentValues.forEach((segment: any) => {
                    if (segment.segment && segment.value !== undefined) {
                      result[segment.segment] = segment.value;
                    }
                  });
                } else if (typeof item === 'object') {
                  Object.keys(item).forEach(key => {
                    if (key !== 'date' && key !== 'year' && typeof item[key] === 'number') {
                      result[key] = item[key];
                    }
                  });
                }
                return result;
              }).reverse();
              
              console.log('Processed geographic segmentation data:', data);
              setRevenueSegmentData(data);
              
              // Initialize visible segments for geographic segments
              if (data.length > 0) {
                const segments = Object.keys(data[0]).filter(k => k !== 'year' && k !== 'date');
                const initialVisibility: {[key: string]: boolean} = {};
                segments.forEach(segment => {
                  initialVisibility[segment] = true;
                });
                setVisibleSegments(initialVisibility);
              }
            } else {
              console.log('No geographic segmentation data available or incorrect format');
              data = [];
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
          
          // Initialize visible segments for FCF vs SBC comparison
          if (metric === 'comparison' && data.length > 0) {
            const initialVisibility: {[key: string]: boolean} = {};
            initialVisibility['freeCashFlow'] = true;
            initialVisibility['stockBasedCompensation'] = true;
            setVisibleSegments(initialVisibility);
          }
          break;

        case 'expenses':
          const expenseData = await fmpAPI.getFinancials(ticker, dataType, 'income', limit);
          data = expenseData.map((item: any) => ({
            year: new Date(item.date).getFullYear(),
            rdExpenses: item.researchAndDevelopmentExpenses || 0,
            sgaExpenses: item.sellingGeneralAndAdministrativeExpenses || 0,
            operatingExpenses: item.operatingExpenses || 0
          })).reverse();
          
          // Initialize visible segments for expenses
          if (data.length > 0) {
            const initialVisibility: {[key: string]: boolean} = {};
            initialVisibility['rdExpenses'] = true;
            initialVisibility['sgaExpenses'] = true;
            initialVisibility['operatingExpenses'] = true;
            setVisibleSegments(initialVisibility);
          }
          break;

        case 'cashDebt':
          const balanceData = await fmpAPI.getFinancials(ticker, dataType, 'balance', limit);
          data = balanceData.map((item: any) => ({
            year: new Date(item.date).getFullYear(),
            totalCash: item.cashAndCashEquivalents || 0,
            totalDebt: item.totalDebt || 0
          })).reverse();
          
          // Initialize visible segments for cash vs debt
          if (data.length > 0) {
            const initialVisibility: {[key: string]: boolean} = {};
            initialVisibility['totalCash'] = true;
            initialVisibility['totalDebt'] = true;
            setVisibleSegments(initialVisibility);
          }
          break;

        case 'margins':
          if (ratioType === 'ttm') {
            const ttmRatios = await fmpAPI.getFinancialRatiosTTM(ticker);
            data = Array.isArray(ttmRatios) ? ttmRatios.map((item: any) => ({
              year: 'TTM',
              grossMargin: item.grossProfitMargin || 0,
              operatingMargin: item.operatingProfitMargin || 0,
              netMargin: item.netProfitMargin || 0,
              ebitdaMargin: item.ebitdaMargin || 0
            })) : [ttmRatios].map((item: any) => ({
              year: 'TTM',
              grossMargin: item.grossProfitMargin || 0,
              operatingMargin: item.operatingProfitMargin || 0,
              netMargin: item.netProfitMargin || 0,
              ebitdaMargin: item.ebitdaMargin || 0
            }));
          } else {
            const ratiosForMargins = await fmpAPI.getRatios(ticker, dataType, limit);
            data = ratiosForMargins.map((item: any) => ({
              year: new Date(item.date).getFullYear(),
              grossMargin: item.grossProfitMargin || 0,
              operatingMargin: item.operatingProfitMargin || 0,
              netMargin: item.netProfitMargin || 0,
              ebitdaMargin: item.ebitdaMargin || 0
            })).reverse();
          }
          break;

        case 'ratios':
          if (ratioType === 'ttm') {
            const ttmKeyMetrics = await fmpAPI.getKeyMetricsTTM(ticker);
            data = Array.isArray(ttmKeyMetrics) ? ttmKeyMetrics.map((item: any) => ({
              year: 'TTM',
              pe: item.peRatio || 0,
              ps: item.priceToSalesRatio || 0,
              pfcf: item.priceToFreeCashFlowsRatio || 0,
              pocf: item.priceToOperatingCashFlowsRatio || 0,
              roe: item.roe || 0,
              roic: item.roic || 0
            })) : [ttmKeyMetrics].map((item: any) => ({
              year: 'TTM',
              pe: item.peRatio || 0,
              ps: item.priceToSalesRatio || 0,
              pfcf: item.priceToFreeCashFlowsRatio || 0,
              pocf: item.priceToOperatingCashFlowsRatio || 0,
              roe: item.roe || 0,
              roic: item.roic || 0
            }));
          } else {
            const ratiosSource = await fmpAPI.getRatios(ticker, dataType, limit);
            data = ratiosSource.map((item: any) => ({
              year: new Date(item.date).getFullYear(),
              pe: item.priceEarningsRatio || 0,
              ps: item.priceToSalesRatio || 0,
              pfcf: item.priceToFreeCashFlowsRatio || 0,
              pocf: item.priceToOperatingCashFlowsRatio || 0,
              roe: item.returnOnEquity || 0,
              roic: item.returnOnCapitalEmployed || 0
            })).reverse();
          }
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

  // Function to toggle segment visibility
  const toggleSegmentVisibility = (segment: string) => {
    setVisibleSegments(prev => ({
      ...prev,
      [segment]: !prev[segment]
    }));
  };

  // Function to render segment legend
  const renderSegmentLegend = (segments: string[]) => {
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#10b981'];
    
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {segments.map((segment, index) => (
          <button
            key={segment}
            onClick={() => toggleSegmentVisibility(segment)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all ${
              visibleSegments[segment]
                ? 'bg-white border-2 text-gray-700 shadow-sm hover:shadow-md'
                : 'bg-gray-200 border-2 border-gray-300 text-gray-400'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${visibleSegments[segment] ? '' : 'opacity-30'}`}
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className={visibleSegments[segment] ? '' : 'line-through'}>{segment}</span>
          </button>
        ))}
      </div>
    );
  };

  // Function to render metric legend for non-segmentation charts
  const renderMetricLegend = (metrics: {key: string, name: string, color: string}[]) => {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            onClick={() => toggleSegmentVisibility(metric.key)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all ${
              visibleSegments[metric.key]
                ? 'bg-white border-2 text-gray-700 shadow-sm hover:shadow-md'
                : 'bg-gray-200 border-2 border-gray-300 text-gray-400'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${visibleSegments[metric.key] ? '' : 'opacity-30'}`}
              style={{ backgroundColor: metric.color }}
            />
            <span className={visibleSegments[metric.key] ? '' : 'line-through'}>{metric.name}</span>
          </button>
        ))}
      </div>
    );
  };

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
          No data available for this metric
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
                  // Special formatting for segmentation data (always currency values)
                  (activeTab === 'revenue' && (activeMetric.revenue === 'productSegments' || activeMetric.revenue === 'geographicSegments'))
                    ? formatCurrency(entry.value, 2)
                    : entry.name.includes('$') || entry.dataKey.includes('cash') || entry.dataKey.includes('revenue') || entry.dataKey.includes('income') || entry.dataKey.includes('expense') || entry.dataKey.includes('flow') || entry.dataKey.includes('price') || entry.dataKey.includes('debt') || entry.dataKey.includes('Expenses') || entry.dataKey.includes('Cash') || entry.dataKey.includes('Debt') || entry.dataKey.includes('Compensation')
                    ? formatCurrency(entry.value, 2)
                    : entry.name.includes('%') || entry.dataKey.includes('margin') || entry.dataKey.includes('yield') || entry.dataKey.includes('roe') || entry.dataKey.includes('roic')
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
        const quarterlyTicks = generateQuarterlyTicks(data, period);
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
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tickFormatter={formatPriceXAxis}
                  ticks={quarterlyTicks}
                  tick={{ fontSize: 12 }}
                  tickLine={true}
                  axisLine={true}
                />
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
          const keys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'year' && k !== 'date') : [];
          const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#10b981'];
          
          console.log('Rendering segmentation chart with keys:', keys, 'data:', data);
          
          if (keys.length === 0) {
            return (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No segmentation data available
              </div>
            );
          }
          
          // Filter visible keys based on segment visibility
          const visibleKeys = keys.filter(key => visibleSegments[key] !== false);
          
          return (
            <div className="space-y-4">
              {renderSegmentLegend(keys)}
              <ChartContainer config={{}} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                    <XAxis dataKey="year" stroke="#6b7280" />
                    <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                    <ChartTooltip content={<CustomTooltip />} />
                    {visibleKeys.map((key, index) => (
                      <Bar 
                        key={key} 
                        dataKey={key} 
                        stackId="segments" 
                        fill={colors[keys.indexOf(key) % colors.length]}
                        name={key}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
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
          const metrics = [
            { key: 'freeCashFlow', name: 'Free Cash Flow', color: '#22c55e' },
            { key: 'stockBasedCompensation', name: 'Stock-Based Compensation', color: '#f59e0b' }
          ];
          const visibleKeys = metrics.filter(metric => visibleSegments[metric.key] !== false);
          
          return (
            <div className="space-y-4">
              {renderMetricLegend(metrics)}
              <ChartContainer config={{}} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                    <XAxis dataKey="year" stroke="#6b7280" />
                    <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                    <ChartTooltip content={<CustomTooltip />} />
                    {visibleKeys.map((metric) => (
                      <Bar 
                        key={metric.key}
                        dataKey={metric.key} 
                        fill={metric.color} 
                        name={metric.name}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          );
        }
        return (
          <ChartContainer config={{}} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis 
                  tickFormatter={activeMetric.cashFlow === 'freeCashFlowYield' ? 
                    (value) => `${(value * 100).toFixed(0)}%` : formatYAxis} 
                  stroke="#6b7280" 
                />
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
        const expenseMetrics = [
          { key: 'rdExpenses', name: 'R&D', color: '#ef4444' },
          { key: 'sgaExpenses', name: 'Sales & Marketing', color: '#f59e0b' },
          { key: 'operatingExpenses', name: 'Operating Expenses', color: '#8b5cf6' }
        ];
        const visibleExpenseKeys = expenseMetrics.filter(metric => visibleSegments[metric.key] !== false);
        
        return (
          <div className="space-y-4">
            {renderMetricLegend(expenseMetrics)}
            <ChartContainer config={{}} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                  <ChartTooltip content={<CustomTooltip />} />
                  {visibleExpenseKeys.map((metric) => (
                    <Bar 
                      key={metric.key}
                      dataKey={metric.key} 
                      fill={metric.color} 
                      name={metric.name}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        );

      case 'cashDebt':
        const cashDebtMetrics = [
          { key: 'totalCash', name: 'Total Cash', color: '#22c55e' },
          { key: 'totalDebt', name: 'Total Debt', color: '#ef4444' }
        ];
        const visibleCashDebtKeys = cashDebtMetrics.filter(metric => visibleSegments[metric.key] !== false);
        
        return (
          <div className="space-y-4">
            {renderMetricLegend(cashDebtMetrics)}
            <ChartContainer config={{}} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                  <ChartTooltip content={<CustomTooltip />} />
                  {visibleCashDebtKeys.map((metric) => (
                    <Bar 
                      key={metric.key}
                      dataKey={metric.key} 
                      fill={metric.color} 
                      name={metric.name}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
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
                <YAxis 
                  tickFormatter={
                    (activeMetric.ratios === 'roe' || activeMetric.ratios === 'roic') ? 
                    (value) => `${(value * 100).toFixed(0)}%` : 
                    (value) => value.toFixed(1)
                  } 
                  stroke="#6b7280" 
                />
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

  const renderDynamicGrowthMetrics = (data: any[], metricKey: string) => {
    if (!data || data.length === 0) return null;

    const calculateGrowth = (periods: number) => {
      if (data.length < periods + 1) return null;
      const currentValue = data[data.length - 1][metricKey];
      const pastValue = data[data.length - 1 - periods][metricKey];
      if (currentValue === undefined || pastValue === undefined || pastValue === 0) return null;
      return ((currentValue - pastValue) / Math.abs(pastValue)) * 100;
    };

    const getPeriodsToShow = () => {
      if (dataType === 'quarterly') {
        switch (period) {
          case '1Y': return [{ periods: 3, label: '4Q' }]; // 4 quarters = index 3
          case '3Y': return [
            { periods: 3, label: '4Q' },
            { periods: 7, label: '8Q' },
            { periods: 11, label: '12Q' }
          ];
          case '5Y': return [
            { periods: 3, label: '4Q' },
            { periods: 11, label: '12Q' },
            { periods: 19, label: '20Q' }
          ];
          case '10Y': return [
            { periods: 11, label: '12Q' },
            { periods: 19, label: '20Q' },
            { periods: 39, label: '40Q' }
          ];
          default: return [];
        }
      } else {
        switch (period) {
          case '1Y': return [{ periods: 0, label: '1Y' }]; // current vs 1 year ago = index 0
          case '3Y': return [
            { periods: 0, label: '1Y' },
            { periods: 1, label: '2Y' },
            { periods: 2, label: '3Y' }
          ];
          case '5Y': return [
            { periods: 0, label: '1Y' },
            { periods: 2, label: '3Y' },
            { periods: 4, label: '5Y' }
          ];
          case '10Y': return [
            { periods: 2, label: '3Y' },
            { periods: 4, label: '5Y' },
            { periods: 9, label: '10Y' }
          ];
          default: return [];
        }
      }
    };

    const periodsToShow = getPeriodsToShow();
    
    return (
      <div className="flex justify-center items-center mt-4 gap-2">
        {periodsToShow.map(({ periods, label }) => {
          const growth = calculateGrowth(periods);
          if (growth === null || !isFinite(growth)) return null;
          
          const isPositive = growth >= 0;
          
          return (
            <div
              key={label}
              className={`
                px-3 py-1.5 rounded-full text-xs font-semibold text-white
                transition-all duration-200 ease-in-out tracking-wide leading-none
                hover:transform hover:-translate-y-0.5
                ${isPositive 
                  ? 'bg-emerald-500 shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.15)]' 
                  : 'bg-red-500 shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.15)]'
                }
              `}
            >
              {label}: {isPositive ? '+' : ''}{growth.toFixed(1)}%
            </div>
          );
        })}
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
            <div className="flex items-center space-x-3">
              <StockLogo ticker={ticker} size={40} />
              <div>
                <CardTitle className="text-2xl">{ticker}</CardTitle>
                <CardDescription>{companyName}</CardDescription>
              </div>
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

      {/* Today's Price Driver - only loads once per stock */}
      <TodaysPriceDriver ticker={ticker} financialData={financials?.slice(0, 3)} />

      {/* Global Period Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center bg-muted rounded-lg p-1">
          <Button
            variant={dataType === 'annual' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDataType('annual')}
            className="rounded-md"
          >
            Annual
          </Button>
          <Button
            variant={dataType === 'quarterly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDataType('quarterly')}
            className="rounded-md"
          >
            Quarterly
          </Button>
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
                    <SelectItem value="10Y">{dataType === 'quarterly' ? '40Q' : '10Y'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderChart()}
              {activeMetric.revenue === 'total' && renderDynamicGrowthMetrics(chartData, 'revenue')}
              {activeMetric.revenue === 'productSegments' && revenueSegmentData.length > 0 && Object.keys(revenueSegmentData[0]).filter(k => k !== 'year' && k !== 'date').map(segment => 
                renderDynamicGrowthMetrics(revenueSegmentData, segment)
              )}
              {activeMetric.revenue === 'geographicSegments' && revenueSegmentData.length > 0 && Object.keys(revenueSegmentData[0]).filter(k => k !== 'year' && k !== 'date').map(segment => 
                renderDynamicGrowthMetrics(revenueSegmentData, segment)
              )}
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
                        <SelectItem value="10Y">{dataType === 'quarterly' ? '40Q' : '10Y'}</SelectItem>
                      </SelectContent>
                </Select>
              </div>
              {renderChart()}
              {activeMetric.profitability === 'netIncome' && renderDynamicGrowthMetrics(chartData, 'netIncome')}
              {activeMetric.profitability === 'ebitda' && renderDynamicGrowthMetrics(chartData, 'ebitda')}
              {activeMetric.profitability === 'eps' && renderDynamicGrowthMetrics(chartData, 'eps')}
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
                        <SelectItem value="10Y">{dataType === 'quarterly' ? '40Q' : '10Y'}</SelectItem>
                      </SelectContent>
                </Select>
              </div>
              {renderChart()}
              {activeMetric.cashFlow === 'operatingCashFlow' && renderDynamicGrowthMetrics(chartData, 'operatingCashFlow')}
              {activeMetric.cashFlow === 'freeCashFlow' && renderDynamicGrowthMetrics(chartData, 'freeCashFlow')}
              {activeMetric.cashFlow === 'freeCashFlowPerShare' && renderDynamicGrowthMetrics(chartData, 'freeCashFlowPerShare')}
              {activeMetric.cashFlow === 'freeCashFlowYield' && renderDynamicGrowthMetrics(chartData, 'freeCashFlowYield')}
              {activeMetric.cashFlow === 'comparison' && (
                <>
                  {renderDynamicGrowthMetrics(chartData, 'freeCashFlow')}
                  {renderDynamicGrowthMetrics(chartData, 'stockBasedCompensation')}
                </>
              )}
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
                        <SelectItem value="10Y">{dataType === 'quarterly' ? '40Q' : '10Y'}</SelectItem>
                      </SelectContent>
                </Select>
              </div>
              {renderChart()}
              {chartData.length > 0 && (
                <>
                  {renderDynamicGrowthMetrics(chartData, 'rdExpenses')}
                  {renderDynamicGrowthMetrics(chartData, 'sgaExpenses')}
                  {renderDynamicGrowthMetrics(chartData, 'operatingExpenses')}
                </>
              )}
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
                        <SelectItem value="10Y">{dataType === 'quarterly' ? '40Q' : '10Y'}</SelectItem>
                      </SelectContent>
                </Select>
              </div>
              {renderChart()}
              {chartData.length > 0 && (
                <>
                  {renderDynamicGrowthMetrics(chartData, 'totalCash')}
                  {renderDynamicGrowthMetrics(chartData, 'totalDebt')}
                </>
              )}
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
                          <SelectItem value="10Y">{dataType === 'quarterly' ? '40Q' : '10Y'}</SelectItem>
                        </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              {renderChart()}
              {chartData.length > 0 && (
                <>
                  {activeMetric.margins === 'grossMargin' && renderDynamicGrowthMetrics(chartData, 'grossMargin')}
                  {activeMetric.margins === 'operatingMargin' && renderDynamicGrowthMetrics(chartData, 'operatingMargin')}
                  {activeMetric.margins === 'netMargin' && renderDynamicGrowthMetrics(chartData, 'netMargin')}
                  {activeMetric.margins === 'ebitdaMargin' && renderDynamicGrowthMetrics(chartData, 'ebitdaMargin')}
                </>
              )}
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
                        <SelectItem value="10Y">{dataType === 'quarterly' ? '40Q' : '10Y'}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              {renderChart()}
              {ratiosData.length > 0 && (
                <>
                  {activeMetric.ratios === 'pe' && renderDynamicGrowthMetrics(ratiosData, 'pe')}
                  {activeMetric.ratios === 'ps' && renderDynamicGrowthMetrics(ratiosData, 'ps')}
                  {activeMetric.ratios === 'pfcf' && renderDynamicGrowthMetrics(ratiosData, 'pfcf')}
                  {activeMetric.ratios === 'pocf' && renderDynamicGrowthMetrics(ratiosData, 'pocf')}
                  {activeMetric.ratios === 'roe' && renderDynamicGrowthMetrics(ratiosData, 'roe')}
                  {activeMetric.ratios === 'roic' && renderDynamicGrowthMetrics(ratiosData, 'roic')}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Company Overview */}
      <CompanyOverview profile={profile} />

      {/* AI Analysis Grid */}
      <AIAnalysisGrid 
        ticker={ticker} 
        financialData={financials?.slice(0, 3)} 
        newsData={[]} 
      />

      {/* Analyst Metrics */}
      <Analyst ticker={ticker} />
    </div>
  );
};

export default StockDetail;
