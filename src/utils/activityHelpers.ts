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
  // Handle specific standard distances first
  switch (distanceMeters) {
    case 400: return '400 m';
    case 800: return '800 m';
    case 805: return '805 m';
    case 1000: return '1 km';
    case 1609: return '1 mile';
    case 2000: return '2 km';
    case 3000: return '3 km';
    case 3219: return '2 miles';
    case 5000: return '5 km';
    case 8000: return '8 km';
    case 8047: return '5 miles';
    case 10000: return '10 km';
    case 15000: return '15 km';
    case 16090: return '10 miles';
    case 21097: return 'Semi-marathon';
    case 42195: return 'Marathon';
    case 50000: return '50 km';
    default:
      // For non-standard distances, show in appropriate units with smart formatting
      const km = distanceMeters / 1000;
      if (km < 1) {
        return `${distanceMeters} m`;
      } else if (km < 10) {
        // Pour les distances < 10km, afficher avec 1 décimale si nécessaire
        return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
      } else {
        // Pour les distances >= 10km, arrondir au km près
        return `${Math.round(km)} km`;
      }
  }
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
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return recordDate > thirtyDaysAgo;
};
