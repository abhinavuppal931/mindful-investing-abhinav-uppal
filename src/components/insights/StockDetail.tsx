import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, BarChart3, Building2, Info, Shield, AlertTriangle, Wind, ChevronDown, ChevronUp } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import { openaiAPI, fmpAPI } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend } from 'recharts';

interface StockDetailProps {
  ticker: string;
  companyName: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const { quote, financials, profile, loading, error } = useStockData(ticker);
  
  const [aiAnalysis, setAiAnalysis] = useState<{
    moat: any;
    risks: any;
    nearTermTailwinds: any;
    longTermTailwinds: any;
    briefInsight: any;
  }>({
    moat: null,
    risks: null,
    nearTermTailwinds: null,
    longTermTailwinds: null,
    briefInsight: null
  });

  const [expandedSections, setExpandedSections] = useState<{
    moat: boolean;
    risks: boolean;
    nearTerm: boolean;
    longTerm: boolean;
  }>({
    moat: false,
    risks: false,
    nearTerm: false,
    longTerm: false
  });

  const [loadingSections, setLoadingSections] = useState<{
    moat: boolean;
    risks: boolean;
    nearTerm: boolean;
    longTerm: boolean;
    briefInsight: boolean;
  }>({
    moat: false,
    risks: false,
    nearTerm: false,
    longTerm: false,
    briefInsight: false
  });

  const [chartToggles, setChartToggles] = useState({
    revenue: 'total',
    profitability: 'netIncome',
    cashFlow: 'freeCashFlow',
    margins: 'grossMargin',
    ratios: 'pe'
  });

  const [periodFilters, setPeriodFilters] = useState({
    revenue: 5,
    profitability: 5,
    cashFlow: 5,
    expenses: 5,
    cashdebt: 5,
    margins: 5,
    ratios: 5
  });

  const [lazyLoadedData, setLazyLoadedData] = useState<{
    [key: string]: {
      loaded: boolean;
      loading: boolean;
      data: any;
    };
  }>({});

  const [additionalData, setAdditionalData] = useState<{
    priceData: any[];
    keyMetrics: any[];
    ratios: any[];
    balanceSheet: any[];
    incomeStatement: any[];
    cashFlowStatement: any[];
    dividends: any[];
    enterpriseValues: any[];
    financialGrowth: any[];
    revenueProductSegmentation: any[];
    revenueGeographicSegmentation: any[];
  }>({
    priceData: [],
    keyMetrics: [],
    ratios: [],
    balanceSheet: [],
    incomeStatement: [],
    cashFlowStatement: [],
    dividends: [],
    enterpriseValues: [],
    financialGrowth: [],
    revenueProductSegmentation: [],
    revenueGeographicSegmentation: []
  });

  useEffect(() => {
    if (financials.length > 0) {
      fetchBriefInsight();
      fetchPriceData(); // Load price data immediately
    }
  }, [financials, ticker]);

  const fetchPriceData = async () => {
    try {
      const priceResponse = await fmpAPI.getHistoricalPrices(ticker);
      setAdditionalData(prev => ({
        ...prev,
        priceData: priceResponse?.historical?.slice(0, 252).reverse() || []
      }));
    } catch (error) {
      console.error('Failed to fetch price data:', error);
    }
  };

