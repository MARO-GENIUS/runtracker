
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { decodePolyline, parseLatLng } from '@/utils/polylineDecoder';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityMapProps {
  polyline?: string | null;
  startLatLng?: string | null;
  endLatLng?: string | null;
  activityName?: string;
  compact?: boolean;
  className?: string;
}

export const ActivityMap: React.FC<ActivityMapProps> = ({
  polyline,
  startLatLng,
  endLatLng,
  activityName = 'Parcours',
  compact = false,
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasGpsData, setHasGpsData] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Vérifier si nous avons des données GPS
    const hasData = polyline || (startLatLng && endLatLng);
    setHasGpsData(!!hasData);

    if (!hasData) return;

    // Configuration du token Mapbox (à configurer dans les secrets Supabase)
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

    // Initialiser la carte
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [2.3522, 48.8566], // Paris par défaut
      zoom: 12,
      attributionControl: false
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Décoder la polyline si disponible
      if (polyline) {
        const coordinates = decodePolyline(polyline);
        
        if (coordinates.length > 0) {
          // Ajouter la source de données pour le parcours
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coordinates.map(([lat, lng]) => [lng, lat])
              }
            }
          });

          // Style de la ligne de parcours
          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3B82F6',
              'line-width': compact ? 3 : 4,
              'line-opacity': 0.8
            }
          });

          // Adapter la vue au parcours
          const bounds = new mapboxgl.LngLatBounds();
          coordinates.forEach(([lat, lng]) => {
            bounds.extend([lng, lat]);
          });
          
          map.current.fitBounds(bounds, { 
            padding: compact ? 20 : 40,
            maxZoom: 15
          });
        }
      }

      // Ajouter les marqueurs de départ/arrivée
      const startCoords = parseLatLng(startLatLng);
      const endCoords = parseLatLng(endLatLng);

      if (startCoords) {
        const startMarker = new mapboxgl.Marker({
          color: '#10B981',
          scale: compact ? 0.8 : 1
        })
          .setLngLat([startCoords[1], startCoords[0]])
          .setPopup(new mapboxgl.Popup().setHTML('<div>Départ</div>'))
          .addTo(map.current);
      }

      if (endCoords && endCoords !== startCoords) {
        const endMarker = new mapboxgl.Marker({
          color: '#EF4444',
          scale: compact ? 0.8 : 1
        })
          .setLngLat([endCoords[1], endCoords[0]])
          .setPopup(new mapboxgl.Popup().setHTML('<div>Arrivée</div>'))
          .addTo(map.current);
      }

      setMapLoaded(true);
    });

    // Gestion du resize
    const resizeObserver = new ResizeObserver(() => {
      if (map.current) {
        map.current.resize();
      }
    });

    resizeObserver.observe(mapContainer.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (map.current) {
        map.current.remove();
      }
    };
  }, [polyline, startLatLng, endLatLng, compact]);

  if (!hasGpsData) {
    return (
      <Card className={className}>
        <CardContent className={`p-4 ${compact ? 'h-48' : 'h-80'} flex items-center justify-center bg-gray-50`}>
          <div className="text-center text-gray-500">
            <MapPin className="mx-auto mb-2 h-8 w-8" />
            <p className="text-sm">Aucune donnée GPS disponible</p>
            <p className="text-xs text-gray-400">Activité sans géolocalisation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0 relative">
        <div 
          ref={mapContainer} 
          className={`${compact ? 'h-48' : 'h-80'} w-full rounded-lg`}
        />
        
        {!mapLoaded && (
          <div className={`absolute inset-0 ${compact ? 'h-48' : 'h-80'} flex items-center justify-center bg-gray-100 rounded-lg`}>
            <div className="text-center">
              <Navigation className="mx-auto mb-2 h-8 w-8 text-gray-400 animate-pulse" />
              <p className="text-sm text-gray-500">Chargement de la carte...</p>
            </div>
          </div>
        )}

        {!compact && mapLoaded && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/90 hover:bg-white"
              onClick={() => {
                // Implement fullscreen functionality
                if (map.current) {
                  map.current.getCanvas().requestFullscreen();
                }
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
