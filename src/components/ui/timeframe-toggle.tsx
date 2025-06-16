
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface TimeframeToggleProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export const TimeframeToggle: React.FC<TimeframeToggleProps> = ({
  value,
  onValueChange,
  options
}) => {
  return (
    <ToggleGroup type="single" value={value} onValueChange={onValueChange}>
      {options.map((option) => (
        <ToggleGroupItem 
          key={option.value} 
          value={option.value}
          className="px-3 py-1 text-sm"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};
