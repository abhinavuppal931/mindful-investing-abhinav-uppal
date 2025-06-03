
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeeklyStatsCardsProps {
  stats: {
    totalDecisions: number;
    rationalDecisions: number;
    rationalPercentage: number;
  };
}

const WeeklyStatsCards = ({ stats }: WeeklyStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDecisions}</div>
          <p className="text-sm text-gray-600">Total Decisions</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">Rational Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.rationalDecisions}</div>
          <p className="text-sm text-gray-600">Based on Logic</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">Rationality Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-mindful-600">{stats.rationalPercentage}%</div>
          <p className="text-sm text-gray-600">This Week</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyStatsCards;
