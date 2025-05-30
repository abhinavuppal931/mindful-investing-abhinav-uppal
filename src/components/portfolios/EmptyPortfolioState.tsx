
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import { Briefcase, Plus } from 'lucide-react';

interface EmptyPortfolioStateProps {
  onCreatePortfolio: () => void;
  onAddTrade: () => void;
  hasPortfolios: boolean;
}

const EmptyPortfolioState = ({ onCreatePortfolio, onAddTrade, hasPortfolios }: EmptyPortfolioStateProps) => {
  if (!hasPortfolios) {
    return (
      <div className="text-center py-20 border border-dashed border-gray-300 rounded-lg">
        <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-medium mb-2">No portfolios yet</h3>
        <p className="text-gray-500 mb-6">Create your first portfolio to start tracking your investments</p>
        <Button onClick={onCreatePortfolio}>
          <Plus className="h-4 w-4 mr-2" />
          Create First Portfolio
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-20 border border-dashed border-gray-300 rounded-lg">
      <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-xl font-medium mb-2">Your portfolio is empty</h3>
      <p className="text-gray-500 mb-6">Add your first trade to start tracking your investments</p>
      <Button onClick={onAddTrade}>
        <Plus className="h-4 w-4 mr-2" />
        Add First Trade
      </Button>
    </div>
  );
};

export default EmptyPortfolioState;
