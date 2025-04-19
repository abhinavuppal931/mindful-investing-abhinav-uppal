
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StockCard from '@/components/cards/StockCard';
import StockDetail from '@/components/insights/StockDetail';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

// Mock data
const stocksList = [
  { ticker: 'AAPL', companyName: 'Apple Inc.', price: 189.84, change: 2.34, changePercent: 1.25 },
  { ticker: 'MSFT', companyName: 'Microsoft Corporation', price: 410.34, change: 3.56, changePercent: 0.87 },
  { ticker: 'GOOGL', companyName: 'Alphabet Inc.', price: 156.57, change: -0.42, changePercent: -0.27 },
  { ticker: 'AMZN', companyName: 'Amazon.com, Inc.', price: 178.22, change: 1.78, changePercent: 1.01 },
  { ticker: 'META', companyName: 'Meta Platforms, Inc.', price: 474.33, change: 5.21, changePercent: 1.11 },
  { ticker: 'TSLA', companyName: 'Tesla, Inc.', price: 176.75, change: -3.25, changePercent: -1.80 },
  { ticker: 'NVDA', companyName: 'NVIDIA Corporation', price: 840.87, change: 12.34, changePercent: 1.49 },
  { ticker: 'BRK.B', companyName: 'Berkshire Hathaway Inc.', price: 408.67, change: 0.78, changePercent: 0.19 },
];

const Insights = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<typeof stocksList[0] | null>(null);

  const filteredStocks = stocksList.filter(stock => 
    stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
    stock.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStockSelect = (stock: typeof stocksList[0]) => {
    setSelectedStock(stock);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Stock Insights</h1>
        
        {selectedStock ? (
          <div className="mb-8">
            <StockDetail 
              ticker={selectedStock.ticker} 
              companyName={selectedStock.companyName} 
            />
          </div>
        ) : (
          <div className="bg-mindful-50 rounded-xl p-6 mb-8 border border-mindful-100">
            <h2 className="text-xl font-semibold mb-2">Welcome to Stock Insights</h2>
            <p className="text-gray-700">
              Select a stock from the list below to view detailed financial metrics and interactive charts.
            </p>
          </div>
        )}
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search stocks by ticker or company name..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredStocks.map((stock) => (
            <StockCard
              key={stock.ticker}
              ticker={stock.ticker}
              companyName={stock.companyName}
              price={stock.price}
              change={stock.change}
              changePercent={stock.changePercent}
              onClick={() => handleStockSelect(stock)}
            />
          ))}
          
          {filteredStocks.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-gray-500">No stocks found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Insights;
