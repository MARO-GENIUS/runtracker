
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
