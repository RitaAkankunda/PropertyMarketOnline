'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER } from '@/lib/constants';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title?: string;
  price?: string;
  image?: string;
  address?: string;
  property?: any;
}

interface GoogleMapClientProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  onBoundsChanged?: (bounds: { north: number; south: number; east: number; west: number } | null) => void;
  className?: string;
  showInfoWindow?: boolean;
}

// Component to handle map events
function MapEventHandler({
  onMapClick,
  onBoundsChanged,
}: {
  onMapClick?: (lat: number, lng: number) => void;
  onBoundsChanged?: (bounds: { north: number; south: number; east: number; west: number } | null) => void;
}) {
  const map = useMap();

  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  useEffect(() => {
    const updateBounds = () => {
      if (onBoundsChanged) {
        const bounds = map.getBounds();
        onBoundsChanged({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    };

    updateBounds();
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);

    return () => {
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [map, onBoundsChanged]);

  return null;
}

export default function GoogleMapClient({
  center = DEFAULT_MAP_CENTER,
  zoom = 7,
  markers = [],
  onMapClick,
  onMarkerClick,
  onBoundsChanged,
  className = 'h-[400px] w-full rounded-lg overflow-hidden',
  showInfoWindow = true,
}: GoogleMapClientProps) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMarkerClick = useCallback(
    (marker: MapMarker) => {
      setSelectedMarker(marker);
      if (onMarkerClick) {
        onMarkerClick(marker);
      }
    },
    [onMarkerClick]
  );

  if (!isClient) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <LeafletMapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler onMapClick={onMapClick} onBoundsChanged={onBoundsChanged} />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.position.lat, marker.position.lng]}
            eventHandlers={{
              click: () => handleMarkerClick(marker),
            }}
          >
            {showInfoWindow && (
              <Popup>
                <div className="p-2 min-w-[200px]">
                  {marker.image && (
                    <img
                      src={marker.image}
                      alt={marker.title}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  )}
                  {marker.title && (
                    <h3 className="font-semibold text-gray-900 text-sm">{marker.title}</h3>
                  )}
                  {marker.address && (
                    <p className="text-xs text-gray-600 mt-1">{marker.address}</p>
                  )}
                  {marker.price && (
                    <p className="text-blue-600 font-bold mt-1 text-sm">{marker.price}</p>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </LeafletMapContainer>
    </div>
  );
}
