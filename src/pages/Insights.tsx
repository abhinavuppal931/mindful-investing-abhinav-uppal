
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StockCard from '@/components/cards/StockCard';
import StockDetail from '@/components/insights/StockDetail';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { getStockQuote } from '@/lib/api/stockService';
import { StockQuote } from '@/lib/api/types';

// Default stock symbols to display
const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'BRK.B'];

interface StockData {
  ticker: string;
  companyName: string;
  price: string;
  change: string;
  changePercent: string;
  loading?: boolean;
}

const Insights = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStocks = async () => {
      setLoading(true);
      try {
        const stockData = await Promise.all(
          DEFAULT_SYMBOLS.map(async (symbol) => {
            try {
              const quote = await getStockQuote(symbol);
              return {
                ticker: quote.symbol,
                companyName: quote.name,
                price: quote.price,
                change: quote.change,
                changePercent: quote.changesPercentage,
                loading: false
              };
            } catch (error) {
              console.error(`Error fetching data for ${symbol}:`, error);
              return null;
            }
          })
        );
        // Filter out null values and ensure all required fields are present
        setStocks(stockData.filter((stock): stock is StockData => {
          return stock !== null && 
            'ticker' in stock && 
            'companyName' in stock && 
            'price' in stock && 
            'change' in stock && 
            'changePercent' in stock;
        }));
      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  const filteredStocks = stocks.filter(stock => 
    stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
    stock.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStockSelect = (stock: StockData) => {
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 8 }).map((_, index) => (
              <StockCard
                key={index}
                ticker=""
                companyName=""
                price="0"
                change="0"
                changePercent="0"
                loading={true}
                onClick={() => {}}
              />
            ))
          ) : filteredStocks.length > 0 ? (
            filteredStocks.map((stock) => (
              <StockCard
                key={stock.ticker}
                ticker={stock.ticker}
                companyName={stock.companyName}
                price={stock.price}
                change={stock.change}
                changePercent={stock.changePercent}
                onClick={() => handleStockSelect(stock)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              No stocks found matching your search.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Insights;
