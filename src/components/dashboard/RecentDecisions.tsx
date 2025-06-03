
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Plus } from 'lucide-react';
import { Decision } from '@/hooks/useDecisions';

interface RecentDecisionsProps {
  decisions: Decision[];
  onNewDecision: () => void;
}

const RecentDecisions = ({ decisions, onNewDecision }: RecentDecisionsProps) => {
  return (
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
            <Button onClick={onNewDecision}>
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
                    {decision.decision_quality_score && (
                      <Badge variant={decision.decision_quality_score > 50 ? "default" : "secondary"} className="text-xs">
                        Score: {decision.decision_quality_score}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentDecisions;
