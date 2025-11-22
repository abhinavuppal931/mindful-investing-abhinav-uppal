
import React from 'react';
import { ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StockLogo from '@/components/insights/StockLogo';
import { formatCurrency, formatNumber } from '@/utils/formatUtils';

interface StockCardProps {
  ticker: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  onClick?: () => void;
}

const StockCard: React.FC<StockCardProps> = ({
  ticker,
  companyName,
  price,
  change,
  changePercent,
  onClick
}) => {
  const isPositive = change >= 0;

  return (
    <div className="liquid-glass group cursor-pointer hover:scale-105 transition-all duration-300">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <StockLogo ticker={ticker} size={32} className="flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-lg font-light tracking-tight">{ticker}</h3>
            <p className="text-sm text-muted-foreground font-light truncate max-w-[150px]">{companyName}</p>
          </div>
        </div>
        <Button 
          variant="glass" 
          size="icon" 
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onClick}
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mt-4">
        <div className="text-2xl font-light tracking-tight">{formatCurrency(price)}</div>
        <div className={`flex items-center mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 mr-1" />
          )}
          <span className="text-sm font-light">
            {isPositive ? '+' : ''}{formatNumber(change)} ({isPositive ? '+' : ''}{formatNumber(changePercent)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default StockCard;
