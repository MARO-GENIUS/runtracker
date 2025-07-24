
/**
 * Décode une polyline encodée de Strava en coordonnées [lat, lng]
 * Basé sur l'algorithme de décodage des polylines Google
 */
export const decodePolyline = (str: string): [number, number][] => {
  if (!str) return [];
  
  let index = 0;
  const len = str.length;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
};

/**
 * Parse les coordonnées de départ/arrivée depuis le format Strava
 */
export const parseLatLng = (latlngStr: string | null): [number, number] | null => {
  if (!latlngStr) return null;
  
  try {
    const coords = JSON.parse(latlngStr);
    if (Array.isArray(coords) && coords.length === 2) {
      return [coords[0], coords[1]];
    }
  } catch (error) {
    console.error('Error parsing lat/lng:', error);
  }
  
  return null;
};
