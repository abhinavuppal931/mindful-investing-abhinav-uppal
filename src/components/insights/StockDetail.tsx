
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Calculator, Wallet, DollarSign, Target, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
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

// Fixed color mapping for consistent metric colors
const FIXED_METRIC_COLORS: { [key: string]: string } = {
  // Price
  'price': 'hsl(142, 76%, 36%)',
  'volume': 'hsl(221, 83%, 53%)',
  // Revenue
  'revenue': 'hsl(142, 76%, 36%)',
  // Product Segments - Tesla
  'Automotive': 'hsl(142, 76%, 36%)',
  'Energy Generation And Storage Segment': 'hsl(221, 83%, 53%)',
  'Services And Other': 'hsl(38, 92%, 50%)',
  // Product Segments - Amazon 
  'North America': 'hsl(142, 76%, 36%)',
  'International': 'hsl(221, 83%, 53%)',
  'AWS': 'hsl(38, 92%, 50%)',
  'Amazon Web Services': 'hsl(38, 92%, 50%)',
  'Advertising Services': 'hsl(262, 83%, 58%)',
  // Product Segments - Apple
  'iPhone': 'hsl(142, 76%, 36%)',
  'Mac': 'hsl(221, 83%, 53%)',
  'iPad': 'hsl(38, 92%, 50%)',
  'Wearables Home and Accessories': 'hsl(262, 83%, 58%)',
  'Services': 'hsl(346, 77%, 49%)',
  // Product Segments - Google/Alphabet
  'Google Search & Other': 'hsl(142, 76%, 36%)',
  'YouTube Ads': 'hsl(221, 83%, 53%)',
  'Google Network': 'hsl(38, 92%, 50%)',
  'Google Cloud': 'hsl(262, 83%, 58%)',
  'Other Bets': 'hsl(346, 77%, 49%)',
  // Geographic Segments
  'Americas Segment': 'hsl(142, 76%, 36%)',
  'Europe Segment': 'hsl(221, 83%, 53%)',
  'Greater China Segment': 'hsl(38, 92%, 50%)',
  'Japan Segment': 'hsl(262, 83%, 58%)',
  'Rest of Asia Pacific Segment': 'hsl(346, 77%, 49%)',
  'Asia Pacific Segment': 'hsl(346, 77%, 49%)',
  // Additional geographic variations
  'United States': 'hsl(142, 76%, 36%)',
  'China': 'hsl(221, 83%, 53%)',
  'Europe': 'hsl(38, 92%, 50%)',
  'Asia': 'hsl(262, 83%, 58%)',
  'International Segments': 'hsl(346, 77%, 49%)',
  'Other Countries': 'hsl(24, 95%, 53%)',
  // Profitability
  'netIncome': 'hsl(142, 76%, 36%)',
  'ebitda': 'hsl(221, 83%, 53%)',
  'eps': 'hsl(38, 92%, 50%)',
  // Cash Flow
  'operatingCashFlow': 'hsl(142, 76%, 36%)',
  'freeCashFlow': 'hsl(221, 83%, 53%)',
  'freeCashFlowPerShare': 'hsl(38, 92%, 50%)',
  'stockBasedCompensation': 'hsl(0, 84%, 60%)',
  'capitalExpenditure': 'hsl(271, 81%, 56%)',
  'freeCashFlowYield': 'hsl(197, 71%, 73%)',
  // Expenses
  'rdExpenses': 'hsl(142, 76%, 36%)',
  'sgaExpenses': 'hsl(221, 83%, 53%)',
  'operatingExpenses': 'hsl(38, 92%, 50%)',
  // Cash & Debt
  'totalCash': 'hsl(142, 76%, 36%)',
  'totalDebt': 'hsl(0, 84%, 60%)',
  // Margins
  'grossMargin': 'hsl(142, 76%, 36%)',
  'operatingMargin': 'hsl(221, 83%, 53%)',
  'netMargin': 'hsl(38, 92%, 50%)',
  'ebitdaMargin': 'hsl(271, 81%, 56%)',
  // Ratios
  'pe': 'hsl(142, 76%, 36%)',
  'ps': 'hsl(221, 83%, 53%)',
  'pfcf': 'hsl(38, 92%, 50%)',
  'pocf': 'hsl(0, 84%, 60%)',
  'roe': 'hsl(271, 81%, 56%)',
  'roic': 'hsl(197, 71%, 73%)'
};

