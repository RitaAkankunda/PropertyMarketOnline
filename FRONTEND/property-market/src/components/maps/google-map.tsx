'use client';

import { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, DEFAULT_MAP_CENTER } from '@/lib/constants';

interface MapContainerProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  showInfoWindow?: boolean;
}

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title?: string;
  price?: string;
  image?: string;
  address?: string;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export function MapContainer({
  center = DEFAULT_MAP_CENTER,
  zoom = 14,
  markers = [],
  onMapClick,
  className = 'h-[400px] w-full rounded-lg overflow-hidden',
  showInfoWindow = true,
}: MapContainerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (onMapClick && e.latLng) {
        onMapClick(e.latLng.lat(), e.latLng.lng());
      }
      setSelectedMarker(null);
    },
    [onMapClick]
  );

  if (loadError) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center text-gray-500">
          <p className="font-medium">Error loading map</p>
          <p className="text-sm">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
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
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={mapOptions}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            title={marker.title}
            onClick={() => setSelectedMarker(marker)}
          />
        ))}

        {showInfoWindow && selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 min-w-[200px]">
              {selectedMarker.image && (
                <img
                  src={selectedMarker.image}
                  alt={selectedMarker.title}
                  className="w-full h-24 object-cover rounded mb-2"
                />
              )}
              {selectedMarker.title && (
                <h3 className="font-semibold text-gray-900">{selectedMarker.title}</h3>
              )}
              {selectedMarker.address && (
                <p className="text-sm text-gray-600">{selectedMarker.address}</p>
              )}
              {selectedMarker.price && (
                <p className="text-primary font-bold mt-1">{selectedMarker.price}</p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default MapContainer;
