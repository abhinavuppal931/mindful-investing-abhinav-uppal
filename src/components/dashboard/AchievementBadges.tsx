
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Target, Shield } from 'lucide-react';

interface AchievementBadgesProps {
  weeklyStats: {
    totalDecisions: number;
    rationalDecisions: number;
    rationalPercentage: number;
  };
}

const AchievementBadges = ({ weeklyStats }: AchievementBadgesProps) => {
  const badges = [
    {
      id: 'rational-investor',
      name: 'Rational Investor',
      description: 'Made 5 rational decisions this week',
      icon: Brain,
      earned: weeklyStats.rationalDecisions >= 5,
      color: 'bg-blue-500'
    },
    {
      id: 'consistent-trader',
      name: 'Consistent Trader',
      description: 'Made decisions 3 days in a row',
      icon: TrendingUp,
      earned: false, // Simple placeholder logic
      color: 'bg-green-500'
    },
    {
      id: 'disciplined-mind',
      name: 'Disciplined Mind',
      description: '80%+ rational decisions this week',
      icon: Target,
      earned: weeklyStats.rationalPercentage >= 80,
      color: 'bg-purple-500'
    },
    {
      id: 'bias-buster',
      name: 'Bias Buster',
      description: 'Avoided emotional trading for a week',
      icon: Shield,
      earned: weeklyStats.totalDecisions > 0 && weeklyStats.rationalPercentage === 100,
      color: 'bg-orange-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievement Badges</CardTitle>
        <CardDescription>
          Unlock badges by making rational investment decisions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map(badge => {
            const IconComponent = badge.icon;
            return (
              <div 
                key={badge.id}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  badge.earned 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${badge.color} ${
                  badge.earned ? 'text-white' : 'text-gray-400 bg-gray-300'
                } mb-3`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <h3 className="font-medium mb-1">{badge.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                <Badge variant={badge.earned ? "default" : "secondary"}>
                  {badge.earned ? "Earned" : "Locked"}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementBadges;
