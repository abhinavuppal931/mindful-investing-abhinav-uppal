import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StockCard from '@/components/cards/StockCard';
import StockDetail from '@/components/insights/StockDetail';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Star, StarOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlist } from '@/hooks/useWatchlist';
import { toast } from '@/hooks/use-toast';
import { fmpAPI } from '@/services/api';

// Remove mock data and fetch real stock data
const Insights = () => {
  const { user } = useAuth();
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<any | null>(null);
  const [stocksList, setStocksList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Predefined list of popular stocks to fetch
  const popularTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'BRK.B'];

  useEffect(() => {
    fetchStocksList();
  }, []);

  const fetchStocksList = async () => {
    setLoading(true);
    try {
      const stockPromises = popularTickers.map(async (ticker) => {
        try {
          const quoteData = await fmpAPI.getQuote(ticker);
          const profileData = await fmpAPI.getProfile(ticker);
          
          if (quoteData && quoteData.length > 0 && profileData && profileData.length > 0) {
            const quote = quoteData[0];
            const profile = profileData[0];
            return {
              ticker: quote.symbol,
              companyName: profile.companyName || quote.name,
              price: quote.price,
              change: quote.change,
              changePercent: quote.changesPercentage
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching data for ${ticker}:`, error);
          return null;
        }
      });

      const stocks = await Promise.all(stockPromises);
      const validStocks = stocks.filter(stock => stock !== null);
      setStocksList(validStocks);
    } catch (error) {
      console.error('Error fetching stocks list:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocksList.filter(stock => 
    stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
    stock.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStockSelect = (stock: any) => {
    setSelectedStock(stock);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWatchlistToggle = async (tickerSymbol: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to manage your watchlist", variant: "destructive" });
      return;
    }

    try {
      if (isInWatchlist(tickerSymbol)) {
        await removeFromWatchlist(tickerSymbol);
        toast({ title: "Removed", description: `${tickerSymbol} removed from watchlist` });
      } else {
        await addToWatchlist(tickerSymbol);
        toast({ title: "Added", description: `${tickerSymbol} added to watchlist` });
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to update watchlist",
        variant: "destructive" 
      });
    }
  };

  // Get watchlist stocks with current prices
  const watchlistStocks = watchlist.map(item => {
    const stock = stocksList.find(s => s.ticker === item.ticker_symbol);
    return stock ? { ...stock, addedAt: item.added_at } : null;
  }).filter(Boolean);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <h1 className="text-3xl font-bold text-foreground">Stock Insights</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mindful-600"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Stock Insights</h1>
        
        {selectedStock ? (
          <div className="mb-8">
            <StockDetail 
              ticker={selectedStock.ticker} 
              companyName={selectedStock.companyName} 
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-mindful-50 dark:bg-mindful-950 rounded-xl p-6 border border-mindful-100 dark:border-mindful-800">
              <h2 className="text-xl font-semibold mb-2 text-foreground">Welcome to Stock Insights</h2>
              <p className="text-muted-foreground">
                Select a stock from the list below to view detailed financial metrics and interactive charts.
              </p>
            </div>

            {user && watchlistStocks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-500" />
                    Your Watchlist
                  </CardTitle>
                  <CardDescription>
                    Stocks you're tracking for potential investment opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {watchlistStocks.map((stock) => (
                      <div key={stock.ticker} className="relative">
                        <StockCard
                          ticker={stock.ticker}
                          companyName={stock.companyName}
                          price={stock.price}
                          change={stock.change}
                          changePercent={stock.changePercent}
                          onClick={() => handleStockSelect(stock)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWatchlistToggle(stock.ticker);
                          }}
                        >
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Search stocks by ticker or company name..."
            className="pl-10 bg-background border-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredStocks.map((stock) => (
            <div key={stock.ticker} className="relative">
              <StockCard
                ticker={stock.ticker}
                companyName={stock.companyName}
                price={stock.price}
                change={stock.change}
                changePercent={stock.changePercent}
                onClick={() => handleStockSelect(stock)}
              />
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWatchlistToggle(stock.ticker);
                  }}
                >
                  {isInWatchlist(stock.ticker) ? (
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ) : (
                    <StarOff className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              )}
            </div>
          ))}
          
          {filteredStocks.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-muted-foreground">No stocks found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Insights;
