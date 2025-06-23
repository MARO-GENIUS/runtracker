
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart, AlertCircle } from 'lucide-react';

interface HeartRateDataPoint {
  time: number;
  heartRate: number;
  distance?: number;
}

interface HeartRateTimeSeriesProps {
  heartRateData: HeartRateDataPoint[];
  averageHR: number;
  maxHR: number | null;
}

export const HeartRateTimeSeries: React.FC<HeartRateTimeSeriesProps> = ({ 
  heartRateData, 
  averageHR, 
  maxHR 
}) => {
  console.log('HeartRateTimeSeries received data:', {
    dataCount: heartRateData?.length || 0,
    averageHR,
    maxHR,
    sampleData: heartRateData?.slice(0, 5)
  });

  // Format time in minutes:seconds
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Convert time to minutes for display - FIXED: now returns string
  const formatTimeInMinutes = (seconds: number): string => {
    return Math.round(seconds / 60).toString();
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            Temps: {formatTime(label)}
          </p>
          <p className="text-sm text-red-600">
            FC: {data.heartRate} bpm
          </p>
          {data.distance && (
            <p className="text-sm text-gray-600">
              Distance: {(data.distance / 1000).toFixed(2)} km
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Check if we have valid heart rate data
  const hasValidData = heartRateData && heartRateData.length > 0;

  if (!hasValidData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart size={20} className="text-red-500" />
          <h3 className="text-lg font-semibold">Fréquence cardiaque</h3>
        </div>
        
        <div className="flex flex-col items-center justify-center py-8 text-gray-600 bg-gray-50 rounded-lg">
          <AlertCircle size={48} className="text-gray-400 mb-4" />
          <p className="text-center text-lg font-medium mb-2">
            Données de fréquence cardiaque non disponibles
          </p>
          <p className="text-center text-sm text-gray-500 max-w-md">
            Cette activité ne contient pas de données détaillées de fréquence cardiaque. 
            Assurez-vous que votre montre ou capteur était connecté pendant l'entraînement.
          </p>
        </div>
        
        {(averageHR || maxHR) && (
          <div className="grid grid-cols-2 gap-4">
            {averageHR && (
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">FC Moyenne</p>
                <p className="text-3xl font-bold text-red-600">{Math.round(averageHR)} bmp</p>
              </div>
            )}
            {maxHR && (
              <div className="text-center p-4 bg-red-100 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">FC Max</p>
                <p className="text-3xl font-bold text-red-700">{Math.round(maxHR)} bpm</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart size={20} className="text-red-500" />
        <h3 className="text-lg font-semibold">Fréquence cardiaque</h3>
      </div>
      
      <div className="h-96 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={heartRateData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time"
              tickFormatter={formatTimeInMinutes}
              stroke="#6b7280"
              fontSize={12}
              label={{ value: 'Durée (en min)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              domain={['dataMin - 10', 'dataMax + 10']}
              stroke="#6b7280"
              fontSize={12}
              label={{ value: 'Fréquence cardiaque (en bat/min)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="heartRate" 
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#dc2626' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">FC Moyenne</p>
          <p className="text-3xl font-bold text-red-600">{Math.round(averageHR)} bpm</p>
        </div>
        {maxHR && (
          <div className="text-center p-4 bg-red-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">FC Max</p>
            <p className="text-3xl font-bold text-red-700">{Math.round(maxHR)} bpm</p>
          </div>
        )}
      </div>
    </div>
  );
};
