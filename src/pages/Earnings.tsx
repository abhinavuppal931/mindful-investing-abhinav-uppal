import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Search, Calendar, ArrowUpRight, Calendar as CalendarLogo, Sun, Moon, Loader2, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar as UICalendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { useEarningsData, EarningsEvent } from '@/hooks/useEarningsData';
import { openaiAPI, logokitAPI } from '@/services/api';
import EarningsCalendarGrid from '@/components/earnings/EarningsCalendarGrid';
import EarningsSidebar from '@/components/earnings/EarningsSidebar';

const Earnings = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
  const [transcriptHighlights, setTranscriptHighlights] = useState<string>('');
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('transcript');
  const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'7days' | 'month'>('7days');
  const [calendarViewType, setCalendarViewType] = useState<'calendar' | 'list'>('calendar');
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<EarningsEvent | undefined>();
  const [overflowCompanies, setOverflowCompanies] = useState<EarningsEvent[]>([]);
  const [overflowDate, setOverflowDate] = useState<Date | undefined>();
  
  // Pagination state for list view
  const [currentCalendarPage, setCurrentCalendarPage] = useState(1);
  const [currentUpcomingPage, setCurrentUpcomingPage] = useState(1);
  const itemsPerPage = 10;
  
  const { earnings, transcripts, loading, error, fetchEarningsCalendar, fetchEarningsTranscript } = useEarningsData();
  
  // Filter earnings by search query
  const filteredEarnings = earnings.filter(earning => {
    const matchesSearch = 
      earning.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });
  
  // Get upcoming earnings (next 7 days)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingEarnings = earnings.filter(earning => {
    const earningDate = new Date(earning.date);
    return earningDate >= today && earningDate <= nextWeek;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Pagination for calendar
  const totalCalendarPages = Math.ceil(filteredEarnings.length / itemsPerPage);
  const paginatedCalendarEarnings = filteredEarnings.slice(
    (currentCalendarPage - 1) * itemsPerPage,
    currentCalendarPage * itemsPerPage
  );

  // Pagination for upcoming
  const totalUpcomingPages = Math.ceil(upcomingEarnings.length / itemsPerPage);
  const paginatedUpcomingEarnings = upcomingEarnings.slice(
    (currentUpcomingPage - 1) * itemsPerPage,
    currentUpcomingPage * itemsPerPage
  );

  const fetchCompanyLogo = async (symbol: string) => {
    if (companyLogos[symbol]) return companyLogos[symbol];
    
    try {
      const response = await logokitAPI.getLogo(symbol);
      if (response?.logoUrl) {
        setCompanyLogos(prev => ({ ...prev, [symbol]: response.logoUrl }));
        return response.logoUrl;
      }
    } catch (error) {
      console.error(`Error fetching logo for ${symbol}:`, error);
    }
    return null;
  };

  const handleCompanyClick = (company: EarningsEvent) => {
    setSelectedCompany(company);
    setOverflowCompanies([]);
    setOverflowDate(undefined);
    setSidebarOpen(true);
  };

  const handleOverflowClick = (companies: EarningsEvent[], date: Date) => {
    setSelectedCompany(undefined);
    setOverflowCompanies(companies);
    setOverflowDate(date);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedCompany(undefined);
    setOverflowCompanies([]);
    setOverflowDate(undefined);
  };

  const handleTranscriptSearch = async () => {
    if (!transcriptSearch.trim()) return;
    
    try {
      const transcript = await fetchEarningsTranscript(transcriptSearch.toUpperCase(), selectedYear, selectedQuarter);
      if (transcript) {
        setSelectedTranscript(transcript);
        setTranscriptHighlights('');
        setActiveTab('transcript');
        // Fetch logo for the selected company
        fetchCompanyLogo(transcriptSearch.toUpperCase());
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
    }
  };

  const generateHighlights = async () => {
    if (!selectedTranscript?.transcript) return;
    
    setLoadingHighlights(true);
    try {
      const response = await openaiAPI.analyzeEarningsHighlights(selectedTranscript.symbol, selectedTranscript.transcript);
      if (response?.analysis) {
        setTranscriptHighlights(response.analysis);
        setActiveTab('highlights');
      }
    } catch (error) {
      console.error('Error generating highlights:', error);
    } finally {
      setLoadingHighlights(false);
    }
  };

  const formatHighlights = (text: string) => {
    if (!text) return null;
    
    // Remove asterisks and format sections
    const cleanText = text.replace(/\*/g, '');
    
    // Split by numbered points (1., 2., 3., etc.)
    const points = cleanText.split(/(?=\d+\.\s)/).filter(point => point.trim());
    
    // If no numbered points found, split by sections
    if (points.length <= 1) {
      const sections = cleanText.split(/(?=Executive Summary|Financial Performance|Business Highlights|Outlook|Tailwinds|Caution Areas|Headwinds)/);
      
      return sections.map((section, index) => {
        if (!section.trim()) return null;
        
        const lines = section.trim().split('\n').filter(line => line.trim());
        if (lines.length === 0) return null;
        
        const title = lines[0].replace(':', '');
        const content = lines.slice(1);
        
        const getIcon = (title: string) => {
          if (title.includes('Executive Summary')) return '📊';
          if (title.includes('Financial Performance')) return '💰';
          if (title.includes('Business Highlights')) return '🎯';
          if (title.includes('Outlook')) return '🔮';
          if (title.includes('Tailwinds')) return '🌟';
          if (title.includes('Caution')) return '⚠️';
          if (title.includes('Headwinds')) return '🚩';
          return '📝';
        };
        
        return (
          <div key={index} className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <span className="text-xl mr-2">{getIcon(title)}</span>
              <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>
            <div className="space-y-2">
              {content.map((line, lineIndex) => (
                <p key={lineIndex} className="text-gray-700 leading-relaxed">
                  {line.trim()}
                </p>
              ))}
            </div>
          </div>
        );
      }).filter(Boolean);
    }
    
    // Handle numbered points format
    return points.map((point, index) => {
      const lines = point.trim().split('\n');
      const firstLine = lines[0];
      const content = lines.slice(1);
      
      // Extract number and title
      const match = firstLine.match(/^(\d+)\.\s*(.+)/);
      if (!match) return null;
      
      const [, number, title] = match;
      
      const getIcon = (index: number) => {
        const icons = ['📈', '💼', '🎯', '🔍', '💡', '⚡', '🚀', '📊', '💰', '🌟'];
        return icons[index % icons.length];
      };
      
      return (
        <div key={index} className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start mb-3">
            <span className="text-xl mr-3 mt-1">{getIcon(index)}</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
              <div className="space-y-2">
                {content.map((line, lineIndex) => (
                  line.trim() && (
                    <p key={lineIndex} className="text-gray-700 leading-relaxed">
                      {line.trim()}
                    </p>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  const currentYears = Array.from({length: 11}, (_, i) => 2025 - i); // 2015-2025
  const quarters = [1, 2, 3, 4];

  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center space-x-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
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
            <Button
              key={pageNum}
              variant={pageNum === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          );
        })}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  // Fetch logos for visible earnings
  React.useEffect(() => {
    paginatedCalendarEarnings.forEach(earning => {
      if (!companyLogos[earning.symbol]) {
        fetchCompanyLogo(earning.symbol);
      }
    });
  }, [paginatedCalendarEarnings]);

  React.useEffect(() => {
    paginatedUpcomingEarnings.forEach(earning => {
      if (!companyLogos[earning.symbol]) {
        fetchCompanyLogo(earning.symbol);
      }
    });
  }, [paginatedUpcomingEarnings]);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <CalendarLogo className="mr-2 h-8 w-8 text-mindful-600" />
              Earnings Calendar
            </h1>
            <p className="text-gray-600 mt-1">
              Track upcoming earnings reports and conference calls
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'MMM d, yyyy') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <UICalendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      setDate(selectedDate);
                      setCurrentCalendarPage(1);
                      const from = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1), 'yyyy-MM-dd');
                      const to = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0), 'yyyy-MM-dd');
                      fetchEarningsCalendar(from, to);
                    } else {
                      setDate(undefined);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="ghost" 
              onClick={() => {
                const today = new Date();
                setDate(today);
                setCurrentCalendarPage(1);
                fetchEarningsCalendar();
              }}
            >
              Today
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <CardTitle>Earnings Calendar</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={calendarViewType === 'calendar' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCalendarViewType('calendar')}
                      >
                        <Grid className="h-4 w-4 mr-2" />
                        Calendar
                      </Button>
                      <Button
                        variant={calendarViewType === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCalendarViewType('list')}
                      >
                        <List className="h-4 w-4 mr-2" />
                        List
                      </Button>
                    </div>
                  </div>
                  
                  {calendarViewType === 'calendar' ? (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={viewMode === '7days' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('7days')}
                      >
                        Next 7 Days
                      </Button>
                      <Button
                        variant={viewMode === 'month' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('month')}
                      >
                        Full Month
                      </Button>
                    </div>
                  ) : (
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by ticker..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentCalendarPage(1);
                        }}
                      />
                    </div>
                  )}
                </div>
                <CardDescription>
                  {calendarViewType === 'calendar' 
                    ? `Showing ${viewMode === '7days' ? 'next 7 days' : format(date || new Date(), 'MMMM yyyy')}`
                    : `Showing earnings for ${format(date || new Date(), 'MMMM yyyy')}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({length: 5}).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Error loading earnings</h3>
                    <p className="text-gray-500">{error}</p>
                  </div>
                ) : calendarViewType === 'calendar' ? (
                  <EarningsCalendarGrid
                    earnings={filteredEarnings}
                    viewMode={viewMode}
                    selectedDate={date || new Date()}
                    onCompanyClick={handleCompanyClick}
                    onOverflowClick={handleOverflowClick}
                  />
                ) : paginatedCalendarEarnings.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className="text-right">EPS Est.</TableHead>
                            <TableHead className="text-right">EPS Actual</TableHead>
                            <TableHead className="text-right">Rev. Est.</TableHead>
                            <TableHead className="text-right">Rev. Actual</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedCalendarEarnings.map((earning, index) => (
                            <TableRow key={`${earning.symbol}-${earning.date}-${index}`} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-2">
                                  {companyLogos[earning.symbol] ? (
                                    <img 
                                      src={companyLogos[earning.symbol]} 
                                      alt={`${earning.symbol} logo`}
                                      className="w-8 h-8 rounded-full shadow-sm"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                      {earning.symbol.charAt(0)}
                                    </div>
                                  )}
                                  <span>{earning.symbol}</span>
                                </div>
                              </TableCell>
                              <TableCell>{format(new Date(earning.date), 'MMM d, yyyy')}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {earning.hour === 'bmo' ? (
                                    <>
                                      <Sun className="h-4 w-4 mr-1 text-yellow-500" />
                                      <span>Before Open</span>
                                    </>
                                  ) : (
                                    <>
                                      <Moon className="h-4 w-4 mr-1 text-blue-500" />
                                      <span>After Close</span>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {earning.epsEstimate ? `$${earning.epsEstimate.toFixed(2)}` : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {earning.epsActual ? `$${earning.epsActual.toFixed(2)}` : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {earning.revenueEstimate ? `$${(earning.revenueEstimate / 1000000).toFixed(1)}M` : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {earning.revenueActual ? `$${(earning.revenueActual / 1000000).toFixed(1)}M` : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {renderPagination(currentCalendarPage, totalCalendarPages, setCurrentCalendarPage)}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No earnings found</h3>
                    <p className="text-gray-500">
                      {searchQuery 
                        ? `No earnings matching "${searchQuery}"`
                        : `No earnings scheduled for ${format(date || new Date(), 'MMMM yyyy')}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Earnings</CardTitle>
                <CardDescription>
                  Next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({length: 3}).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : paginatedUpcomingEarnings.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {paginatedUpcomingEarnings.map((earning, index) => (
                        <div key={`${earning.symbol}-${earning.date}-${index}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            {companyLogos[earning.symbol] ? (
                              <img 
                                src={companyLogos[earning.symbol]} 
                                alt={`${earning.symbol} logo`}
                                className="w-10 h-10 rounded-full shadow-sm"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                                {earning.symbol.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{earning.symbol}</div>
                              <div className="text-sm text-gray-500">{format(new Date(earning.date), 'MMM d')}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {earning.hour === 'bmo' ? (
                              <Sun className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <Moon className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {renderPagination(currentUpcomingPage, totalUpcomingPages, setCurrentUpcomingPage)}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No upcoming earnings in the next 7 days</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Earnings Transcripts Section - Keep existing code unchanged */}
        <div className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Transcripts</CardTitle>
              <CardDescription>
                Search and analyze earnings call transcripts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Search Section */}
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="transcript-search">Stock Symbol</Label>
                    <Input
                      id="transcript-search"
                      placeholder="e.g., AAPL"
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <Label htmlFor="year-select">Year</Label>
                    <select 
                      id="year-select"
                      className="w-full p-2 border rounded-md"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                      {currentYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="quarter-select">Quarter</Label>
                    <select 
                      id="quarter-select"
                      className="w-full p-2 border rounded-md"
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                    >
                      {quarters.map(quarter => (
                        <option key={quarter} value={quarter}>Q{quarter}</option>
                      ))}
                    </select>
                  </div>
                  <Button 
                    onClick={handleTranscriptSearch}
                    disabled={!transcriptSearch.trim() || loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    Search
                  </Button>
                </div>

                {/* Transcript Display */}
                {selectedTranscript && (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-3">
                        {companyLogos[selectedTranscript.symbol] && (
                          <img 
                            src={companyLogos[selectedTranscript.symbol]} 
                            alt={`${selectedTranscript.symbol} logo`}
                            className="w-12 h-12 rounded-full shadow-sm"
                          />
                        )}
                        <h3 className="text-lg font-semibold">
                          {selectedTranscript.symbol} - Q{selectedTranscript.quarter} {selectedTranscript.year}
                        </h3>
                      </div>
                      <Button 
                        onClick={generateHighlights}
                        disabled={loadingHighlights}
                        variant="outline"
                        size="sm"
                      >
                        {loadingHighlights ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                        )}
                        Generate Highlights
                      </Button>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="transcript">Full Transcript</TabsTrigger>
                        <TabsTrigger value="highlights">Earnings Highlights</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="transcript" className="mt-4">
                        <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                          <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                            {selectedTranscript.transcript}
                          </pre>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="highlights" className="mt-4">
                        {loadingHighlights ? (
                          <div className="space-y-4">
                            {Array.from({length: 4}).map((_, i) => (
                              <div key={i} className="space-y-2">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                              </div>
                            ))}
                          </div>
                        ) : transcriptHighlights ? (
                          <div className="space-y-4">
                            {formatHighlights(transcriptHighlights)}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            Click "Generate Highlights" to create an AI analysis of this transcript
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sidebar */}
      <EarningsSidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        selectedCompany={selectedCompany}
        overflowCompanies={overflowCompanies}
        overflowDate={overflowDate}
      />
    </MainLayout>
  );
};

export default Earnings;
