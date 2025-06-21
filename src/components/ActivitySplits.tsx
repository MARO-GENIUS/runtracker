
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatTimeFromSeconds } from '@/utils/activityHelpers';

interface Split {
  split: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_difference: number;
  average_speed: number;
}

interface ActivitySplitsProps {
  splits: Split[];
}

export const ActivitySplits: React.FC<ActivitySplitsProps> = ({ splits }) => {
  if (!splits || splits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Splits par kilomètre</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-4">
            Aucune donnée de splits disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Splits par kilomètre</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Km</TableHead>
                <TableHead>Temps</TableHead>
                <TableHead>Allure</TableHead>
                <TableHead>Dénivelé</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {splits.map((split, index) => {
                const paceInSeconds = split.moving_time;
                const paceMinutes = Math.floor(paceInSeconds / 60);
                const paceSecondsRemainder = Math.round(paceInSeconds % 60);
                
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {split.split}
                    </TableCell>
                    <TableCell>
                      {formatTimeFromSeconds(split.moving_time)}
                    </TableCell>
                    <TableCell className="text-running-blue">
                      {paceMinutes}:{paceSecondsRemainder.toString().padStart(2, '0')}/km
                    </TableCell>
                    <TableCell>
                      {split.elevation_difference > 0 ? '+' : ''}{Math.round(split.elevation_difference)}m
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
