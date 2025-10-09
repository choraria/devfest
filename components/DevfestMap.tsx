'use client';

import { RedirectEntry } from '@/lib/data';
import dynamic from 'next/dynamic';

interface DevfestMapProps {
  redirects: RedirectEntry[];
}

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(
  () => import('./MapComponent').then((mod) => mod.MapComponent),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full bg-muted rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    ) 
  }
);

export default function DevfestMap({ redirects }: DevfestMapProps) {
  return <MapComponent redirects={redirects} />;
} 