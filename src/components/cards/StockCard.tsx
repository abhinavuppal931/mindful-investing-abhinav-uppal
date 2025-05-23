
import React from 'react';
import { ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseStringNumber } from '@/lib/api/stockService';

interface StockCardProps {
  ticker: string;
  companyName: string;
  price: string | number;
  change: string | number;
  changePercent: string | number;
  loading?: boolean;
  onClick?: () => void;
}

const StockCard: React.FC<StockCardProps> = ({
  ticker,
  companyName,
  price,
  change,
  changePercent,
  loading = false,
  onClick
}) => {
  const numericPrice = typeof price === 'string' ? parseStringNumber(price) : price;
  const numericChange = typeof change === 'string' ? parseStringNumber(change) : change;
  const numericChangePercent = typeof changePercent === 'string' ? parseStringNumber(changePercent) : changePercent;
  const isPositive = numericChange >= 0;

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
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className={`flex items-center mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              <span className="text-sm font-medium">
                {isPositive ? '+' : ''}{numericChange.toFixed(2)} ({isPositive ? '+' : ''}{numericChangePercent.toFixed(2)}%)
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockCard;
