
import React from 'react';
import { ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="stock-card group">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-bold">{ticker}</h3>
          <p className="text-sm text-gray-500 truncate max-w-[180px]">{companyName}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onClick}
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mt-4">
        <div className="text-2xl font-bold">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div className={`flex items-center mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 mr-1" />
          )}
          <span className="text-sm font-medium">
            {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default StockCard;
