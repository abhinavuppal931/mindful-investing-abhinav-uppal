
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StockCard from '@/components/cards/StockCard';
import StockDetail from '@/components/insights/StockDetail';
import MarketIndices from '@/components/insights/MarketIndices';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Star, StarOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlist } from '@/hooks/useWatchlist';
import { toast } from '@/hooks/use-toast';
import { fmpAPI } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';

const Insights = () => {
  const { user } = useAuth();
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<any | null>(null);
  const [stocksList, setStocksList] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Predefined list of popular stocks to fetch
  const popularTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'BRK.B'];

  useEffect(() => {
    fetchStocksList();
  }, []);

  // Handle search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      handleSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedSearchQuery]);

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

  const handleSearch = async (query: string) => {
    if (!query || query.length < 2) return;
    
    setSearchLoading(true);
    try {
      // Use the correct search API method
      const searchData = await fmpAPI.searchSymbol(query);
      
      if (searchData && searchData.length > 0) {
        // Get quotes for search results to include price data
        const resultsWithQuotes = await Promise.all(
          searchData.slice(0, 10).map(async (item: any) => {
            try {
              const quoteData = await fmpAPI.getQuote(item.symbol);
              if (quoteData && quoteData.length > 0) {
                const quote = quoteData[0];
                return {
                  ticker: item.symbol,
                  companyName: item.name,
                  price: quote.price,
                  change: quote.change,
                  changePercent: quote.changesPercentage,
                  exchange: item.exchangeShortName || item.exchange
                };
              }
              return {
                ticker: item.symbol,
                companyName: item.name,
                price: 0,
                change: 0,
                changePercent: 0,
                exchange: item.exchangeShortName || item.exchange
              };
            } catch (error) {
              console.error(`Error fetching quote for ${item.symbol}:`, error);
              return {
                ticker: item.symbol,
                companyName: item.name,
                price: 0,
                change: 0,
                changePercent: 0,
                exchange: item.exchangeShortName || item.exchange
              };
            }
          })
        );
        
        setSearchResults(resultsWithQuotes.filter(Boolean));
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleStockSelect = (stock: any) => {
    setSelectedStock(stock);
    setSearchQuery('');
    setShowSearchResults(false);
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
        
        // Force a refetch of the watchlist to ensure UI updates
        setTimeout(() => {
          window.location.reload();
        }, 500);
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-3xl font-bold text-foreground">Stock Insights</h1>
            <MarketIndices />
          </div>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="glass-heading text-4xl">Stock Insights</h1>
          <MarketIndices />
        </div>

        {/* Search Bar - moved to top */}
        <div className="relative liquid-glass">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Search stocks by ticker or company name..."
            className="pl-10 bg-transparent border-none font-light"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Search Results */}
        {showSearchResults && searchQuery.length >= 2 && (
          <Card className="liquid-glass">
            <CardHeader>
              <CardTitle className="glass-subheading">Search Results for "{searchQuery}"</CardTitle>
            </CardHeader>
            <CardContent>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {searchResults.map((stock) => (
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
                          variant="glass"
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
                            <StarOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="glass-body text-center py-4">
                  No stocks found matching "{searchQuery}"
                </p>
              )}
            </CardContent>
          </Card>
        )}
        
        {selectedStock ? (
          <div className="mb-8">
            <StockDetail 
              ticker={selectedStock.ticker} 
              companyName={selectedStock.companyName} 
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="liquid-glass p-6">
              <h2 className="glass-heading text-2xl mb-2">Welcome to Stock Insights</h2>
              <p className="glass-body">
                Search for any stock by ticker or company name, or select from the popular stocks below to view detailed financial metrics and interactive charts.
              </p>
            </div>

            {user && watchlistStocks.length > 0 && (
              <Card className="liquid-glass">
                <CardHeader>
                  <CardTitle className="glass-subheading flex items-center">
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
                          variant="glass"
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

            {/* Popular Stocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stocksList.map((stock) => (
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
                      variant="glass"
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
                        <StarOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
              
              {stocksList.length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <p className="text-muted-foreground">No stocks available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Insights;
