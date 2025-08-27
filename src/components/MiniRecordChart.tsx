import React from 'react';
import { ComposedChart, Area, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDistanceHistory } from '../hooks/useDistanceHistory';
import { useIsMobile } from '../hooks/use-mobile';
import { Skeleton } from './ui/skeleton';

interface MiniRecordChartProps {
  distance: number;
  fullHeight?: boolean;
}

const MiniRecordChart: React.FC<MiniRecordChartProps> = ({ distance, fullHeight = false }) => {
  const { history, loading } = useDistanceHistory(distance);
  const isMobile = useIsMobile();

  if (loading) {
    return <Skeleton className="h-24 w-full rounded-md" />;
  }

  if (!history || history.length <= 1) {
    return null;
  }

  // Custom date formatting function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} ${year}`;
  };

  // Sort by date and take last 10 records
  const sortedHistory = [...history]
    .sort((a, b) => new Date(a.start_date_local).getTime() - new Date(b.start_date_local).getTime())
    .slice(-10);

  const chartData = sortedHistory.map((record, index) => ({
    index,
    time: record.moving_time,
    pace: (record.moving_time / (record.distance / 1000)) / 60, // pace in min/km
    date: formatDate(record.start_date_local)
  }));

  const axisTickFontSize = isMobile ? 9 : 10;
  const xTickMargin = isMobile ? 4 : 6;
  const yAxisWidth = isMobile ? 24 : 28;
  const margin = isMobile ? { top: 4, right: 4, left: 6, bottom: 8 } : { top: 8, right: 8, left: 8, bottom: 12 };
  const dotR = isMobile ? 2 : 3;
  const activeDotR = isMobile ? 3 : 4;
  const xTickCount = isMobile ? Math.min(5, chartData.length) : Math.min(8, chartData.length);

  return (
    <div className={fullHeight ? "h-full w-full" : "h-24 w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={margin}>
          <defs>
            <linearGradient id="recordGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="recordArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.18} />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="index"
            type="number"
            domain={[0, chartData.length - 1]}
            tickCount={xTickCount}
            axisLine={true}
            tickLine={true}
            tick={{ fontSize: axisTickFontSize, fill: "hsl(var(--muted-foreground))" }}
            padding={{ left: 0, right: 0 }}
            tickMargin={xTickMargin}
            tickFormatter={(value) => chartData[value]?.date || ''}
          />
          <YAxis
            orientation="left"
            domain={['dataMin - 0.1', 'dataMax + 0.1']}
            tick={{ fontSize: axisTickFontSize, fill: "hsl(var(--muted-foreground))" }}
            axisLine={true}
            tickLine={true}
            width={yAxisWidth}
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
          <Area
            type="monotone"
            dataKey="pace"
            stroke="transparent"
            fill="url(#recordArea)"
            fillOpacity={1}
          />
          <Line
            type="monotone"
            dataKey="pace"
            stroke="url(#recordGradient)"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", r: dotR }}
            activeDot={{ r: activeDotR, fill: "hsl(var(--primary))" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniRecordChart;