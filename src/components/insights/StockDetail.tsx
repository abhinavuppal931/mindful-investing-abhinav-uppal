import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, BarChart3, Building2, BrainCircuit, Shield, AlertTriangle, Wind, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import { openaiAPI, fmpAPI } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell } from 'recharts';

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
    profitability: 'netIncome',
    cashFlow: 'freeCashFlow',
    margins: 'grossMargin',
    ratios: 'pe'
  });

  const [additionalData, setAdditionalData] = useState<{
    priceData: any[];
    keyMetrics: any[];
    ratios: any[];
    dividends: any[];
    enterpriseValues: any[];
    financialGrowth: any[];
  }>({
    priceData: [],
    keyMetrics: [],
    ratios: [],
    dividends: [],
    enterpriseValues: [],
    financialGrowth: []
  });

  useEffect(() => {
    if (financials.length > 0) {
      fetchBriefInsight();
      fetchAdditionalData();
    }
  }, [financials, ticker]);

  const fetchAdditionalData = async () => {
    try {
      // Fetch all additional data for comprehensive charts
      const [priceResponse, metricsResponse, ratiosResponse, dividendsResponse, enterpriseResponse, growthResponse] = await Promise.all([
        fmpAPI.getHistoricalPrices(ticker),
        fmpAPI.getMetrics(ticker, 'annual', 5),
        fmpAPI.getRatios(ticker, 'annual', 5),
        fmpAPI.getDividends(ticker),
        fmpAPI.getEnterpriseValues(ticker, 'annual', 5),
        fmpAPI.getFinancialGrowth(ticker, 'annual', 5)
      ]);

      setAdditionalData({
        priceData: priceResponse?.historical?.slice(0, 252).reverse() || [], // Last year of trading days
        keyMetrics: metricsResponse || [],
        ratios: ratiosResponse || [],
        dividends: dividendsResponse?.historical || [],
        enterpriseValues: enterpriseResponse || [],
        financialGrowth: growthResponse || []
      });
    } catch (error) {
      console.error('Failed to fetch additional data:', error);
    }
  };

  const fetchBriefInsight = async () => {
    setLoadingSections(prev => ({ ...prev, briefInsight: true }));
    try {
      const insight = await openaiAPI.generateBriefInsight(ticker, financials.slice(0, 3));
      setAiAnalysis(prev => ({ ...prev, briefInsight: insight }));
    } catch (error) {
      console.error('Failed to fetch brief insight:', error);
    } finally {
      setLoadingSections(prev => ({ ...prev, briefInsight: false }));
    }
  };

  const handleSectionToggle = async (section: string) => {
    const isExpanded = expandedSections[section as keyof typeof expandedSections];
    
    setExpandedSections(prev => ({
      ...prev,
      [section]: !isExpanded
    }));

    if (!isExpanded && !aiAnalysis[section as keyof typeof aiAnalysis]) {
      setLoadingSections(prev => ({ ...prev, [section]: true }));
      
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
        setLoadingSections(prev => ({ ...prev, [section]: false }));
      }
    }
  };

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000000000) {
      return `$${(value / 1000000000000).toFixed(2)}T`;
    } else if (Math.abs(value) >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };

  const formatNumber = (value: number) => {
    if (Math.abs(value) >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(2)}T`;
    } else if (Math.abs(value) >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else {
      return value.toLocaleString();
    }
  };

  const formatAIContent = (content: string) => {
    // Clean up the content by removing markdown symbols and formatting nicely
    const cleanContent = content
      .replace(/###\s*/g, '') // Remove ### headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove ** bold formatting but keep text
      .replace(/\*([^*]+)\*/g, '$1') // Remove * italic formatting but keep text
      .replace(/^\s*[\*\-•]\s*/gm, '• ') // Normalize bullet points
      .trim();

    return cleanContent.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        return (
          <li key={index} className="mb-3 text-sm text-gray-700 leading-relaxed list-none">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
            {trimmed.substring(1).trim()}
          </li>
        );
      } else if (trimmed.length > 0 && !trimmed.match(/^\d+\./)) {
        return (
          <p key={index} className="mb-4 text-sm text-gray-700 leading-relaxed font-medium">
            {trimmed}
          </p>
        );
      }
      return null;
    }).filter(Boolean);
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
  
  // Prepare comprehensive chart data with proper formatting
  const revenueData = financials.map(f => ({
    year: new Date(f.date).getFullYear(),
    revenue: f.revenue / 1000000,
    netIncome: f.netIncome / 1000000,
    ebitda: f.ebitda / 1000000,
    eps: f.netIncome / (quote.sharesOutstanding || 1),
    freeCashFlow: f.freeCashFlow / 1000000,
    operatingCashFlow: f.operatingCashFlow / 1000000,
    fcfPerShare: f.freeCashFlow / (quote.sharesOutstanding || 1),
    grossProfit: f.grossProfit / 1000000,
    operatingIncome: f.operatingIncome / 1000000,
    totalCash: f.totalCash / 1000000,
    totalDebt: f.totalDebt / 1000000,
    grossMargin: f.revenue > 0 ? ((f.grossProfit / f.revenue) * 100) : 0,
    operatingMargin: f.revenue > 0 ? ((f.operatingIncome / f.revenue) * 100) : 0,
    researchAndDevelopment: (f as any).researchAndDevelopmentExpenses / 1000000 || 0,
    salesAndMarketing: (f as any).sellingGeneralAndAdministrativeExpenses / 1000000 || 0
  })).reverse();

  // Price chart data
  const priceChartData = additionalData.priceData.map(p => ({
    date: p.date,
    price: p.close
  }));

  // Key ratios data with proper metrics access
  const ratiosData = additionalData.ratios.map(ratio => ({
    year: new Date(ratio.date).getFullYear(),
    pe: ratio.priceEarningsRatio || 0,
    ps: ratio.priceToSalesRatio || 0,
    pOcf: ratio.priceCashFlowRatio || 0,
    pEbitda: ratio.enterpriseValueMultiple || 0,
    debtToEquity: ratio.debtEquityRatio || 0,
    roe: (ratio.returnOnEquity || 0) * 100,
    roic: (ratio.returnOnCapitalEmployed || 0) * 100
  })).reverse();

  // Dividends data
  const dividendsData = additionalData.dividends.map(d => ({
    year: new Date(d.date).getFullYear(),
    dividend: d.dividend || 0
  })).reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{ticker}</h1>
          <p className="text-xl text-gray-600">{profile?.companyName || companyName}</p>
          {profile?.sector && (
            <p className="text-sm text-gray-500">{profile.sector} • {profile.industry}</p>
          )}
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center">
          <span className="text-3xl font-bold mr-3">
            ${quote.price.toFixed(2)}
          </span>
          <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <ArrowUpRight className="h-5 w-5 mr-1" />
            ) : (
              <ArrowDownRight className="h-5 w-5 mr-1" />
            )}
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
              {formatNumber(quote.volume)}
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
          {loadingSections.briefInsight ? (
            <div className="flex items-center justify-center h-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : aiAnalysis.briefInsight ? (
            <div className="text-sm text-blue-700 leading-relaxed">
              {aiAnalysis.briefInsight.analysis}
            </div>
          ) : (
            <p className="text-sm text-blue-600">Generating market insight...</p>
          )}
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
                  {expandedSections.moat ? 
                    <ChevronUp className="h-5 w-5" /> : 
                    <ChevronDown className="h-5 w-5" />
                  }
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {loadingSections.moat ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : aiAnalysis.moat ? (
                  <div className="space-y-2">
                    {formatAIContent(aiAnalysis.moat.analysis)}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Click to generate analysis</p>
                )}
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
                  {expandedSections.risks ? 
                    <ChevronUp className="h-5 w-5" /> : 
                    <ChevronDown className="h-5 w-5" />
                  }
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {loadingSections.risks ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : aiAnalysis.risks ? (
                  <div className="space-y-2">
                    {formatAIContent(aiAnalysis.risks.analysis)}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Click to generate analysis</p>
                )}
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
                  {expandedSections.nearTerm ? 
                    <ChevronUp className="h-5 w-5" /> : 
                    <ChevronDown className="h-5 w-5" />
                  }
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {loadingSections.nearTerm ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : aiAnalysis.nearTermTailwinds ? (
                  <div className="space-y-2">
                    {formatAIContent(aiAnalysis.nearTermTailwinds.analysis)}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Click to generate analysis</p>
                )}
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
                  {expandedSections.longTerm ? 
                    <ChevronUp className="h-5 w-5" /> : 
                    <ChevronDown className="h-5 w-5" />
                  }
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {loadingSections.longTerm ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : aiAnalysis.longTermTailwinds ? (
                  <div className="space-y-2">
                    {formatAIContent(aiAnalysis.longTermTailwinds.analysis)}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Click to generate analysis</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* ... keep existing code (company overview section) */}
      {profile?.description && (
        <Card>
          <CardHeader>
            <CardTitle>Company Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{profile.description}</p>
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                 className="inline-flex items-center mt-2 text-mindful-600 hover:text-mindful-700">
                Visit Website <ArrowUpRight className="h-4 w-4 ml-1" />
              </a>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Comprehensive Financial Charts - All 8 Categories */}
      <Tabs defaultValue="price" className="space-y-4">
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

        {/* Price Chart */}
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
                    <CartesianGrid strokeDasharray="none" stroke="#f0f0f0" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']} />
                    <Area type="monotone" dataKey="price" stroke="#0ea5e9" fill="url(#priceGradient)" />
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Chart */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth</CardTitle>
              <CardDescription>Annual revenue over time (in millions)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="none" stroke="#f0f0f0" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${formatNumber(Number(value) * 1000000)}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profitability Chart with Toggles */}
        <TabsContent value="profitability">
          <Card>
            <CardHeader>
              <CardTitle>Profitability</CardTitle>
              <CardDescription>Financial performance metrics over time (in millions)</CardDescription>
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
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="none" stroke="#f0f0f0" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => {
                      if (chartToggles.profitability === 'eps') {
                        return [`$${Number(value).toFixed(2)}`, 'EPS'];
                      }
                      return [`${formatNumber(Number(value) * 1000000)}`, chartToggles.profitability === 'netIncome' ? 'Net Income' : 'EBITDA'];
                    }} />
                    <Line type="monotone" dataKey={chartToggles.profitability} stroke="#8b5cf6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Chart with Toggles */}
        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow</CardTitle>
              <CardDescription>Cash generation metrics over time</CardDescription>
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
                  Operating Cash Flow
                </Button>
                <Button
                  variant={chartToggles.cashFlow === 'fcfPerShare' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartToggles(prev => ({ ...prev, cashFlow: 'fcfPerShare' }))}
                >
                  FCF Per Share
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="none" stroke="#f0f0f0" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => {
                      if (chartToggles.cashFlow === 'fcfPerShare') {
                        return [`$${Number(value).toFixed(2)}`, 'FCF Per Share'];
                      }
                      return [`${formatNumber(Number(value) * 1000000)}`, chartToggles.cashFlow === 'freeCashFlow' ? 'Free Cash Flow' : 'Operating Cash Flow'];
                    }} />
                    <Bar dataKey={chartToggles.cashFlow} fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Chart */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Operating Expenses</CardTitle>
              <CardDescription>R&D and Sales & Marketing expenses (in millions)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="none" stroke="#f0f0f0" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [`${formatNumber(Number(value) * 1000000)}`, name === 'researchAndDevelopment' ? 'R&D' : 'Sales & Marketing']} />
                    <Bar dataKey="researchAndDevelopment" fill="#ef4444" name="R&D" />
                    <Bar dataKey="salesAndMarketing" fill="#f97316" name="Sales & Marketing" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash & Debt Chart */}
        <TabsContent value="cashdebt">
          <Card>
            <CardHeader>
              <CardTitle>Cash vs Debt</CardTitle>
              <CardDescription>Balance sheet cash and debt levels (in millions)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="none" stroke="#f0f0f0" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [`${formatNumber(Number(value) * 1000000)}`, name === 'totalCash' ? 'Cash' : 'Debt']} />
                    <Bar dataKey="totalCash" fill="#22c55e" name="Cash" />
                    <Bar dataKey="totalDebt" fill="#dc2626" name="Debt" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Margins Chart with Toggles */}
        <TabsContent value="margins">
          <Card>
            <CardHeader>
              <CardTitle>Profit Margins</CardTitle>
              <CardDescription>Profitability margins over time (%)</CardDescription>
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="none" stroke="#f0f0f0" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, chartToggles.margins === 'grossMargin' ? 'Gross Margin' : 'Operating Margin']} />
                    <Line type="monotone" dataKey={chartToggles.margins} stroke="#06b6d4" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Ratios Chart with Toggles */}
        <TabsContent value="ratios">
          <Card>
            <CardHeader>
              <CardTitle>Key Financial Ratios</CardTitle>
              <CardDescription>Important valuation and profitability ratios</CardDescription>
              <div className="grid grid-cols-4 gap-2">
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
                  variant={chartToggles.ratios === 'roe' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartToggles(prev => ({ ...prev, ratios: 'roe' }))}
                >
                  ROE
                </Button>
                <Button
                  variant={chartToggles.ratios === 'debtToEquity' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartToggles(prev => ({ ...prev, ratios: 'debtToEquity' }))}
                >
                  Debt/Equity
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ratiosData}>
                    <CartesianGrid strokeDasharray="none" stroke="#f0f0f0" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => {
                      const suffix = ['roe', 'roic'].includes(chartToggles.ratios) ? '%' : '';
                      return [`${Number(value).toFixed(2)}${suffix}`, chartToggles.ratios.toUpperCase()];
                    }} />
                    <Line type="monotone" dataKey={chartToggles.ratios} stroke="#8b5cf6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockDetail;
