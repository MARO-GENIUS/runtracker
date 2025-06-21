
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart } from 'lucide-react';

interface HeartRateChartProps {
  averageHR: number;
  maxHR: number | null;
}

export const HeartRateChart: React.FC<HeartRateChartProps> = ({ averageHR, maxHR }) => {
  // Create simple data for heart rate visualization
  const data = [
    {
      name: 'FC Moyenne',
      value: Math.round(averageHR),
      color: '#ef4444'
    },
    ...(maxHR ? [{
      name: 'FC Max',
      value: Math.round(maxHR),
      color: '#dc2626'
    }] : [])
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart size={20} className="text-red-500" />
          Fréquence cardiaque
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 'dataMax + 20']} />
              <Tooltip 
                formatter={(value) => [`${value} bpm`, 'Fréquence cardiaque']}
                labelStyle={{ color: '#374151' }}
              />
              <Bar 
                dataKey="value" 
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">FC Moyenne</p>
            <p className="text-2xl font-bold text-red-600">{Math.round(averageHR)} bpm</p>
          </div>
          {maxHR && (
            <div className="text-center p-3 bg-red-100 rounded-lg">
              <p className="text-sm text-gray-600">FC Max</p>
              <p className="text-2xl font-bold text-red-700">{Math.round(maxHR)} bpm</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
