
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowDownRight, ArrowUpRight, Briefcase, Plus, Trash2 } from 'lucide-react';

// Mock data
const mockPortfolios = [
  {
    id: 1,
    name: 'Long-Term Growth',
    holdings: [
      { id: 1, ticker: 'AAPL', companyName: 'Apple Inc.', shares: 10, purchasePrice: 175.23, currentPrice: 189.84 },
      { id: 2, ticker: 'MSFT', companyName: 'Microsoft Corporation', shares: 5, purchasePrice: 380.45, currentPrice: 410.34 },
      { id: 3, ticker: 'GOOGL', companyName: 'Alphabet Inc.', shares: 8, purchasePrice: 140.30, currentPrice: 156.57 },
    ]
  },
  {
    id: 2,
    name: 'Dividend Income',
    holdings: [
      { id: 1, ticker: 'JNJ', companyName: 'Johnson & Johnson', shares: 15, purchasePrice: 152.75, currentPrice: 147.89 },
      { id: 2, ticker: 'PG', companyName: 'Procter & Gamble Co.', shares: 12, purchasePrice: 145.30, currentPrice: 156.24 },
      { id: 3, ticker: 'KO', companyName: 'The Coca-Cola Company', shares: 25, purchasePrice: 58.45, currentPrice: 61.78 },
    ]
  }
];

