import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDistanceHistory } from '../hooks/useDistanceHistory';
import { Skeleton } from './ui/skeleton';

interface MiniRecordChartProps {
  distance: number;
  fullHeight?: boolean;
}

const MiniRecordChart: React.FC<MiniRecordChartProps> = ({ distance, fullHeight = false }) => {
  const { history, loading } = useDistanceHistory(distance);

  if (loading) {
    return <Skeleton className="h-24 w-full rounded-md" />;
  }

  if (!history || history.length <= 1) {
    return null;
  }

  // Sort by date and take last 10 records
  const sortedHistory = [...history]
    .sort((a, b) => new Date(a.start_date_local).getTime() - new Date(b.start_date_local).getTime())
    .slice(-10);

  const chartData = sortedHistory.map((record, index) => ({
    index,
    time: record.moving_time,
    pace: (record.moving_time / (record.distance / 1000)) / 60, // pace in min/km
    date: new Date(record.start_date_local).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  }));

  return (
    <div className={fullHeight ? "h-full w-full" : "h-24 w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="recordGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis 
            domain={['dataMin - 0.1', 'dataMax + 0.1']}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${Math.floor(value)}:${(Math.round((value % 1) * 60)).toString().padStart(2, '0')}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              const data = payload[0].payload;
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <p className="text-xs text-muted-foreground">{data.date}</p>
                  <p className="text-xs font-medium">
                    {Math.floor(data.pace)}:{(Math.round((data.pace % 1) * 60)).toString().padStart(2, '0')}/km
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="pace"
            stroke="url(#recordGradient)"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", r: 3 }}
            activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniRecordChart;