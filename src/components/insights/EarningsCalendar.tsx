
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EarningsCalendarProps {
  ticker: string;
}

const EarningsCalendar: React.FC<EarningsCalendarProps> = ({ ticker }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Earnings calendar for {ticker} coming soon...</p>
      </CardContent>
    </Card>
  );
};

export default EarningsCalendar;
