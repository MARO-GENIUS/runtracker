
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useSixMonthsData } from '@/hooks/useSixMonthsData';
import { Skeleton } from '@/components/ui/skeleton';

interface SixMonthsViewProps {
  startDate: Date;
  onWeekClick?: (week: string, startDate: string, endDate: string) => void;
}

const SixMonthsView: React.FC<SixMonthsViewProps> = ({ startDate, onWeekClick }) => {
  const { stats, loading, error } = useSixMonthsData(startDate);

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
          data={stats.weeksData} 
          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        >
          <XAxis 
            dataKey="week" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            interval={0}
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
              `Semaine ${props.payload.week}`
            ]}
            labelFormatter={(label: string, payload: any) => {
              if (payload && payload[0]) {
                const data = payload[0].payload;
                const start = new Date(data.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                const end = new Date(data.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                return `${start} - ${end}`;
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
            onClick={(data) => onWeekClick?.(data.week, data.startDate, data.endDate)}
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

export default SixMonthsView;