// Dynamic chart configuration generator with fixed color mapping
const generateChartConfig = (data: any[], activeMetric?: string, visibleSegments?: {[key: string]: boolean}) => {
  if (!data || data.length === 0) return {};
  
  const config: any = {};
  
  // Get all possible segment keys from all data points to ensure consistent mapping
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'year' && key !== 'date') {
        allKeys.add(key);
      }
    });
  });
  
  // Generate color palette for segments that don't have fixed colors
  const defaultColors = [
    'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)', 'hsl(38, 92%, 50%)', 
    'hsl(262, 83%, 58%)', 'hsl(346, 77%, 49%)', 'hsl(24, 95%, 53%)',
    'hsl(191, 95%, 53%)', 'hsl(301, 95%, 53%)', 'hsl(60, 95%, 53%)'
  ];
  
  let colorIndex = 0;
  Array.from(allKeys).sort().forEach(key => {
    const metricName = getMetricDisplayName(key);
    let color = FIXED_METRIC_COLORS[key];
    
    // Assign default color if not in fixed mapping
    if (!color) {
      color = defaultColors[colorIndex % defaultColors.length];
      colorIndex++;
    }
    
    config[key] = {
      label: metricName,
      color: color
    };
  });
  
  return config;
};

// Helper function to get display names for metrics
const getMetricDisplayName = (key: string): string => {
  const nameMap: { [key: string]: string } = {
    // Price
    'price': 'Price',
    'volume': 'Volume',
    // Revenue
    'revenue': 'Revenue',
    'Automotive': 'Automotive',
    'Energy Generation And Storage Segment': 'Energy & Storage',
    'Services And Other': 'Services',
    // Product Segments - Amazon
    'North America': 'North America',
    'International': 'International', 
    'AWS': 'AWS',
    'Amazon Web Services': 'AWS',
    'Advertising Services': 'Advertising',
    // Product Segments - Apple
    'iPhone': 'iPhone',
    'Mac': 'Mac',
    'iPad': 'iPad',
    'Wearables Home and Accessories': 'Wearables & Accessories',
    'Services': 'Services',
    // Product Segments - Google/Alphabet
    'Google Search & Other': 'Search & Other',
    'YouTube Ads': 'YouTube Ads',
    'Google Network': 'Network',
    'Google Cloud': 'Cloud',
    'Other Bets': 'Other Bets',
    // Geographic Segments
    'Americas Segment': 'Americas',
    'Europe Segment': 'Europe',
    'Greater China Segment': 'China',
    'Japan Segment': 'Japan',
    'Rest of Asia Pacific Segment': 'Asia Pacific',
    'Asia Pacific Segment': 'Asia Pacific',
    // Additional geographic variations
    'United States': 'United States',
    'China': 'China',
    'Europe': 'Europe', 
    'Asia': 'Asia',
    'International Segments': 'International',
    'Other Countries': 'Other Countries',
    // Profitability
    'netIncome': 'Net Income',
    'ebitda': 'EBITDA',
    'eps': 'EPS',
    // Cash Flow
    'operatingCashFlow': 'Operating Cash Flow',
    'freeCashFlow': 'Free Cash Flow',
    'freeCashFlowPerShare': 'FCF Per Share',
    'stockBasedCompensation': 'Stock-Based Compensation',
    'capitalExpenditure': 'Capital Expenditure',
    'freeCashFlowYield': 'FCF Yield',
    // Expenses
    'rdExpenses': 'R&D Expenses',
    'sgaExpenses': 'SG&A Expenses',
    'operatingExpenses': 'Operating Expenses',
    // Cash & Debt
    'totalCash': 'Total Cash',
    'totalDebt': 'Total Debt',
    // Margins
    'grossMargin': 'Gross Margin',
    'operatingMargin': 'Operating Margin',
    'netMargin': 'Net Margin',
    'ebitdaMargin': 'EBITDA Margin',
    // Ratios
    'pe': 'P/E Ratio',
    'ps': 'P/S Ratio',
    'pfcf': 'P/FCF Ratio',
    'pocf': 'P/OCF Ratio',
    'roe': 'ROE',
    'roic': 'ROIC'
  };
  return nameMap[key] || key;
};

