'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, DEFAULT_MAP_CENTER } from '@/lib/constants';
import { MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LocationPickerProps {
  initialPosition?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  className?: string;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

export function LocationPicker({
  initialPosition,
  onLocationSelect,
  className = 'h-[400px] w-full',
}: LocationPickerProps) {
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    initialPosition || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [center, setCenter] = useState(initialPosition || DEFAULT_MAP_CENTER);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newPosition = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        };
        setMarkerPosition(newPosition);
        
        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: newPosition }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            onLocationSelect({
              ...newPosition,
              address: results[0].formatted_address,
            });
          } else {
            onLocationSelect(newPosition);
          }
        });
      }
    },
    [onLocationSelect]
  );

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !isLoaded) return;

    setIsSearching(true);
    const geocoder = new google.maps.Geocoder();

    // Add Uganda context to search
    const searchWithContext = searchQuery.toLowerCase().includes('uganda')
      ? searchQuery
      : `${searchQuery}, Uganda`;

    geocoder.geocode({ address: searchWithContext }, (results, status) => {
      setIsSearching(false);
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const newPosition = {
          lat: location.lat(),
          lng: location.lng(),
        };
        setCenter(newPosition);
        setMarkerPosition(newPosition);
        onLocationSelect({
          ...newPosition,
          address: results[0].formatted_address,
        });
      }
    });
  }, [searchQuery, isLoaded, onLocationSelect]);

  const handleMarkerDrag = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newPosition = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        };
        setMarkerPosition(newPosition);

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: newPosition }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            onLocationSelect({
              ...newPosition,
              address: results[0].formatted_address,
            });
          } else {
            onLocationSelect(newPosition);
          }
        });
      }
    },
    [onLocationSelect]
  );

  if (loadError) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center rounded-lg`}>
        <div className="text-center text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">Error loading map</p>
          <p className="text-sm">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center rounded-lg`}>
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search Bar */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Search location in Uganda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Map */}
      <div className="h-[350px] rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={14}
          onClick={handleMapClick}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable
              onDragEnd={handleMarkerDrag}
            />
          )}
        </GoogleMap>
      </div>

      {/* Instructions */}
      <p className="text-sm text-gray-500 mt-2">
        <MapPin className="w-4 h-4 inline mr-1" />
        Click on the map or search to select a location. Drag the marker to adjust.
      </p>

      {/* Selected Location Display */}
      {markerPosition && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
          <span className="font-medium">Selected:</span>{' '}
          {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
