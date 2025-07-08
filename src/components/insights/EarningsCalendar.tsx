
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface EarningsCalendarProps {
  ticker: string;
}

const EarningsCalendar: React.FC<EarningsCalendarProps> = ({ ticker }) => {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Earnings calendar for {ticker} coming soon...</p>
      </div>
    </div>
  );
};

export default EarningsCalendar;
