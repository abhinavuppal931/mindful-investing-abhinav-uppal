
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

interface DecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecisionAdded: (decision: any) => Promise<void>;
}

const DecisionDialog = ({ open, onOpenChange, onDecisionAdded }: DecisionDialogProps) => {
  const [decision, setDecision] = useState({
    ticker_symbol: '',
    action: 'buy' as 'buy' | 'sell',
    shares: '',
    price_per_share: '',
    emotional_state: 50,
    based_on_fundamentals: false,
    fits_strategy: false,
    not_reacting_to_news: false
  });

  const handleSubmit = async () => {
    if (!decision.ticker_symbol || !decision.shares || !decision.price_per_share) {
      toast({ 
        title: "Error", 
        description: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }

    try {
      await onDecisionAdded({
        ticker_symbol: decision.ticker_symbol.toUpperCase(),
        action: decision.action,
        shares: parseFloat(decision.shares),
        price_per_share: parseFloat(decision.price_per_share),
        emotional_state: decision.emotional_state,
        based_on_fundamentals: decision.based_on_fundamentals,
        fits_strategy: decision.fits_strategy,
        not_reacting_to_news: decision.not_reacting_to_news,
        decision_date: new Date().toISOString().split('T')[0]
      });

      setDecision({
        ticker_symbol: '',
        action: 'buy',
        shares: '',
        price_per_share: '',
        emotional_state: 50,
        based_on_fundamentals: false,
        fits_strategy: false,
        not_reacting_to_news: false
      });
      onOpenChange(false);
      toast({ title: "Success", description: "Decision recorded successfully" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to record decision",
        variant: "destructive" 
      });
    }
  };

  const getEmotionalStateLabel = (value: number) => {
    if (value <= 30) return 'Fearful';
    if (value <= 70) return 'Neutral';
    return 'Confident';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record New Decision</DialogTitle>
          <DialogDescription>
            Track your investment decision and analyze potential biases.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ticker">Ticker Symbol</Label>
              <Input
                id="ticker"
                value={decision.ticker_symbol}
                onChange={(e) => setDecision({...decision, ticker_symbol: e.target.value.toUpperCase()})}
                placeholder="e.g., AAPL"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Select value={decision.action} onValueChange={(value: 'buy' | 'sell') => setDecision({...decision, action: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shares">Shares</Label>
              <Input
                id="shares"
                type="number"
                value={decision.shares}
                onChange={(e) => setDecision({...decision, shares: e.target.value})}
                placeholder="100"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="price">Price per Share</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={decision.price_per_share}
                onChange={(e) => setDecision({...decision, price_per_share: e.target.value})}
                placeholder="150.00"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Emotional State: {getEmotionalStateLabel(decision.emotional_state)}</Label>
            <Slider
              value={[decision.emotional_state]}
              onValueChange={(value) => setDecision({...decision, emotional_state: value[0]})}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="fundamentals">Based on fundamentals?</Label>
              <Switch
                id="fundamentals"
                checked={decision.based_on_fundamentals}
                onCheckedChange={(checked) => setDecision({...decision, based_on_fundamentals: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="strategy">Fits long-term strategy?</Label>
              <Switch
                id="strategy"
                checked={decision.fits_strategy}
                onCheckedChange={(checked) => setDecision({...decision, fits_strategy: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="news">Not reacting to news/price?</Label>
              <Switch
                id="news"
                checked={decision.not_reacting_to_news}
                onCheckedChange={(checked) => setDecision({...decision, not_reacting_to_news: checked})}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Record Decision</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DecisionDialog;
