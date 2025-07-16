
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
            <div className="h-24 w-32 bg-gray-200 rounded-2xl"></div>
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
          <div
            key={index.symbol}
            className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10 p-4 min-w-[140px]"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-inter font-normal tracking-tighter text-sm text-muted-foreground">
                {index.name}
              </p>
              <span 
                className={`text-xs px-2 py-1 rounded-xl ${
                  isPositive 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {isPositive ? '+' : ''}{index.changesPercentage.toFixed(2)}%
              </span>
            </div>
            <div className="text-2xl font-inter font-normal tracking-tighter mb-1">
              {formatNumber(index.price)}
            </div>
            <div className={`flex items-center text-xs ${
              isPositive ? 'text-green-300' : 'text-red-300'
            }`}>
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              <span>
                {isPositive ? '+' : ''}{index.change.toFixed(2)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MarketIndices;
