import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Briefcase, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolios, usePortfolioWithPrices } from '@/hooks/usePortfolios';
import PortfolioMetrics from '@/components/portfolios/PortfolioMetrics';
import HoldingsTable from '@/components/portfolios/HoldingsTable';
import TradeDialog from '@/components/portfolios/TradeDialog';
import PortfolioDialog from '@/components/portfolios/PortfolioDialog';
import EmptyPortfolioState from '@/components/portfolios/EmptyPortfolioState';

const Portfolios = () => {
  const { user } = useAuth();
  const { portfolios, loading: portfoliosLoading, createPortfolio } = usePortfolios();
  const [activePortfolio, setActivePortfolio] = useState<string>('');
  const [isAddPortfolioOpen, setIsAddPortfolioOpen] = useState(false);
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);

  // Get holdings with real-time prices for active portfolio
  const { holdings, createTrade, loading: holdingsLoading } = usePortfolioWithPrices(activePortfolio || undefined);
  
  // Set first portfolio as active when portfolios load
  React.useEffect(() => {
    if (portfolios.length > 0 && !activePortfolio) {
      setActivePortfolio(portfolios[0].id);
    }
  }, [portfolios, activePortfolio]);

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
            <PortfolioDialog 
              open={isAddPortfolioOpen}
              onOpenChange={setIsAddPortfolioOpen}
              onPortfolioCreated={createPortfolio}
              onPortfolioSelected={setActivePortfolio}
            />
          </Dialog>
        </div>
        
        {portfolios.length === 0 ? (
          <EmptyPortfolioState
            onCreatePortfolio={() => setIsAddPortfolioOpen(true)}
            onAddTrade={() => setIsAddTradeOpen(true)}
            hasPortfolios={false}
          />
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
                {holdingsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mindful-600 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading portfolio data...</p>
                  </div>
                ) : holdings.length > 0 ? (
                  <>
                    <PortfolioMetrics holdings={holdings} />
                    <HoldingsTable 
                      holdings={holdings}
                      portfolioName={portfolio.name}
                      onAddTrade={() => setIsAddTradeOpen(true)}
                    />
                  </>
                ) : (
                  <EmptyPortfolioState
                    onCreatePortfolio={() => setIsAddPortfolioOpen(true)}
                    onAddTrade={() => setIsAddTradeOpen(true)}
                    hasPortfolios={true}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        <TradeDialog
          open={isAddTradeOpen}
          onOpenChange={setIsAddTradeOpen}
          portfolioId={activePortfolio}
          onTradeAdded={createTrade}
        />
      </div>
    </MainLayout>
  );
};

export default Portfolios;
