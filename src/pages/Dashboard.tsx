
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Brain, Plus } from 'lucide-react';
import { useDecisions } from '@/hooks/useDecisions';
import DecisionWizard from '@/components/decision/DecisionWizard';
import WeeklyStatsCards from '@/components/dashboard/WeeklyStatsCards';
import AchievementBadges from '@/components/dashboard/AchievementBadges';
import RecentDecisions from '@/components/dashboard/RecentDecisions';

const Dashboard = () => {
  const { decisions, loading, createDecision, getWeeklyStats } = useDecisions();
  const [isDecisionWizardOpen, setIsDecisionWizardOpen] = useState(false);
  
  const weeklyStats = getWeeklyStats();

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
            
            <Dialog open={isDecisionWizardOpen} onOpenChange={setIsDecisionWizardOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  New Decision
                </Button>
              </DialogTrigger>
              <DecisionWizard 
                open={isDecisionWizardOpen}
                onOpenChange={setIsDecisionWizardOpen}
                onDecisionAdded={createDecision}
              />
            </Dialog>
          </div>

          <WeeklyStatsCards stats={weeklyStats} />
          <AchievementBadges weeklyStats={weeklyStats} />
          <RecentDecisions 
            decisions={decisions} 
            onNewDecision={() => setIsDecisionWizardOpen(true)} 
          />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default Dashboard;
