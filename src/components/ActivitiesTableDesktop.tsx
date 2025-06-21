
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatDistance, formatDuration, formatPace, formatDate, formatElevation } from '@/utils/activityHelpers';

interface Activity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number | null;
  start_date_local: string;
}

interface ActivitiesTableDesktopProps {
  activities: Activity[];
  sortBy: 'start_date' | 'distance' | 'moving_time';
  sortOrder: 'asc' | 'desc';
  onSort: (column: 'start_date' | 'distance' | 'moving_time') => void;
  onActivityClick: (activityId: number) => void;
}

export const ActivitiesTableDesktop: React.FC<ActivitiesTableDesktopProps> = ({
  activities,
  sortBy,
  sortOrder,
  onSort,
  onActivityClick
}) => {
  const SortIcon = ({ column }: { column: 'start_date' | 'distance' | 'moving_time' }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'desc' ? <TrendingDown size={16} /> : <TrendingUp size={16} />;
  };

  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onSort('start_date')}
            >
              <div className="flex items-center gap-2">
                Date
                <SortIcon column="start_date" />
              </div>
            </TableHead>
            <TableHead>Nom</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onSort('distance')}
            >
              <div className="flex items-center gap-2">
                Distance
                <SortIcon column="distance" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onSort('moving_time')}
            >
              <div className="flex items-center gap-2">
                Durée
                <SortIcon column="moving_time" />
              </div>
            </TableHead>
            <TableHead>Allure</TableHead>
            <TableHead>Dénivelé</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow 
              key={activity.id} 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onActivityClick(activity.id)}
            >
              <TableCell className="font-medium">
                {formatDate(activity.start_date_local)}
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={activity.name}>
                  {activity.name}
                </div>
              </TableCell>
              <TableCell>{formatDistance(activity.distance)}</TableCell>
              <TableCell>{formatDuration(activity.moving_time)}</TableCell>
              <TableCell className="text-running-blue font-medium">
                {formatPace(activity.distance, activity.moving_time)}
              </TableCell>
              <TableCell>{formatElevation(activity.total_elevation_gain)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