const Portfolios = () => {
  const [portfolios, setPortfolios] = useState(mockPortfolios);
  const [activePortfolio, setActivePortfolio] = useState(portfolios[0].id.toString());
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [isAddPortfolioOpen, setIsAddPortfolioOpen] = useState(false);
  
  // New holding form state
  const [newHolding, setNewHolding] = useState({
    ticker: '',
    shares: '',
    purchasePrice: ''
  });
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  
  const currentPortfolio = portfolios.find(p => p.id.toString() === activePortfolio);
  
  const handleAddPortfolio = () => {
    if (!newPortfolioName.trim()) return;
    
    const newPortfolio = {
      id: portfolios.length + 1,
      name: newPortfolioName,
      holdings: []
    };
    
    setPortfolios([...portfolios, newPortfolio]);
    setNewPortfolioName('');
    setIsAddPortfolioOpen(false);
    setActivePortfolio(newPortfolio.id.toString());
  };
  
  const handleAddHolding = () => {
    if (!newHolding.ticker || !newHolding.shares || !newHolding.purchasePrice) return;
    
    const updatedPortfolios = portfolios.map(portfolio => {
      if (portfolio.id.toString() === activePortfolio) {
        const newId = portfolio.holdings.length > 0 
          ? Math.max(...portfolio.holdings.map(h => h.id)) + 1 
          : 1;
        
        return {
          ...portfolio,
          holdings: [
            ...portfolio.holdings,
            {
              id: newId,
              ticker: newHolding.ticker,
              companyName: `${newHolding.ticker} Company`, // Placeholder, would be fetched from API
              shares: parseFloat(newHolding.shares),
              purchasePrice: parseFloat(newHolding.purchasePrice),
              currentPrice: parseFloat(newHolding.purchasePrice) * 1.02 // Mock current price
            }
          ]
        };
      }
      return portfolio;
    });
    
    setPortfolios(updatedPortfolios);
    setNewHolding({
      ticker: '',
      shares: '',
      purchasePrice: ''
    });
    setIsAddHoldingOpen(false);
  };
  
  const handleDeleteHolding = (holdingId: number) => {
    const updatedPortfolios = portfolios.map(portfolio => {
      if (portfolio.id.toString() === activePortfolio) {
        return {
          ...portfolio,
          holdings: portfolio.holdings.filter(h => h.id !== holdingId)
        };
      }
      return portfolio;
    });
    
    setPortfolios(updatedPortfolios);
  };
  
  const calculatePortfolioValue = (holdings: typeof currentPortfolio.holdings) => {
    return holdings.reduce((total, holding) => {
      return total + (holding.currentPrice * holding.shares);
    }, 0);
  };
  
  const calculatePortfolioCost = (holdings: typeof currentPortfolio.holdings) => {
    return holdings.reduce((total, holding) => {
      return total + (holding.purchasePrice * holding.shares);
    }, 0);
  };
  
  const calculatePortfolioReturn = (holdings: typeof currentPortfolio.holdings) => {
    const cost = calculatePortfolioCost(holdings);
    const value = calculatePortfolioValue(holdings);
    return ((value - cost) / cost) * 100;
  };

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
        
        <Tabs value={activePortfolio} onValueChange={setActivePortfolio}>
          <TabsList className="mb-6">
            {portfolios.map(portfolio => (
              <TabsTrigger key={portfolio.id} value={portfolio.id.toString()}>
                {portfolio.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {portfolios.map(portfolio => (
            <TabsContent key={portfolio.id} value={portfolio.id.toString()} className="mt-0">
              {portfolio.holdings.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500">
                          Current Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ${calculatePortfolioValue(portfolio.holdings).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500">
                          Total Cost Basis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ${calculatePortfolioCost(portfolio.holdings).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500">
                          Total Return
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const returnPct = calculatePortfolioReturn(portfolio.holdings);
                          const isPositive = returnPct >= 0;
                          
                          return (
                            <div className={`text-2xl font-bold flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {isPositive ? (
                                <ArrowUpRight className="h-5 w-5 mr-1" />
                              ) : (
                                <ArrowDownRight className="h-5 w-5 mr-1" />
                              )}
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
                      <CardDescription>
                        Individual stocks in your {portfolio.name} portfolio
                      </CardDescription>
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
                              <th className="text-center py-3 px-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {portfolio.holdings.map(holding => {
                              const returnPct = ((holding.currentPrice - holding.purchasePrice) / holding.purchasePrice) * 100;
                              const isPositive = returnPct >= 0;
                              
                              return (
                                <tr key={holding.id} className="border-b">
                                  <td className="py-3 px-4 font-medium">{holding.ticker}</td>
                                  <td className="py-3 px-4">{holding.companyName}</td>
                                  <td className="py-3 px-4 text-right">{holding.shares.toLocaleString()}</td>
                                  <td className="py-3 px-4 text-right">${holding.purchasePrice.toFixed(2)}</td>
                                  <td className="py-3 px-4 text-right">${holding.currentPrice.toFixed(2)}</td>
                                  <td className="py-3 px-4 text-right font-medium">
                                    ${(holding.shares * holding.currentPrice).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </td>
                                  <td className={`py-3 px-4 text-right ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    <div className="flex items-center justify-end">
                                      {isPositive ? (
                                        <ArrowUpRight className="h-4 w-4 mr-1" />
                                      ) : (
                                        <ArrowDownRight className="h-4 w-4 mr-1" />
                                      )}
                                      {isPositive ? '+' : ''}{returnPct.toFixed(2)}%
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleDeleteHolding(holding.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-gray-500" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t pt-6">
                      <Dialog open={isAddHoldingOpen} onOpenChange={setIsAddHoldingOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Holding
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Holding</DialogTitle>
                            <DialogDescription>
                              Enter the details of your stock purchase.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4 space-y-4">
                            <div>
                              <Label htmlFor="ticker">Ticker Symbol</Label>
                              <Input
                                id="ticker"
                                value={newHolding.ticker}
                                onChange={(e) => setNewHolding({...newHolding, ticker: e.target.value.toUpperCase()})}
                                placeholder="e.g., AAPL"
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label htmlFor="shares">Number of Shares</Label>
                              <Input
                                id="shares"
                                type="number"
                                value={newHolding.shares}
                                onChange={(e) => setNewHolding({...newHolding, shares: e.target.value})}
                                placeholder="e.g., 10"
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label htmlFor="purchase-price">Purchase Price per Share</Label>
                              <Input
                                id="purchase-price"
                                type="number"
                                value={newHolding.purchasePrice}
                                onChange={(e) => setNewHolding({...newHolding, purchasePrice: e.target.value})}
                                placeholder="e.g., 150.75"
                                className="mt-2"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddHoldingOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddHolding}>Add Holding</Button>
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
                  <p className="text-gray-500 mb-6">Add your first holding to start tracking your investments</p>
                  <Dialog open={isAddHoldingOpen} onOpenChange={setIsAddHoldingOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Holding
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Holding</DialogTitle>
                        <DialogDescription>
                          Enter the details of your stock purchase.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div>
                          <Label htmlFor="ticker-empty">Ticker Symbol</Label>
                          <Input
                            id="ticker-empty"
                            value={newHolding.ticker}
                            onChange={(e) => setNewHolding({...newHolding, ticker: e.target.value.toUpperCase()})}
                            placeholder="e.g., AAPL"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shares-empty">Number of Shares</Label>
                          <Input
                            id="shares-empty"
                            type="number"
                            value={newHolding.shares}
                            onChange={(e) => setNewHolding({...newHolding, shares: e.target.value})}
                            placeholder="e.g., 10"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="purchase-price-empty">Purchase Price per Share</Label>
                          <Input
                            id="purchase-price-empty"
                            type="number"
                            value={newHolding.purchasePrice}
                            onChange={(e) => setNewHolding({...newHolding, purchasePrice: e.target.value})}
                            placeholder="e.g., 150.75"
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddHoldingOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddHolding}>Add Holding</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Portfolios;
