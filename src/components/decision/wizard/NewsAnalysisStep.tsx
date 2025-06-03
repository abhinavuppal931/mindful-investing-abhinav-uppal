
import React, { useEffect, useState } from 'react';
import { WizardData } from '../DecisionWizard';

interface NewsAnalysisStepProps {
  data: WizardData;
  onChange: (data: Partial<WizardData>) => void;
  onComplete: () => void;
}

const NewsAnalysisStep = ({ data, onChange, onComplete }: NewsAnalysisStepProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    // Simulate news analysis
    const timer = setTimeout(() => {
      // Mock score calculation (will be replaced with actual backend logic)
      const mockScore = Math.floor(Math.random() * 100);
      onChange({ decision_quality_score: mockScore });
      setIsAnalyzing(false);
      
      // Auto-proceed to next step after brief pause
      setTimeout(() => {
        onComplete();
      }, 1000);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onChange, onComplete]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Analyzing Market Context</h3>
        <p className="text-gray-600">We're checking recent news and market sentiment for {data.ticker_symbol}.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-16">
        {isAnalyzing ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mindful-600 mb-6"></div>
            <p className="text-lg font-medium mb-2">Analyzing recent news for {data.ticker_symbol}...</p>
            <p className="text-gray-500 text-center max-w-md">
              Checking sentiment analysis, market impact, and relevance to your investment decision.
            </p>
          </>
        ) : (
          <>
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-green-600">Analysis Complete</p>
            <p className="text-gray-500">Proceeding to reflection questions...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default NewsAnalysisStep;
