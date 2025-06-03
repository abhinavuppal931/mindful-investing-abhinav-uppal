
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { WizardData } from '../DecisionWizard';
import { toast } from '@/hooks/use-toast';

interface ConfirmationStepProps {
  data: WizardData;
  onConfirm: (decision: any) => Promise<void>;
  onClose: () => void;
}

const ConfirmationStep = ({ data, onConfirm, onClose }: ConfirmationStepProps) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const score = data.decision_quality_score || 0;
  const isHighQuality = score > 50;

  const getScoreColor = () => {
    if (score >= 75) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-blue-600 bg-blue-50';
    if (score >= 25) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = () => {
    if (score >= 75) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Needs Attention';
    return 'High Risk';
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm({
        ticker_symbol: data.ticker_symbol.toUpperCase(),
        action: data.action,
        shares: parseFloat(data.shares),
        price_per_share: parseFloat(data.price_per_share),
        anxious_level: data.anxious_level,
        confident_level: data.confident_level,
        impulsive_level: data.impulsive_level,
        cautious_level: data.cautious_level,
        overwhelmed_level: data.overwhelmed_level,
        reflection_answers: data.reflection_answers,
        decision_quality_score: data.decision_quality_score,
        is_draft: false,
        decision_date: new Date().toISOString().split('T')[0]
      });

      setIsConfirmed(true);
      toast({ 
        title: "Decision recorded successfully!", 
        description: "Your investment decision has been logged." 
      });
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to record decision",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isConfirmed) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-green-600 mb-2">Decision Recorded!</h3>
        <p className="text-gray-600">Your investment decision has been successfully logged.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Review Your Decision</h3>
        <p className="text-gray-600">Confirm the details before finalizing your decision.</p>
      </div>

      {/* Trade Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trade Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Action:</strong> {data.action.toUpperCase()} {data.ticker_symbol}
            </div>
            <div>
              <strong>Shares:</strong> {data.shares}
            </div>
            <div>
              <strong>Price:</strong> ${data.price_per_share}
            </div>
            <div>
              <strong>Total Value:</strong> ${(parseFloat(data.shares) * parseFloat(data.price_per_share)).toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emotional State Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emotional State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'anxious_level', label: '😰 Anxious', value: data.anxious_level },
              { key: 'confident_level', label: '💪 Confident', value: data.confident_level },
              { key: 'impulsive_level', label: '⚡ Impulsive', value: data.impulsive_level },
              { key: 'cautious_level', label: '🛡️ Cautious', value: data.cautious_level },
              { key: 'overwhelmed_level', label: '😵 Overwhelmed', value: data.overwhelmed_level }
            ].map(emotion => (
              <Badge key={emotion.key} variant="outline">
                {emotion.label}: {['Not at all', 'Neutral', 'Extremely'][emotion.value]}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reflection Answers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reflection Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {Object.entries(data.reflection_answers).map(([question, answer]) => (
              <div key={question}>
                <strong>{question.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {answer}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirm Button */}
      <div className="flex justify-center pt-4">
        <Button 
          onClick={handleConfirm} 
          disabled={isSubmitting}
          size="lg"
          className="px-8"
        >
          {isSubmitting ? 'Recording...' : 'Confirm Decision'}
        </Button>
      </div>

      {/* Decision Quality Score - Revealed After Confirmation */}
      {isConfirmed && (
        <Card className={`mt-6 ${getScoreColor()}`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {isHighQuality ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>Decision Quality Score</span>
            </CardTitle>
            <CardDescription>
              Based on market analysis and emotional assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{score}/100</div>
              <div className="text-lg font-medium">{getScoreLabel()}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConfirmationStep;
