
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineConfig {
  key: string;
  color: string;
  name: string;
}

interface MultiLineChartProps {
  data: any[];
  lines: LineConfig[];
  height?: number;
  showTooltip?: boolean;
  formatValue?: (value: any) => string;
}

const MultiLineChart: React.FC<MultiLineChartProps> = ({
  data,
  lines,
  height = 400,
  showTooltip = true,
  formatValue = (value) => value?.toLocaleString() || 'N/A'
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${formatValue(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="date" 
          className="text-xs text-gray-600"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          className="text-xs text-gray-600"
          tick={{ fontSize: 12 }}
          tickFormatter={formatValue}
        />
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            name={line.name}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MultiLineChart;
