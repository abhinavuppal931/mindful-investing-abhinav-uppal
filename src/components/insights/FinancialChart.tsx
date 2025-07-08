
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface FinancialChartProps {
  ticker: string;
}

const FinancialChart: React.FC<FinancialChartProps> = ({ ticker }) => {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Financial charts for {ticker} coming soon...</p>
      </div>
    </div>
  );
};

export default FinancialChart;
