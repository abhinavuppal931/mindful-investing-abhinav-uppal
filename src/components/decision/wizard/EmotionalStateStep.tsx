
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { WizardData } from '../DecisionWizard';

interface EmotionalStateStepProps {
  data: WizardData;
  onChange: (data: Partial<WizardData>) => void;
}

const emotions = [
  {
    key: 'anxious_level' as keyof WizardData,
    emoji: '😰',
    label: 'Anxious',
    description: 'Feeling worried, uneasy, or nervous about potential outcomes'
  },
  {
    key: 'confident_level' as keyof WizardData,
    emoji: '💪',
    label: 'Confident',
    description: 'Feeling assured, certain, and self-assured about your decision'
  },
  {
    key: 'impulsive_level' as keyof WizardData,
    emoji: '⚡',
    label: 'Impulsive',
    description: 'Feeling rushed, wanting to act quickly without much deliberation'
  },
  {
    key: 'cautious_level' as keyof WizardData,
    emoji: '🛡️',
    label: 'Cautious',
    description: 'Feeling careful, wanting to proceed slowly and consider all risks'
  },
  {
    key: 'overwhelmed_level' as keyof WizardData,
    emoji: '😵',
    label: 'Overwhelmed',
    description: 'Feeling stressed, having too much information or pressure to decide'
  }
];

const levelLabels = ['Not at all', 'Neutral', 'Extremely'];

const EmotionalStateStep = ({ data, onChange }: EmotionalStateStepProps) => {
  const handleEmotionChange = (emotionKey: keyof WizardData, value: number[]) => {
    onChange({ [emotionKey]: value[0] });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">How are you feeling right now?</h3>
        <p className="text-gray-600">Understanding your emotional state helps make better decisions.</p>
      </div>

      <div className="space-y-6">
        {emotions.map((emotion) => (
          <div key={emotion.key} className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{emotion.emoji}</span>
              <Label className="text-base font-medium">{emotion.label}</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{emotion.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="space-y-2">
              <Slider
                value={[data[emotion.key] as number]}
                onValueChange={(value) => handleEmotionChange(emotion.key, value)}
                max={2}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                {levelLabels.map((label, index) => (
                  <span key={index}>{label}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Remember:</strong> There are no right or wrong feelings. Being honest about your emotional state helps you make more mindful investment decisions.
        </p>
      </div>
    </div>
  );
};

export default EmotionalStateStep;
