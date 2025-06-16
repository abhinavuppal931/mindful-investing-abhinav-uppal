
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { openaiAPI } from '@/services/api';
import { openaiCache } from '@/utils/openaiCache';
import { formatAIContent } from '@/utils/formatAIContent';

interface AIAnalysisGridProps {
  ticker: string;
  financialData: any[];
  newsData: any[];
}

const AIAnalysisGrid: React.FC<AIAnalysisGridProps> = ({ ticker, financialData, newsData }) => {
  const [analyses, setAnalyses] = useState<{
    moat: string | null;
    risks: string | null;
    nearTermTailwinds: string | null;
    longTermTailwinds: string | null;
  }>({
    moat: null,
    risks: null,
    nearTermTailwinds: null,
    longTermTailwinds: null
  });
  
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [openSections, setOpenSections] = useState<{[key: string]: boolean}>({
    moat: false,
    risks: false,
    nearTermTailwinds: false,
    longTermTailwinds: false
  });

  useEffect(() => {
    // Load cached data on component mount
    if (ticker) {
      loadCachedAnalyses();
    }
  }, [ticker]);

  const loadCachedAnalyses = () => {
    const analysisTypes = ['moat', 'risks', 'nearTermTailwinds', 'longTermTailwinds'];
    
    analysisTypes.forEach(type => {
      const cacheKey = `${type}_${ticker}`;
      const cachedData = openaiCache.get(cacheKey);
      if (cachedData) {
        setAnalyses(prev => ({ ...prev, [type]: cachedData }));
      }
    });
  };

  const loadAnalysis = async (analysisType: string) => {
    if (analyses[analysisType as keyof typeof analyses]) {
      // Already loaded, just return
      return;
    }

    setLoading(prev => ({ ...prev, [analysisType]: true }));
    
    try {
      const cacheKey = `${analysisType}_${ticker}`;
      let cachedData = openaiCache.get(cacheKey);
      
      if (cachedData) {
        console.log(`Using cached ${analysisType} for ${ticker}`);
        setAnalyses(prev => ({ ...prev, [analysisType]: cachedData }));
        return;
      }

      // Fetch new data
      console.log(`Fetching new ${analysisType} for ${ticker}`);
      let result;
      
      switch (analysisType) {
        case 'moat':
          result = await openaiAPI.analyzeCompanyMoat(ticker, financialData);
          break;
        case 'risks':
          result = await openaiAPI.analyzeInvestmentRisks(ticker, financialData, newsData);
          break;
        case 'nearTermTailwinds':
          result = await openaiAPI.analyzeNearTermTailwinds(ticker, financialData, newsData);
          break;
        case 'longTermTailwinds':
          result = await openaiAPI.analyzeLongTermTailwinds(ticker, financialData, newsData);
          break;
      }

      if (result?.analysis) {
        setAnalyses(prev => ({ ...prev, [analysisType]: result.analysis }));
        // Cache the result
        openaiCache.set(cacheKey, result.analysis);
      }
    } catch (error) {
      console.error(`Error loading ${analysisType} analysis:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [analysisType]: false }));
    }
  };

  const toggleSection = async (section: string) => {
    const isOpening = !openSections[section];
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    
    // Load analysis when opening section if not already loaded
    if (isOpening) {
      await loadAnalysis(section);
    }
  };

  const analysisCards = [
    {
      key: 'moat',
      title: '🏰 Company Moat Analysis',
      description: 'Competitive advantages and defensive strategies',
      bgGradient: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      key: 'risks',
      title: '⚠️ Investment Risk Assessment',
      description: 'Potential challenges and risk factors',
      bgGradient: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900',
      borderColor: 'border-red-200 dark:border-red-800'
    },
    {
      key: 'nearTermTailwinds',
      title: '🚀 Near-Term Growth Drivers',
      description: 'Short-term opportunities and catalysts',
      bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      key: 'longTermTailwinds',
      title: '🎯 Long-Term Strategic Advantages',
      description: 'Sustainable growth opportunities',
      bgGradient: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900',
      borderColor: 'border-purple-200 dark:border-purple-800'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {analysisCards.map((card) => (
        <Card key={card.key} className={`${card.bgGradient} ${card.borderColor} border-2 transition-all duration-200 hover:shadow-lg`}>
          <Collapsible 
            open={openSections[card.key]} 
            onOpenChange={() => toggleSection(card.key)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {card.description}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    {openSections[card.key] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0">
                {loading[card.key] ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : analyses[card.key as keyof typeof analyses] ? (
                  <div className="space-y-2">
                    {formatAIContent(analyses[card.key as keyof typeof analyses] || '')}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-sm">
                    Analysis will load when you expand this section
                  </p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
};

export default AIAnalysisGrid;
