
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TradeDetailsStep from './wizard/TradeDetailsStep';
import EmotionalStateStep from './wizard/EmotionalStateStep';
import NewsAnalysisStep from './wizard/NewsAnalysisStep';
import ReflectionStep from './wizard/ReflectionStep';
import ConfirmationStep from './wizard/ConfirmationStep';
import { toast } from '@/hooks/use-toast';

interface DecisionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecisionAdded: (decision: any) => Promise<void>;
}

export interface WizardData {
  // Step 1: Trade Details
  ticker_symbol: string;
  action: 'buy' | 'sell';
  shares: string;
  price_per_share: string;
  
  // Step 2: Emotional State
  anxious_level: number;
  confident_level: number;
  impulsive_level: number;
  cautious_level: number;
  overwhelmed_level: number;
  
  // Step 3: News Analysis (backend calculated)
  decision_quality_score?: number;
  
  // Step 4: Reflection
  reflection_answers: Record<string, string>;
  
  // Meta
  is_draft: boolean;
}

const DecisionWizard = ({ open, onOpenChange, onDecisionAdded }: DecisionWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    ticker_symbol: '',
    action: 'buy',
    shares: '',
    price_per_share: '',
    anxious_level: 0,
    confident_level: 0,
    impulsive_level: 0,
    cautious_level: 0,
    overwhelmed_level: 0,
    reflection_answers: {},
    is_draft: false
  });

  const totalSteps = 5;

  const updateWizardData = (stepData: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...stepData }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setWizardData({
      ticker_symbol: '',
      action: 'buy',
      shares: '',
      price_per_share: '',
      anxious_level: 0,
      confident_level: 0,
      impulsive_level: 0,
      cautious_level: 0,
      overwhelmed_level: 0,
      reflection_answers: {},
      is_draft: false
    });
  };

  const handleClose = () => {
    resetWizard();
    onOpenChange(false);
  };

  const saveDraft = async () => {
    try {
      await onDecisionAdded({
        ...wizardData,
        shares: parseFloat(wizardData.shares),
        price_per_share: parseFloat(wizardData.price_per_share),
        is_draft: true,
        decision_date: new Date().toISOString().split('T')[0]
      });
      toast({ title: "Draft saved", description: "Your decision draft has been saved" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save draft",
        variant: "destructive" 
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.ticker_symbol && wizardData.shares && wizardData.price_per_share;
      case 2:
        return true; // Emotional state is optional
      case 3:
        return true; // News analysis is automatic
      case 4:
        return Object.keys(wizardData.reflection_answers).length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <TradeDetailsStep data={wizardData} onChange={updateWizardData} />;
      case 2:
        return <EmotionalStateStep data={wizardData} onChange={updateWizardData} />;
      case 3:
        return <NewsAnalysisStep data={wizardData} onChange={updateWizardData} onComplete={nextStep} />;
      case 4:
        return <ReflectionStep data={wizardData} onChange={updateWizardData} />;
      case 5:
        return <ConfirmationStep data={wizardData} onConfirm={onDecisionAdded} onClose={handleClose} />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Trade Details';
      case 2: return 'Emotional State Check-In';
      case 3: return 'News Analysis';
      case 4: return 'Reflection Questions';
      case 5: return 'Confirmation & Results';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{getStepTitle()}</span>
            <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <Progress value={(currentStep / totalSteps) * 100} className="w-full" />

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStep()}
          </div>

          {/* Navigation */}
          {currentStep !== 3 && currentStep !== 5 && (
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex space-x-2">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                {currentStep > 1 && (
                  <Button variant="ghost" onClick={saveDraft}>
                    Save Draft
                  </Button>
                )}
              </div>
              
              <Button 
                onClick={nextStep} 
                disabled={!canProceed() || currentStep === totalSteps}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DecisionWizard;
