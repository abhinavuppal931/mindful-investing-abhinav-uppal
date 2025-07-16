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
      
      try {
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
          default:
            throw new Error(`Unknown analysis type: ${analysisType}`);
        }

        if (result?.analysis) {
          setAnalyses(prev => ({ ...prev, [analysisType]: result.analysis }));
          // Cache the result
          openaiCache.set(cacheKey, result.analysis);
        } else {
          console.error(`No analysis returned for ${analysisType}`);
        }
      } catch (apiError) {
        console.error(`API error for ${analysisType}:`, apiError);
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
      hoverColor: 'hover:shadow-blue-500/10'
    },
    {
      key: 'risks',
      title: '⚠️ Investment Risk Assessment',
      description: 'Potential challenges and risk factors',
      hoverColor: 'hover:shadow-red-500/10'
    },
    {
      key: 'nearTermTailwinds',
      title: '🚀 Near-Term Growth Drivers',
      description: 'Short-term opportunities and catalysts',
      hoverColor: 'hover:shadow-green-500/10'
    },
    {
      key: 'longTermTailwinds',
      title: '🎯 Long-Term Strategic Trajectory',
      description: 'Sustainable growth opportunities',
      hoverColor: 'hover:shadow-purple-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {analysisCards.map((card) => (
        <div 
          key={card.key} 
          className={`rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl ${card.hoverColor}`}
        >
          <Collapsible 
            open={openSections[card.key]} 
            onOpenChange={() => toggleSection(card.key)}
          >
            <CollapsibleTrigger asChild>
              <div className="flex flex-col space-y-1.5 p-6 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-inter font-normal leading-none tracking-tighter flex items-center">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      {card.description}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    {openSections[card.key] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="p-6 pt-0">
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
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ))}
    </div>
  );
};

export default AIAnalysisGrid;
