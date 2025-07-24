
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useYearlyData } from '@/hooks/useYearlyData';
import { Skeleton } from '@/components/ui/skeleton';

interface YearlyViewProps {
  year: number;
  onMonthClick?: (month: string, monthNumber: number) => void;
}

const YearlyView: React.FC<YearlyViewProps> = ({ year, onMonthClick }) => {
  const { stats, loading, error } = useYearlyData(year);

  if (loading) {
    return <Skeleton className="h-32 w-full rounded" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-red-500 text-sm">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={stats.monthsData} 
          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        >
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            interval={0}
            tickFormatter={(value) => value.substring(0, 3)}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            width={28}
          />
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [
              `${value} km`, 
              props.payload.month
            ]}
            labelFormatter={(label: string, payload: any) => {
              if (payload && payload[0]) {
                const data = payload[0].payload;
                return `${data.month} ${year} - ${data.activitiesCount} séance${data.activitiesCount > 1 ? 's' : ''}`;
              }
              return label;
            }}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              fontSize: '12px'
            }}
          />
          <Bar 
            dataKey="distance" 
            fill="url(#gradientBar)"
            radius={[4, 4, 0, 0]}
            onClick={(data) => onMonthClick?.(data.month, data.monthNumber)}
            style={{ cursor: 'pointer' }}
          />
          <defs>
            <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default YearlyView;
