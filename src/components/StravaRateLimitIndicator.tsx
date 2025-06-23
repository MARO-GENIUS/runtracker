
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface StravaRateLimitIndicatorProps {
  requestsUsed: number;
  canMakeRequest: boolean;
  remainingRequests: number;
  usagePercentage: number;
}

export const StravaRateLimitIndicator: React.FC<StravaRateLimitIndicatorProps> = ({
  requestsUsed,
  canMakeRequest,
  remainingRequests,
  usagePercentage
}) => {
  const getStatusColor = () => {
    if (usagePercentage > 90) return 'text-red-600';
    if (usagePercentage > 70) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (!canMakeRequest) return <XCircle size={16} className="text-red-600" />;
    if (usagePercentage > 70) return <AlertTriangle size={16} className="text-orange-600" />;
    return <CheckCircle size={16} className="text-green-600" />;
  };

  const getProgressColor = () => {
    if (usagePercentage > 90) return 'bg-red-500';
    if (usagePercentage > 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        {getStatusIcon()}
        <h3 className="font-medium text-sm">Limite API Strava</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Requêtes utilisées: {requestsUsed}/1800</span>
          <span>Restantes: {remainingRequests}</span>
        </div>
        
        <Progress 
          value={usagePercentage} 
          className="h-2"
        />
        
        <div className={`text-xs font-medium ${getStatusColor()}`}>
          {usagePercentage.toFixed(1)}% utilisé
          {!canMakeRequest && (
            <span className="block text-red-600 mt-1">
              ⚠️ Limite atteinte - Synchronisation bloquée
            </span>
          )}
          {canMakeRequest && usagePercentage > 70 && (
            <span className="block text-orange-600 mt-1">
              ⚠️ Approche de la limite - Utilisez avec parcimonie
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
