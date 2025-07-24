
import React from 'react';
import { useOptimizedActivityDetail } from '@/hooks/useOptimizedActivityDetail';

interface ActivityPreloaderProps {
  activityId: number;
  children: React.ReactNode;
}

export const ActivityPreloader: React.FC<ActivityPreloaderProps> = ({ 
  activityId, 
  children 
}) => {
  const { prefetchActivity } = useOptimizedActivityDetail();

  const handleMouseEnter = () => {
    prefetchActivity(activityId);
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      {children}
    </div>
  );
};
