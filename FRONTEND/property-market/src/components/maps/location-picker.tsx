'use client';

import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER } from '@/lib/constants';
import { MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

interface LocationPickerProps {
  initialPosition?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  className?: string;
}

// Component to handle map click events
function MapClickHandler({
  onMapClick,
  markerPosition,
  setMarkerPosition,
}: {
  onMapClick: (lat: number, lng: number) => void;
  markerPosition: { lat: number; lng: number } | null;
  setMarkerPosition: (pos: { lat: number; lng: number }) => void;
}) {
  const map = useMap();

  useMapEvents({
    click: (e) => {
      const newPosition = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };
      setMarkerPosition(newPosition);
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  // Update map center when marker position changes
  useEffect(() => {
    if (markerPosition) {
      map.setView([markerPosition.lat, markerPosition.lng], map.getZoom());
    }
  }, [markerPosition, map]);

  return null;
}

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
  const [isClient, setIsClient] = useState(false);

  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update marker position when initialPosition changes
  useEffect(() => {
    if (initialPosition) {
      setMarkerPosition(initialPosition);
      setCenter(initialPosition);
    }
  }, [initialPosition]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      const newPosition = { lat, lng };
      // For Leaflet, we'll use the coordinates directly
      // Reverse geocoding would require a separate service (like Nominatim)
      onLocationSelect(newPosition);
    },
    [onLocationSelect]
  );

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Use Nominatim (OpenStreetMap's geocoding service) for free geocoding
      const searchWithContext = searchQuery.toLowerCase().includes('uganda')
        ? searchQuery
        : `${searchQuery}, Uganda`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchWithContext)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = data[0];
        const newPosition = {
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon),
        };
        setCenter(newPosition);
        setMarkerPosition(newPosition);
        onLocationSelect({
          ...newPosition,
          address: location.display_name,
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, onLocationSelect]);

  const handleMarkerDrag = useCallback(
    (e: L.DragEndEvent) => {
      const newPosition = {
        lat: e.target.getLatLng().lat,
        lng: e.target.getLatLng().lng,
      };
      setMarkerPosition(newPosition);
      onLocationSelect(newPosition);
    },
    [onLocationSelect]
  );

  if (!isClient) {
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
      <div className="h-[350px] rounded-lg overflow-hidden border relative z-0">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={14}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler
            onMapClick={handleMapClick}
            markerPosition={markerPosition}
            setMarkerPosition={setMarkerPosition}
          />

          {markerPosition && (
            <Marker
              position={[markerPosition.lat, markerPosition.lng]}
              draggable={true}
              eventHandlers={{
                dragend: handleMarkerDrag,
              }}
            />
          )}
        </MapContainer>
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
