
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Search, Calendar, ArrowUpRight, Calendar as CalendarLogo, Sun, Moon, Loader2 } from 'lucide-react';
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
import { format } from 'date-fns';
import { useEarningsData } from '@/hooks/useEarningsData';
import { openaiAPI } from '@/services/api';

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
  
  const { earnings, transcripts, loading, error, fetchEarningsCalendar, fetchEarningsTranscript } = useEarningsData();
  
  // Filter earnings by search query and date
  const filteredEarnings = earnings.filter(earning => {
    const matchesSearch = 
      earning.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = date ? 
      new Date(earning.date).getMonth() === date.getMonth() && 
      new Date(earning.date).getFullYear() === date.getFullYear() 
      : true;
    
    return matchesSearch && matchesDate;
  });
  
  // Get upcoming earnings (next 7 days)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingEarnings = earnings.filter(earning => {
    const earningDate = new Date(earning.date);
    return earningDate >= today && earningDate <= nextWeek;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleTranscriptSearch = async () => {
    if (!transcriptSearch.trim()) return;
    
    try {
      const transcript = await fetchEarningsTranscript(transcriptSearch.toUpperCase(), selectedYear, selectedQuarter);
      if (transcript) {
        setSelectedTranscript(transcript);
        setTranscriptHighlights('');
        setActiveTab('transcript');
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
        <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center mb-3">
            <span className="text-xl mr-2">{getIcon(title)}</span>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
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
  };

  const currentYears = Array.from({length: 3}, (_, i) => new Date().getFullYear() - i);
  const quarters = [1, 2, 3, 4];

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
                  {date ? format(date, 'MMMM yyyy') : <span>Pick a month</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <UICalendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      const newDate = new Date(selectedDate);
                      setDate(newDate);
                      // Fetch earnings for the new month
                      const from = format(new Date(newDate.getFullYear(), newDate.getMonth(), 1), 'yyyy-MM-dd');
                      const to = format(new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0), 'yyyy-MM-dd');
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
                  <CardTitle>Earnings Calendar</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by ticker..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <CardDescription>
                  {date ? `Showing earnings for ${format(date, 'MMMM yyyy')}` : 'Select a month to view earnings'}
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
                ) : filteredEarnings.length > 0 ? (
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
                        {filteredEarnings.map((earning, index) => (
                          <TableRow key={`${earning.symbol}-${earning.date}-${index}`} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium">{earning.symbol}</TableCell>
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
                ) : upcomingEarnings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingEarnings.map((earning, index) => (
                      <div key={`${earning.symbol}-${earning.date}-${index}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div>
                          <div className="font-medium">{earning.symbol}</div>
                          <div className="text-sm text-gray-500">{format(new Date(earning.date), 'MMM d')}</div>
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
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No upcoming earnings in the next 7 days</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Earnings Transcripts Section - Made wider and positioned below calendar */}
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
                      <h3 className="text-lg font-semibold">
                        {selectedTranscript.symbol} - Q{selectedTranscript.quarter} {selectedTranscript.year}
                      </h3>
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
    </MainLayout>
  );
};

export default Earnings;
