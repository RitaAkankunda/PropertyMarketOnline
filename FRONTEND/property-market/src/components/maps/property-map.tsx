'use client';

import { MapContainer, MapMarker } from './google-map';
import { DEFAULT_MAP_CENTER } from '@/lib/constants';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PropertyMapProps {
  coordinates?: { lat: number; lng: number };
  address?: string;
  title?: string;
  price?: string;
  image?: string;
  className?: string;
  showDirections?: boolean;
}

export function PropertyMap({
  coordinates,
  address,
  title,
  price,
  image,
  className = 'h-[400px] w-full rounded-lg overflow-hidden',
  showDirections = true,
}: PropertyMapProps) {
  const center = coordinates || DEFAULT_MAP_CENTER;

  const markers: MapMarker[] = coordinates
    ? [
        {
          id: 'property',
          position: coordinates,
          title: title,
          price: price,
          image: image,
          address: address,
        },
      ]
    : [];

  const handleGetDirections = () => {
    if (coordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleOpenInMaps = () => {
    if (coordinates) {
      const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  if (!coordinates) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">Location not available</p>
          <p className="text-sm">No coordinates provided for this property</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <MapContainer
        center={center}
        zoom={15}
        markers={markers}
        className={className}
        showInfoWindow
      />

      {/* Location Info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            {address && <p className="text-sm text-gray-700">{address}</p>}
            <p className="text-xs text-gray-500">
              {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </p>
          </div>
        </div>

        {showDirections && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenInMaps}>
              <MapPin className="w-4 h-4 mr-1" />
              View in Maps
            </Button>
            <Button size="sm" onClick={handleGetDirections}>
              <Navigation className="w-4 h-4 mr-1" />
              Get Directions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertyMap;
