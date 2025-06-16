
import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sun, Moon } from 'lucide-react';
import { EarningsEvent } from '@/hooks/useEarningsData';
import StockLogo from '@/components/insights/StockLogo';

interface EarningsCalendarGridProps {
  earnings: EarningsEvent[];
  viewMode: '7days' | 'month';
  selectedDate: Date;
  onCompanyClick: (company: EarningsEvent) => void;
  onOverflowClick: (companies: EarningsEvent[], date: Date) => void;
}

const EarningsCalendarGrid: React.FC<EarningsCalendarGridProps> = ({
  earnings,
  viewMode,
  selectedDate,
  onCompanyClick,
  onOverflowClick
}) => {
  const getDaysToShow = () => {
    if (viewMode === '7days') {
      const start = new Date();
      return eachDayOfInterval({
        start,
        end: addDays(start, 6)
      });
    } else {
      return eachDayOfInterval({
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate)
      });
    }
  };

  const getEarningsForDay = (day: Date) => {
    return earnings.filter(earning => isSameDay(new Date(earning.date), day));
  };

  const sortCompaniesByRevenue = (companies: EarningsEvent[]) => {
    return companies.sort((a, b) => {
      const aRevenue = a.revenueEstimate || 0;
      const bRevenue = b.revenueEstimate || 0;
      return bRevenue - aRevenue;
    });
  };

  const days = getDaysToShow();
  const today = new Date();

  const renderWeekView = () => {
    return (
      <div className="grid grid-cols-7 gap-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-center font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dayEarnings = getEarningsForDay(day);
          const sortedEarnings = sortCompaniesByRevenue(dayEarnings);
          const visibleCompanies = sortedEarnings.slice(0, 9);
          const remainingCount = sortedEarnings.length - 9;
          const isToday = isSameDay(day, today);

          return (
            <Card key={index} className={`min-h-32 ${isToday ? 'ring-2 ring-mindful-600' : ''}`}>
              <CardContent className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${isToday ? 'text-mindful-600' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </span>
                  {isToday && (
                    <Badge variant="secondary" className="text-xs">Today</Badge>
                  )}
                </div>
                
                {dayEarnings.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-4">
                    No Earnings
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-1">
                      {visibleCompanies.map((company, idx) => (
                        <button
                          key={`${company.symbol}-${idx}`}
                          onClick={() => onCompanyClick(company)}
                          className="flex flex-col items-center p-1 rounded hover:bg-gray-50 transition-colors"
                        >
                          <StockLogo ticker={company.symbol} size={24} className="mb-1" />
                          <span className="text-xs font-medium truncate w-full text-center">
                            {company.symbol}
                          </span>
                          <div className="flex items-center justify-center">
                            {company.hour === 'bmo' ? (
                              <Sun className="h-3 w-3 text-yellow-500" />
                            ) : (
                              <Moon className="h-3 w-3 text-blue-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {remainingCount > 0 && (
                      <button
                        onClick={() => onOverflowClick(sortedEarnings.slice(9), day)}
                        className="w-full p-2 text-xs font-medium text-mindful-600 bg-mindful-50 rounded hover:bg-mindful-100 transition-colors"
                      >
                        +{remainingCount} more
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-center font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        {calendarDays.map((day, index) => {
          const dayEarnings = getEarningsForDay(day);
          const sortedEarnings = sortCompaniesByRevenue(dayEarnings);
          const visibleCompanies = sortedEarnings.slice(0, 9);
          const remainingCount = sortedEarnings.length - 9;
          const isToday = isSameDay(day, today);
          const isCurrentMonth = day >= monthStart && day <= monthEnd;

          return (
            <Card key={index} className={`min-h-24 ${isToday ? 'ring-2 ring-mindful-600' : ''} ${!isCurrentMonth ? 'opacity-50' : ''}`}>
              <CardContent className="p-2">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-medium ${isToday ? 'text-mindful-600' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </span>
                  {isToday && (
                    <Badge variant="secondary" className="text-xs py-0 px-1">Today</Badge>
                  )}
                </div>
                
                {dayEarnings.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-2">
                    No Earnings
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="grid grid-cols-3 gap-1">
                      {visibleCompanies.slice(0, 6).map((company, idx) => (
                        <button
                          key={`${company.symbol}-${idx}`}
                          onClick={() => onCompanyClick(company)}
                          className="flex flex-col items-center p-1 rounded hover:bg-gray-50 transition-colors"
                        >
                          <StockLogo ticker={company.symbol} size={16} className="mb-0.5" />
                          <span className="text-xs font-medium truncate w-full text-center text-gray-700">
                            {company.symbol}
                          </span>
                        </button>
                      ))}
                    </div>
                    
                    {remainingCount > 0 && (
                      <button
                        onClick={() => onOverflowClick(sortedEarnings.slice(6), day)}
                        className="w-full p-1 text-xs font-medium text-mindful-600 bg-mindful-50 rounded hover:bg-mindful-100 transition-colors"
                      >
                        +{remainingCount + (visibleCompanies.length - 6)} more
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return viewMode === '7days' ? renderWeekView() : renderMonthView();
};

export default EarningsCalendarGrid;
