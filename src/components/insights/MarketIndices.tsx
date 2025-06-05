
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useIndices } from '@/hooks/useIndices';

const MarketIndices = () => {
  const { indices, loading, error } = useIndices();

  if (loading) {
    return (
      <div className="flex space-x-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || indices.length === 0) {
    return null;
  }

  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    }
    return value.toFixed(2);
  };

  return (
    <div className="flex space-x-3">
      {indices.map((index) => {
        const isPositive = index.change >= 0;
        return (
          <Card key={index.symbol} className="min-w-[100px] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="text-xs font-medium text-gray-600 mb-1">
                {index.name}
              </div>
              <div className="text-sm font-bold mb-1">
                {formatNumber(index.price)}
              </div>
              <div className={`flex items-center text-xs ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                <span>
                  {isPositive ? '+' : ''}{index.changesPercentage.toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MarketIndices;
