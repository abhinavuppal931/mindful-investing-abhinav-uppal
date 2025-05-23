import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFinancialStatements, getKeyMetrics, getFinancialRatios, getStockQuote } from '@/lib/api/stockService';
import { FinancialStatement, KeyMetrics, FinancialRatios } from '@/lib/api/types';
import LineChart from '@/components/charts/LineChart';
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';



interface StockDetailProps {
  ticker: string;
  companyName: string;
}

interface FinancialData {
  statements: {
    income: FinancialStatement[];
    balance: FinancialStatement[];
    cashFlow: FinancialStatement[];
  };
  metrics: KeyMetrics[];
  ratios: FinancialRatios[];
  loading: boolean;
  error: string | null;
}

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const [financialData, setFinancialData] = useState<FinancialData>({
    statements: {
      income: [],
      balance: [],
      cashFlow: []
    },
    metrics: [],
    ratios: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchFinancialData = async () => {
      setFinancialData(prev => ({ ...prev, loading: true, error: null }));
      try {
        const [income, balance, cashFlow, metrics, ratios] = await Promise.all([
          getFinancialStatements(ticker, 'income', 'annual'),
          getFinancialStatements(ticker, 'balance', 'annual'),
          getFinancialStatements(ticker, 'cashflow', 'annual'),
          getKeyMetrics(ticker),
          getFinancialRatios(ticker)
        ]);

        setFinancialData({
          statements: {
            income,
            balance,
            cashFlow
          },
          metrics,
          ratios,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching financial data:', error);
        setFinancialData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load financial data. Please try again later.'
        }));
      }
    };

    fetchFinancialData();
  }, [ticker]);

  const [priceData, setPriceData] = useState<{ date: Date; value: number }[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceDiff, setPriceDiff] = useState(0);
  const [priceChangePct, setPriceChangePct] = useState(0);
  const [isPositive, setIsPositive] = useState(true);

  useEffect(() => {
    const fetchQuoteData = async () => {
      try {
        const quote = await getStockQuote(ticker);
        const price = parseFloat(quote.price);
        const change = parseFloat(quote.change);
        const changePct = parseFloat(quote.changesPercentage);

        setCurrentPrice(price);
        setPriceDiff(change);
        setPriceChangePct(changePct);
        setIsPositive(change >= 0);

        // Create price data point
        const today = new Date();
        setPriceData([{
          date: today,
          value: price
        }]);
      } catch (error) {
        console.error('Error fetching stock quote:', error);
      }
    };

    fetchQuoteData();
  }, [ticker]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{ticker}</h1>
          <p className="text-xl text-gray-600">{companyName}</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center">
          <span className="text-3xl font-bold mr-3">
            ${currentPrice.toFixed(2)}
          </span>
          <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <ArrowUpRight className="h-5 w-5 mr-1" />
            ) : (
              <ArrowDownRight className="h-5 w-5 mr-1" />
            )}
            <span className="text-lg font-medium">
              {isPositive ? '+' : ''}{priceDiff.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePct.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Market Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialData.metrics.length > 0 
                ? parseFloat(financialData.metrics[0].marketCap).toLocaleString() 
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Revenue (TTM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialData.statements.income.length > 0 
                ? parseFloat(financialData.statements.income[0].revenue).toLocaleString() 
                : 'N/A'}M
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <BarChart3 className="h-4 w-4 mr-1" />
              EBITDA (TTM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialData.statements.income.length > 0 
                ? parseFloat(financialData.statements.income[0].ebitda).toLocaleString() 
                : 'N/A'}M
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="price">
        <TabsList className="mb-4">
          <TabsTrigger value="price">Price</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="ratios">Financial Ratios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="price" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Price History</CardTitle>
              <CardDescription>Historical stock price over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <LineChart 
                  data={priceData} 
                  width={800} 
                  height={400} 
                  yAxisLabel="Price ($)" 
                  color="#0ea5e9"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="financials" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Financial Statements</CardTitle>
              <CardDescription>Annual financial data</CardDescription>
            </CardHeader>
            <CardContent>
              {financialData.loading ? (
                <div>Loading financial data...</div>
              ) : financialData.error ? (
                <div className="text-red-500">{financialData.error}</div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Income Statement</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {financialData.statements.income.map((statement) => (
                        <Card key={statement.date}>
                          <CardHeader>
                            <CardTitle>{new Date(statement.date).getFullYear()}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <dl className="space-y-2">
                              <div>
                                <dt className="text-sm text-gray-500">Revenue</dt>
                                <dd className="text-lg font-semibold">${parseFloat(statement.revenue).toLocaleString()}M</dd>
                              </div>
                              <div>
                                <dt className="text-sm text-gray-500">Net Income</dt>
                                <dd className="text-lg font-semibold">${parseFloat(statement.netIncome).toLocaleString()}M</dd>
                              </div>
                              <div>
                                <dt className="text-sm text-gray-500">EBITDA</dt>
                                <dd className="text-lg font-semibold">${parseFloat(statement.ebitda).toLocaleString()}M</dd>
                              </div>
                            </dl>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metrics" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
              <CardDescription>Important financial metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {financialData.loading ? (
                <div>Loading metrics...</div>
              ) : financialData.error ? (
                <div className="text-red-500">{financialData.error}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {financialData.metrics.map((metric) => (
                    <Card key={metric.date}>
                      <CardHeader>
                        <CardTitle>{new Date(metric.date).getFullYear()}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm text-gray-500">P/E Ratio</dt>
                            <dd className="text-lg font-semibold">{parseFloat(metric.peRatio).toFixed(2)}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">ROE</dt>
                            <dd className="text-lg font-semibold">{parseFloat(metric.roe).toFixed(2)}%</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Market Cap</dt>
                            <dd className="text-lg font-semibold">${parseFloat(metric.marketCap).toLocaleString()}M</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ratios" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Financial Ratios</CardTitle>
              <CardDescription>Key financial ratios and indicators</CardDescription>
            </CardHeader>
            <CardContent>
              {financialData.loading ? (
                <div>Loading ratios...</div>
              ) : financialData.error ? (
                <div className="text-red-500">{financialData.error}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {financialData.ratios.map((ratio) => (
                    <Card key={ratio.date}>
                      <CardHeader>
                        <CardTitle>{new Date(ratio.date).getFullYear()}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm text-gray-500">Current Ratio</dt>
                            <dd className="text-lg font-semibold">{parseFloat(ratio.currentRatio).toFixed(2)}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Debt to Equity</dt>
                            <dd className="text-lg font-semibold">{parseFloat(ratio.debtToEquity).toFixed(2)}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Profit Margin</dt>
                            <dd className="text-lg font-semibold">{parseFloat(ratio.profitMargin).toFixed(2)}%</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockDetail;
