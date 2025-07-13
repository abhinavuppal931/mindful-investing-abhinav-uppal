
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FinancialChartProps {
  ticker: string;
}

const FinancialChart: React.FC<FinancialChartProps> = ({ ticker }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Charts</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Financial charts for {ticker} coming soon...</p>
      </CardContent>
    </Card>
  );
};

export default FinancialChart;
