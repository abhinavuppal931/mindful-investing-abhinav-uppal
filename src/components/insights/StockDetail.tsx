import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, BarChart3, Building2, BrainCircuit, Shield, AlertTriangle, Wind, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import { openaiAPI, fmpAPI } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

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

  const [priceData, setPriceData] = useState<any[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<any[]>([]);

  useEffect(() => {
    if (financials.length > 0) {
      fetchBriefInsight();
      fetchAdditionalData();
    }
  }, [financials, ticker]);

  const fetchAdditionalData = async () => {
    try {
      // Fetch historical price data
      const priceResponse = await fmpAPI.getHistoricalPrices(ticker, '1year');
      setPriceData(priceResponse?.historical?.slice(0, 30).reverse() || []);

      // Fetch key metrics
      const metricsResponse = await fmpAPI.getMetrics(ticker, 'annual', 5);
      setKeyMetrics(metricsResponse || []);
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
    if (value >= 1000000000000) {
      return `$${(value / 1000000000000).toFixed(2)}T`;
    } else if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(2)}T`;
    } else if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else {
      return value.toLocaleString();
    }
  };

  const formatAIContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <li key={index} className="mb-2 text-sm text-gray-700 leading-relaxed">
            {trimmed.substring(1).trim()}
          </li>
        );
      } else if (trimmed.length > 0) {
        return (
          <p key={index} className="mb-3 text-sm text-gray-700 leading-relaxed">
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
  
  // Prepare chart data with improved formatting
  const revenueData = financials.map(f => ({
    year: new Date(f.date).getFullYear(),
    revenue: f.revenue / 1000000,
    netIncome: f.netIncome / 1000000,
    freeCashFlow: f.freeCashFlow / 1000000,
    operatingCashFlow: f.operatingCashFlow / 1000000,
    ebitda: f.ebitda / 1000000,
    eps: f.netIncome / (quote.sharesOutstanding || 1),
    grossProfit: f.grossProfit / 1000000,
    operatingIncome: f.operatingIncome / 1000000,
    totalCash: f.totalCash / 1000000,
    totalDebt: f.totalDebt / 1000000
  })).reverse();

  // Price chart data
  const priceChartData = priceData.map(p => ({
    date: p.date,
    price: p.close
  }));

  // Margins data
  const marginsData = revenueData.map(d => ({
    year: d.year,
    grossMargin: d.revenue > 0 ? ((d.grossProfit / d.revenue) * 100) : 0,
    operatingMargin: d.revenue > 0 ? ((d.operatingIncome / d.revenue) * 100) : 0
  }));

  // Key ratios data
  const ratiosData = keyMetrics.map((metric, index) => ({
    year: new Date(metric.date).getFullYear(),
    pe: metric.peRatio || 0,
    ps: metric.priceToSalesRatio || 0,
    pOcf: metric.priceCashFlowRatio || 0,
    pEbitda: metric.enterpriseValueMultiple || 0,
    debtToEquity: metric.debtToEquity || 0,
    roe: metric.returnOnEquity * 100 || 0,
    roic: metric.returnOnCapitalEmployed * 100 || 0
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

      {/* Expandable AI Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitive Moat */}
        <Collapsible open={expandedSections.moat} onOpenChange={() => handleSectionToggle('moat')}>
          <Card>
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
              <CardContent>
                {loadingSections.moat ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : aiAnalysis.moat ? (
                  <ul className="space-y-2">
                    {formatAIContent(aiAnalysis.moat.analysis)}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Click to generate analysis</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Investment Risks */}
        <Collapsible open={expandedSections.risks} onOpenChange={() => handleSectionToggle('risks')}>
          <Card>
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
              <CardContent>
                {loadingSections.risks ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : aiAnalysis.risks ? (
                  <ul className="space-y-2">
                    {formatAIContent(aiAnalysis.risks.analysis)}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Click to generate analysis</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Near-term Tailwinds & Headwinds */}
        <Collapsible open={expandedSections.nearTerm} onOpenChange={() => handleSectionToggle('nearTerm')}>
          <Card>
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
              <CardContent>
                {loadingSections.nearTerm ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : aiAnalysis.nearTermTailwinds ? (
                  <ul className="space-y-2">
                    {formatAIContent(aiAnalysis.nearTermTailwinds.analysis)}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Click to generate analysis</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Long-term Tailwinds & Headwinds */}
        <Collapsible open={expandedSections.longTerm} onOpenChange={() => handleSectionToggle('longTerm')}>
          <Card>
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
              <CardContent>
                {loadingSections.longTerm ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : aiAnalysis.longTermTailwinds ? (
                  <ul className="space-y-2">
                    {formatAIContent(aiAnalysis.longTermTailwinds.analysis)}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Click to generate analysis</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

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
      
      <Tabs defaultValue="revenue">
        <TabsList className="mb-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth</CardTitle>
              <CardDescription>Annual revenue over time (in millions)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}M`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profitability" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Profitability</CardTitle>
              <CardDescription>Net income and EBITDA over time (in millions)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [`$${value}M`, name]} />
                    <Line type="monotone" dataKey="netIncome" stroke="#0ea5e9" name="Net Income" />
                    <Line type="monotone" dataKey="ebitda" stroke="#8b5cf6" name="EBITDA" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cashflow" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow</CardTitle>
              <CardDescription>Free cash flow over time (in millions)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}M`, 'Free Cash Flow']} />
                    <Bar dataKey="freeCashFlow" fill="#f59e0b" />
                  </BarChart>
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
