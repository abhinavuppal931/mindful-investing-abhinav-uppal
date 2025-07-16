
import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import CustomChartTooltip from '@/components/ui/CustomChartTooltip';

interface LineChartProps {
  data: any[];
  xDataKey: string;
  yDataKey: string;
  color?: string;
  title?: string;
  height?: number;
  showGrid?: boolean;
  strokeWidth?: number;
  className?: string;
  config?: any;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  xDataKey,
  yDataKey,
  color = "#3b82f6",
  title,
  height = 300,
  showGrid = true,
  strokeWidth = 2,
  className = "",
  config
}) => {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />}
          <XAxis 
            dataKey={xDataKey} 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip 
            content={<CustomChartTooltip config={config} />}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '5 5' }}
          />
          <Line 
            type="monotone" 
            dataKey={yDataKey} 
            stroke={color} 
            strokeWidth={strokeWidth}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: 'white' }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
