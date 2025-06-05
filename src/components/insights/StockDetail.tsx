import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStockData, useNews } from '@/hooks/useStockData';
import { fmpAPI, openaiAPI } from '@/services/api';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Target, Shield, Calendar, Loader2, Building2, Globe, Users, ExternalLink } from 'lucide-react';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';

interface StockDetailProps {
  ticker: string;
  companyName: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const { quote, financials, profile, loading, error } = useStockData(ticker);
  const { news } = useNews(ticker);
  
  // State for additional data
  const [metrics, setMetrics] = useState<any[]>([]);
  const [metricsTTM, setMetricsTTM] = useState<any>(null);
  const [ratios, setRatios] = useState<any[]>([]);
  const [ratiosTTM, setRatiosTTM] = useState<any>(null);
  const [enterpriseValues, setEnterpriseValues] = useState<any[]>([]);
  const [financialGrowth, setFinancialGrowth] = useState<any[]>([]);
  const [historicalPrices, setHistoricalPrices] = useState<any[]>([]);
  const [revenueProductSegments, setRevenueProductSegments] = useState<any[]>([]);
  const [revenueGeoSegments, setRevenueGeoSegments] = useState<any[]>([]);
  
  // AI Analysis state
  const [moatAnalysis, setMoatAnalysis] = useState<string>('');
  const [riskAnalysis, setRiskAnalysis] = useState<string>('');
  const [nearTermAnalysis, setNearTermAnalysis] = useState<string>('');
  const [longTermAnalysis, setLongTermAnalysis] = useState<string>('');
  const [dailyDriverAnalysis, setDailyDriverAnalysis] = useState<string>('');
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    revenue: false,
    profitability: false,
    margins: false,
    cashFlow: false,
    keyRatios: false,
    expenses: false,
    ai: false
  });
  
  // Current selections
  const [selectedPeriod, setSelectedPeriod] = useState('annual');
  const [selectedDataType, setSelectedDataType] = useState('annual');
  const [activeTabs, setActiveTabs] = useState<{[key: string]: boolean}>({});
  const [periodFilters, setPeriodFilters] = useState<{[key: string]: number}>({
    price: 1,
    revenue: 5,
    profitability: 5,
    margins: 5,
    cashFlow: 5,
    keyRatios: 5,
    expenses: 5
  });

  useEffect(() => {
    if (!ticker) return;
    fetchMetricsData(selectedPeriod);
    fetchRatiosData(selectedPeriod);
    fetchHistoricalData(periodFilters.price);
    fetchRevenueSegments(selectedPeriod);
  }, [ticker, selectedPeriod]);

  useEffect(() => {
    if (selectedDataType === 'ttm') {
      fetchMetricsTTM();
      fetchRatiosTTM();
    }
  }, [selectedDataType, ticker]);

  const fetchMetricsTTM = async () => {
    if (!ticker) return;
    try {
      const metricsTTMData = await fmpAPI.getMetricsTTM(ticker);
      setMetricsTTM(metricsTTMData && metricsTTMData.length > 0 ? metricsTTMData[0] : null);
    } catch (error) {
      console.error('Error fetching metrics TTM:', error);
    }
  };

  const fetchRatiosTTM = async () => {
    if (!ticker) return;
    try {
      const ratiosTTMData = await fmpAPI.getRatiosTTM(ticker);
      setRatiosTTM(ratiosTTMData && ratiosTTMData.length > 0 ? ratiosTTMData[0] : null);
    } catch (error) {
      console.error('Error fetching ratios TTM:', error);
    }
  };

  useEffect(() => {
    if (!ticker) return;
    
    // Fetch AI analysis
    fetchAIAnalysis();
  }, [ticker, financials, news]);

  const fetchAIAnalysis = async () => {
    if (!financials.length || !news.length) return;
    
    setLoadingStates(prev => ({ ...prev, ai: true }));
    
    try {
      const [moat, risks, nearTerm, longTerm, dailyDriver] = await Promise.all([
        openaiAPI.analyzeCompanyMoat(ticker, financials.slice(0, 3)),
        openaiAPI.analyzeInvestmentRisks(ticker, financials.slice(0, 3), news.slice(0, 5)),
        openaiAPI.analyzeNearTermTailwinds(ticker, financials.slice(0, 3), news.slice(0, 5)),
        openaiAPI.analyzeLongTermTailwinds(ticker, financials.slice(0, 3), news.slice(0, 5)),
        openaiAPI.generateBriefInsight(ticker, financials.slice(0, 1))
      ]);
      
      setMoatAnalysis(moat?.analysis || '');
      setRiskAnalysis(risks?.analysis || '');
      setNearTermAnalysis(nearTerm?.analysis || '');
      setLongTermAnalysis(longTerm?.analysis || '');
      setDailyDriverAnalysis(dailyDriver?.analysis || '');
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, ai: false }));
    }
  };

  const fetchMetricsData = async (period: string) => {
    if (!ticker) return;
    setLoadingStates(prev => ({ ...prev, profitability: true, margins: true, cashFlow: true, keyRatios: true }));
    try {
      const metricsData = await fmpAPI.getMetrics(ticker, period, periodFilters.profitability);
      setMetrics(metricsData || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        profitability: false,
        margins: false,
        cashFlow: false,
        keyRatios: false
      }));
    }
  };

  const fetchRatiosData = async (period: string) => {
    if (!ticker) return;
    setLoadingStates(prev => ({ ...prev, profitability: true, margins: true, cashFlow: true, keyRatios: true }));
    try {
      const ratiosData = await fmpAPI.getRatios(ticker, period, periodFilters.keyRatios);
      setRatios(ratiosData || []);
    } catch (error) {
      console.error('Error fetching ratios:', error);
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        profitability: false,
        margins: false,
        cashFlow: false,
        keyRatios: false
      }));
    }
  };

  const fetchHistoricalData = async (years: number) => {
    if (!ticker) return;
    setLoadingStates(prev => ({ ...prev, price: true }));
    try {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - years * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const historicalData = await fmpAPI.getHistoricalChart(ticker, from, to);
      setHistoricalPrices(historicalData || []);
    } catch (error) {
      console.error('Error fetching historical prices:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, price: false }));
    }
  };

  const fetchRevenueSegments = async (period: string) => {
    if (!ticker) return;
    setLoadingStates(prev => ({ ...prev, revenue: true }));
    try {
      const [productSegments, geoSegments] = await Promise.all([
        fmpAPI.getRevenueProductSegmentation(ticker, period),
        fmpAPI.getRevenueGeographicSegmentation(ticker, period)
      ]);
      setRevenueProductSegments(productSegments || []);
      setRevenueGeoSegments(geoSegments || []);
    } catch (error) {
      console.error('Error fetching revenue segments:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, revenue: false }));
    }
  };

  const handleTabClick = async (tabName: string) => {
    setActiveTabs(prev => ({ ...prev, [tabName]: true }));
    switch (tabName) {
      case 'revenue':
        if (!revenueProductSegments.length && !revenueGeoSegments.length) {
          await fetchRevenueSegments(selectedPeriod);
        }
        break;
      case 'profitability':
      case 'margins':
      case 'cashFlow':
      case 'keyRatios':
        if (!metrics.length) {
          await fetchMetricsData(selectedPeriod);
          await fetchRatiosData(selectedPeriod);
        }
        break;
      case 'expenses':
        break;
      default:
        break;
    }
  };

  const handlePeriodChange = (metric: string, years: number) => {
    setPeriodFilters(prev => ({ ...prev, [metric]: years }));
    if (metric === 'price') {
      fetchHistoricalData(years);
    }
  };

  const formatTooltipValue = (value: any, name: string) => {
    if (['Revenue', 'Gross Profit', 'Net Income', 'Operating Income'].includes(name)) {
      return formatCurrency(value);
    } else if (name.includes('Margin')) {
      return formatPercentage(value);
    } else {
      return formatNumber(value);
    }
  };

  const formatYAxisTick = (value: any) => {
    if (value >= 1000000) {
      return formatCurrency(value);
    }
    return value;
  };

  const renderChart = (data: any[], type: string, dataKeys: string[], colors: string[]) => {
    if (!data || data.length === 0) {
      return <p className="text-muted-foreground">No data available for this chart.</p>;
    }

    let ChartComponent: any = LineChart;
    let DataComponent: any = Line;

    if (type === 'area') {
      ChartComponent = AreaChart;
      DataComponent = Area;
    } else if (type === 'bar') {
      ChartComponent = BarChart;
      DataComponent = Bar;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={formatYAxisTick} />
          <Tooltip formatter={formatTooltipValue} />
          <Legend />
          {dataKeys.map((key, index) => (
            <DataComponent key={key} type="monotone" dataKey={key} stroke={colors[index]} fill={colors[index]} />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  const renderGrowthMetrics = (data: any[], title: string, metricKey: string) => {
    if (!data || data.length === 0) {
      return <p className="text-muted-foreground">No growth data available.</p>;
    }
  
    const limitedData = limitDataByPeriod(data, periodFilters.profitability);
  
    const chartData = limitedData.map((item: any) => ({
      date: item.date,
      [title]: item[metricKey]
    }));
  
    return renderChart(
      chartData,
      'line',
      [title],
      ['#82ca9d']
    );
  };

  const limitDataByPeriod = (data: any[], periods: number) => {
    return data.slice(0, periods);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mindful-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading stock data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stock Header */}
      <Card className="bg-gradient-to-r from-mindful-50 to-mindful-100 dark:from-mindful-900 dark:to-mindful-800 border-mindful-200 dark:border-mindful-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{ticker}</h1>
              <p className="text-lg text-muted-foreground">{companyName}</p>
              {quote && (
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-2xl font-semibold">${quote.price?.toFixed(2)}</span>
                  <span className={`flex items-center ${quote.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {quote.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    {quote.change?.toFixed(2)} ({quote.changesPercentage?.toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>
            {quote && (
              <div className="text-right">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Market Cap</p>
                    <p className="font-semibold">{formatCurrency(quote.marketCap)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">P/E Ratio</p>
                    <p className="font-semibold">{quote.pe?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Volume</p>
                    <p className="font-semibold">{formatNumber(quote.volume)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Volume</p>
                    <p className="font-semibold">{formatNumber(quote.avgVolume)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Price Driver Analysis */}
      {dailyDriverAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-mindful-600" />
              Today's Price Driver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{dailyDriverAnalysis}</p>
          </CardContent>
        </Card>
      )}

      {/* Company Information */}
      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-mindful-600" />
                Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {profile.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="flex items-center">
                  <Globe className="h-3 w-3 mr-1" />
                  {profile.country}
                </Badge>
                <Badge variant="secondary" className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {formatNumber(profile.employees)} employees
                </Badge>
                {profile.website && (
                  <Badge variant="outline" className="flex items-center cursor-pointer hover:bg-muted">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-xs">
                      Website
                    </a>
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-mindful-600" />
                Industry Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sector</p>
                <p className="text-lg font-semibold text-foreground">{profile.sector}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Industry</p>
                <p className="text-lg font-semibold text-foreground">{profile.industry}</p>
              </div>
              {profile.ceo && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CEO</p>
                  <p className="text-lg font-semibold text-foreground">{profile.ceo}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-mindful-600" />
              Competitive Moat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStates.ai ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: moatAnalysis.replace(/\n/g, '<br>') }} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-red-600" />
              Investment Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStates.ai ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: riskAnalysis.replace(/\n/g, '<br>') }} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Near-term Outlook (6-12 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStates.ai ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: nearTermAnalysis.replace(/\n/g, '<br>') }} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Long-term Outlook (5+ years)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStates.ai ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: longTermAnalysis.replace(/\n/g, '<br>') }} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Charts Section */}
      <div className="space-y-6">
        {/* Period and Data Type Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Data Period:</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Data Type:</label>
              <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="ttm">TTM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="price" className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="revenue" onClick={() => handleTabClick('revenue')}>Revenue</TabsTrigger>
            <TabsTrigger value="profitability" onClick={() => handleTabClick('profitability')}>Profitability</TabsTrigger>
            <TabsTrigger value="margins" onClick={() => handleTabClick('margins')}>Margins</TabsTrigger>
            <TabsTrigger value="cashFlow" onClick={() => handleTabClick('cashFlow')}>Cash Flow</TabsTrigger>
            <TabsTrigger value="keyRatios" onClick={() => handleTabClick('keyRatios')}>Key Ratios</TabsTrigger>
            <TabsTrigger value="expenses" onClick={() => handleTabClick('expenses')}>Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="price">
            <Card>
              <CardHeader>
                <CardTitle>Historical Price</CardTitle>
                <CardDescription>
                  <div className="flex items-center space-x-2">
                    <span>Past</span>
                    <Select value={periodFilters.price.toString()} onValueChange={(value) => handlePeriodChange('price', parseInt(value))}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="1 Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Year</SelectItem>
                        <SelectItem value="3">3 Years</SelectItem>
                        <SelectItem value="5">5 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStates.price ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  renderChart(
                    historicalPrices?.map((item: any) => ({
                      date: item.date,
                      Price: item.close
                    })),
                    'line',
                    ['Price'],
                    ['#8884d8']
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Segmentation</CardTitle>
                <CardDescription>Revenue split by product and geography</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">By Product</h3>
                  {loadingStates.revenue ? (
                    <div className="flex justify-center items-center h-48">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    renderChart(
                      revenueProductSegments?.map((item: any) => ({
                        date: item.date,
                        Revenue: item.revenue
                      })),
                      'bar',
                      ['Revenue'],
                      ['#8884d8']
                    )
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">By Geography</h3>
                  {loadingStates.revenue ? (
                    <div className="flex justify-center items-center h-48">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    renderChart(
                      revenueGeoSegments?.map((item: any) => ({
                        date: item.date,
                        Revenue: item.revenue
                      })),
                      'bar',
                      ['Revenue'],
                      ['#82ca9d']
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profitability">
            <Card>
              <CardHeader>
                <CardTitle>Profitability Metrics</CardTitle>
                <CardDescription>Key profitability indicators over time</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStates.profitability ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  renderChart(
                    metrics?.map((item: any) => ({
                      date: item.date,
                      ROA: item.roa,
                      ROE: item.roe,
                      ROIC: item.roic
                    })),
                    'line',
                    ['ROA', 'ROE', 'ROIC'],
                    ['#8884d8', '#82ca9d', '#ffc658']
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="margins">
            <Card>
              <CardHeader>
                <CardTitle>Margins Analysis</CardTitle>
                <CardDescription>Gross, Operating and Net Margins</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStates.margins ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  renderChart(
                    ratios?.map((item: any) => ({
                      date: item.date,
                      GrossMargin: item.grossProfitMargin,
                      OperatingMargin: item.operatingProfitMargin,
                      NetMargin: item.netProfitMargin
                    })),
                    'line',
                    ['GrossMargin', 'OperatingMargin', 'NetMargin'],
                    ['#ff7300', '#38b000', '#bb3e03']
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashFlow">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Metrics</CardTitle>
                <CardDescription>Operating and Free Cash Flow</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStates.cashFlow ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  renderChart(
                    metrics?.map((item: any) => ({
                      date: item.date,
                      OperatingCF: item.operatingCashFlowPerShare,
                      FreeCF: item.freeCashFlowPerShare
                    })),
                    'line',
                    ['OperatingCF', 'FreeCF'],
                    ['#0a9396', '#94d2bd']
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keyRatios">
            <Card>
              <CardHeader>
                <CardTitle>Key Ratios</CardTitle>
                <CardDescription>Debt/Equity, Payout Ratio, Current Ratio</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStates.keyRatios ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  renderChart(
                    ratios?.map((item: any) => ({
                      date: item.date,
                      DERatio: item.debtEquityRatio,
                      PayoutRatio: item.payoutRatio,
                      CurrentRatio: item.currentRatio
                    })),
                    'line',
                    ['DERatio', 'PayoutRatio', 'CurrentRatio'],
                    ['#ca6702', '#95d5b2', '#005f73']
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>R&D and SG&A Expenses</CardTitle>
                <CardDescription>As a percentage of revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStates.expenses ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  renderChart(
                    financials?.map((item: any) => ({
                      date: item.date,
                      RDExpense: item.researchAndDevelopmentExpenses / item.revenue,
                      SGAndAExpense: item.sellingGeneralAndAdministrativeExpenses / item.revenue
                    })),
                    'line',
                    ['RDExpense', 'SGAndAExpense'],
                    ['#bcbddc', '#6a51a3']
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StockDetail;