// Custom tooltip component with dark theme
const CustomTooltipContent = ({ active, payload, label, config }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-gray-800 border border-white/10 rounded-lg p-3 shadow-[0_10px_25px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <p className="text-white font-medium text-sm mb-2">{label}</p>
      {payload.map((entry: any, index: number) => {
        const metricConfig = config?.[entry.dataKey] || {};
        const color = metricConfig.color || entry.color;
        const label = metricConfig.label || entry.name || entry.dataKey;
        
        // Format value based on metric type
        const formatValue = (value: number, dataKey: string) => {
          // Margin metrics: Display as percentages
          if (dataKey.includes('margin') || dataKey.includes('Margin')) {
            return `${(value * 100).toFixed(2)}%`;
          }
          // FCF Yield: Display as percentage, remove $ prefix
          else if (dataKey === 'freeCashFlowYield') {
            return `${(value * 100).toFixed(2)}%`;
          }
          // ROE and ROIC: Display as percentages
          else if (dataKey === 'roe' || dataKey === 'roic') {
            return `${(value * 100).toFixed(2)}%`;
          }
          // Geographic Segments: Format in appropriate scale with currency prefix
          else if (dataKey.includes('Segment') || dataKey.includes('Americas') || dataKey.includes('Europe') || 
                   dataKey.includes('China') || dataKey.includes('Japan') || dataKey.includes('Asia')) {
            return formatCurrency(value, 2);
          }
          // Net Income & EBITDA: Format in appropriate scale with currency prefix
          else if (dataKey === 'netIncome' || dataKey === 'ebitda') {
            return formatCurrency(value, 2);
          }
          // Other currency metrics
          else if (dataKey === 'price' || dataKey.includes('cash') || dataKey.includes('revenue') || 
                   dataKey.includes('income') || dataKey.includes('expense') || dataKey.includes('flow') || 
                   dataKey.includes('debt') || dataKey.includes('Expenses') || dataKey.includes('Cash') || 
                   dataKey.includes('Debt') || dataKey.includes('Compensation') || dataKey.includes('Automotive') ||
                   dataKey.includes('Energy') || dataKey.includes('Services')) {
            return formatCurrency(value, 2);
          } else {
            return value.toFixed(2);
          }
        };
        
        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: color }}
            />
            <span className="text-gray-300">{label}:</span>
            <span className="text-white font-semibold" style={{ color }}>
              {formatValue(entry.value, entry.dataKey)}
            </span>
          </div>
        );
      })}
    </div>
  );
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
              // Process all available data, not limited to `limit` for complete historical coverage
              const allData = segmentData; // Use all data to avoid missing years
              data = allData.map((item: any) => {
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
                  // Handle alternative formats - includes direct segment properties
                  Object.keys(item).forEach(key => {
                    if (key !== 'date' && key !== 'year' && typeof item[key] === 'number' && item[key] > 0) {
                      result[key] = item[key];
                    }
                  });
                }
                
                // Filter out years with no segment data
                const hasSegmentData = Object.keys(result).some(key => 
                  key !== 'year' && typeof result[key] === 'number' && result[key] > 0
                );
                
                return hasSegmentData ? result : null;
              }).filter(item => item !== null).reverse().slice(0, limit);
              
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
              // Process all available data, not limited for complete historical coverage
              const allData = geoData; // Use all data to avoid missing years
              data = allData.map((item: any) => {
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
                  // Handle alternative formats - includes direct segment properties
                  Object.keys(item).forEach(key => {
                    if (key !== 'date' && key !== 'year' && typeof item[key] === 'number' && item[key] > 0) {
                      result[key] = item[key];
                    }
                  });
                }
                
                // Filter out years with no segment data
                const hasSegmentData = Object.keys(result).some(key => 
                  key !== 'year' && typeof result[key] === 'number' && result[key] > 0
                );
                
                return hasSegmentData ? result : null;
              }).filter(item => item !== null).reverse().slice(0, limit);
              
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

  // Function to render segment legend with fixed colors
  const renderSegmentLegend = (segments: string[]) => {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {segments.map((segment) => (
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
              style={{ backgroundColor: FIXED_METRIC_COLORS[segment] || 'hsl(142, 76%, 36%)' }}
            />
            <span className={visibleSegments[segment] ? '' : 'line-through'}>{getMetricDisplayName(segment)}</span>
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

    switch (activeTab) {
      case 'price':
        const quarterlyTicks = generateQuarterlyTicks(data, period);
        const priceConfig = generateChartConfig(data, activeMetric.price);
        return (
          <ChartContainer config={priceConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.05}/>
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
                <ChartTooltip content={<CustomTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                  name="Price"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'revenue':
        if (activeMetric.revenue === 'productSegments' || activeMetric.revenue === 'geographicSegments') {
          const keys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'year' && k !== 'date') : [];
          
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
          const segmentConfig = generateChartConfig(data, activeMetric.revenue, visibleSegments);
          
          return (
            <div className="space-y-4">
              {renderSegmentLegend(keys)}
              <ChartContainer config={segmentConfig} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                    <XAxis dataKey="year" stroke="#6b7280" />
                    <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                    <ChartTooltip content={<CustomTooltipContent />} />
                    {visibleKeys.map((key) => (
                      <Bar 
                        key={key} 
                        dataKey={key} 
                        stackId="segments" 
                        fill={segmentConfig[key]?.color || 'hsl(142, 76%, 36%)'}
                        name={getMetricDisplayName(key)}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          );
        }
        const revenueConfig = generateChartConfig(data, activeMetric.revenue);
        return (
          <ChartContainer config={revenueConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                <ChartTooltip content={<CustomTooltipContent />} />
                <Bar 
                  dataKey="revenue" 
                  fill={revenueConfig.revenue?.color || 'hsl(142, 76%, 36%)'} 
                  name={getMetricDisplayName('revenue')} 
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'profitability':
        const profitabilityConfig = generateChartConfig(data, activeMetric.profitability);
        return (
          <ChartContainer config={profitabilityConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                <ChartTooltip content={<CustomTooltipContent />} />
                {activeMetric.profitability === 'netIncome' && (
                  <Bar 
                    dataKey="netIncome" 
                    fill={profitabilityConfig.netIncome?.color || 'hsl(221, 83%, 53%)'} 
                    name={getMetricDisplayName('netIncome')} 
                  />
                )}
                {activeMetric.profitability === 'ebitda' && (
                  <Bar 
                    dataKey="ebitda" 
                    fill={profitabilityConfig.ebitda?.color || 'hsl(271, 81%, 56%)'} 
                    name={getMetricDisplayName('ebitda')} 
                  />
                )}
                {activeMetric.profitability === 'eps' && (
                  <Bar 
                    dataKey="eps" 
                    fill={profitabilityConfig.eps?.color || 'hsl(38, 92%, 50%)'} 
                    name={getMetricDisplayName('eps')} 
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'cashFlow':
        if (activeMetric.cashFlow === 'comparison') {
          const visibleKeys = ['freeCashFlow', 'stockBasedCompensation'].filter(key => visibleSegments[key] !== false);
          const cashFlowConfig = generateChartConfig(data, activeMetric.cashFlow, visibleSegments);
          
          return (
            <div className="space-y-4">
              {renderMetricLegend([
                { key: 'freeCashFlow', name: 'Free Cash Flow', color: cashFlowConfig.freeCashFlow?.color || 'hsl(142, 76%, 36%)' },
                { key: 'stockBasedCompensation', name: 'Stock-Based Compensation', color: cashFlowConfig.stockBasedCompensation?.color || 'hsl(38, 92%, 50%)' }
              ])}
              <ChartContainer config={cashFlowConfig} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                    <XAxis dataKey="year" stroke="#6b7280" />
                    <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                    <ChartTooltip content={<CustomTooltipContent />} />
                    {visibleKeys.map((key) => (
                      <Bar 
                        key={key}
                        dataKey={key} 
                        fill={cashFlowConfig[key]?.color || 'hsl(142, 76%, 36%)'} 
                        name={getMetricDisplayName(key)}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          );
        }
        const cashFlowSingleConfig = generateChartConfig(data, activeMetric.cashFlow);
        return (
          <ChartContainer config={cashFlowSingleConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis 
                  tickFormatter={activeMetric.cashFlow === 'freeCashFlowYield' ? 
                    (value) => `${(value * 100).toFixed(0)}%` : formatYAxis} 
                  stroke="#6b7280" 
                />
                <ChartTooltip content={<CustomTooltipContent />} />
                {activeMetric.cashFlow === 'operatingCashFlow' && (
                  <Bar 
                    dataKey="operatingCashFlow" 
                    fill={cashFlowSingleConfig.operatingCashFlow?.color || 'hsl(197, 71%, 73%)'} 
                    name={getMetricDisplayName('operatingCashFlow')} 
                  />
                )}
                {activeMetric.cashFlow === 'freeCashFlow' && (
                  <Bar 
                    dataKey="freeCashFlow" 
                    fill={cashFlowSingleConfig.freeCashFlow?.color || 'hsl(142, 76%, 36%)'} 
                    name={getMetricDisplayName('freeCashFlow')} 
                  />
                )}
                {activeMetric.cashFlow === 'freeCashFlowPerShare' && (
                  <Bar 
                    dataKey="freeCashFlowPerShare" 
                    fill={cashFlowSingleConfig.freeCashFlowPerShare?.color || 'hsl(271, 81%, 56%)'} 
                    name={getMetricDisplayName('freeCashFlowPerShare')} 
                  />
                )}
                {activeMetric.cashFlow === 'freeCashFlowYield' && (
                  <Bar 
                    dataKey="freeCashFlowYield" 
                    fill={cashFlowSingleConfig.freeCashFlowYield?.color || 'hsl(38, 92%, 50%)'} 
                    name={getMetricDisplayName('freeCashFlowYield')} 
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'expenses':
        const visibleExpenseKeys = ['rdExpenses', 'sgaExpenses', 'operatingExpenses'].filter(key => visibleSegments[key] !== false);
        const expenseConfig = generateChartConfig(data, activeMetric.expenses, visibleSegments);
        
        return (
          <div className="space-y-4">
            {renderMetricLegend([
              { key: 'rdExpenses', name: 'R&D', color: expenseConfig.rdExpenses?.color || 'hsl(0, 84%, 60%)' },
              { key: 'sgaExpenses', name: 'Sales & Marketing', color: expenseConfig.sgaExpenses?.color || 'hsl(38, 92%, 50%)' },
              { key: 'operatingExpenses', name: 'Operating Expenses', color: expenseConfig.operatingExpenses?.color || 'hsl(271, 81%, 56%)' }
            ])}
            <ChartContainer config={expenseConfig} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                  <ChartTooltip content={<CustomTooltipContent />} />
                  {visibleExpenseKeys.map((key) => (
                    <Bar 
                      key={key}
                      dataKey={key} 
                      fill={expenseConfig[key]?.color || 'hsl(0, 84%, 60%)'} 
                      name={getMetricDisplayName(key)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        );

      case 'cashDebt':
        const visibleCashDebtKeys = ['totalCash', 'totalDebt'].filter(key => visibleSegments[key] !== false);
        const cashDebtConfig = generateChartConfig(data, activeMetric.cashDebt, visibleSegments);
        
        return (
          <div className="space-y-4">
            {renderMetricLegend([
              { key: 'totalCash', name: 'Total Cash', color: cashDebtConfig.totalCash?.color || 'hsl(142, 76%, 36%)' },
              { key: 'totalDebt', name: 'Total Debt', color: cashDebtConfig.totalDebt?.color || 'hsl(0, 84%, 60%)' }
            ])}
            <ChartContainer config={cashDebtConfig} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis tickFormatter={formatYAxis} stroke="#6b7280" />
                  <ChartTooltip content={<CustomTooltipContent />} />
                  {visibleCashDebtKeys.map((key) => (
                    <Bar 
                      key={key}
                      dataKey={key} 
                      fill={cashDebtConfig[key]?.color || 'hsl(142, 76%, 36%)'} 
                      name={getMetricDisplayName(key)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        );

      case 'margins':
        const marginsConfig = generateChartConfig(data, activeMetric.margins);
        return (
          <ChartContainer config={marginsConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} stroke="#6b7280" />
                <ChartTooltip content={<CustomTooltipContent />} />
                {activeMetric.margins === 'grossMargin' && (
                  <Line 
                    type="monotone" 
                    dataKey="grossMargin" 
                    stroke={marginsConfig.grossMargin?.color || 'hsl(142, 76%, 36%)'} 
                    strokeWidth={2} 
                    name={getMetricDisplayName('grossMargin')} 
                  />
                )}
                {activeMetric.margins === 'operatingMargin' && (
                  <Line 
                    type="monotone" 
                    dataKey="operatingMargin" 
                    stroke={marginsConfig.operatingMargin?.color || 'hsl(221, 83%, 53%)'} 
                    strokeWidth={2} 
                    name={getMetricDisplayName('operatingMargin')} 
                  />
                )}
                {activeMetric.margins === 'netMargin' && (
                  <Line 
                    type="monotone" 
                    dataKey="netMargin" 
                    stroke={marginsConfig.netMargin?.color || 'hsl(271, 81%, 56%)'} 
                    strokeWidth={2} 
                    name={getMetricDisplayName('netMargin')} 
                  />
                )}
                {activeMetric.margins === 'ebitdaMargin' && (
                  <Line 
                    type="monotone" 
                    dataKey="ebitdaMargin" 
                    stroke={marginsConfig.ebitdaMargin?.color || 'hsl(38, 92%, 50%)'} 
                    strokeWidth={2} 
                    name={getMetricDisplayName('ebitdaMargin')} 
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'ratios':
        const ratiosConfig = generateChartConfig(ratiosData, activeMetric.ratios);
        return (
          <ChartContainer config={ratiosConfig} className="h-[400px] w-full">
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
                <ChartTooltip content={<CustomTooltipContent />} />
                {activeMetric.ratios === 'pe' && (
                  <Line 
                    type="monotone" 
                    dataKey="pe" 
                    stroke={ratiosConfig.pe?.color || 'hsl(221, 83%, 53%)'} 
                    strokeWidth={2} 
                    name={getMetricDisplayName('pe')} 
                  />
                )}
                {activeMetric.ratios === 'ps' && (
                  <Line 
                    type="monotone" 
                    dataKey="ps" 
                    stroke={ratiosConfig.ps?.color || 'hsl(142, 76%, 36%)'} 
                    strokeWidth={2} 
                    name={getMetricDisplayName('ps')} 
                  />
                )}
                {activeMetric.ratios === 'pfcf' && (
                  <Line 
                    type="monotone" 
                    dataKey="pfcf" 
                    stroke={ratiosConfig.pfcf?.color || 'hsl(38, 92%, 50%)'} 
                    strokeWidth={2} 
                    name={getMetricDisplayName('pfcf')} 
                  />
                )}
                {activeMetric.ratios === 'pocf' && (
                  <Line 
                    type="monotone" 
                    dataKey="pocf" 
                    stroke={ratiosConfig.pocf?.color || 'hsl(271, 81%, 56%)'} 
                    strokeWidth={2} 
                    name={getMetricDisplayName('pocf')} 
                  />
                )}
                {activeMetric.ratios === 'roe' && (
                  <Line 
                    type="monotone" 
                    dataKey="roe" 
                    stroke={ratiosConfig.roe?.color || 'hsl(0, 84%, 60%)'} 
                    strokeWidth={2} 
                    name={getMetricDisplayName('roe')} 
                  />
                )}
                {activeMetric.ratios === 'roic' && (
                  <Line 
                    type="monotone" 
                    dataKey="roic" 
                    stroke={ratiosConfig.roic?.color || 'hsl(197, 71%, 73%)'} 
                    strokeWidth={2} 
                    name={getMetricDisplayName('roic')} 
                  />
                )}
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

  // New function for grouped multi-metric display
  const renderGroupedGrowthMetrics = (data: any[], metrics: string[]) => {
    if (!data || data.length === 0 || !metrics.length) return null;

    const calculateGrowth = (metricKey: string, periods: number) => {
      if (data.length < periods + 1) return null;
      const currentValue = data[data.length - 1][metricKey];
      const pastValue = data[data.length - 1 - periods][metricKey];
      if (currentValue === undefined || pastValue === undefined || pastValue === 0) return null;
      return ((currentValue - pastValue) / Math.abs(pastValue)) * 100;
    };

    const getPeriodsToShow = () => {
      if (dataType === 'quarterly') {
        switch (period) {
          case '1Y': return [{ periods: 3, label: '4Q' }];
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
          case '1Y': return [{ periods: 0, label: '1Y' }];
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
    const formatMetricName = (key: string) => {
      const nameMap: { [key: string]: string } = {
        // Revenue segments
        'Automotive': 'Automotive',
        'Energy Generation And Storage Segment': 'Energy & Storage',
        'Services And Other': 'Services',
        // Geographic segments
        'Americas Segment': 'Americas',
        'Europe Segment': 'Europe',
        'Greater China Segment': 'China',
        'Japan Segment': 'Japan',
        'Rest of Asia Pacific Segment': 'Asia Pacific',
        // Cash flow
        'freeCashFlow': 'Free Cash Flow',
        'stockBasedCompensation': 'Stock-Based Comp',
        // Expenses
        'rdExpenses': 'R&D',
        'sgaExpenses': 'Sales & Marketing',
        'operatingExpenses': 'Operating Expenses',
        // Cash & Debt
        'totalCash': 'Total Cash',
        'totalDebt': 'Total Debt'
      };
      return nameMap[key] || key;
    };

    return (
      <div className="flex flex-wrap justify-center items-start mt-4 gap-3">
        {metrics.map((metricKey) => {
          const metricName = formatMetricName(metricKey);
          const badges = periodsToShow.map(({ periods, label }) => {
            const growth = calculateGrowth(metricKey, periods);
            if (growth === null || !isFinite(growth)) return null;
            
            const isPositive = growth >= 0;
            
            return (
              <div
                key={`${metricKey}-${label}`}
                className={`
                  px-2 py-1 rounded-full text-[10px] font-semibold text-white
                  transition-all duration-200 ease-in-out tracking-wide leading-none
                  hover:transform hover:-translate-y-0.5
                  ${isPositive 
                    ? 'bg-emerald-500 shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.15)]' 
                    : 'bg-red-500 shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.15)]'
                  }
                `}
              >
                {label} {isPositive ? '+' : ''}{growth.toFixed(1)}%
              </div>
            );
          }).filter(Boolean);

          if (badges.length === 0) return null;

          return (
            <div key={metricKey} className="bg-slate-50 rounded-lg p-3">
              <div className="text-[11px] font-semibold text-slate-600 mb-1">
                {metricName}
              </div>
              <div className="flex gap-1">
                {badges}
              </div>
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
              {activeMetric.revenue === 'productSegments' && revenueSegmentData.length > 0 && 
                renderGroupedGrowthMetrics(revenueSegmentData, Object.keys(revenueSegmentData[0]).filter(k => k !== 'year' && k !== 'date'))
              }
              {activeMetric.revenue === 'geographicSegments' && revenueSegmentData.length > 0 && 
                renderGroupedGrowthMetrics(revenueSegmentData, Object.keys(revenueSegmentData[0]).filter(k => k !== 'year' && k !== 'date'))
              }
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
              {activeMetric.cashFlow === 'comparison' && 
                renderGroupedGrowthMetrics(chartData, ['freeCashFlow', 'stockBasedCompensation'])
              }
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
              {chartData.length > 0 && 
                renderGroupedGrowthMetrics(chartData, ['rdExpenses', 'sgaExpenses', 'operatingExpenses'])
              }
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
              {chartData.length > 0 && 
                renderGroupedGrowthMetrics(chartData, ['totalCash', 'totalDebt'])
              }
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
