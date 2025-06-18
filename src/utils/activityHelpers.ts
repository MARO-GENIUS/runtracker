
// Utility functions for formatting activity data

export const formatDistance = (distanceInMeters: number): string => {
  const km = distanceInMeters / 1000;
  return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}min`;
  }
  return `${minutes}min${remainingSeconds.toString().padStart(2, '0')}s`;
};

export const formatPace = (distanceInMeters: number, timeInSeconds: number): string => {
  const km = distanceInMeters / 1000;
  const paceInSecondsPerKm = timeInSeconds / km;
  const minutes = Math.floor(paceInSecondsPerKm / 60);
  const seconds = Math.round(paceInSecondsPerKm % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
};

export const formatSpeed = (distanceInMeters: number, timeInSeconds: number): string => {
  const km = distanceInMeters / 1000;
  const hours = timeInSeconds / 3600;
  const speed = km / hours;
  
  return `${speed.toFixed(1)} km/h`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatElevation = (elevationInMeters: number | null): string => {
  if (!elevationInMeters) return '0 m';
  return `${Math.round(elevationInMeters)} m`;
};

export const formatDistanceType = (distanceMeters: number): string => {
  const km = distanceMeters / 1000;
  
  if (km <= 1) return '1 km';
  if (km <= 3) return '3 km';
  if (km <= 5) return '5 km';
  if (km <= 10) return '10 km';
  if (km <= 15) return '15 km';
  if (km <= 21.1) return 'Semi-marathon';
  if (km <= 42.2) return 'Marathon';
  if (km <= 50) return '50 km';
  if (km <= 100) return '100 km';
  
  return `${Math.round(km)} km`;
};

export const formatTimeFromSeconds = (timeInSeconds: number): string => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const isRecentRecord = (dateString: string): boolean => {
  const recordDate = new Date(dateString);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return recordDate > threeMonthsAgo;
};
