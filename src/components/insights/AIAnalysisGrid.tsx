
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Shield, AlertTriangle, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { openaiAPI } from '@/services/api';

interface AIAnalysisGridProps {
  ticker: string;
  financialData: any;
  newsData: any;
}

interface AnalysisCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  loading: boolean;
  expanded: boolean;
}

const AIAnalysisGrid: React.FC<AIAnalysisGridProps> = ({ ticker, financialData, newsData }) => {
  const [cards, setCards] = useState<AnalysisCard[]>([
    {
      id: 'moat',
      title: 'Competitive Moat',
      icon: <Shield className="h-5 w-5" />,
      content: '',
      loading: false,
      expanded: false
    },
    {
      id: 'risks',
      title: 'Investment Risks',
      icon: <AlertTriangle className="h-5 w-5" />,
      content: '',
      loading: false,
      expanded: false
    },
    {
      id: 'near-term',
      title: 'Near-term Outlook (6-12M)',
      icon: <Calendar className="h-5 w-5" />,
      content: '',
      loading: false,
      expanded: false
    },
    {
      id: 'long-term',
      title: 'Long-term Outlook (5Y+)',
      icon: <TrendingUp className="h-5 w-5" />,
      content: '',
      loading: false,
      expanded: false
    }
  ]);

  const loadAnalysis = async (cardId: string) => {
    if (!ticker) return;

    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, loading: true } : card
    ));

    try {
      let result;
      switch (cardId) {
        case 'moat':
          result = await openaiAPI.analyzeCompanyMoat(ticker, financialData);
          break;
        case 'risks':
          result = await openaiAPI.analyzeInvestmentRisks(ticker, financialData, newsData || []);
          break;
        case 'near-term':
          result = await openaiAPI.analyzeNearTermTailwinds(ticker, financialData, newsData || []);
          break;
        case 'long-term':
          result = await openaiAPI.analyzeLongTermTailwinds(ticker, financialData, newsData || []);
          break;
        default:
          throw new Error('Unknown analysis type');
      }

      setCards(prev => prev.map(card => 
        card.id === cardId 
          ? { ...card, content: result.analysis, loading: false, expanded: true }
          : card
      ));
    } catch (error) {
      console.error(`Error loading ${cardId} analysis:`, error);
      setCards(prev => prev.map(card => 
        card.id === cardId 
          ? { ...card, content: 'Failed to load analysis. Please try again.', loading: false, expanded: true }
          : card
      ));
    }
  };

  const toggleCard = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    if (!card.expanded && !card.content && !card.loading) {
      loadAnalysis(cardId);
    } else {
      setCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, expanded: !c.expanded } : c
      ));
    }
  };

  const formatContent = (content: string) => {
    if (!content) return null;
    
    // Split content into lines and format as bullet points
    const lines = content.split('\n').filter(line => line.trim());
    
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
          if (!cleanLine) return null;
          
          return (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{cleanLine}</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-4">AI Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <Card key={card.id} className="transition-all duration-200 hover:shadow-md">
            <Collapsible open={card.expanded} onOpenChange={() => toggleCard(card.id)}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full p-0 h-auto hover:bg-transparent"
                >
                  <CardHeader className="w-full">
                    <CardTitle className="flex items-center justify-between text-left">
                      <div className="flex items-center space-x-2">
                        {card.icon}
                        <span className="text-sm font-medium">{card.title}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {card.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {card.expanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {card.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Generating analysis...</span>
                    </div>
                  ) : card.content ? (
                    formatContent(card.content)
                  ) : null}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIAnalysisGrid;
