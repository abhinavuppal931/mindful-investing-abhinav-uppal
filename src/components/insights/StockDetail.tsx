import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, BarChart3, Building2, BrainCircuit, Shield, AlertTriangle, Wind } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import { openaiAPI } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface StockDetailProps {
  ticker: string;
  companyName: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const { quote, financials, profile, loading, error } = useStockData(ticker);
  const [aiAnalysis, setAiAnalysis] = useState<{
    moat: any;
    risks: any;
    tailwinds: any;
  }>({
    moat: null,
    risks: null,
    tailwinds: null
  });
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    if (financials.length > 0 && !analysisLoading) {
      fetchAIAnalysis();
    }
  }, [financials, ticker]);

  const fetchAIAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const [moatData, risksData, tailwindsData] = await Promise.all([
        openaiAPI.analyzeCompanyMoat(ticker, financials.slice(0, 3)),
        openaiAPI.analyzeInvestmentRisks(ticker, financials.slice(0, 3), []),
        openaiAPI.analyzeTailwindsHeadwinds(ticker, financials.slice(0, 3), [])
      ]);

      setAiAnalysis({
        moat: moatData,
        risks: risksData,
        tailwinds: tailwindsData
      });
    } catch (error) {
      console.error('Failed to fetch AI analysis:', error);
    } finally {
      setAnalysisLoading(false);
    }
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
  
  // Prepare chart data
  const revenueData = financials.map(f => ({
    year: new Date(f.date).getFullYear(),
    revenue: f.revenue / 1000000, // Convert to millions
    netIncome: f.netIncome / 1000000,
    freeCashFlow: f.freeCashFlow / 1000000,
    ebitda: f.ebitda / 1000000
  })).reverse();

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else {
      return value.toLocaleString();
    }
  };
  
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

      {/* AI Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Competitive Moat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysisLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : aiAnalysis.moat ? (
              <p className="text-sm text-gray-700">{aiAnalysis.moat.analysis}</p>
            ) : (
              <p className="text-sm text-gray-500">Analysis not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Investment Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysisLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : aiAnalysis.risks ? (
              <p className="text-sm text-gray-700">{aiAnalysis.risks.analysis}</p>
            ) : (
              <p className="text-sm text-gray-500">Analysis not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wind className="h-5 w-5 mr-2 text-green-600" />
              Tailwinds & Headwinds
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysisLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : aiAnalysis.tailwinds ? (
              <p className="text-sm text-gray-700">{aiAnalysis.tailwinds.analysis}</p>
            ) : (
              <p className="text-sm text-gray-500">Analysis not available</p>
            )}
          </CardContent>
        </Card>
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
