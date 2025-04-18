
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LineChart from '@/components/charts/LineChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';

// Mock data for demonstration
const generateMockData = (days: number, startValue: number, volatility: number) => {
  const data = [];
  let currentValue = startValue;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const change = (Math.random() - 0.5) * volatility;
    currentValue = Math.max(0.1, currentValue + change);
    
    data.push({
      date,
      value: currentValue
    });
  }
  
  return data;
};

const priceData = generateMockData(365, 150, 5);
const revenueData = generateMockData(20, 5000, 200).map(d => ({
  ...d,
  date: new Date(d.date.getFullYear(), d.date.getMonth(), 1) // Set to first day of month
}));
const ebitdaData = generateMockData(20, 1500, 100).map(d => ({
  ...d,
  date: new Date(d.date.getFullYear(), d.date.getMonth(), 1) // Set to first day of month
}));

interface StockDetailProps {
  ticker: string;
  companyName: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ ticker, companyName }) => {
  const currentPrice = priceData[priceData.length - 1].value;
  const previousPrice = priceData[priceData.length - 2].value;
  const priceDiff = currentPrice - previousPrice;
  const priceChangePct = (priceDiff / previousPrice) * 100;
  
  const isPositive = priceDiff >= 0;
  
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
              ${(currentPrice * 1000000).toLocaleString()}
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
              ${revenueData[revenueData.length - 1].value.toLocaleString()}M
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
              ${ebitdaData[ebitdaData.length - 1].value.toLocaleString()}M
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="price">
        <TabsList className="mb-4">
          <TabsTrigger value="price">Price</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="ebitda">EBITDA</TabsTrigger>
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
                  color="#0ea5e9"
                  yAxisLabel="Price ($)"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Revenue History</CardTitle>
              <CardDescription>Quarterly revenue in millions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <LineChart 
                  data={revenueData} 
                  width={800} 
                  height={400} 
                  color="#10b981"
                  yAxisLabel="Revenue ($M)"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ebitda" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>EBITDA History</CardTitle>
              <CardDescription>Quarterly EBITDA in millions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <LineChart 
                  data={ebitdaData} 
                  width={800} 
                  height={400} 
                  color="#8b5cf6"
                  yAxisLabel="EBITDA ($M)"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockDetail;