  const fetchTabData = async (tabKey: string) => {
    if (lazyLoadedData[tabKey]?.loaded || lazyLoadedData[tabKey]?.loading) return;

    setLazyLoadedData(prev => ({
      ...prev,
      [tabKey]: { loaded: false, loading: true, data: null }
    }));

    try {
      let dataPromises = [];
      
      switch (tabKey) {
        case 'revenue':
          dataPromises = [
            fmpAPI.getMetrics(ticker, 'annual', periodFilters.revenue),
            fmpAPI.getRatios(ticker, 'annual', periodFilters.revenue),
            fmpAPI.getFinancials(ticker, 'annual', 'income', periodFilters.revenue),
            fmpAPI.getRevenueProductSegmentation(ticker),
            fmpAPI.getRevenueGeographicSegmentation(ticker),
            fmpAPI.getFinancialGrowth(ticker, 'annual', periodFilters.revenue)
          ];
          break;
        case 'profitability':
          dataPromises = [
            fmpAPI.getFinancials(ticker, 'annual', 'income', periodFilters.profitability),
            fmpAPI.getFinancialGrowth(ticker, 'annual', periodFilters.profitability)
          ];
          break;
        case 'cashflow':
          dataPromises = [
            fmpAPI.getFinancials(ticker, 'annual', 'cash', periodFilters.cashFlow),
            fmpAPI.getMetrics(ticker, 'annual', periodFilters.cashFlow),
            fmpAPI.getFinancialGrowth(ticker, 'annual', periodFilters.cashFlow)
          ];
          break;
        case 'expenses':
          dataPromises = [
            fmpAPI.getFinancials(ticker, 'annual', 'income', periodFilters.expenses)
          ];
          break;
        case 'cashdebt':
          dataPromises = [
            fmpAPI.getFinancials(ticker, 'annual', 'balance', periodFilters.cashdebt)
          ];
          break;
        case 'margins':
          dataPromises = [
            fmpAPI.getRatios(ticker, 'annual', periodFilters.margins)
          ];
          break;
        case 'ratios':
          dataPromises = [
            fmpAPI.getRatios(ticker, 'annual', periodFilters.ratios),
            fmpAPI.getMetrics(ticker, 'annual', periodFilters.ratios)
          ];
          break;
      }

      const results = await Promise.all(dataPromises);
      
      setLazyLoadedData(prev => ({
        ...prev,
        [tabKey]: { loaded: true, loading: false, data: results }
      }));

      // Update additionalData based on results
      const updateData: any = {};
      switch (tabKey) {
        case 'revenue':
          updateData.keyMetrics = results[0] || [];
          updateData.ratios = results[1] || [];
          updateData.incomeStatement = results[2] || [];
          updateData.revenueProductSegmentation = results[3] || [];
          updateData.revenueGeographicSegmentation = results[4] || [];
          updateData.financialGrowth = results[5] || [];
          break;
        case 'profitability':
          updateData.incomeStatement = results[0] || [];
          updateData.financialGrowth = results[1] || [];
          break;
        case 'cashflow':
          updateData.cashFlowStatement = results[0] || [];
          updateData.keyMetrics = results[1] || [];
          updateData.financialGrowth = results[2] || [];
          break;
        case 'expenses':
          updateData.incomeStatement = results[0] || [];
          break;
        case 'cashdebt':
          updateData.balanceSheet = results[0] || [];
          break;
        case 'margins':
          updateData.ratios = results[0] || [];
          break;
        case 'ratios':
          updateData.ratios = results[0] || [];
          updateData.keyMetrics = results[1] || [];
          break;
      }
      
      setAdditionalData(prev => ({ ...prev, ...updateData }));

    } catch (error) {
      console.error(`Failed to fetch ${tabKey} data:`, error);
      setLazyLoadedData(prev => ({
        ...prev,
        [tabKey]: { loaded: false, loading: false, data: null }
      }));
    }
  };

  const fetchBriefInsight = async () => {
    setLoadingSections(prev => ({
      ...prev,
      briefInsight: true
    }));
    try {
      const insight = await openaiAPI.generateBriefInsight(ticker, financials.slice(0, 3));
      setAiAnalysis(prev => ({
        ...prev,
        briefInsight: insight
      }));
    } catch (error) {
      console.error('Failed to fetch brief insight:', error);
    } finally {
      setLoadingSections(prev => ({
        ...prev,
        briefInsight: false
      }));
    }
  };

