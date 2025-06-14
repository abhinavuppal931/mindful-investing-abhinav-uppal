
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, ChevronUp, Shield, AlertTriangle, TrendingUp, Target } from 'lucide-react';
import { openaiAPI } from '@/services/api';
import { Badge } from '@/components/ui/badge';

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
    if (ticker && financialData?.length > 0) {
      loadAnalyses();
    }
  }, [ticker, financialData]);

  const loadAnalyses = async () => {
    const analysisTypes = [
      { key: 'moat', func: () => openaiAPI.analyzeCompanyMoat(ticker, financialData) },
      { key: 'risks', func: () => openaiAPI.analyzeInvestmentRisks(ticker, financialData, newsData) },
      { key: 'nearTermTailwinds', func: () => openaiAPI.analyzeNearTermTailwinds(ticker, financialData, newsData) },
      { key: 'longTermTailwinds', func: () => openaiAPI.analyzeLongTermTailwinds(ticker, financialData, newsData) }
    ];

    for (const analysis of analysisTypes) {
      setLoading(prev => ({ ...prev, [analysis.key]: true }));
      try {
        const result = await analysis.func();
        if (result?.analysis) {
          setAnalyses(prev => ({ ...prev, [analysis.key]: result.analysis }));
        }
      } catch (error) {
        console.error(`Error loading ${analysis.key} analysis:`, error);
      } finally {
        setLoading(prev => ({ ...prev, [analysis.key]: false }));
      }
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatAnalysisContent = (content: string) => {
    if (!content) return null;
    
    // Split content into sections and format as bullet points
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        return (
          <div key={index} className="flex items-start mb-2">
            <span className="text-primary mr-2 mt-1">•</span>
            <span className="text-sm">{trimmedLine.replace(/^[•\-*]\s*/, '')}</span>
          </div>
        );
      }
      return (
        <p key={index} className="text-sm mb-2 font-medium">
          {trimmedLine}
        </p>
      );
    });
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
                    {formatAnalysisContent(analyses[card.key as keyof typeof analyses] || '')}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Click to load {card.title.toLowerCase()} analysis
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
