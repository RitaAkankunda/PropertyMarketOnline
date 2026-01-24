'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { DEFAULT_MAP_CENTER } from '@/lib/constants';
import 'leaflet/dist/leaflet.css';

// Dynamically import entire map to avoid SSR issues with leaflet
const GoogleMapComponent = dynamic(
  () => import('./GoogleMapClient'),
  { ssr: false, loading: () => <div className="h-[400px] w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"><span className="text-gray-500">Loading map...</span></div> }
);

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title?: string;
  price?: string;
  image?: string;
  address?: string;
  property?: any; // Store full property for details
}

interface MapContainerProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  onBoundsChanged?: (bounds: { north: number; south: number; east: number; west: number } | null) => void;
  className?: string;
  showInfoWindow?: boolean;
}

export function MapContainer({
  center = DEFAULT_MAP_CENTER,
  zoom = 7,
  markers = [],
  onMapClick,
  onMarkerClick,
  onBoundsChanged,
  className = 'h-[400px] w-full rounded-lg overflow-hidden',
  showInfoWindow = true,
}: MapContainerProps) {
  return (
    <GoogleMapComponent
      center={center}
      zoom={zoom}
      markers={markers}
      onMapClick={onMapClick}
      onMarkerClick={onMarkerClick}
      onBoundsChanged={onBoundsChanged}
      className={className}
      showInfoWindow={showInfoWindow}
    />
  );
}

export default MapContainer;
