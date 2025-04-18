
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, BrainCircuit, BarChart3, Calendar, EyeOff, TrendingUp, BadgeCheck, Target, LineChart, BarChart } from 'lucide-react';

// Mock badges data
const badgesData = [
  {
    id: 1,
    name: "Rational Thinker",
    description: "Made 10 non-emotional decisions",
    icon: BrainCircuit,
    earned: true,
    date: "April 10, 2025",
    category: "mindset",
    level: 1
  },
  {
    id: 2,
    name: "Data Driven",
    description: "Consulted financial data for 25 decisions",
    icon: BarChart3,
    earned: true,
    date: "April 5, 2025",
    category: "analysis",
    level: 1
  },
  {
    id: 3,
    name: "Patience Master",
    description: "Held positions for 6+ months",
    icon: EyeOff,
    earned: true,
    date: "March 28, 2025",
    category: "discipline",
    level: 1
  },
  {
    id: 4,
    name: "Trend Spotter",
    description: "Identified 5 major market trends",
    icon: TrendingUp,
    earned: false,
    progress: 60,
    category: "analysis",
    level: 2
  },
  {
    id: 5,
    name: "Diamond Hands",
    description: "Maintained conviction through 20%+ volatility",
    icon: BadgeCheck,
    earned: false,
    progress: 75,
    category: "discipline",
    level: 2
  },
  {
    id: 6,
    name: "Calendar Sage",
    description: "Tracked 15 earnings reports and made accurate predictions",
    icon: Calendar,
    earned: false,
    progress: 40,
    category: "analysis",
    level: 2
  },
  {
    id: 7,
    name: "Sharp Focus",
    description: "Used Focus Mode for 30 consecutive days",
    icon: Target,
    earned: false,
    progress: 20,
    category: "mindset",
    level: 2
  },
  {
    id: 8,
    name: "Chart Master",
    description: "Analyzed 50 different chart patterns",
    icon: LineChart,
    earned: false,
    progress: 30,
    category: "analysis",
    level: 3
  },
  {
    id: 9,
    name: "Mindful Investor",
    description: "Completed 20 emotional bias checks before trading",
    icon: BrainCircuit,
    earned: false,
    progress: 45,
    category: "mindset",
    level: 3
  },
];

const Badges = () => {
  // Count badges by category
  const badgeCounts = {
    total: badgesData.length,
    earned: badgesData.filter(badge => badge.earned).length,
    mindset: badgesData.filter(badge => badge.category === 'mindset').length,
    analysis: badgesData.filter(badge => badge.category === 'analysis').length,
    discipline: badgesData.filter(badge => badge.category === 'discipline').length,
  };
  
  const earnedByCategory = {
    mindset: badgesData.filter(badge => badge.earned && badge.category === 'mindset').length,
    analysis: badgesData.filter(badge => badge.earned && badge.category === 'analysis').length,
    discipline: badgesData.filter(badge => badge.earned && badge.category === 'discipline').length,
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Award className="mr-2 h-8 w-8 text-mindful-600" />
            Achievement Badges
          </h1>
          <p className="text-gray-600 mt-1">
            Track your progress and earn badges for mindful investing practices
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="col-span-1 md:col-span-4 bg-gradient-to-r from-mindful-600 to-mindful-800 text-white">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold mb-1">Badge Progress</h2>
                  <p className="text-mindful-100">
                    You've earned {badgeCounts.earned} out of {badgeCounts.total} available badges
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="h-10 w-10 text-mindful-100" />
                  <div className="text-3xl font-bold">{Math.round((badgeCounts.earned / badgeCounts.total) * 100)}%</div>
                </div>
              </div>
              <Progress className="h-2 mt-6" value={(badgeCounts.earned / badgeCounts.total) * 100} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center">
                <BrainCircuit className="h-4 w-4 mr-2 text-mindful-600" />
                Mindset Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {earnedByCategory.mindset}/{badgesData.filter(b => b.category === 'mindset').length}
              </div>
              <Progress 
                className="h-2 mt-2" 
                value={(earnedByCategory.mindset / badgesData.filter(b => b.category === 'mindset').length) * 100} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center">
                <BarChart className="h-4 w-4 mr-2 text-mindful-600" />
                Analysis Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {earnedByCategory.analysis}/{badgesData.filter(b => b.category === 'analysis').length}
              </div>
              <Progress 
                className="h-2 mt-2" 
                value={(earnedByCategory.analysis / badgesData.filter(b => b.category === 'analysis').length) * 100} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center">
                <EyeOff className="h-4 w-4 mr-2 text-mindful-600" />
                Discipline Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {earnedByCategory.discipline}/{badgesData.filter(b => b.category === 'discipline').length}
              </div>
              <Progress 
                className="h-2 mt-2" 
                value={(earnedByCategory.discipline / badgesData.filter(b => b.category === 'discipline').length) * 100} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center">
                <Award className="h-4 w-4 mr-2 text-mindful-600" />
                Next Badge
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const nextBadge = badgesData.find(badge => !badge.earned);
                if (!nextBadge) return <div>All badges earned!</div>;
                
                return (
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-mindful-100 flex items-center justify-center mr-3 text-mindful-600">
                      <nextBadge.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{nextBadge.name}</div>
                      <Progress 
                        className="h-1.5 mt-1 w-24" 
                        value={nextBadge.progress || 0} 
                      />
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Earned Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badgesData.filter(badge => badge.earned).map(badge => (
              <Card key={badge.id} className="bg-mindful-50 border-mindful-200">
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <div className="h-12 w-12 rounded-full bg-mindful-100 flex items-center justify-center mr-4 text-mindful-600">
                      <badge.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-bold text-lg flex items-center">
                        {badge.name}
                        <Badge className="ml-2 bg-mindful-600">Level {badge.level}</Badge>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{badge.description}</p>
                      <div className="text-xs text-gray-500 mt-2 flex items-center">
                        <BadgeCheck className="h-3 w-3 mr-1 text-green-600" />
                        Earned on {badge.date}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <h2 className="text-2xl font-bold mt-8">Badges in Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badgesData.filter(badge => !badge.earned).map(badge => (
              <Card key={badge.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mr-4 text-gray-500">
                      <badge.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg flex items-center">
                        {badge.name}
                        <Badge variant="outline" className="ml-2">Level {badge.level}</Badge>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{badge.description}</p>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{badge.progress}%</span>
                        </div>
                        <Progress value={badge.progress} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Badges;
