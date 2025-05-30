
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface Holding {
  ticker: string;
  companyName: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  return: number;
}

interface PortfolioMetricsProps {
  holdings: Holding[];
}

const PortfolioMetrics = ({ holdings }: PortfolioMetricsProps) => {
  const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.shares * h.avgPrice), 0);
  const returnPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  const isPositive = returnPct >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">Current Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">Total Cost Basis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalCost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">Total Return</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight className="h-5 w-5 mr-1" /> : <ArrowDownRight className="h-5 w-5 mr-1" />}
            {isPositive ? '+' : ''}{returnPct.toFixed(2)}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioMetrics;
