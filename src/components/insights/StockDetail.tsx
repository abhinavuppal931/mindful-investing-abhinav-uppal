import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { LineChart, ResponsiveContainer, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3, LineChart as LineChartIcon, Activity, Target } from 'lucide-react';
import { fmpAPI } from '@/services/api';
import { formatLargeNumber, formatCurrency, formatPercentage } from '@/utils/formatUtils';
import CompanyOverview from './CompanyOverview';
import AIAnalysisGrid from './AIAnalysisGrid';
import TodaysPriceDriver from './TodaysPriceDriver';
import CustomChartTooltip from '@/components/ui/CustomChartTooltip';

interface StockDetailProps {
  ticker: string;
  companyName: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const [stockProfile, setStockProfile] = useState<any | null>(null);
  const [quote, setQuote] = useState<any | null>(null);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [analystEstimates, setAnalystEstimates] = useState<any | null>(null);
  const [todaysPriceDrivers, setTodaysPriceDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chartConfig = {
    price: { label: "Price", color: "hsl(var(--primary))" },
    revenue: { label: "Revenue", color: "hsl(220, 70%, 50%)" },
    netIncome: { label: "Net Income", color: "hsl(142, 76%, 36%)" },
    operatingIncome: { label: "Operating Income", color: "hsl(45, 93%, 47%)" },
    freeCashFlow: { label: "Free Cash Flow", color: "hsl(262, 83%, 58%)" },
    eps: { label: "EPS", color: "hsl(346, 77%, 49%)" },
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch stock profile
        const profileData = await fmpAPI.getProfile(ticker);
        if (profileData && profileData.length > 0) {
          setStockProfile(profileData[0]);
        } else {
          setError('Failed to load stock profile.');
        }

        // Fetch quote
        const quoteData = await fmpAPI.getQuote(ticker);
        if (quoteData && quoteData.length > 0) {
          setQuote(quoteData[0]);
        } else {
          setError('Failed to load quote.');
        }

        // Fetch price data (1 year)
        const now = new Date();
        const from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().slice(0, 10);
        const priceHistory = await fmpAPI.getPriceHistory(ticker, from, now.toISOString().slice(0, 10));
        setPriceData(priceHistory);

        // Fetch financial data (5 years)
        const incomeStatement = await fmpAPI.getIncomeStatement(ticker);
        if (incomeStatement && incomeStatement.length > 0) {
          setFinancialData(incomeStatement.slice(0, 5).map(item => ({
            year: item.calendarYear,
            revenue: item.revenue,
            netIncome: item.netIncome,
            operatingIncome: item.operatingIncome,
            freeCashFlow: item.freeCashFlow,
            eps: item.eps
          })));
        } else {
          console.warn('Failed to load income statement data.');
        }

        // Fetch news
        const newsData = await fmpAPI.getCompanyNews(ticker);
        setNews(newsData.slice(0, 5));

         // Fetch analyst estimates
         const estimatesData = await fmpAPI.getAnalystEstimates(ticker);
         setAnalystEstimates(estimatesData);

        // Fetch today's price drivers
        const todaysDrivers = await fmpAPI.getTodaysPriceDrivers(ticker);
        setTodaysPriceDrivers(todaysDrivers);

      } catch (err: any) {
        setError(err.message || 'Failed to load data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg"></div>
          <div 
            className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
            style={{ animationDelay: '0.2s' }}
          ></div>
          <div 
            className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
            style={{ animationDelay: '0.4s' }}
          ></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Company Overview Section */}
      {stockProfile && quote && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{companyName} ({ticker})</CardTitle>
            <CardDescription>{stockProfile.industry} - {stockProfile.sector}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <CompanyOverview 
                  symbol={ticker}
                  companyName={companyName}
                  description={stockProfile.description}
                  ceo={stockProfile.ceo}
                  employees={stockProfile.fullTimeEmployees}
                  headquarters={stockProfile.headQuarter}
                  website={stockProfile.website}
                />
                <Card>
                  <CardHeader>
                    <CardTitle>Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground">Price</p>
                        <p className="font-semibold">{formatCurrency(quote.price)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Change</p>
                        <p className={`font-semibold ${quote.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {quote.change > 0 ? <TrendingUp className="inline-block mr-1 h-4 w-4" /> : <TrendingDown className="inline-block mr-1 h-4 w-4" />}
                          {formatCurrency(quote.change)} ({formatPercentage(quote.changesPercentage)})
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Market Cap</p>
                        <p className="font-semibold">{formatLargeNumber(stockProfile.mktCap)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">52 Week High</p>
                        <p className="font-semibold">{formatCurrency(stockProfile.rangeHigh)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">52 Week Low</p>
                        <p className="font-semibold">{formatCurrency(stockProfile.rangeLow)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Dividend</p>
                        <p className="font-semibold">{stockProfile.lastDiv ? formatCurrency(stockProfile.lastDiv) : 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {analystEstimates && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Analyst Estimates</CardTitle>
                      <CardDescription>
                        {analystEstimates.numberOfAnalysts} analysts providing estimates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-muted-foreground">Target High</p>
                          <p className="font-semibold">{formatCurrency(analystEstimates.targetHigh)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Target Low</p>
                          <p className="font-semibold">{formatCurrency(analystEstimates.targetLow)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Target Mean</p>
                          <p className="font-semibold">{formatCurrency(analystEstimates.targetMean)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Target Median</p>
                          <p className="font-semibold">{formatCurrency(analystEstimates.targetMedian)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {todaysPriceDrivers && todaysPriceDrivers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Today's Price Drivers</CardTitle>
                      <CardDescription>Key factors influencing today's stock price</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TodaysPriceDriver drivers={todaysPriceDrivers} />
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle>Company News</CardTitle>
                    <CardDescription>Latest news and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-none space-y-2">
                      {news.map(item => (
                        <li key={item.link} className="truncate">
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            {item.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChartIcon className="mr-2 h-5 w-5" />
              Stock Price (1 Year)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip content={<CustomChartTooltip config={chartConfig} />} />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg"></div>
                  <div 
                    className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div 
                    className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Metrics Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Financial Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="revenue" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
                <TabsTrigger value="eps">EPS</TabsTrigger>
              </TabsList>
              
              {/* Revenue Tab */}
              <TabsContent value="revenue" className="mt-4">
                {financialData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={financialData.slice(0, 5).reverse()}>
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => formatLargeNumber(value)}
                      />
                      <Tooltip content={<CustomChartTooltip config={chartConfig} />} />
                      <Bar dataKey="revenue" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px]">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg"></div>
                      <div 
                        className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                      <div 
                        className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
                        style={{ animationDelay: '0.4s' }}
                      ></div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Income Tab */}
              <TabsContent value="income" className="mt-4">
                {financialData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={financialData.slice(0, 5).reverse()}>
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => formatLargeNumber(value)}
                      />
                      <Tooltip content={<CustomChartTooltip config={chartConfig} />} />
                      <Bar dataKey="netIncome" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="operatingIncome" fill="hsl(45, 93%, 47%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px]">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg"></div>
                      <div 
                        className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                      <div 
                        className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
                        style={{ animationDelay: '0.4s' }}
                      ></div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Cash Flow Tab */}
              <TabsContent value="cashflow" className="mt-4">
                {financialData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={financialData.slice(0, 5).reverse()}>
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => formatLargeNumber(value)}
                      />
                      <Tooltip content={<CustomChartTooltip config={chartConfig} />} />
                      <Bar dataKey="freeCashFlow" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px]">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg"></div>
                      <div 
                        className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                      <div 
                        className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
                        style={{ animationDelay: '0.4s' }}
                      ></div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* EPS Tab */}
              <TabsContent value="eps" className="mt-4">
                {financialData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={financialData.slice(0, 5).reverse()}>
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip content={<CustomChartTooltip config={chartConfig} />} />
                      <Line 
                        type="monotone" 
                        dataKey="eps" 
                        stroke="hsl(346, 77%, 49%)" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(346, 77%, 49%)', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px]">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg"></div>
                      <div 
                        className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                      <div 
                        className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
                        style={{ animationDelay: '0.4s' }}
                      ></div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Grid */}
      <Card>
        <CardHeader>
          <CardTitle>AI Analysis</CardTitle>
          <CardDescription>AI-powered insights and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <AIAnalysisGrid ticker={ticker} financialData={financialData} newsData={news} />
        </CardContent>
      </Card>
    </div>
  );
};

export default StockDetail;
