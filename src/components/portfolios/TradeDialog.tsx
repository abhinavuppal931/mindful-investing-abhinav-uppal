
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { fmpAPI } from '@/services/api';

interface TradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
  onTradeAdded: (trade: any) => Promise<void>;
}

const TradeDialog = ({ open, onOpenChange, portfolioId, onTradeAdded }: TradeDialogProps) => {
  const [ticker, setTicker] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchStocks = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await fmpAPI.searchSymbol(query);
      setSearchResults(results?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectStock = (stock: any) => {
    setTicker(stock.symbol);
    setCompanyName(stock.name);
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!ticker || !shares || !price || !portfolioId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const trade = {
        portfolio_id: portfolioId,
        ticker_symbol: ticker.toUpperCase(),
        company_name: companyName || ticker.toUpperCase(),
        action,
        shares: parseFloat(shares),
        price_per_share: parseFloat(price),
        trade_date: tradeDate,
        notes: notes || null
      };

      await onTradeAdded(trade);
      
      // Reset form
      setTicker('');
      setCompanyName('');
      setAction('buy');
      setShares('');
      setPrice('');
      setTradeDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setSearchResults([]);
      
      onOpenChange(false);
      toast({
        title: "Success",
        description: `${action === 'buy' ? 'Buy' : 'Sell'} trade added successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add trade",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Trade</DialogTitle>
          <DialogDescription>
            Record a {action} transaction for your portfolio
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Action Toggle */}
          <div>
            <Label htmlFor="action">Trade Action</Label>
            <Select value={action} onValueChange={(value: 'buy' | 'sell') => setAction(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">
                  <span className="flex items-center">
                    <Badge variant="default" className="mr-2 bg-green-100 text-green-800">BUY</Badge>
                    Purchase shares
                  </span>
                </SelectItem>
                <SelectItem value="sell">
                  <span className="flex items-center">
                    <Badge variant="secondary" className="mr-2 bg-red-100 text-red-800">SELL</Badge>
                    Sell shares
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stock Search */}
          <div className="relative">
            <Label htmlFor="ticker">Stock Symbol</Label>
            <Input
              id="ticker"
              value={ticker}
              onChange={(e) => {
                setTicker(e.target.value);
                searchStocks(e.target.value);
              }}
              placeholder="Search by symbol or company name"
              className="mt-2"
            />
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    onClick={() => selectStock(stock)}
                  >
                    <div className="font-medium">{stock.symbol}</div>
                    <div className="text-sm text-gray-600 truncate">{stock.name}</div>
                  </div>
                ))}
              </div>
            )}
            
            {isSearching && (
              <div className="absolute right-3 top-10 text-gray-400">
                Searching...
              </div>
            )}
          </div>

          {/* Shares */}
          <div>
            <Label htmlFor="shares">Number of Shares</Label>
            <Input
              id="shares"
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="100"
              className="mt-2"
              min="1"
              step="1"
            />
          </div>

          {/* Price */}
          <div>
            <Label htmlFor="price">Price per Share ($)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="150.00"
              className="mt-2"
              min="0"
              step="0.01"
            />
          </div>

          {/* Trade Date */}
          <div>
            <Label htmlFor="trade-date">Trade Date</Label>
            <Input
              id="trade-date"
              type="date"
              value={tradeDate}
              onChange={(e) => setTradeDate(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this trade..."
              className="mt-2"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : `Add ${action === 'buy' ? 'Buy' : 'Sell'} Trade`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TradeDialog;
