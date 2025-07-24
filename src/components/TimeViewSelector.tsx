
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type TimeViewType = 'week' | 'month' | '6months' | 'year';

interface TimeViewSelectorProps {
  value: TimeViewType;
  onChange: (value: TimeViewType) => void;
}

const TimeViewSelector: React.FC<TimeViewSelectorProps> = ({ value, onChange }) => {
  const options = [
    { value: 'week', label: 'Semaine' },
    { value: 'month', label: 'Mois' },
    { value: '6months', label: '6 mois' },
    { value: 'year', label: 'Année' }
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32 h-8 bg-white/20 border-white/30 text-white text-sm hover:bg-white/30 transition-colors">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="z-50 bg-white border border-gray-200 rounded-lg shadow-lg">
        {options.map(option => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="text-sm hover:bg-gray-50 cursor-pointer"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TimeViewSelector;
