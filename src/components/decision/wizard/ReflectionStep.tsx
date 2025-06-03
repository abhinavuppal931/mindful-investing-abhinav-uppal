
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { WizardData } from '../DecisionWizard';

interface ReflectionStepProps {
  data: WizardData;
  onChange: (data: Partial<WizardData>) => void;
}

const lowQualityQuestions = [
  {
    id: 'driving_decision',
    question: "What's driving your decision?",
    options: ['News urgency', 'Following trend', 'Research data', 'Not sure']
  },
  {
    id: 'emotional_impact',
    question: "How are your emotions affecting you?",
    options: ['Making me rush', 'Making me hesitate', 'Not affecting', 'Confusing me']
  },
  {
    id: 'investment_goals',
    question: "How does this fit your investment goals?",
    options: ['Protects portfolio', 'Short-term gains', 'Aligns with plan', "Doesn't fit"]
  }
];

const highQualityQuestions = [
  {
    id: 'decision_strength',
    question: "What makes this decision solid?",
    options: ['News impacts fundamentals', 'Matches strategy', 'Confident in data', 'Feels right']
  },
  {
    id: 'investment_help',
    question: "How does this move help your investments?",
    options: ['Reduces risk', 'Captures opportunity', 'Maintains stability', 'Safe bet']
  },
  {
    id: 'long_term_certainty',
    question: "How certain are you long-term?",
    options: ['Extremely strategic', 'Fairly certain', 'Somewhat certain', 'Not very certain']
  }
];

const ReflectionStep = ({ data, onChange }: ReflectionStepProps) => {
  // Use mock score for now (score <= 50 = low quality, > 50 = high quality)
  const isLowQuality = (data.decision_quality_score || 0) <= 50;
  const questions = isLowQuality ? lowQualityQuestions : highQualityQuestions;
  
  const handleAnswerChange = (questionId: string, value: string) => {
    const updatedAnswers = {
      ...data.reflection_answers,
      [questionId]: value
    };
    onChange({ reflection_answers: updatedAnswers });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Reflection Questions</h3>
        <p className="text-gray-600">
          Take a moment to think through your reasoning for this investment decision.
        </p>
      </div>

      <div className="space-y-8">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-3">
            <Label className="text-base font-medium">
              {index + 1}. {question.question}
            </Label>
            <RadioGroup
              value={data.reflection_answers[question.id] || ''}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              className="space-y-2"
            >
              {question.options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                  <Label 
                    htmlFor={`${question.id}-${option}`}
                    className="cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-blue-50">
        <p className="text-sm text-blue-800">
          <strong>Mindful investing:</strong> Taking time to reflect helps you make more intentional investment decisions and build long-term discipline.
        </p>
      </div>
    </div>
  );
};

export default ReflectionStep;
