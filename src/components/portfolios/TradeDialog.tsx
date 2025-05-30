
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Trade } from '@/hooks/usePortfolios';

interface TradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
  onTradeAdded: (trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const TradeDialog = ({ open, onOpenChange, portfolioId, onTradeAdded }: TradeDialogProps) => {
  const [newTrade, setNewTrade] = useState({
    ticker_symbol: '',
    company_name: '',
    shares: '',
    price_per_share: '',
    action: 'buy' as 'buy' | 'sell'
  });

  const handleAddTrade = async () => {
    if (!newTrade.ticker_symbol || !newTrade.shares || !newTrade.price_per_share || !portfolioId) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    
    try {
      await onTradeAdded({
        portfolio_id: portfolioId,
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
      onOpenChange(false);
      toast({ title: "Success", description: "Trade added successfully" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to add trade",
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAddTrade}>Add Trade</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TradeDialog;
