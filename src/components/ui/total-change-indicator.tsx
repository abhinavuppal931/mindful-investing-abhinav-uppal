
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface TotalChangeIndicatorProps {
  startValue: number;
  endValue: number;
  className?: string;
}

export const TotalChangeIndicator: React.FC<TotalChangeIndicatorProps> = ({
  startValue,
  endValue,
  className = ''
}) => {
  const calculatePercentageChange = (start: number, end: number) => {
    if (start === 0) return 0;
    return ((end - start) / Math.abs(start)) * 100;
  };

  const percentageChange = calculatePercentageChange(startValue, endValue);
  const isPositive = percentageChange >= 0;

  return (
    <div className={`flex justify-center ${className}`}>
      <Badge 
        variant={isPositive ? "default" : "destructive"}
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          isPositive 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'bg-red-500 text-white hover:bg-red-600'
        }`}
      >
        Total Change: {isPositive ? '+' : ''}{percentageChange.toFixed(1)}%
      </Badge>
    </div>
  );
};
