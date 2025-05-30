
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface PortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPortfolioCreated: (name: string, description?: string) => Promise<{ id: string }>;
  onPortfolioSelected: (portfolioId: string) => void;
}

const PortfolioDialog = ({ open, onOpenChange, onPortfolioCreated, onPortfolioSelected }: PortfolioDialogProps) => {
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDescription, setNewPortfolioDescription] = useState('');

  const handleAddPortfolio = async () => {
    if (!newPortfolioName.trim()) {
      toast({ title: "Error", description: "Portfolio name is required", variant: "destructive" });
      return;
    }
    
    try {
      const portfolio = await onPortfolioCreated(newPortfolioName, newPortfolioDescription || undefined);
      setNewPortfolioName('');
      setNewPortfolioDescription('');
      onOpenChange(false);
      onPortfolioSelected(portfolio.id);
      toast({ title: "Success", description: "Portfolio created successfully" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create portfolio",
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Portfolio</DialogTitle>
          <DialogDescription>
            Give your new portfolio a name and optional description.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="portfolio-name">Portfolio Name</Label>
            <Input
              id="portfolio-name"
              value={newPortfolioName}
              onChange={(e) => setNewPortfolioName(e.target.value)}
              placeholder="e.g., Tech Stocks, Retirement, etc."
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="portfolio-description">Description (Optional)</Label>
            <Input
              id="portfolio-description"
              value={newPortfolioDescription}
              onChange={(e) => setNewPortfolioDescription(e.target.value)}
              placeholder="Brief description of your portfolio strategy"
              className="mt-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAddPortfolio}>Create Portfolio</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PortfolioDialog;
