
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Search, Calendar, ArrowUpRight, Calendar as CalendarLogo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar as UICalendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Mock earnings data
const mockEarningsData = [
  {
    id: 1,
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    date: new Date('2025-04-30'),
    time: 'After Close',
    epsEstimate: 1.52,
    epsPrior: 1.47,
    revenueEstimate: '96.4B',
    revenuePrior: '94.8B',
  },
  {
    id: 2,
    ticker: 'MSFT',
    companyName: 'Microsoft Corporation',
    date: new Date('2025-04-28'),
    time: 'After Close',
    epsEstimate: 2.68,
    epsPrior: 2.48,
    revenueEstimate: '61.2B',
    revenuePrior: '56.5B',
  },
  {
    id: 3,
    ticker: 'AMZN',
    companyName: 'Amazon.com, Inc.',
    date: new Date('2025-05-02'),
    time: 'After Close',
    epsEstimate: 0.89,
    epsPrior: 0.65,
    revenueEstimate: '142.8B',
    revenuePrior: '127.4B',
  },
  {
    id: 4,
    ticker: 'GOOGL',
    companyName: 'Alphabet Inc.',
    date: new Date('2025-04-25'),
    time: 'After Close',
    epsEstimate: 1.87,
    epsPrior: 1.68,
    revenueEstimate: '78.3B',
    revenuePrior: '72.1B',
  },
  {
    id: 5,
    ticker: 'META',
    companyName: 'Meta Platforms, Inc.',
    date: new Date('2025-05-01'),
    time: 'After Close',
    epsEstimate: 4.21,
    epsPrior: 3.85,
    revenueEstimate: '38.6B',
    revenuePrior: '34.2B',
  },
  {
    id: 6,
    ticker: 'NFLX',
    companyName: 'Netflix, Inc.',
    date: new Date('2025-04-22'),
    time: 'After Close',
    epsEstimate: 4.76,
    epsPrior: 4.45,
    revenueEstimate: '9.2B',
    revenuePrior: '8.8B',
  },
  {
    id: 7,
    ticker: 'TSLA',
    companyName: 'Tesla, Inc.',
    date: new Date('2025-04-21'),
    time: 'After Close',
    epsEstimate: 0.78,
    epsPrior: 0.63,
    revenueEstimate: '25.7B',
    revenuePrior: '23.2B',
  },
  {
    id: 8,
    ticker: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    date: new Date('2025-04-15'),
    time: 'Before Open',
    epsEstimate: 4.12,
    epsPrior: 3.98,
    revenueEstimate: '41.2B',
    revenuePrior: '39.3B',
  },
  {
    id: 9,
    ticker: 'V',
    companyName: 'Visa Inc.',
    date: new Date('2025-04-29'),
    time: 'After Close',
    epsEstimate: 2.47,
    epsPrior: 2.33,
    revenueEstimate: '8.6B',
    revenuePrior: '8.1B',
  },
  {
    id: 10,
    ticker: 'DIS',
    companyName: 'The Walt Disney Company',
    date: new Date('2025-05-08'),
    time: 'After Close',
    epsEstimate: 1.14,
    epsPrior: 0.93,
    revenueEstimate: '23.8B',
    revenuePrior: '22.1B',
  },
];

// Mock transcripts data
const mockTranscripts = [
  {
    id: 1,
    ticker: 'AAPL',
    date: new Date('2025-01-31'),
    quarter: 'Q1 2025',
    highlights: [
      "Record quarterly revenue of $94.8 billion",
      "Services revenue reached all-time high of $23.1 billion",
      "iPhone sales grew 6% year-over-year",
      "Expansion plans in India and Southeast Asia",
    ]
  },
  {
    id: 2,
    ticker: 'MSFT',
    date: new Date('2025-01-28'),
    quarter: 'Q2 FY25',
    highlights: [
      "Azure revenue increased 27% year-over-year",
      "Microsoft 365 consumer subscribers surpassed 65 million",
      "AI solutions driving enterprise growth",
      "Gaming revenue up 22% following Activision Blizzard acquisition",
    ]
  },
  {
    id: 3,
    ticker: 'AMZN',
    date: new Date('2025-02-01'),
    quarter: 'Q4 2024',
    highlights: [
      "AWS revenue grew 18% year-over-year",
      "Advertising revenue exceeded $14 billion",
      "North America retail segment operating margin improved to 5.2%",
      "Prime membership retention rates at all-time high",
    ]
  },
];

const Earnings = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTranscript, setSelectedTranscript] = useState<typeof mockTranscripts[0] | null>(null);
  
  // Filter earnings by search query and date
  const filteredEarnings = mockEarningsData.filter(earning => {
    const matchesSearch = 
      earning.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
      earning.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = date ? 
      earning.date.getMonth() === date.getMonth() && 
      earning.date.getFullYear() === date.getFullYear() 
      : true;
    
    return matchesSearch && matchesDate;
  });
  
  // Get upcoming earnings (next 7 days)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingEarnings = mockEarningsData.filter(earning => 
    earning.date >= today && earning.date <= nextWeek
  ).sort((a, b) => a.date.getTime() - b.date.getTime());

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
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="ghost" 
              onClick={() => setDate(new Date())}
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
                      placeholder="Search by ticker or company..."
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
                {filteredEarnings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Ticker</th>
                          <th className="text-left py-3 px-4">Company</th>
                          <th className="text-center py-3 px-4">Date</th>
                          <th className="text-center py-3 px-4">Time</th>
                          <th className="text-right py-3 px-4">EPS Est.</th>
                          <th className="text-right py-3 px-4">EPS Prior</th>
                          <th className="text-right py-3 px-4">Rev. Est.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEarnings.sort((a, b) => a.date.getTime() - b.date.getTime()).map(earning => (
                          <tr key={earning.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{earning.ticker}</td>
                            <td className="py-3 px-4">{earning.companyName}</td>
                            <td className="py-3 px-4 text-center">{format(earning.date, 'MMM d, yyyy')}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={earning.time === 'Before Open' ? 'outline' : 'default'}>
                                {earning.time}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">${earning.epsEstimate.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right">${earning.epsPrior.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right">{earning.revenueEstimate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                {upcomingEarnings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingEarnings.map(earning => (
                      <div key={earning.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <div className="font-medium">{earning.ticker}</div>
                          <div className="text-sm text-gray-500">{format(earning.date, 'MMM d')}</div>
                        </div>
                        <Badge variant={earning.time === 'Before Open' ? 'outline' : 'default'}>
                          {earning.time}
                        </Badge>
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
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Earnings Transcripts</CardTitle>
                <CardDescription>
                  Latest conference call transcripts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTranscripts.map(transcript => (
                    <div 
                      key={transcript.id} 
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedTranscript(transcript === selectedTranscript ? null : transcript)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{transcript.ticker} - {transcript.quarter}</div>
                          <div className="text-sm text-gray-500">{format(transcript.date, 'MMM d, yyyy')}</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {selectedTranscript?.id === transcript.id && (
                        <div className="mt-3 pt-3 border-t">
                          <Label className="text-xs text-gray-500 mb-2 block">Key Highlights</Label>
                          <ul className="space-y-2 text-sm">
                            {transcript.highlights.map((highlight, index) => (
                              <li key={index} className="flex items-start">
                                <div className="h-5 w-5 rounded-full bg-mindful-100 flex items-center justify-center text-mindful-600 mr-2 flex-shrink-0 mt-0.5 text-xs">
                                  {index + 1}
                                </div>
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Earnings;
