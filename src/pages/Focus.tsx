
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, Calendar, ArrowUpRight, Filter, Info, ThumbsUp, ThumbsDown } from 'lucide-react';

// Mock news data
const mockNews = [
  {
    id: 1,
    title: 'Apple Reports Record Q3 Earnings, Beats Expectations',
    source: 'Financial Times',
    date: '2025-04-15',
    sentiment: 'positive',
    relevance: 'high',
    ticker: 'AAPL',
    content: 'Apple Inc. reported record third-quarter earnings that exceeded analyst expectations, driven by strong iPhone sales and growth in services revenue. The company also announced a $90 billion share buyback program.',
    url: '#'
  },
  {
    id: 2,
    title: 'Microsoft Cloud Revenue Surges 25% in Latest Quarter',
    source: 'Bloomberg',
    date: '2025-04-14',
    sentiment: 'positive',
    relevance: 'high',
    ticker: 'MSFT',
    content: 'Microsoft Corporation reported a 25% increase in cloud revenue for the quarter, as demand for Azure services continued to grow among enterprise customers. The company\'s overall revenue rose 18% year-over-year.',
    url: '#'
  },
  {
    id: 3,
    title: 'Federal Reserve Signals Potential Rate Cut in September',
    source: 'Wall Street Journal',
    date: '2025-04-16',
    sentiment: 'neutral',
    relevance: 'medium',
    ticker: '',
    content: 'The Federal Reserve indicated that it may consider cutting interest rates in September, contingent on inflation continuing to move toward its 2% target. Markets reacted positively to the news.',
    url: '#'
  },
  {
    id: 4,
    title: 'Tesla Faces Production Delays for New Model',
    source: 'Reuters',
    date: '2025-04-13',
    sentiment: 'negative',
    relevance: 'medium',
    ticker: 'TSLA',
    content: 'Tesla is experiencing production delays for its newest vehicle model due to supply chain constraints. The company has pushed back the release date by approximately three months.',
    url: '#'
  },
  {
    id: 5,
    title: 'Amazon Opens 20 New Fulfillment Centers Worldwide',
    source: 'CNBC',
    date: '2025-04-12',
    sentiment: 'positive',
    relevance: 'medium',
    ticker: 'AMZN',
    content: 'Amazon.com announced the opening of 20 new fulfillment centers across North America, Europe, and Asia, creating approximately 40,000 new jobs. The expansion aims to reduce delivery times.',
    url: '#'
  },
  {
    id: 6,
    title: 'Google Unveils New AI Features for Search',
    source: 'The Verge',
    date: '2025-04-11',
    sentiment: 'positive',
    relevance: 'high',
    ticker: 'GOOGL',
    content: 'Google has introduced several new AI-powered features for its search engine, designed to provide more relevant and contextual results. The company says the updates represent the most significant changes to search in years.',
    url: '#'
  }
];

