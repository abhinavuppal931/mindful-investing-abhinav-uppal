
import React from 'react';
import { ChartTooltipContent } from '@/components/ui/chart';

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  config?: any;
}

const CustomChartTooltip: React.FC<CustomChartTooltipProps> = ({ 
  active, 
  payload, 
  label, 
  config 
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md shadow-xl p-4 min-w-[180px]">
      {label && (
        <div className="font-inter font-medium text-sm text-foreground mb-2 border-b border-border/20 pb-2">
          {label}
        </div>
      )}
      <div className="space-y-2">
        {payload.map((item, index) => {
          const configEntry = config?.[item.dataKey];
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground font-inter">
                  {configEntry?.label || item.dataKey}
                </span>
              </div>
              <span className="text-sm font-inter font-medium text-foreground">
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomChartTooltip;
