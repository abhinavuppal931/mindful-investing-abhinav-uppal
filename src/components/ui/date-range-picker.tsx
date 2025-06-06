
import React, { useState } from 'react';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const presetRanges = [
    {
      label: 'Last 7 days',
      value: {
        from: subDays(new Date(), 6),
        to: new Date(),
      },
    },
    {
      label: 'Last 30 days',
      value: {
        from: subDays(new Date(), 29),
        to: new Date(),
      },
    },
    {
      label: 'Last 3 months',
      value: {
        from: subMonths(new Date(), 3),
        to: new Date(),
      },
    },
    {
      label: 'Last 6 months',
      value: {
        from: subMonths(new Date(), 6),
        to: new Date(),
      },
    },
    {
      label: 'Last year',
      value: {
        from: subYears(new Date(), 1),
        to: new Date(),
      },
    },
  ];

  const handlePresetClick = (range: DateRange) => {
    onChange(range);
    setIsOpen(false);
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    onChange(range);
    // Close the popover only if both dates are selected
    if (range?.from && range?.to) {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="border-r p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Presets</p>
                {presetRanges.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start font-normal"
                    onClick={() => handlePresetClick(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;
