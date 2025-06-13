import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, Calendar, ArrowUpRight, Filter, Info, ThumbsUp, ThumbsDown, Loader } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { finnhubAPI } from '@/services/api';
import { fmpNewsAPI } from '@/services/fmpNewsAPI';
import StockSearch from '@/components/ui/stock-search';
import DateRangePicker from '@/components/ui/date-range-picker';
import { aiNewsAnalysis } from '@/services/aiNewsAnalysis';
import { useDebounce } from '@/hooks/useDebounce';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance: 'high' | 'low';
  ticker?: string;
  content: string;
  url: string;
  provider: 'finnhub' | 'fmp';
  image?: string;
}

const ITEMS_PER_PAGE = 10;

const Focus = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickerFilter, setTickerFilter] = useState('');
  const [showHighRelevanceOnly, setShowHighRelevanceOnly] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [processingArticleIds, setProcessingArticleIds] = useState<Set<string>>(new Set());

  // Debounce ticker filter to avoid excessive API calls
  const debouncedTickerFilter = useDebounce(tickerFilter, 2000);

  // Format date for API calls (YYYY-MM-DD)
  const formatDateForAPI = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  // Fix timezone issue - ensure we're displaying dates in user's timezone
  const formatDisplayDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const correctedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      return format(correctedDate, 'M/d/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedTickerFilter, dateRange, searchQuery, showHighRelevanceOnly, sentimentFilter]);

  useEffect(() => {
    fetchNews();
  }, [debouncedTickerFilter, dateRange]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const fromDate = dateRange?.from ? formatDateForAPI(dateRange.from) : undefined;
      const toDate = dateRange?.to ? formatDateForAPI(dateRange.to) : undefined;
      
      const allNewsData: NewsItem[] = [];

      // Fetch Finnhub news
      try {
        let finnhubData;
        if (debouncedTickerFilter && debouncedTickerFilter !== 'all-stocks' && debouncedTickerFilter !== '') {
          const from = fromDate || format(subDays(new Date(), 30), 'yyyy-MM-dd');
          const to = toDate || format(new Date(), 'yyyy-MM-dd');
          finnhubData = await finnhubAPI.getCompanyNews(debouncedTickerFilter, from, to);
        } else {
          finnhubData = await finnhubAPI.getMarketNews('general');
        }

        if (finnhubData && finnhubData.length > 0) {
          const processedFinnhubNews = finnhubData.map((item: any, index: number) => ({
            id: `finnhub_${item.id || index}`,
            title: item.headline,
            source: item.source,
            date: format(new Date(item.datetime * 1000), 'yyyy-MM-dd'),
            sentiment: 'neutral' as const,
            relevance: 'low' as const,
            ticker: debouncedTickerFilter && debouncedTickerFilter !== 'all-stocks' && debouncedTickerFilter !== '' ? debouncedTickerFilter : '',
            content: item.summary || item.headline,
            url: item.url,
            provider: 'finnhub' as const,
            image: item.image || undefined
          }));
          allNewsData.push(...processedFinnhubNews);
        }
      } catch (finnhubError) {
        console.warn('Finnhub API error:', finnhubError);
      }

      // Fetch FMP news
      try {
        let fmpData;
        if (debouncedTickerFilter && debouncedTickerFilter !== 'all-stocks' && debouncedTickerFilter !== '') {
          fmpData = await fmpNewsAPI.getStockNews(debouncedTickerFilter, fromDate, toDate, 0, 50);
        } else {
          fmpData = await fmpNewsAPI.getGeneralNews(fromDate, toDate, 0, 50);
        }

        if (fmpData && Array.isArray(fmpData) && fmpData.length > 0) {
          const processedFmpNews = fmpData.map((item: any, index: number) => ({
            id: `fmp_${item.publishedDate}_${index}`,
            title: item.title,
            source: item.site || item.publisher || 'FMP',
            date: item.publishedDate,
            sentiment: 'neutral' as const,
            relevance: 'low' as const,
            ticker: item.symbol || (debouncedTickerFilter && debouncedTickerFilter !== 'all-stocks' && debouncedTickerFilter !== '' ? debouncedTickerFilter : ''),
            content: item.text || item.title,
            url: item.url,
            provider: 'fmp' as const,
            image: item.image || undefined
          }));
          allNewsData.push(...processedFmpNews);
        }
      } catch (fmpError) {
        console.warn('FMP API error:', fmpError);
      }

      // Remove duplicates and sort by date
      const uniqueNews = allNewsData.filter((item, index, self) => 
        index === self.findIndex(t => t.title === item.title || t.url === item.url)
      );
      
      uniqueNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setAllNews(uniqueNews);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch news data');
    } finally {
      setLoading(false);
    }
  };

  // Run AI analysis on current page articles with enhanced OpenAI relevance
  useEffect(() => {
    const runAIAnalysis = async () => {
      if (paginatedNews.length === 0) return;

      // Check if any articles need AI analysis
      const articlesNeedingAnalysis = paginatedNews.filter(
        item => item.sentiment === 'neutral' && item.relevance === 'low'
      );

      if (articlesNeedingAnalysis.length === 0) return;

      setAiAnalysisLoading(true);
      setProcessingArticleIds(new Set(articlesNeedingAnalysis.map(item => item.id)));

      try {
        const articlesForAnalysis = articlesNeedingAnalysis.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          ticker: item.ticker,
          source: item.provider
        }));
        
        const analysisResults = await aiNewsAnalysis.analyzeArticles(articlesForAnalysis);
        
        // Update the news items with AI analysis results
        setAllNews(prevNews => 
          prevNews.map(newsItem => {
            const analysis = analysisResults.find(result => result.id === newsItem.id);
            if (analysis) {
              return {
                ...newsItem,
                sentiment: analysis.sentiment,
                relevance: analysis.relevance
              };
            }
            return newsItem;
          })
        );
      } catch (aiError) {
        console.warn('AI Analysis error:', aiError);
      } finally {
        setAiAnalysisLoading(false);
        setProcessingArticleIds(new Set());
      }
    };

    runAIAnalysis();
  }, [currentPage, allNews.length]);

  // Filter news based on current filters
  const filteredNews = allNews.filter(item => {
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (debouncedTickerFilter && debouncedTickerFilter !== 'all-stocks' && debouncedTickerFilter !== '' && 
        item.ticker && item.ticker !== debouncedTickerFilter) {
      return false;
    }
    
    if (showHighRelevanceOnly && item.relevance !== 'high') {
      return false;
    }
    
    if (sentimentFilter !== 'all' && item.sentiment !== sentimentFilter) {
      return false;
    }
    
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedNews = filteredNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Component for rendering news item with image
  const NewsItemCard = ({ newsItem }: { newsItem: NewsItem }) => (
    <Card key={newsItem.id}>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{newsItem.title}</CardTitle>
            <CardDescription>
              {newsItem.source} • {formatDisplayDate(newsItem.date)} • 
              <span className="text-xs ml-1 px-1.5 py-0.5 bg-gray-100 rounded">
                {newsItem.provider.toUpperCase()}
              </span>
            </CardDescription>
          </div>
          {newsItem.ticker && (
            <Badge variant="outline" className="h-fit ml-2">
              {newsItem.ticker}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {newsItem.image && (
            <div className="flex-shrink-0">
              <img 
                src={newsItem.image} 
                alt={newsItem.title}
                className="w-24 h-24 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <p className="text-gray-700 flex-1">{newsItem.content}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex space-x-2">
          {processingArticleIds.has(newsItem.id) ? (
            <>
              <Badge variant="secondary">
                <Loader className="h-3 w-3 mr-1 animate-spin" />
                Analyzing...
              </Badge>
              <Badge variant="secondary">
                <Loader className="h-3 w-3 mr-1 animate-spin" />
                Analyzing...
              </Badge>
            </>
          ) : (
            <>
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
              <Badge variant={newsItem.relevance === 'high' ? 'default' : 'outline'} className={newsItem.relevance === 'high' ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                {newsItem.relevance === 'high' ? 'High Relevance' : 'Low Relevance'}
              </Badge>
            </>
          )}
        </div>
        <Button variant="ghost" size="sm" className="text-xs" asChild>
          <a href={newsItem.url} target="_blank" rel="noopener noreferrer">
            Read More
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );

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
        
        <div className="focus-mode">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="space-y-4 mb-4">
                <Input
                  placeholder="Search news content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                <div className="flex flex-col md:flex-row gap-4">
                  <StockSearch
                    value={tickerFilter}
                    onChange={setTickerFilter}
                    placeholder="Search stock symbols..."
                    className="flex-1"
                  />
                  
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <Tabs defaultValue="all">
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="all">All News</TabsTrigger>
                    <TabsTrigger value="positive">Positive</TabsTrigger>
                    <TabsTrigger value="negative">Negative</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {filteredNews.length} articles • Page {currentPage} of {totalPages}
                      {dateRange?.from && dateRange?.to && (
                        ` • ${formatDisplayDate(dateRange.from.toISOString())} - ${formatDisplayDate(dateRange.to.toISOString())}`
                      )}
                    </span>
                  </div>
                </div>
                
                {aiAnalysisLoading && (
                  <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg mb-4">
                    <Loader className="h-5 w-5 animate-spin mr-2 text-blue-600" />
                    <span className="text-blue-600">Running OpenAI relevance analysis on news articles...</span>
                  </div>
                )}
                
                <TabsContent value="all" className="mt-0">
                  <div className="space-y-4">
                    {paginatedNews.length > 0 ? (
                      <>
                        {paginatedNews.map(newsItem => (
                          <NewsItemCard key={newsItem.id} newsItem={newsItem} />
                        ))}
                        
                        {totalPages > 1 && (
                          <Pagination className="mt-6">
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious 
                                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                              </PaginationItem>
                              
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage - 2 + i;
                                }
                                
                                return (
                                  <PaginationItem key={pageNum}>
                                    <PaginationLink
                                      onClick={() => handlePageChange(pageNum)}
                                      isActive={currentPage === pageNum}
                                      className="cursor-pointer"
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              })}
                              
                              <PaginationItem>
                                <PaginationNext 
                                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500">No news items match your current filters</p>
                        <Button 
                          variant="link" 
                          onClick={() => {
                            setSearchQuery('');
                            setTickerFilter('');
                            setShowHighRelevanceOnly(false);
                            setSentimentFilter('all');
                            setDateRange({
                              from: subDays(new Date(), 7),
                              to: new Date(),
                            });
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
                      <NewsItemCard key={newsItem.id} newsItem={newsItem} />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="negative" className="mt-0">
                  <div className="space-y-4">
                    {filteredNews.filter(newsItem => newsItem.sentiment === 'negative').map(newsItem => (
                      <NewsItemCard key={newsItem.id} newsItem={newsItem} />
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
                      setTickerFilter('');
                      setShowHighRelevanceOnly(false);
                      setSentimentFilter('all');
                      setDateRange({
                        from: subDays(new Date(), 7),
                        to: new Date(),
                      });
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
