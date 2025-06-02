
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Brain, Plus, TrendingUp, Target, Shield } from 'lucide-react';
import { useDecisions } from '@/hooks/useDecisions';
import DecisionDialog from '@/components/decision/DecisionDialog';

const Dashboard = () => {
  const { decisions, loading, createDecision, getWeeklyStats } = useDecisions();
  const [isDecisionDialogOpen, setIsDecisionDialogOpen] = useState(false);
  
  const weeklyStats = getWeeklyStats();

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

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mindful-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading decision dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Brain className="mr-2 h-8 w-8 text-mindful-600" />
                Decision Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Track your investment decisions and build discipline
              </p>
            </div>
            
            <Dialog open={isDecisionDialogOpen} onOpenChange={setIsDecisionDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  New Decision
                </Button>
              </DialogTrigger>
              <DecisionDialog 
                open={isDecisionDialogOpen}
                onOpenChange={setIsDecisionDialogOpen}
                onDecisionAdded={createDecision}
              />
            </Dialog>
          </div>

          {/* Weekly Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyStats.totalDecisions}</div>
                <p className="text-sm text-gray-600">Total Decisions</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Rational Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{weeklyStats.rationalDecisions}</div>
                <p className="text-sm text-gray-600">Based on Logic</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Rationality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-mindful-600">{weeklyStats.rationalPercentage}%</div>
                <p className="text-sm text-gray-600">This Week</p>
              </CardContent>
            </Card>
          </div>

          {/* Badges */}
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

          {/* Recent Decisions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Decisions</CardTitle>
              <CardDescription>
                Your latest investment decision analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {decisions.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No decisions recorded yet</h3>
                  <p className="text-gray-500 mb-4">Start tracking your investment decisions to build discipline</p>
                  <Button onClick={() => setIsDecisionDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record First Decision
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {decisions.slice(0, 5).map(decision => (
                    <div key={decision.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          decision.action === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {decision.action.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{decision.ticker_symbol}</div>
                          <div className="text-sm text-gray-500">
                            {decision.shares} shares @ ${decision.price_per_share}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {new Date(decision.decision_date).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-1 mt-1">
                          {decision.based_on_fundamentals && <Badge variant="outline" className="text-xs">Fundamentals</Badge>}
                          {decision.fits_strategy && <Badge variant="outline" className="text-xs">Strategy</Badge>}
                          {decision.not_reacting_to_news && <Badge variant="outline" className="text-xs">Rational</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default Dashboard;
