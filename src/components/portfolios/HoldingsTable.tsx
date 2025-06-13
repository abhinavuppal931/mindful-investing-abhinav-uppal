
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDownRight, ArrowUpRight, Plus, Building2 } from 'lucide-react';

interface Holding {
  ticker: string;
  companyName: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  return: number;
  sector?: string;
  logoUrl?: string | null;
}

interface HoldingsTableProps {
  holdings: Holding[];
  portfolioName: string;
  onAddTrade: () => void;
}

const HoldingsTable = ({ holdings, portfolioName, onAddTrade }: HoldingsTableProps) => {
  const StockLogo = ({ logoUrl, ticker }: { logoUrl?: string | null; ticker: string }) => {
    if (logoUrl) {
      return (
        <img 
          src={logoUrl} 
          alt={`${ticker} logo`}
          className="w-8 h-8 rounded-full shadow-sm object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shadow-sm">
        <Building2 className="h-4 w-4 text-gray-400" />
      </div>
    );
  };

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
                <th className="text-left py-3 px-4">Stock</th>
                <th className="text-left py-3 px-4">Company & Sector</th>
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
                  <tr key={holding.ticker} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <StockLogo logoUrl={holding.logoUrl} ticker={holding.ticker} />
                        <span className="font-medium">{holding.ticker}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{holding.companyName}</span>
                        {holding.sector && holding.sector !== 'Unknown' && (
                          <Badge variant="outline" className="text-xs mt-1 w-fit">
                            {holding.sector}
                          </Badge>
                        )}
                      </div>
                    </td>
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
        <Button variant="outline" className="flex items-center hover:bg-gray-50" onClick={onAddTrade}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Trade
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HoldingsTable;
