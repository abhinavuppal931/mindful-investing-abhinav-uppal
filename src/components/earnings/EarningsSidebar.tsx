
import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, Sun, Moon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { EarningsEvent } from '@/hooks/useEarningsData';
import StockLogo from '@/components/insights/StockLogo';

interface EarningsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCompany?: EarningsEvent;
  overflowCompanies?: EarningsEvent[];
  overflowDate?: Date;
}

const EarningsSidebar: React.FC<EarningsSidebarProps> = ({
  isOpen,
  onClose,
  selectedCompany,
  overflowCompanies,
  overflowDate
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const formatRevenue = (revenue: number | null | undefined): string => {
    if (!revenue) return '-';
    
    if (revenue >= 1000000000) {
      return `$${(revenue / 1000000000).toFixed(1)}B`;
    } else {
      return `$${(revenue / 1000000).toFixed(1)}M`;
    }
  };

  const filteredOverflowCompanies = overflowCompanies?.filter(company =>
    company.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const renderCompanyDetails = (company: EarningsEvent) => (
    <Card key={company.symbol} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-4">
          <StockLogo ticker={company.symbol} size={40} />
          <div>
            <h3 className="font-semibold text-lg">{company.symbol}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{format(new Date(company.date), 'MMM d, yyyy')}</span>
              <div className="flex items-center">
                {company.hour === 'bmo' ? (
                  <>
                    <Sun className="h-4 w-4 mr-1 text-yellow-500" />
                    <span>Before Open</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-1 text-blue-500" />
                    <span>After Close</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Revenue</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimate:</span>
                <span className="font-medium">
                  {formatRevenue(company.revenueEstimate)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Actual:</span>
                <span className="font-medium">
                  {formatRevenue(company.revenueActual)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">EPS</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimate:</span>
                <span className="font-medium">
                  {company.epsEstimate ? `$${company.epsEstimate.toFixed(2)}` : '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Actual:</span>
                <span className="font-medium">
                  {company.epsActual ? `$${company.epsActual.toFixed(2)}` : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-lg z-50 transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            {selectedCompany ? 'Earnings Details' : `Earnings for ${overflowDate ? format(overflowDate, 'MMM d, yyyy') : ''}`}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {overflowCompanies && overflowCompanies.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search companies..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          {selectedCompany && renderCompanyDetails(selectedCompany)}
          
          {overflowCompanies && overflowCompanies.length > 0 && (
            <div className="space-y-2">
              {(searchQuery ? filteredOverflowCompanies : overflowCompanies).map((company, index) => renderCompanyDetails(company))}
              
              {searchQuery && filteredOverflowCompanies.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No companies found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default EarningsSidebar;
