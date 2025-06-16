
import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
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
      // Get next 7 weekdays only (Monday-Friday)
      const weekdays = [];
      let currentDay = new Date(start);
      
      while (weekdays.length < 7) {
        const dayOfWeek = currentDay.getDay();
        // Only include Monday (1) through Friday (5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          weekdays.push(new Date(currentDay));
        }
        currentDay = addDays(currentDay, 1);
      }
      return weekdays;
    } else {
      // For month view, get all weekdays in the month
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      // Filter to only weekdays (Monday-Friday)
      return allDays.filter(day => {
        const dayOfWeek = day.getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      });
    }
  };

  const getEarningsForDay = (day: Date) => {
    return earnings.filter(earning => {
      // Parse the API date string correctly to avoid timezone issues
      const earningDate = parseISO(earning.date);
      return isSameDay(earningDate, day);
    });
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
      <div className="grid grid-cols-5 gap-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
          <div key={day} className="text-center font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dayEarnings = getEarningsForDay(day);
          const sortedEarnings = sortCompaniesByRevenue(dayEarnings);
          const visibleCompanies = sortedEarnings.slice(0, 6);
          const remainingCount = sortedEarnings.length - 6;
          const isToday = isSameDay(day, today);

          return (
            <Card key={index} className={`min-h-40 ${isToday ? 'ring-2 ring-mindful-600' : ''}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-sm font-medium ${isToday ? 'text-mindful-600' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </span>
                  {isToday && (
                    <Badge variant="secondary" className="text-xs">Today</Badge>
                  )}
                </div>
                
                {dayEarnings.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-6">
                    No Earnings
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {visibleCompanies.map((company, idx) => (
                        <button
                          key={`${company.symbol}-${idx}`}
                          onClick={() => onCompanyClick(company)}
                          className="flex flex-col items-center p-2 rounded hover:bg-gray-50 transition-colors"
                        >
                          <StockLogo ticker={company.symbol} size={32} className="mb-1" />
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
                        onClick={() => onOverflowClick(sortedEarnings.slice(6), day)}
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
    // Group days by weeks for month view
    const weeks = [];
    let currentWeek = [];
    
    days.forEach((day, index) => {
      currentWeek.push(day);
      
      // If it's Friday or the last day, complete the week
      if (day.getDay() === 5 || index === days.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
            <div key={day} className="text-center font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }, (_, dayIndex) => {
              const day = week[dayIndex];
              
              if (!day) {
                return <div key={dayIndex} className="min-h-24"></div>;
              }
              
              const dayEarnings = getEarningsForDay(day);
              const sortedEarnings = sortCompaniesByRevenue(dayEarnings);
              const visibleCompanies = sortedEarnings.slice(0, 6);
              const remainingCount = sortedEarnings.length - 6;
              const isToday = isSameDay(day, today);

              return (
                <Card key={dayIndex} className={`min-h-28 ${isToday ? 'ring-2 ring-mindful-600' : ''}`}>
                  <CardContent className="p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-medium ${isToday ? 'text-mindful-600' : 'text-gray-700'}`}>
                        {format(day, 'd')}
                      </span>
                      {isToday && (
                        <Badge variant="secondary" className="text-xs py-0 px-1">Today</Badge>
                      )}
                    </div>
                    
                    {dayEarnings.length === 0 ? (
                      <div className="text-xs text-gray-400 text-center py-3">
                        No Earnings
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="grid grid-cols-3 gap-1">
                          {visibleCompanies.map((company, idx) => (
                            <button
                              key={`${company.symbol}-${idx}`}
                              onClick={() => onCompanyClick(company)}
                              className="flex flex-col items-center p-1 rounded hover:bg-gray-50 transition-colors"
                            >
                              <StockLogo ticker={company.symbol} size={20} className="mb-0.5" />
                            </button>
                          ))}
                        </div>
                        
                        {remainingCount > 0 && (
                          <button
                            onClick={() => onOverflowClick(sortedEarnings.slice(6), day)}
                            className="w-full p-1 text-xs font-medium text-mindful-600 bg-mindful-50 rounded hover:bg-mindful-100 transition-colors"
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
        ))}
      </div>
    );
  };

  return viewMode === '7days' ? renderWeekView() : renderMonthView();
};

export default EarningsCalendarGrid;
