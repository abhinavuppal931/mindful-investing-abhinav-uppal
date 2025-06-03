
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WizardData } from '../DecisionWizard';

interface TradeDetailsStepProps {
  data: WizardData;
  onChange: (data: Partial<WizardData>) => void;
}

const TradeDetailsStep = ({ data, onChange }: TradeDetailsStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">What trade are you considering?</h3>
        <p className="text-gray-600">Let's start with the basic details of your trade.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ticker">Ticker Symbol</Label>
          <Input
            id="ticker"
            value={data.ticker_symbol}
            onChange={(e) => onChange({ ticker_symbol: e.target.value.toUpperCase() })}
            placeholder="e.g., AAPL"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="action">Action</Label>
          <Select 
            value={data.action} 
            onValueChange={(value: 'buy' | 'sell') => onChange({ action: value })}
          >
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
          <Label htmlFor="shares">Number of Shares</Label>
          <Input
            id="shares"
            type="number"
            value={data.shares}
            onChange={(e) => onChange({ shares: e.target.value })}
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
            value={data.price_per_share}
            onChange={(e) => onChange({ price_per_share: e.target.value })}
            placeholder="150.00"
            className="mt-1"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Trade Summary:</strong> {data.action.toUpperCase()} {data.shares || '0'} shares of {data.ticker_symbol || 'TICKER'} at ${data.price_per_share || '0.00'} per share
        </p>
      </div>
    </div>
  );
};

export default TradeDetailsStep;
