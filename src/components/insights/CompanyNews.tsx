
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CompanyNewsProps {
  ticker: string;
}

const CompanyNews: React.FC<CompanyNewsProps> = ({ ticker }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company News</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Company news for {ticker} coming soon...</p>
      </CardContent>
    </Card>
  );
};

export default CompanyNews;
