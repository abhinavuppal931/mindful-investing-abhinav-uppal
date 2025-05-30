import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowDownRight, ArrowUpRight, Briefcase, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolios, useTrades } from '@/hooks/usePortfolios';
import { toast } from '@/hooks/use-toast';

const Portfolios = () => {
  const { user } = useAuth();
  const { portfolios, loading: portfoliosLoading, createPortfolio, deletePortfolio } = usePortfolios();
  const [activePortfolio, setActivePortfolio] = useState<string>('');
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDescription, setNewPortfolioDescription] = useState('');
  const [isAddPortfolioOpen, setIsAddPortfolioOpen] = useState(false);
  
  // New trade form state
  const [newTrade, setNewTrade] = useState({
    ticker_symbol: '',
    company_name: '',
    shares: '',
    price_per_share: '',
    action: 'buy' as 'buy' | 'sell'
  });
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);

  // Get trades for active portfolio
  const { trades, loading: tradesLoading, createTrade, deleteTrade } = useTrades(activePortfolio || undefined);
  
  // Set first portfolio as active when portfolios load
  React.useEffect(() => {
    if (portfolios.length > 0 && !activePortfolio) {
      setActivePortfolio(portfolios[0].id);
    }
  }, [portfolios, activePortfolio]);

  const handleAddPortfolio = async () => {
    if (!newPortfolioName.trim()) {
      toast({ title: "Error", description: "Portfolio name is required", variant: "destructive" });
      return;
    }
    
    try {
      const portfolio = await createPortfolio(newPortfolioName, newPortfolioDescription || undefined);
      setNewPortfolioName('');
      setNewPortfolioDescription('');
      setIsAddPortfolioOpen(false);
      setActivePortfolio(portfolio.id);
      toast({ title: "Success", description: "Portfolio created successfully" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create portfolio",
        variant: "destructive" 
      });
    }
  };
  
  const handleAddTrade = async () => {
    if (!newTrade.ticker_symbol || !newTrade.shares || !newTrade.price_per_share || !activePortfolio) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    
    try {
      await createTrade({
        portfolio_id: activePortfolio,
        ticker_symbol: newTrade.ticker_symbol.toUpperCase(),
        company_name: newTrade.company_name || null,
        action: newTrade.action,
        shares: parseFloat(newTrade.shares),
        price_per_share: parseFloat(newTrade.price_per_share),
        trade_date: new Date().toISOString().split('T')[0],
        notes: null
      });
      
      setNewTrade({
        ticker_symbol: '',
        company_name: '',
        shares: '',
        price_per_share: '',
        action: 'buy'
      });
      setIsAddTradeOpen(false);
      toast({ title: "Success", description: "Trade added successfully" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to add trade",
        variant: "destructive" 
      });
    }
  };
  
  const handleDeleteTrade = async (tradeId: string) => {
    try {
      await deleteTrade(tradeId);
      toast({ title: "Success", description: "Trade deleted successfully" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to delete trade",
        variant: "destructive" 
      });
    }
  };

  // Calculate portfolio metrics based on trades
  const calculateHoldings = () => {
    const holdings = new Map();
    
    trades.forEach(trade => {
      const key = trade.ticker_symbol;
      if (!holdings.has(key)) {
        holdings.set(key, {
          ticker: trade.ticker_symbol,
          companyName: trade.company_name || trade.ticker_symbol,
          totalShares: 0,
          totalCost: 0,
          trades: []
        });
      }
      
      const holding = holdings.get(key);
      if (trade.action === 'buy') {
        holding.totalShares += trade.shares;
        holding.totalCost += trade.shares * trade.price_per_share;
      } else {
        holding.totalShares -= trade.shares;
        holding.totalCost -= trade.shares * trade.price_per_share;
      }
      holding.trades.push(trade);
    });

    return Array.from(holdings.values()).filter(h => h.totalShares > 0).map(holding => ({
      ticker: holding.ticker,
      companyName: holding.companyName,
      shares: holding.totalShares,
      avgPrice: holding.totalCost / holding.totalShares,
      currentPrice: holding.avgPrice * 1.02, // Mock current price
      totalValue: holding.totalShares * (holding.avgPrice * 1.02),
      return: ((holding.avgPrice * 1.02) - holding.avgPrice) / holding.avgPrice * 100
    }));
  };

  const holdings = calculateHoldings();
  const currentPortfolio = portfolios.find(p => p.id === activePortfolio);

  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold mb-4">Please sign in to view your portfolios</h2>
          <p className="text-muted-foreground">You need to be authenticated to manage your investment portfolios.</p>
        </div>
      </MainLayout>
    );
  }

  if (portfoliosLoading) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mindful-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading portfolios...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Briefcase className="mr-2 h-8 w-8 text-mindful-600" />
              Portfolios
            </h1>
            <p className="text-gray-600 mt-1">
              Track your investments and monitor performance
            </p>
          </div>
          
          <Dialog open={isAddPortfolioOpen} onOpenChange={setIsAddPortfolioOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                New Portfolio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Portfolio</DialogTitle>
                <DialogDescription>
                  Give your new portfolio a name and optional description.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <Label htmlFor="portfolio-name">Portfolio Name</Label>
                  <Input
                    id="portfolio-name"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                    placeholder="e.g., Tech Stocks, Retirement, etc."
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="portfolio-description">Description (Optional)</Label>
                  <Input
                    id="portfolio-description"
                    value={newPortfolioDescription}
                    onChange={(e) => setNewPortfolioDescription(e.target.value)}
                    placeholder="Brief description of your portfolio strategy"
                    className="mt-2"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddPortfolioOpen(false)}>Cancel</Button>
                <Button onClick={handleAddPortfolio}>Create Portfolio</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {portfolios.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-300 rounded-lg">
            <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No portfolios yet</h3>
            <p className="text-gray-500 mb-6">Create your first portfolio to start tracking your investments</p>
            <Dialog open={isAddPortfolioOpen} onOpenChange={setIsAddPortfolioOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Portfolio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Portfolio</DialogTitle>
                  <DialogDescription>
                    Give your new portfolio a name to get started.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="portfolio-name">Portfolio Name</Label>
                  <Input
                    id="portfolio-name"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                    placeholder="e.g., Tech Stocks, Retirement, etc."
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddPortfolioOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddPortfolio}>Create Portfolio</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <Tabs value={activePortfolio} onValueChange={setActivePortfolio}>
            <TabsList className="mb-6">
              {portfolios.map(portfolio => (
                <TabsTrigger key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {portfolios.map(portfolio => (
              <TabsContent key={portfolio.id} value={portfolio.id} className="mt-0">
                {holdings.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-500">Current Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            ${holdings.reduce((sum, h) => sum + h.totalValue, 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-500">Total Cost Basis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            ${holdings.reduce((sum, h) => sum + (h.shares * h.avgPrice), 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-500">Total Return</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
                            const totalCost = holdings.reduce((sum, h) => sum + (h.shares * h.avgPrice), 0);
                            const returnPct = ((totalValue - totalCost) / totalCost) * 100;
                            const isPositive = returnPct >= 0;
                            
                            return (
                              <div className={`text-2xl font-bold flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? <ArrowUpRight className="h-5 w-5 mr-1" /> : <ArrowDownRight className="h-5 w-5 mr-1" />}
                                {isPositive ? '+' : ''}{returnPct.toFixed(2)}%
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Holdings</CardTitle>
                        <CardDescription>Individual stocks in your {portfolio.name} portfolio</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4">Ticker</th>
                                <th className="text-left py-3 px-4">Company</th>
                                <th className="text-right py-3 px-4">Shares</th>
                                <th className="text-right py-3 px-4">Avg. Price</th>
                                <th className="text-right py-3 px-4">Current Price</th>
                                <th className="text-right py-3 px-4">Total Value</th>
                                <th className="text-right py-3 px-4">Return</th>
                              </tr>
                            </thead>
                            <tbody>
                              {holdings.map(holding => {
                                const isPositive = holding.return >= 0;
                                
                                return (
                                  <tr key={holding.ticker} className="border-b">
                                    <td className="py-3 px-4 font-medium">{holding.ticker}</td>
                                    <td className="py-3 px-4">{holding.companyName}</td>
                                    <td className="py-3 px-4 text-right">{holding.shares.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-right">${holding.avgPrice.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-right">${holding.currentPrice.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-right font-medium">
                                      ${holding.totalValue.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}
                                    </td>
                                    <td className={`py-3 px-4 text-right ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                      <div className="flex items-center justify-end">
                                        {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                                        {isPositive ? '+' : ''}{holding.return.toFixed(2)}%
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-center border-t pt-6">
                        <Dialog open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex items-center">
                              <Plus className="h-4 w-4 mr-2" />
                              Add New Trade
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Trade</DialogTitle>
                              <DialogDescription>Enter the details of your stock transaction.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                              <div>
                                <Label htmlFor="ticker">Ticker Symbol</Label>
                                <Input
                                  id="ticker"
                                  value={newTrade.ticker_symbol}
                                  onChange={(e) => setNewTrade({...newTrade, ticker_symbol: e.target.value.toUpperCase()})}
                                  placeholder="e.g., AAPL"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="company">Company Name (Optional)</Label>
                                <Input
                                  id="company"
                                  value={newTrade.company_name}
                                  onChange={(e) => setNewTrade({...newTrade, company_name: e.target.value})}
                                  placeholder="e.g., Apple Inc."
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="shares">Number of Shares</Label>
                                <Input
                                  id="shares"
                                  type="number"
                                  value={newTrade.shares}
                                  onChange={(e) => setNewTrade({...newTrade, shares: e.target.value})}
                                  placeholder="e.g., 10"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="price">Price per Share</Label>
                                <Input
                                  id="price"
                                  type="number"
                                  step="0.01"
                                  value={newTrade.price_per_share}
                                  onChange={(e) => setNewTrade({...newTrade, price_per_share: e.target.value})}
                                  placeholder="e.g., 150.75"
                                  className="mt-2"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsAddTradeOpen(false)}>Cancel</Button>
                              <Button onClick={handleAddTrade}>Add Trade</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardFooter>
                    </Card>
                  </>
                ) : (
                  <div className="text-center py-20 border border-dashed border-gray-300 rounded-lg">
                    <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium mb-2">Your portfolio is empty</h3>
                    <p className="text-gray-500 mb-6">Add your first trade to start tracking your investments</p>
                    <Dialog open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Trade
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Trade</DialogTitle>
                          <DialogDescription>
                            Enter the details of your stock transaction.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div>
                            <Label htmlFor="ticker-empty">Ticker Symbol</Label>
                            <Input
                              id="ticker-empty"
                              value={newTrade.ticker_symbol}
                              onChange={(e) => setNewTrade({...newTrade, ticker_symbol: e.target.value.toUpperCase()})}
                              placeholder="e.g., AAPL"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="company">Company Name (Optional)</Label>
                            <Input
                              id="company"
                              value={newTrade.company_name}
                              onChange={(e) => setNewTrade({...newTrade, company_name: e.target.value})}
                              placeholder="e.g., Apple Inc."
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="shares-empty">Number of Shares</Label>
                            <Input
                              id="shares-empty"
                              type="number"
                              value={newTrade.shares}
                              onChange={(e) => setNewTrade({...newTrade, shares: e.target.value})}
                              placeholder="e.g., 10"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="price">Price per Share</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              value={newTrade.price_per_share}
                              onChange={(e) => setNewTrade({...newTrade, price_per_share: e.target.value})}
                              placeholder="e.g., 150.75"
                              className="mt-2"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddTradeOpen(false)}>Cancel</Button>
                          <Button onClick={handleAddTrade}>Add Trade</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
};

export default Portfolios;
