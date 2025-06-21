
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp } from 'lucide-react';
import { formatDistanceType, formatTimeFromSeconds } from '@/utils/activityHelpers';

interface BestEffort {
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date_local: string;
}

interface BestEffortsProps {
  bestEfforts: BestEffort[];
}

export const BestEfforts: React.FC<BestEffortsProps> = ({ bestEfforts }) => {
  if (!bestEfforts || bestEfforts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp size={20} className="text-running-blue" />
          Meilleurs efforts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Distance</TableHead>
                <TableHead>Temps</TableHead>
                <TableHead>Allure</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bestEfforts.map((effort, index) => {
                const pace = effort.moving_time / (effort.distance / 1000);
                const paceMinutes = Math.floor(pace / 60);
                const paceSeconds = Math.round(pace % 60);
                
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {formatDistanceType(effort.distance)}
                    </TableCell>
                    <TableCell>
                      {formatTimeFromSeconds(effort.moving_time)}
                    </TableCell>
                    <TableCell className="text-running-blue">
                      {paceMinutes}:{paceSeconds.toString().padStart(2, '0')}/km
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