const Focus = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickerFilter, setTickerFilter] = useState('all');
  const [showHighRelevanceOnly, setShowHighRelevanceOnly] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState('all');
  
  // Filter news based on current filters
  const filteredNews = mockNews.filter(item => {
    // Search query filter
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Ticker filter
    if (tickerFilter !== 'all' && item.ticker !== tickerFilter) {
      return false;
    }
    
    // Relevance filter
    if (showHighRelevanceOnly && item.relevance !== 'high') {
      return false;
    }
    
    // Sentiment filter
    if (sentimentFilter !== 'all' && item.sentiment !== sentimentFilter) {
      return false;
    }
    
    return true;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <BrainCircuit className="mr-2 h-8 w-8 text-mindful-600" />
              Focus Mode
            </h1>
            <p className="text-gray-600 mt-1">
              Filter out the noise and focus on what matters for your investments
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="high-relevance" 
              checked={showHighRelevanceOnly}
              onCheckedChange={setShowHighRelevanceOnly}
            />
            <Label htmlFor="high-relevance">Show High Relevance Only</Label>
          </div>
        </div>
        
        <div className="focus-mode">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search news content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
              />
              
              <Tabs defaultValue="all">
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="all">All News</TabsTrigger>
                    <TabsTrigger value="positive">Positive</TabsTrigger>
                    <TabsTrigger value="negative">Negative</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>April 2025</span>
                  </div>
                </div>
                
                <TabsContent value="all" className="mt-0">
                  <div className="space-y-4">
                    {filteredNews.length > 0 ? (
                      filteredNews.map(news => (
                        <Card key={news.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <div className="space-y-1">
                                <CardTitle>{news.title}</CardTitle>
                                <CardDescription>
                                  {news.source} • {new Date(news.date).toLocaleDateString()}
                                </CardDescription>
                              </div>
                              {news.ticker && (
                                <Badge variant="outline" className="h-fit">
                                  {news.ticker}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p>{news.content}</p>
                          </CardContent>
                          <CardFooter className="flex justify-between pt-2">
                            <div className="flex space-x-2">
                              <Badge variant={news.sentiment === 'positive' ? 'default' : news.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                                {news.sentiment === 'positive' ? (
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                ) : news.sentiment === 'negative' ? (
                                  <ThumbsDown className="h-3 w-3 mr-1" />
                                ) : (
                                  <Info className="h-3 w-3 mr-1" />
                                )}
                                {news.sentiment.charAt(0).toUpperCase() + news.sentiment.slice(1)}
                              </Badge>
                              <Badge variant="outline">
                                {news.relevance.charAt(0).toUpperCase() + news.relevance.slice(1)} Relevance
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs" asChild>
                              <a href={news.url} target="_blank" rel="noopener noreferrer">
                                Read More
                                <ArrowUpRight className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500">No news items match your current filters</p>
                        <Button 
                          variant="link" 
                          onClick={() => {
                            setSearchQuery('');
                            setTickerFilter('all');
                            setShowHighRelevanceOnly(false);
                            setSentimentFilter('all');
                          }}
                        >
                          Clear all filters
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="positive" className="mt-0">
                  <div className="space-y-4">
                    {filteredNews.filter(news => news.sentiment === 'positive').map(news => (
                      <Card key={news.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="space-y-1">
                              <CardTitle>{news.title}</CardTitle>
                              <CardDescription>
                                {news.source} • {new Date(news.date).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            {news.ticker && (
                              <Badge variant="outline" className="h-fit">
                                {news.ticker}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p>{news.content}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                          <div className="flex space-x-2">
                            <Badge>
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Positive
                            </Badge>
                            <Badge variant="outline">
                              {news.relevance.charAt(0).toUpperCase() + news.relevance.slice(1)} Relevance
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs" asChild>
                            <a href={news.url} target="_blank" rel="noopener noreferrer">
                              Read More
                              <ArrowUpRight className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="negative" className="mt-0">
                  <div className="space-y-4">
                    {filteredNews.filter(news => news.sentiment === 'negative').map(news => (
                      <Card key={news.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="space-y-1">
                              <CardTitle>{news.title}</CardTitle>
                              <CardDescription>
                                {news.source} • {new Date(news.date).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            {news.ticker && (
                              <Badge variant="outline" className="h-fit">
                                {news.ticker}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p>{news.content}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                          <div className="flex space-x-2">
                            <Badge variant="destructive">
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              Negative
                            </Badge>
                            <Badge variant="outline">
                              {news.relevance.charAt(0).toUpperCase() + news.relevance.slice(1)} Relevance
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs" asChild>
                            <a href={news.url} target="_blank" rel="noopener noreferrer">
                              Read More
                              <ArrowUpRight className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Filter className="h-5 w-5 mr-2 text-mindful-600" />
                    Filter Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticker-filter">Ticker Symbol</Label>
                    <Select 
                      value={tickerFilter} 
                      onValueChange={setTickerFilter}
                    >
                      <SelectTrigger id="ticker-filter">
                        <SelectValue placeholder="All Stocks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stocks</SelectItem>
                        <SelectItem value="AAPL">AAPL</SelectItem>
                        <SelectItem value="MSFT">MSFT</SelectItem>
                        <SelectItem value="GOOGL">GOOGL</SelectItem>
                        <SelectItem value="AMZN">AMZN</SelectItem>
                        <SelectItem value="TSLA">TSLA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sentiment-filter">Sentiment</Label>
                    <Select 
                      value={sentimentFilter} 
                      onValueChange={setSentimentFilter}
                    >
                      <SelectTrigger id="sentiment-filter">
                        <SelectValue placeholder="All Sentiments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sentiments</SelectItem>
                        <SelectItem value="positive">Positive</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="negative">Negative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => {
                      setSearchQuery('');
                      setTickerFilter('all');
                      setShowHighRelevanceOnly(false);
                      setSentimentFilter('all');
                    }}
                  >
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-mindful-50 border-mindful-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BrainCircuit className="h-5 w-5 mr-2 text-mindful-600" />
                    Focus Mode Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-mindful-100 flex items-center justify-center text-mindful-600 mr-2 flex-shrink-0 mt-0.5">1</div>
                      <span>Filter out market noise to focus on relevant information</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-mindful-100 flex items-center justify-center text-mindful-600 mr-2 flex-shrink-0 mt-0.5">2</div>
                      <span>Reduce recency bias by viewing historical context</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-mindful-100 flex items-center justify-center text-mindful-600 mr-2 flex-shrink-0 mt-0.5">3</div>
                      <span>Identify sentiment trends across different news sources</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-mindful-100 flex items-center justify-center text-mindful-600 mr-2 flex-shrink-0 mt-0.5">4</div>
                      <span>Make more rational, data-driven investment decisions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Focus;
