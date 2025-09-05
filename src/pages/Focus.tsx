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
  const [analyzedArticles, setAnalyzedArticles] = useState<Set<string>>(new Set());

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

  // Optimized individual article analysis with persistent caching and better state management
  useEffect(() => {
    const processArticleAnalysis = async () => {
      if (paginatedNews.length === 0) return;

      // Get all unanalyzed articles that need processing
      const unanalyzedArticles = paginatedNews.filter(
        item => !analyzedArticles.has(item.id) && 
               !processingArticleIds.has(item.id) &&
               item.sentiment === 'neutral' && 
               item.relevance === 'low'
      );

      if (unanalyzedArticles.length === 0) return;

      console.log(`Starting analysis for ${unanalyzedArticles.length} articles`);

      // Mark articles as processing before starting
      setProcessingArticleIds(prev => {
        const newSet = new Set(prev);
        unanalyzedArticles.forEach(article => newSet.add(article.id));
        return newSet;
      });

      // Process articles with proper error handling and state consistency
      try {
        for (const article of unanalyzedArticles) {
          try {
            const analysisResults = await aiNewsAnalysis.analyzeArticles([{
              id: article.id,
              title: article.title,
              content: article.content,
              ticker: article.ticker,
              source: article.provider
            }]);

            if (analysisResults && analysisResults.length > 0) {
              const analysis = analysisResults[0];
              
              console.log(`Analysis complete for ${article.id}: sentiment=${analysis.sentiment}, relevance=${analysis.relevance}`);
              
              // Update the article with analysis results immediately
              setAllNews(prevNews => {
                return prevNews.map(newsItem => {
                  if (newsItem.id === article.id) {
                    return {
                      ...newsItem,
                      sentiment: analysis.sentiment,
                      relevance: analysis.relevance
                    };
                  }
                  return newsItem;
                });
              });

              // Mark as analyzed in separate state update
              setAnalyzedArticles(prev => new Set([...prev, article.id]));
            }
          } catch (error) {
            console.error(`Analysis error for article ${article.id}:`, error);
          }

          // Remove from processing set after completion
          setProcessingArticleIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(article.id);
            return newSet;
          });

          // Small delay between articles to prevent API overwhelming
          if (unanalyzedArticles.indexOf(article) < unanalyzedArticles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      } catch (error) {
        console.error('Error in article analysis process:', error);
        // Clear processing state on error
        setProcessingArticleIds(prev => {
          const newSet = new Set(prev);
          unanalyzedArticles.forEach(article => newSet.delete(article.id));
          return newSet;
        });
      }
    };

    processArticleAnalysis();
  }, [paginatedNews.map(item => item.id).join(','), analyzedArticles.size]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Component for rendering news item with image - enhanced with loading states
  const NewsItemCard = ({ newsItem }: { newsItem: NewsItem }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    return (
      <Card key={newsItem.id} className="liquid-glass">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="space-y-1 flex-1">
              <CardTitle className="glass-subheading text-lg font-light leading-tight">{newsItem.title}</CardTitle>
              <CardDescription className="glass-body text-sm">
                {newsItem.source} • {formatDisplayDate(newsItem.date)} • 
                <span className="text-xs ml-1 px-1.5 py-0.5 bg-glass-background backdrop-blur-sm rounded">
                  {newsItem.provider.toUpperCase()}
                </span>
              </CardDescription>
            </div>
            {newsItem.ticker && (
              <Badge variant="outline" className="h-fit ml-0 sm:ml-2 w-fit bg-glass-background backdrop-blur-sm">
                {newsItem.ticker}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {newsItem.image && !imageError && (
              <div className="flex-shrink-0">
                {!imageLoaded && (
                  <div className="w-24 h-24 bg-glass-background backdrop-blur-sm rounded-lg animate-pulse flex items-center justify-center">
                    <Loader className="h-4 w-4 animate-spin glass-accent" />
                  </div>
                )}
                <img 
                  src={newsItem.image} 
                  alt={newsItem.title}
                  className={`w-24 h-24 object-cover rounded-lg transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true);
                    setImageLoaded(false);
                  }}
                />
              </div>
            )}
            <p className="glass-body flex-1 text-sm leading-relaxed">{newsItem.content}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between pt-2 gap-3">
          <div className="flex flex-wrap gap-2">
            {processingArticleIds.has(newsItem.id) ? (
              <>
                <Badge variant="secondary" className="bg-glass-background backdrop-blur-sm">
                  <Loader className="h-3 w-3 mr-1 animate-spin" />
                  Analyzing...
                </Badge>
                <Badge variant="secondary" className="bg-glass-background backdrop-blur-sm">
                  <Loader className="h-3 w-3 mr-1 animate-spin" />
                  Analyzing...
                </Badge>
              </>
            ) : (
              <>
                <Badge 
                  className={`
                    liquid-glass px-3 py-1 text-xs font-medium border
                    ${newsItem.sentiment === 'positive' 
                      ? 'bg-emerald-500/20 text-emerald-700 border-emerald-300/30 dark:text-emerald-400 dark:border-emerald-600/30' 
                      : newsItem.sentiment === 'negative' 
                      ? 'bg-red-500/20 text-red-700 border-red-300/30 dark:text-red-400 dark:border-red-600/30'
                      : 'bg-slate-500/20 text-slate-700 border-slate-300/30 dark:text-slate-400 dark:border-slate-600/30'
                    }
                  `}
                >
                  {newsItem.sentiment === 'positive' ? (
                    <ThumbsUp className="h-3 w-3 mr-1" />
                  ) : newsItem.sentiment === 'negative' ? (
                    <ThumbsDown className="h-3 w-3 mr-1" />
                  ) : (
                    <Info className="h-3 w-3 mr-1" />
                  )}
                  {newsItem.sentiment.charAt(0).toUpperCase() + newsItem.sentiment.slice(1)}
                </Badge>
                <Badge 
                  className={`
                    liquid-glass px-3 py-1 text-xs font-medium border
                    ${newsItem.relevance === 'high' 
                      ? 'bg-green-600/20 text-green-800 border-green-400/30 dark:text-green-300 dark:border-green-500/30' 
                      : 'bg-gray-500/20 text-gray-700 border-gray-300/30 dark:text-gray-400 dark:border-gray-600/30'
                    }
                  `}
                >
                  {newsItem.relevance === 'high' ? 'High Relevance' : 'Low Relevance'}
                </Badge>
              </>
            )}
          </div>
          <Button variant="ghost" size="sm" className="glass-body text-xs bg-glass-background backdrop-blur-sm hover:bg-foreground/10 w-full sm:w-auto" asChild>
            <a href={newsItem.url} target="_blank" rel="noopener noreferrer">
              Read More
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="liquid-glass flex justify-center items-center h-64 rounded-xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-glass-border"></div>
            <p className="glass-body">Loading news articles...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="liquid-glass p-6 rounded-xl border-destructive">
          <h3 className="glass-subheading font-medium text-destructive mb-2">Error loading news</h3>
          <p className="glass-body text-destructive">{error}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h1 className="glass-heading text-2xl sm:text-3xl lg:text-4xl font-light flex items-center">
              <BrainCircuit className="mr-2 lg:mr-3 h-8 w-8 lg:h-10 lg:w-10 glass-accent" />
              Focus Mode
            </h1>
            <p className="glass-subheading mt-2 text-sm lg:text-base">
              Filter out the noise and focus on what matters for your investments
            </p>
          </div>
          
          <div className="liquid-glass flex items-center space-x-3 p-3 lg:p-4 rounded-lg w-full lg:w-auto">
            <Switch 
              id="high-relevance" 
              checked={showHighRelevanceOnly}
              onCheckedChange={(checked) => {
                console.log('Toggle changed:', checked);
                setShowHighRelevanceOnly(checked);
              }}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="high-relevance" className="glass-body cursor-pointer text-sm lg:text-base">Show High Relevance Only</Label>
          </div>
        </div>
        
        <div className="liquid-glass p-4 sm:p-6 rounded-xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-2">
              <div className="space-y-4 mb-6">
                <Input
                  placeholder="Search news content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-glass-background backdrop-blur-md border-glass-border"
                />
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <StockSearch
                    value={tickerFilter}
                    onChange={setTickerFilter}
                    placeholder="Search stock symbols..."
                    className="flex-1"
                  />
                  
                  <div className="flex-1 relative">
                    <div className="relative z-[60]">
                      <DateRangePicker
                        value={dateRange}
                        onChange={(range) => setDateRange(range)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <Tabs value={sentimentFilter} onValueChange={setSentimentFilter} className="liquid-glass p-3 sm:p-4 rounded-lg">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                  <TabsList className="bg-glass-background backdrop-blur-sm border-glass-border w-full lg:w-auto">
                    <TabsTrigger value="all" className="glass-body flex-1 lg:flex-none">All News</TabsTrigger>
                    <TabsTrigger value="positive" className="glass-body flex-1 lg:flex-none">Positive</TabsTrigger>
                    <TabsTrigger value="negative" className="glass-body flex-1 lg:flex-none">Negative</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center glass-body text-xs lg:text-sm">
                    <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                    <span className="truncate">
                      {filteredNews.length} articles • Page {currentPage} of {totalPages}
                      {dateRange?.from && dateRange?.to && (
                        <span className="hidden sm:inline">
                          {` • ${formatDisplayDate(dateRange.from.toISOString())} - ${formatDisplayDate(dateRange.to.toISOString())}`}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                
                {processingArticleIds.size > 0 && (
                  <div className="liquid-glass flex items-center justify-center p-4 rounded-lg mb-4">
                    <Loader className="h-5 w-5 animate-spin mr-2 glass-accent" />
                    <span className="glass-body">
                      Analyzing {processingArticleIds.size} article{processingArticleIds.size > 1 ? 's' : ''}...
                    </span>
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
                                  className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} bg-glass-background backdrop-blur-sm hover:bg-foreground/10`}
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
                                      className="cursor-pointer bg-glass-background backdrop-blur-sm hover:bg-foreground/10"
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              })}
                              
                              <PaginationItem>
                                <PaginationNext 
                                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                  className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} bg-glass-background backdrop-blur-sm hover:bg-foreground/10`}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        )}
                      </>
                    ) : (
                      <div className="liquid-glass p-8 rounded-lg text-center">
                        <p className="glass-body">No articles found matching your filters.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="positive" className="mt-0">
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
                                  className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} bg-glass-background backdrop-blur-sm hover:bg-foreground/10`}
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
                                      className="cursor-pointer bg-glass-background backdrop-blur-sm hover:bg-foreground/10"
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              })}
                              
                              <PaginationItem>
                                <PaginationNext 
                                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                  className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} bg-glass-background backdrop-blur-sm hover:bg-foreground/10`}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        )}
                      </>
                    ) : (
                      <div className="liquid-glass p-8 rounded-lg text-center">
                        <p className="glass-body">No positive articles found matching your filters.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="negative" className="mt-0">
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
                                  className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} bg-glass-background backdrop-blur-sm hover:bg-foreground/10`}
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
                                      className="cursor-pointer bg-glass-background backdrop-blur-sm hover:bg-foreground/10"
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              })}
                              
                              <PaginationItem>
                                <PaginationNext 
                                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                  className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} bg-glass-background backdrop-blur-sm hover:bg-foreground/10`}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        )}
                      </>
                    ) : (
                      <div className="liquid-glass p-8 rounded-lg text-center">
                        <p className="glass-body">No negative articles found matching your filters.</p>
                        <Button 
                          variant="ghost" 
                          className="glass-body bg-glass-background backdrop-blur-sm hover:bg-foreground/10 mt-2"
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
              </Tabs>
            </div>
            
            <div className="space-y-4 lg:space-y-6">
              <Card className="liquid-glass">
                <CardHeader>
                  <CardTitle className="glass-subheading text-base lg:text-lg flex items-center">
                    <Filter className="h-4 w-4 lg:h-5 lg:w-5 mr-2 glass-accent" />
                    Filter Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sentiment-filter" className="glass-body text-sm">Sentiment</Label>
                    <Select 
                      value={sentimentFilter} 
                      onValueChange={setSentimentFilter}
                    >
                      <SelectTrigger id="sentiment-filter" className="bg-glass-background backdrop-blur-sm border-glass-border">
                        <SelectValue placeholder="All Sentiments" />
                      </SelectTrigger>
                      <SelectContent className="bg-glass-background backdrop-blur-md border-glass-border">
                        <SelectItem value="all" className="glass-body">All Sentiments</SelectItem>
                        <SelectItem value="positive" className="glass-body">Positive</SelectItem>
                        <SelectItem value="neutral" className="glass-body">Neutral</SelectItem>
                        <SelectItem value="negative" className="glass-body">Negative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 glass-body text-sm bg-glass-background backdrop-blur-sm border-glass-border hover:bg-foreground/10"
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
              
              <Card className="liquid-glass hidden lg:block">
                <CardHeader>
                  <CardTitle className="glass-subheading text-lg flex items-center">
                    <BrainCircuit className="h-5 w-5 mr-2 glass-accent" />
                    Focus Mode Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 glass-body text-sm">
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-glass-background backdrop-blur-sm flex items-center justify-center glass-accent mr-2 flex-shrink-0 mt-0.5 text-xs">1</div>
                      <span>Filter out market noise to focus on relevant information</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-glass-background backdrop-blur-sm flex items-center justify-center glass-accent mr-2 flex-shrink-0 mt-0.5 text-xs">2</div>
                      <span>Reduce recency bias by viewing historical context</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-glass-background backdrop-blur-sm flex items-center justify-center glass-accent mr-2 flex-shrink-0 mt-0.5 text-xs">3</div>
                      <span>Identify sentiment trends across different news sources</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-glass-background backdrop-blur-sm flex items-center justify-center glass-accent mr-2 flex-shrink-0 mt-0.5 text-xs">4</div>
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
