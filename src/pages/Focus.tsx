
import React, { useState, useEffect } from 'react';
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
import { finnhubAPI } from '@/services/api';

const Focus = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickerFilter, setTickerFilter] = useState('all-stocks');
  const [showHighRelevanceOnly, setShowHighRelevanceOnly] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, [tickerFilter]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      let newsData;
      
      if (tickerFilter && tickerFilter !== 'all-stocks') {
        // Fetch company-specific news
        const to = new Date().toISOString().split('T')[0];
        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        newsData = await finnhubAPI.getCompanyNews(tickerFilter, from, to);
      } else {
        // Fetch general market news
        newsData = await finnhubAPI.getMarketNews('general');
      }

      // Process news data and add mock sentiment/relevance scores
      const processedNews = (newsData || []).map((item: any, index: number) => ({
        id: item.id || index,
        title: item.headline,
        source: item.source,
        date: new Date(item.datetime * 1000).toISOString().split('T')[0],
        sentiment: Math.random() > 0.6 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative',
        relevance: Math.random() > 0.5 ? 'high' : 'medium',
        ticker: tickerFilter && tickerFilter !== 'all-stocks' ? tickerFilter : '',
        content: item.summary || item.headline,
        url: item.url
      }));

      setNews(processedNews);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch news data');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter news based on current filters
  const filteredNews = news.filter(item => {
    // Search query filter
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Ticker filter
    if (tickerFilter && tickerFilter !== 'all-stocks' && item.ticker !== tickerFilter) {
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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-mindful-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-medium">Error loading news</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </MainLayout>
    );
  }

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
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" onClick={fetchNews} className="mt-2">
              Retry
            </Button>
          </div>
        )}
        
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
                    <span>Latest Market News</span>
                  </div>
                </div>
                
                <TabsContent value="all" className="mt-0">
                  <div className="space-y-4">
                    {filteredNews.length > 0 ? (
                      filteredNews.map(newsItem => (
                        <Card key={newsItem.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg">{newsItem.title}</CardTitle>
                                <CardDescription>
                                  {newsItem.source} • {new Date(newsItem.date).toLocaleDateString()}
                                </CardDescription>
                              </div>
                              {newsItem.ticker && (
                                <Badge variant="outline" className="h-fit">
                                  {newsItem.ticker}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700">{newsItem.content}</p>
                          </CardContent>
                          <CardFooter className="flex justify-between pt-2">
                            <div className="flex space-x-2">
                              <Badge variant={newsItem.sentiment === 'positive' ? 'default' : newsItem.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                                {newsItem.sentiment === 'positive' ? (
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                ) : newsItem.sentiment === 'negative' ? (
                                  <ThumbsDown className="h-3 w-3 mr-1" />
                                ) : (
                                  <Info className="h-3 w-3 mr-1" />
                                )}
                                {newsItem.sentiment.charAt(0).toUpperCase() + newsItem.sentiment.slice(1)}
                              </Badge>
                              <Badge variant="outline">
                                {newsItem.relevance.charAt(0).toUpperCase() + newsItem.relevance.slice(1)} Relevance
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs" asChild>
                              <a href={newsItem.url} target="_blank" rel="noopener noreferrer">
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
                            setTickerFilter('all-stocks');
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
                    {filteredNews.filter(newsItem => newsItem.sentiment === 'positive').map(newsItem => (
                      <Card key={newsItem.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="space-y-1">
                              <CardTitle>{newsItem.title}</CardTitle>
                              <CardDescription>
                                {newsItem.source} • {new Date(newsItem.date).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            {newsItem.ticker && (
                              <Badge variant="outline" className="h-fit">
                                {newsItem.ticker}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p>{newsItem.content}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                          <div className="flex space-x-2">
                            <Badge>
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Positive
                            </Badge>
                            <Badge variant="outline">
                              {newsItem.relevance.charAt(0).toUpperCase() + newsItem.relevance.slice(1)} Relevance
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs" asChild>
                            <a href={newsItem.url} target="_blank" rel="noopener noreferrer">
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
                    {filteredNews.filter(newsItem => newsItem.sentiment === 'negative').map(newsItem => (
                      <Card key={newsItem.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="space-y-1">
                              <CardTitle>{newsItem.title}</CardTitle>
                              <CardDescription>
                                {newsItem.source} • {new Date(newsItem.date).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            {newsItem.ticker && (
                              <Badge variant="outline" className="h-fit">
                                {newsItem.ticker}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p>{newsItem.content}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                          <div className="flex space-x-2">
                            <Badge variant="destructive">
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              Negative
                            </Badge>
                            <Badge variant="outline">
                              {newsItem.relevance.charAt(0).toUpperCase() + newsItem.relevance.slice(1)} Relevance
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs" asChild>
                            <a href={newsItem.url} target="_blank" rel="noopener noreferrer">
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
                        <SelectItem value="all-stocks">All Stocks</SelectItem>
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
                      setTickerFilter('all-stocks');
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
