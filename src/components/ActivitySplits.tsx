
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Timer } from 'lucide-react';
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
          <CardTitle className="flex items-center gap-2">
            <Timer size={20} className="text-running-blue" />
            Splits par kilomètre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-4">
            Aucune donnée de splits disponible pour cette activité
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate average pace for comparison
  const totalTime = splits.reduce((sum, split) => sum + split.moving_time, 0);
  const totalDistance = splits.reduce((sum, split) => sum + (split.distance / 1000), 0);
  const averagePace = totalDistance > 0 ? totalTime / totalDistance : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer size={20} className="text-running-blue" />
          Splits par kilomètre
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Km</TableHead>
                <TableHead className="font-semibold">Distance</TableHead>
                <TableHead className="font-semibold">Temps</TableHead>
                <TableHead className="font-semibold">Allure</TableHead>
                <TableHead className="font-semibold">Dénivelé</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {splits.map((split, index) => {
                const distanceKm = split.distance / 1000;
                const paceInSeconds = split.moving_time / distanceKm;
                const paceMinutes = Math.floor(paceInSeconds / 60);
                const paceSecondsRemainder = Math.round(paceInSeconds % 60);
                
                // Determine if this split is faster or slower than average
                const isFaster = paceInSeconds < averagePace;
                const paceColor = isFaster ? 'text-green-600' : 
                                paceInSeconds > averagePace * 1.1 ? 'text-red-600' : 
                                'text-running-blue';
                
                return (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="font-bold text-gray-700">
                      {split.split}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {distanceKm.toFixed(2)} km
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatTimeFromSeconds(split.moving_time)}
                    </TableCell>
                    <TableCell className={`font-medium ${paceColor}`}>
                      {paceMinutes}:{paceSecondsRemainder.toString().padStart(2, '0')}/km
                    </TableCell>
                    <TableCell className={split.elevation_difference >= 0 ? 'text-red-600' : 'text-green-600'}>
                      {split.elevation_difference > 0 ? '+' : ''}{Math.round(split.elevation_difference)}m
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {/* Summary row */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">Allure moyenne:</span>
              <span className="font-bold text-running-blue">
                {Math.floor(averagePace / 60)}:{Math.round(averagePace % 60).toString().padStart(2, '0')}/km
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
