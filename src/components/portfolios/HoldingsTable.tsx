
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react';

interface Holding {
  ticker: string;
  companyName: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  return: number;
}

interface HoldingsTableProps {
  holdings: Holding[];
  portfolioName: string;
  onAddTrade: () => void;
}

const HoldingsTable = ({ holdings, portfolioName, onAddTrade }: HoldingsTableProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
        <CardDescription>Individual stocks in your {portfolioName} portfolio</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Ticker</th>
                <th className="text-left py-3 px-4">Company</th>
                <th className="text-right py-3 px-4">Shares</th>
                <th className="text-right py-3 px-4">Avg. Price</th>
                <th className="text-right py-3 px-4">Current Price</th>
                <th className="text-right py-3 px-4">Total Value</th>
                <th className="text-right py-3 px-4">Return</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map(holding => {
                const isPositive = holding.return >= 0;
                
                return (
                  <tr key={holding.ticker} className="border-b">
                    <td className="py-3 px-4 font-medium">{holding.ticker}</td>
                    <td className="py-3 px-4">{holding.companyName}</td>
                    <td className="py-3 px-4 text-right">{holding.shares.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">${holding.avgPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">${holding.currentPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      ${holding.totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td className={`py-3 px-4 text-right ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      <div className="flex items-center justify-end">
                        {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                        {isPositive ? '+' : ''}{holding.return.toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <Button variant="outline" className="flex items-center" onClick={onAddTrade}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Trade
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HoldingsTable;