  const handleSectionToggle = async (section: string) => {
    const isExpanded = expandedSections[section as keyof typeof expandedSections];
    setExpandedSections(prev => ({
      ...prev,
      [section]: !isExpanded
    }));
    if (!isExpanded && !aiAnalysis[section as keyof typeof aiAnalysis]) {
      setLoadingSections(prev => ({
        ...prev,
        [section]: true
      }));
      try {
        let analysisResult;
        switch (section) {
          case 'moat':
            analysisResult = await openaiAPI.analyzeCompanyMoat(ticker, financials.slice(0, 3));
            break;
          case 'risks':
            analysisResult = await openaiAPI.analyzeInvestmentRisks(ticker, financials.slice(0, 3), []);
            break;
          case 'nearTerm':
            analysisResult = await openaiAPI.analyzeNearTermTailwinds(ticker, financials.slice(0, 3), []);
            break;
          case 'longTerm':
            analysisResult = await openaiAPI.analyzeLongTermTailwinds(ticker, financials.slice(0, 3), []);
            break;
        }
        setAiAnalysis(prev => ({
          ...prev,
          [section === 'nearTerm' ? 'nearTermTailwinds' : section === 'longTerm' ? 'longTermTailwinds' : section]: analysisResult
        }));
      } catch (error) {
        console.error(`Failed to fetch ${section} analysis:`, error);
      } finally {
        setLoadingSections(prev => ({
          ...prev,
          [section]: false
        }));
      }
    }
  };

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000000000) {
      return `$${(value / 1000000000000).toFixed(1)}T`;
    } else if (Math.abs(value) >= 1000000000) {
      return `$${(value / 1000000000).toFixed(0)}B`;
    } else if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatAxisValue = (value: number) => {
    if (Math.abs(value) >= 1000000000) {
      return `${(value / 1000000000).toFixed(0)}B`;
    } else if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  const formatAIContent = (content: string) => {
    const cleanContent = content.replace(/###\s*/g, '') // Remove ### headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove ** bold formatting but keep text
    .replace(/\*([^*]+)\*/g, '$1') // Remove * italic formatting but keep text
    .replace(/^\s*[\*\-•]\s*/gm, '• ') // Normalize bullet points
    .trim();
    return cleanContent.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        return <li key={index} className="mb-3 text-sm text-gray-700 leading-relaxed list-none">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
            {trimmed.substring(1).trim()}
          </li>;
      } else if (trimmed.length > 0 && !trimmed.match(/^\d+\./)) {
        return <p key={index} className="mb-4 text-sm text-gray-700 leading-relaxed font-medium">
            {trimmed}
          </p>;
      }
      return null;
    }).filter(Boolean);
  };

  const renderGrowthMetrics = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const latestGrowth = data[0];
    const metrics = [{
      label: '3Y Revenue Growth',
      value: latestGrowth?.threeYRevenueGrowthPerShare
    }, {
      label: '5Y Revenue Growth',
      value: latestGrowth?.fiveYRevenueGrowthPerShare
    }, {
      label: '10Y Revenue Growth',
      value: latestGrowth?.tenYRevenueGrowthPerShare
    }, {
      label: '3Y Net Income Growth',
      value: latestGrowth?.threeYNetIncomeGrowthPerShare
    }, {
      label: '5Y Net Income Growth',
      value: latestGrowth?.fiveYNetIncomeGrowthPerShare
    }, {
      label: '10Y Net Income Growth',
      value: latestGrowth?.tenYNetIncomeGrowthPerShare
    }, {
      label: '3Y Operating CF Growth',
      value: latestGrowth?.threeYOperatingCFGrowthPerShare
    }, {
      label: '5Y Operating CF Growth',
      value: latestGrowth?.fiveYOperatingCFGrowthPerShare
    }, {
      label: '10Y Operating CF Growth',
      value: latestGrowth?.tenYOperatingCFGrowthPerShare
    }].filter(metric => metric.value !== undefined && metric.value !== null);
    return <div className="mt-6 grid grid-cols-3 gap-4">
        {metrics.map((metric, index) => <div key={index} className={`p-3 rounded-lg text-center ${metric.value >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="text-xs text-gray-600 mb-1">{metric.label}</div>
            <div className={`font-semibold ${metric.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metric.value >= 0 ? '+' : ''}{(metric.value * 100).toFixed(1)}%
            </div>
          </div>)}
      </div>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-mindful-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium">Error loading stock data</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600">No data available for {ticker}</p>
      </div>
    );
  }

  const isPositive = quote.change >= 0;
  
  // Enhanced financial data processing
  const processFinancialData = (tabKey: string) => {
    const tabData = lazyLoadedData[tabKey]?.data;
    if (!tabData) return [];

    const limit = periodFilters[tabKey as keyof typeof periodFilters];
    
    switch (tabKey) {
      case 'revenue':
        const incomeData = tabData[2] || [];
        const productSeg = tabData[3] || [];
        const geoSeg = tabData[4] || [];
        if (chartToggles.revenue === 'total') {
          return incomeData.slice(0, limit).map((income: any) => ({
            year: new Date(income.date).getFullYear(),
            revenue: income.revenue / 1000000000
          })).reverse();
        } else if (chartToggles.revenue === 'product') {
          // Process product segmentation data for stacked bar chart
          // Assuming productSeg is an array of objects with date and segment revenues
          // We will transform it into array of { year, segment1, segment2, ... }
          if (!productSeg.length) return [];
          // Extract unique segment names
          const segments = new Set<string>();
          productSeg.forEach((item: any) => {
            Object.keys(item).forEach(key => {
              if (key !== 'date') segments.add(key);
            });
          });
          const segmentArray = Array.from(segments);
          // Group by year
          const grouped: Record<string, any> = {};
          productSeg.forEach((item: any) => {
            const year = new Date(item.date).getFullYear();
            if (!grouped[year]) grouped[year] = { year };
            segmentArray.forEach(seg => {
              grouped[year][seg] = (grouped[year][seg] || 0) + (item[seg] || 0);
            });
          });
          // Convert to array and slice by limit
          const result = Object.values(grouped).sort((a, b) => b.year - a.year).slice(0, limit).reverse();
          // Convert values to billions
          return result.map((item: any) => {
            const newItem: any = { year: item.year };
            segmentArray.forEach(seg => {
              newItem[seg] = item[seg] / 1000000000;
            });
            return newItem;
          });
        } else if (chartToggles.revenue === 'geographic') {
          // Process geographic segmentation data for stacked bar chart
          if (!geoSeg.length) return [];
          const regions = new Set<string>();
          geoSeg.forEach((item: any) => {
            Object.keys(item).forEach(key => {
              if (key !== 'date') regions.add(key);
            });
          });
          const regionArray = Array.from(regions);
          const grouped: Record<string, any> = {};
          geoSeg.forEach((item: any) => {
            const year = new Date(item.date).getFullYear();
            if (!grouped[year]) grouped[year] = { year };
            regionArray.forEach(region => {
              grouped[year][region] = (grouped[year][region] || 0) + (item[region] || 0);
            });
          });
          const result = Object.values(grouped).sort((a, b) => b.year - a.year).slice(0, limit).reverse();
          return result.map((item: any) => {
            const newItem: any = { year: item.year };
            regionArray.forEach(region => {
              newItem[region] = item[region] / 1000000000;
            });
            return newItem;
          });
        }
        return [];
      
      case 'profitability':
        const profitData = tabData[0] || [];
        return profitData.slice(0, limit).map((income: any) => ({
          year: new Date(income.date).getFullYear(),
          netIncome: income.netIncome / 1000000000,
          ebitda: income.ebitda / 1000000000,
          eps: income.eps || 0
        })).reverse();

      case 'cashflow':
        const cashData = tabData[0] || [];
        const metricsData = tabData[1] || [];
        return cashData.slice(0, limit).map((cash: any, index: number) => {
          const metrics = metricsData[index] || {};
          return {
            year: new Date(cash.date).getFullYear(),
            freeCashFlow: cash.freeCashFlow / 1000000000,
            operatingCashFlow: cash.operatingCashFlow / 1000000000,
            stockBasedCompensation: cash.stockBasedCompensation ? cash.stockBasedCompensation / 1000000000 : 0,
            capitalExpenditure: Math.abs(cash.capitalExpenditure || 0) / 1000000000,
            freeCashFlowYield: (metrics.freeCashFlowYield || 0) * 100
          };
        }).reverse();

      case 'expenses':
        const expensesData = tabData[0] || [];
        return expensesData.slice(0, limit).map((income: any) => ({
          year: new Date(income.date).getFullYear(),
          researchAndDevelopment: (income.researchAndDevelopmentExpenses || 0) / 1000000000,
          salesAndMarketing: (income.sellingGeneralAndAdministrativeExpenses || 0) / 1000000000,
          operatingExpenses: (income.operatingExpenses || 0) / 1000000000
        })).reverse();

      case 'cashdebt':
        const balanceData = tabData[0] || [];
        return balanceData.slice(0, limit).map((balance: any) => ({
          year: new Date(balance.date).getFullYear(),
          totalCash: (balance.cashAndCashEquivalents || 0) / 1000000000,
          totalDebt: (balance.totalDebt || 0) / 1000000000
        })).reverse();

      case 'margins':
        const marginData = tabData[0] || [];
        return marginData.slice(0, limit).map((ratio: any) => ({
          year: new Date(ratio.date).getFullYear(),
          grossMargin: (ratio.grossProfitMargin || 0) * 100,
          operatingMargin: (ratio.operatingProfitMargin || 0) * 100,
          ebitdaMargin: (ratio.ebitdaMargin || 0) * 100,
          netProfitMargin: (ratio.netProfitMargin || 0) * 100
        })).reverse();

      case 'ratios':
        const ratioData = tabData[0] || [];
        const keyMetricsData = tabData[1] || [];
        return ratioData.slice(0, limit).map((ratio: any, index: number) => {
          const metrics = keyMetricsData[index] || {};
          return {
            year: new Date(ratio.date).getFullYear(),
            pe: ratio.priceEarningsRatio || 0,
            ps: ratio.priceToSalesRatio || 0,
            pFcf: ratio.priceToFreeCashFlowsRatio || metrics.priceToFreeCashFlowsRatio || 0,
            pOcf: ratio.priceCashFlowRatio || 0,
            roe: (ratio.returnOnEquity || 0) * 100,
            roic: (ratio.returnOnCapitalEmployed || 0) * 100
          };
        }).reverse();

      default:
        return [];
    }
  };

  // Price chart data with gradient
  const priceChartData = additionalData.priceData.map(p => ({
    date: p.date,
    price: p.close
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700">
                {entry.name}: {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{ticker}</h1>
          <p className="text-xl text-gray-600">{profile?.companyName || companyName}</p>
          {profile?.sector && <p className="text-sm text-gray-500">{profile.sector} • {profile.industry}</p>}
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center">
          <span className="text-3xl font-bold mr-3">
            ${quote.price.toFixed(2)}
          </span>
          <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight className="h-5 w-5 mr-1" /> : <ArrowDownRight className="h-5 w-5 mr-1" />}
            <span className="text-lg font-medium">
              {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changesPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Market Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(quote.marketCap)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              P/E Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quote.pe ? quote.pe.toFixed(2) : 'N/A'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <BarChart3 className="h-4 w-4 mr-1" />
              52W High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${quote.yearHigh.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <Building2 className="h-4 w-4 mr-1" />
              Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAxisValue(quote.volume)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brief Market Insight */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-blue-800">
            <Info className="h-5 w-5 mr-2" />
            Market Insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSections.briefInsight ? <div className="flex items-center justify-center h-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div> : aiAnalysis.briefInsight ? <div className="text-sm text-blue-700 leading-relaxed">
              {aiAnalysis.briefInsight.analysis}
            </div> : <p className="text-sm text-blue-600">Generating market insight...</p>}
        </CardContent>
      </Card>

      {/* Expandable AI Analysis Sections with improved formatting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitive Moat */}
        <Collapsible open={expandedSections.moat} onOpenChange={() => handleSectionToggle('moat')}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    Competitive Moat
                  </div>
                  {expandedSections.moat ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {loadingSections.moat ? <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div> : aiAnalysis.moat ? <div className="space-y-2">
                    {formatAIContent(aiAnalysis.moat.analysis)}
                  </div> : <p className="text-sm text-gray-500">Click to generate analysis</p>}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Investment Risks */}
        <Collapsible open={expandedSections.risks} onOpenChange={() => handleSectionToggle('risks')}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Investment Risks
                  </div>
                  {expandedSections.risks ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {loadingSections.risks ? <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div> : aiAnalysis.risks ? <div className="space-y-2">
                    {formatAIContent(aiAnalysis.risks.analysis)}
                  </div> : <p className="text-sm text-gray-500">Click to generate analysis</p>}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Near-term Tailwinds & Headwinds */}
        <Collapsible open={expandedSections.nearTerm} onOpenChange={() => handleSectionToggle('nearTerm')}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wind className="h-5 w-5 mr-2 text-green-600" />
                    Near-term Factors (6-12 months)
                  </div>
                  {expandedSections.nearTerm ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {loadingSections.nearTerm ? <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div> : aiAnalysis.nearTermTailwinds ? <div className="space-y-2">
                    {formatAIContent(aiAnalysis.nearTermTailwinds.analysis)}
                  </div> : <p className="text-sm text-gray-500">Click to generate analysis</p>}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Long-term Tailwinds & Headwinds */}
        <Collapsible open={expandedSections.longTerm} onOpenChange={() => handleSectionToggle('longTerm')}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wind className="h-5 w-5 mr-2 text-purple-600" />
                    Long-term Factors (2-5 years)
                  </div>
                  {expandedSections.longTerm ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {loadingSections.longTerm ? <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div> : aiAnalysis.longTermTailwinds ? <div className="space-y-2">
                    {formatAIContent(aiAnalysis.longTermTailwinds.analysis)}
                  </div> : <p className="text-sm text-gray-500">Click to generate analysis</p>}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {profile?.description && <Card>
          <CardHeader>
            <CardTitle>Company Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{profile.description}</p>
            {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-2 text-mindful-600 hover:text-mindful-700">
                Visit Website <ArrowUpRight className="h-4 w-4 ml-1" />
              </a>}
          </CardContent>
        </Card>}
      
      {/* Enhanced Financial Charts */}
      <Tabs defaultValue="price" className="space-y-4" onValueChange={(value) => fetchTabData(value)}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
          <TabsTrigger value="price">Price</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="cashdebt">Cash & Debt</TabsTrigger>
          <TabsTrigger value="margins">Margins</TabsTrigger>
          <TabsTrigger value="ratios">Key Ratios</TabsTrigger>
        </TabsList>

        {/* Price Chart - Enhanced */}
        <TabsContent value="price">
          <Card>
            <CardHeader>
              <CardTitle>Stock Price Movement</CardTitle>
              <CardDescription>Historical price trend over the last year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceChartData}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatCurrency} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#0ea5e9" 
                      strokeWidth={2}
                      fill="url(#priceGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Chart - Enhanced with Segmentation */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>Revenue growth and segmentation analysis</CardDescription>
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button
                    variant={chartToggles.revenue === 'total' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, revenue: 'total' }))}
                  >
                    Total Revenue
                  </Button>
                  <Button
                    variant={chartToggles.revenue === 'product' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, revenue: 'product' }))}
                  >
                    Product Segments
                  </Button>
                  <Button
                    variant={chartToggles.revenue === 'geographic' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, revenue: 'geographic' }))}
                  >
                    Geographic Segments
                  </Button>
                </div>
                <Select
                  value={periodFilters.revenue.toString()}
                  onValueChange={(value) => setPeriodFilters(prev => ({ ...prev, revenue: parseInt(value) }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1Y</SelectItem>
                    <SelectItem value="3">3Y</SelectItem>
                    <SelectItem value="5">5Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {lazyLoadedData.revenue?.loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mindful-600"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartToggles.revenue === 'total' ? (
                      <BarChart data={processFinancialData('revenue')}>
                        <XAxis dataKey="year" axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={formatAxisValue} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" fill="#10b981" name="Revenue ($B)" />
                      </BarChart>
                    ) : (
                      <BarChart data={processFinancialData('revenue')}>
                        <XAxis dataKey="year" axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={formatAxisValue} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        {chartToggles.revenue === 'product' && additionalData.revenueProductSegmentation.length > 0 && Object.keys(additionalData.revenueProductSegmentation[0]).filter(k => k !== 'year').map((key) => (
                          <Bar key={key} dataKey={key} stackId="a" name={key} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                        ))}
                        {chartToggles.revenue === 'geographic' && additionalData.revenueGeographicSegmentation.length > 0 && Object.keys(additionalData.revenueGeographicSegmentation[0]).filter(k => k !== 'year').map((key) => (
                          <Bar key={key} dataKey={key} stackId="a" name={key} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                        ))}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
              {renderGrowthMetrics(additionalData.financialGrowth)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profitability Chart - Enhanced as Bar Charts */}
        <TabsContent value="profitability">
          <Card>
            <CardHeader>
              <CardTitle>Profitability Metrics</CardTitle>
              <CardDescription>Financial performance over time</CardDescription>
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button
                    variant={chartToggles.profitability === 'netIncome' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, profitability: 'netIncome' }))}
                  >
                    Net Income
                  </Button>
                  <Button
                    variant={chartToggles.profitability === 'ebitda' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, profitability: 'ebitda' }))}
                  >
                    EBITDA
                  </Button>
                  <Button
                    variant={chartToggles.profitability === 'eps' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, profitability: 'eps' }))}
                  >
                    EPS
                  </Button>
                </div>
                <Select
                  value={periodFilters.profitability.toString()}
                  onValueChange={(value) => setPeriodFilters(prev => ({ ...prev, profitability: parseInt(value) }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1Y</SelectItem>
                    <SelectItem value="3">3Y</SelectItem>
                    <SelectItem value="5">5Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {lazyLoadedData.profitability?.loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mindful-600"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processFinancialData('profitability')}>
                      <XAxis dataKey="year" axisLine={false} tickLine={false} />
                      <YAxis 
                        tickFormatter={chartToggles.profitability === 'eps' ? 
                          (value) => `$${value.toFixed(2)}` : formatAxisValue} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey={chartToggles.profitability} 
                        fill={chartToggles.profitability === 'netIncome' ? '#8b5cf6' : 
                             chartToggles.profitability === 'ebitda' ? '#06b6d4' : '#f59e0b'} 
                        name={chartToggles.profitability === 'netIncome' ? 'Net Income ($B)' :
                             chartToggles.profitability === 'ebitda' ? 'EBITDA ($B)' : 'EPS ($)'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Cash Flow Chart */}
        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Analysis</CardTitle>
              <CardDescription>Cash generation and capital allocation</CardDescription>
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button
                    variant={chartToggles.cashFlow === 'freeCashFlow' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, cashFlow: 'freeCashFlow' }))}
                  >
                    Free Cash Flow
                  </Button>
                  <Button
                    variant={chartToggles.cashFlow === 'operatingCashFlow' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, cashFlow: 'operatingCashFlow' }))}
                  >
                    Operating CF
                  </Button>
                  <Button
                    variant={chartToggles.cashFlow === 'stockBasedCompensation' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, cashFlow: 'stockBasedCompensation' }))}
                  >
                    Stock-Based Comp
                  </Button>
                  <Button
                    variant={chartToggles.cashFlow === 'capitalExpenditure' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, cashFlow: 'capitalExpenditure' }))}
                  >
                    CapEx
                  </Button>
                  <Button
                    variant={chartToggles.cashFlow === 'freeCashFlowYield' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, cashFlow: 'freeCashFlowYield' }))}
                  >
                    FCF Yield
                  </Button>
                  <Button
                    variant={chartToggles.cashFlow === 'fcfVsSbc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, cashFlow: 'fcfVsSbc' }))}
                  >
                    FCF vs SBC
                  </Button>
                </div>
                <Select
                  value={periodFilters.cashFlow.toString()}
                  onValueChange={(value) => setPeriodFilters(prev => ({ ...prev, cashFlow: parseInt(value) }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1Y</SelectItem>
                    <SelectItem value="3">3Y</SelectItem>
                    <SelectItem value="5">5Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {lazyLoadedData.cashflow?.loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mindful-600"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartToggles.cashFlow === 'fcfVsSbc' ? (
                      <BarChart data={processFinancialData('cashflow')}>
                        <XAxis dataKey="year" axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={formatAxisValue} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="freeCashFlow" fill="#22c55e" name="Free Cash Flow ($B)" />
                        <Bar dataKey="stockBasedCompensation" fill="#ef4444" name="Stock-Based Comp ($B)" />
                      </BarChart>
                    ) : (
                      <BarChart data={processFinancialData('cashflow')}>
                        <XAxis dataKey="year" axisLine={false} tickLine={false} />
                        <YAxis 
                          tickFormatter={chartToggles.cashFlow === 'freeCashFlowYield' ? 
                            (value) => `${value.toFixed(1)}%` : formatAxisValue} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey={chartToggles.cashFlow} 
                          fill="#f59e0b" 
                          name={chartToggles.cashFlow === 'freeCashFlowYield' ? 'FCF Yield (%)' : 
                               chartToggles.cashFlow + ' ($B)'}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Chart */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Operating Expenses</CardTitle>
              <CardDescription>R&D, Sales & Marketing, and Operating expenses (in billions)</CardDescription>
              <div className="flex justify-between items-center">
                <Select
                  value={periodFilters.expenses.toString()}
                  onValueChange={(value) => setPeriodFilters(prev => ({ ...prev, expenses: parseInt(value) }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1Y</SelectItem>
                    <SelectItem value="3">3Y</SelectItem>
                    <SelectItem value="5">5Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {lazyLoadedData.expenses?.loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mindful-600"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processFinancialData('expenses')}>
                      <XAxis dataKey="year" axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={formatAxisValue} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="researchAndDevelopment" fill="#ef4444" name="R&D ($B)" />
                      <Bar dataKey="salesAndMarketing" fill="#f97316" name="Sales & Marketing ($B)" />
                      <Bar dataKey="operatingExpenses" fill="#6366f1" name="Operating Expenses ($B)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash & Debt Chart */}
        <TabsContent value="cashdebt">
          <Card>
            <CardHeader>
              <CardTitle>Cash vs Debt</CardTitle>
              <CardDescription>Balance sheet cash and debt levels (in billions)</CardDescription>
              <div className="flex justify-between items-center">
                <Select
                  value={periodFilters.cashdebt.toString()}
                  onValueChange={(value) => setPeriodFilters(prev => ({ ...prev, cashdebt: parseInt(value) }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1Y</SelectItem>
                    <SelectItem value="3">3Y</SelectItem>
                    <SelectItem value="5">5Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {lazyLoadedData.cashdebt?.loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mindful-600"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processFinancialData('cashdebt')}>
                      <XAxis dataKey="year" axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={formatAxisValue} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="totalCash" fill="#22c55e" name="Total Cash ($B)" />
                      <Bar dataKey="totalDebt" fill="#dc2626" name="Total Debt ($B)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Margins Chart */}
        <TabsContent value="margins">
          <Card>
            <CardHeader>
              <CardTitle>Profit Margins</CardTitle>
              <CardDescription>Profitability margins over time (%)</CardDescription>
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button
                    variant={chartToggles.margins === 'grossMargin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, margins: 'grossMargin' }))}
                  >
                    Gross Margin
                  </Button>
                  <Button
                    variant={chartToggles.margins === 'operatingMargin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, margins: 'operatingMargin' }))}
                  >
                    Operating Margin
                  </Button>
                  <Button
                    variant={chartToggles.margins === 'ebitdaMargin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, margins: 'ebitdaMargin' }))}
                  >
                    EBITDA Margin
                  </Button>
                  <Button
                    variant={chartToggles.margins === 'netProfitMargin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, margins: 'netProfitMargin' }))}
                  >
                    Net Profit Margin
                  </Button>
                </div>
                <Select
                  value={periodFilters.margins.toString()}
                  onValueChange={(value) => setPeriodFilters(prev => ({ ...prev, margins: parseInt(value) }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1Y</SelectItem>
                    <SelectItem value="3">3Y</SelectItem>
                    <SelectItem value="5">5Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {lazyLoadedData.margins?.loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mindful-600"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processFinancialData('margins')}>
                      <XAxis dataKey="year" axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey={chartToggles.margins} 
                        stroke="#06b6d4" 
                        strokeWidth={3} 
                        dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Ratios Chart */}
        <TabsContent value="ratios">
          <Card>
            <CardHeader>
              <CardTitle>Key Financial Ratios</CardTitle>
              <CardDescription>Valuation and profitability ratios</CardDescription>
              <div className="flex justify-between items-center">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={chartToggles.ratios === 'pe' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, ratios: 'pe' }))}
                  >
                    P/E
                  </Button>
                  <Button
                    variant={chartToggles.ratios === 'ps' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, ratios: 'ps' }))}
                  >
                    P/S
                  </Button>
                  <Button
                    variant={chartToggles.ratios === 'pFcf' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, ratios: 'pFcf' }))}
                  >
                    P/FCF
                  </Button>
                  <Button
                    variant={chartToggles.ratios === 'pOcf' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, ratios: 'pOcf' }))}
                  >
                    P/OCF
                  </Button>
                  <Button
                    variant={chartToggles.ratios === 'roe' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, ratios: 'roe' }))}
                  >
                    ROE
                  </Button>
                  <Button
                    variant={chartToggles.ratios === 'roic' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartToggles(prev => ({ ...prev, ratios: 'roic' }))}
                  >
                    ROIC
                  </Button>
                </div>
                <Select
                  value={periodFilters.ratios.toString()}
                  onValueChange={(value) => setPeriodFilters(prev => ({ ...prev, ratios: parseInt(value) }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1Y</SelectItem>
                    <SelectItem value="3">3Y</SelectItem>
                    <SelectItem value="5">5Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {lazyLoadedData.ratios?.loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mindful-600"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processFinancialData('ratios')}>
                      <XAxis dataKey="year" axisLine={false} tickLine={false} />
                      <YAxis 
                        tickFormatter={['roe', 'roic'].includes(chartToggles.ratios) ? 
                          (value) => `${value.toFixed(0)}%` : (value) => value.toFixed(1)} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey={chartToggles.ratios} 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockDetail;
