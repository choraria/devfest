'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { RedirectEntry } from '@/lib/redis';
import { Button } from './ui/button';
import { Combobox } from './ui/combobox';
import 'leaflet/dist/leaflet.css';
import { Copy, Github, Check, Locate, Link, MapPin, Calendar } from 'lucide-react';

// Fix for Leaflet marker icons in Next.js
import L from 'leaflet';
import { LatLngTuple } from 'leaflet';

// Define props interface
interface MapComponentProps {
  redirects: RedirectEntry[];
}

// Map layer URLs
const LIGHT_TILE_LAYER = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Component to handle user location and map view
function MapViewController({ userLocation, nearestEvents, mapRef }: { 
  userLocation: LatLngTuple | null, 
  nearestEvents: RedirectEntry[],
  mapRef: React.MutableRefObject<L.Map | null>
}) {
  const map = useMap();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewSet, setViewSet] = useState(false);
  
  // Store map reference
  useEffect(() => {
    if (mapRef) {
      mapRef.current = map;
    }
  }, [map, mapRef]);

  // Set map view based on user location or nearest events only once
  useEffect(() => {
    if (viewSet) return; // Skip if view has already been set
    
    if (userLocation) {
      // If we have user location, zoom to it
      map.setView(userLocation, 5);
      setViewSet(true);
    } else if (nearestEvents.length > 0) {
      // Otherwise, if we have nearby events, create a bounds object and fit to it
      const bounds = L.latLngBounds(
        nearestEvents.map(event => [event.latitude || 0, event.longitude || 0])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
      setViewSet(true);
    }
  }, [map, userLocation, nearestEvents, viewSet]);

  // Check for dark mode and apply styles
  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Set up observer to detect theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Initial check
    checkDarkMode();

    return () => observer.disconnect();
  }, []);

  // Add dark mode styles to map
  useEffect(() => {
    if (isDarkMode) {
      // Set map container style for dark mode
      const mapContainer = map.getContainer();
      mapContainer.style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
      
      // Exclude markers from the filter
      const markers = document.querySelectorAll('.leaflet-marker-icon, .leaflet-popup-content-wrapper');
      markers.forEach((marker) => {
        if (marker instanceof HTMLElement) {
          marker.style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
        }
      });
    } else {
      // Reset styles for light mode
      const mapContainer = map.getContainer();
      mapContainer.style.filter = '';
      
      // Reset marker styles
      const markers = document.querySelectorAll('.leaflet-marker-icon, .leaflet-popup-content-wrapper');
      markers.forEach((marker) => {
        if (marker instanceof HTMLElement) {
          marker.style.filter = '';
        }
      });
    }
  }, [isDarkMode, map]);

  return null;
}

// Format date to "21 October 2023" format
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    // If the date string is already formatted or invalid, return as is
    return dateString;
  }
};

export function MapComponent({ redirects }: MapComponentProps) {
  const [mounted, setMounted] = useState(false);
  const [copyingSlug, setCopyingSlug] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
  const [nearestEvents, setNearestEvents] = useState<RedirectEntry[]>([]);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<string>("checking");
  const [isResettingView, setIsResettingView] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const mapRef = useRef<L.Map | null>(null);

  // Filter out entries without coordinates
  const validEvents = redirects.filter(
    (event) => event.latitude && event.longitude
  );

  // Get unique countries for the dropdown
  const countryOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Countries' },
      ...Array.from(new Set(validEvents.map(event => event.countryName || '').filter(Boolean)))
        .sort()
        .map(country => ({ value: country, label: country }))
    ];
  }, [validEvents]);

  // Filter events based on selected country
  const filteredEvents = useMemo(() => {
    if (!selectedCountry) return validEvents;
    return validEvents.filter(event => event.countryName === selectedCountry);
  }, [validEvents, selectedCountry]);

  // Handle country change
  const handleCountryChange = (value: string) => {
    const country = value === 'all' ? '' : value;
    setSelectedCountry(country);
    
    if (mapRef.current) {
      if (country) {
        // Filter events by the selected country
        const countryEvents = validEvents.filter(event => event.countryName === country);
        
        if (countryEvents.length > 0) {
          // Create bounds for all events in the country
          const bounds = L.latLngBounds(
            countryEvents.map(event => [event.latitude || 0, event.longitude || 0])
          );
          
          // Fit the map to these bounds
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
        }
      } else {
        // If no country is selected, reset to global view
        resetMapView();
      }
    }
    
    // Track country filter changes
    window.gtag?.('event', 'filter_map_by_country', {
      country: country || 'all'
    });
  };

  // Handle client-side only rendering and icon fix
  useEffect(() => {
    setMounted(true);
    
    // Fix Leaflet icon issues in Next.js
    // @ts-expect-error - _getIconUrl is not in the type definitions but exists in the implementation
    delete L.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });

    // Get user location
    if (navigator.geolocation) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        setLocationPermissionStatus(permissionStatus.state);
        
        if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userCoords: LatLngTuple = [position.coords.latitude, position.coords.longitude];
              setUserLocation(userCoords);
              
              // Find nearest events
              const eventsWithDistance = validEvents.map(event => {
                const distance = calculateDistance(
                  userCoords[0], 
                  userCoords[1],
                  event.latitude || 0,
                  event.longitude || 0
                );
                return { ...event, distance };
              });
              
              // Sort by distance and take the 5 closest
              const closest = eventsWithDistance
                .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
                .slice(0, 5);
              
              setNearestEvents(closest);
              setLocationPermissionStatus("granted");
            },
            (error) => {
              console.error('Error getting location:', error);
              setLocationPermissionStatus("denied");
              // No fallback - use global view
            },
            { timeout: 5000, enableHighAccuracy: false }
          );
        } else {
          // User denied permission - use global view
          setLocationPermissionStatus("denied");
        }
      });
    } else {
      // Geolocation not supported
      setLocationPermissionStatus("unsupported");
    }
  }, [validEvents]);

  // Reset map to initial view
  const resetMapView = () => {
    if (!mapRef.current) return;
    
    setIsResettingView(true);
    
    // If we have user location, go back to that view
    if (userLocation) {
      mapRef.current.setView(userLocation, 5);
    } else {
      // Otherwise, show global view of all events
      const center = calculateCenter();
      mapRef.current.setView(center, 2);
      
      // Try to fit bounds if we have events
      if (validEvents.length > 0) {
        try {
          const bounds = L.latLngBounds(
            validEvents.map(event => [event.latitude || 0, event.longitude || 0])
          );
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 2 });
        } catch (error) {
          console.error('Error fitting bounds:', error);
        }
      }
    }
    
    // Track reset view action
    window.gtag?.('event', 'reset_map_view', {
      has_user_location: !!userLocation
    });
    
    setTimeout(() => setIsResettingView(false), 500);
  };

  // Calculate distance between coordinates using Haversine formula (in km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate the center of the map based on event coordinates
  const calculateCenter = (): LatLngTuple => {
    if (userLocation) {
      return userLocation;
    }
    
    if (nearestEvents.length > 0) {
      // Calculate center of nearest events
      const sumLat = nearestEvents.reduce((sum, event) => sum + (event.latitude || 0), 0);
      const sumLng = nearestEvents.reduce((sum, event) => sum + (event.longitude || 0), 0);
      return [sumLat / nearestEvents.length, sumLng / nearestEvents.length];
    }
    
    // Fallback to all events
    if (validEvents.length === 0) return [0, 0];
    const sumLat = validEvents.reduce((sum, event) => sum + (event.latitude || 0), 0);
    const sumLng = validEvents.reduce((sum, event) => sum + (event.longitude || 0), 0);
    return [sumLat / validEvents.length, sumLng / validEvents.length];
  };

  // Handle copying the URL to clipboard
  const handleCopyLink = async (slug: string | undefined) => {
    if (!slug) return;
    
    const baseUrl = typeof window !== 'undefined' ? 
      window.location.origin : 
      (process.env.NEXT_PUBLIC_SITE_URL || 'https://devfe.st');
    const url = `${baseUrl}/${slug}`;
    
    // Remove "https://" from the URL for copying
    const urlToCopy = url.replace(/^https?:\/\//, '');
    
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopyingSlug(slug);
      // Remove toast notification
      setTimeout(() => setCopyingSlug(null), 1000);
      
      // Track URL copy
      window.gtag?.('event', 'copy_devfest_url', {
        slug: slug,
        url: url
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle opening GitHub issue for URL update
  const handleUpdateUrl = (redirect: RedirectEntry) => {
    const title = encodeURIComponent(`Update DevFest details: ${redirect.city || redirect.slug} (slug: ${redirect.slug})`);
    const url = `https://github.com/choraria/devfest/issues/new?assignees=&labels=update-url&template=update-url.yml&title=${title}`;
    
    window.open(url, '_blank');
    
    // Track GitHub issue creation
    window.gtag?.('event', 'create_github_issue_map', {
      slug: redirect.slug,
      city: redirect.city,
      country: redirect.countryName
    });
  };

  if (!mounted) return null;

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden shadow-md dark:shadow-gray-700 relative">
      <MapContainer 
        center={calculateCenter()} 
        zoom={userLocation ? 5 : 2} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        zoomControl={false}
      >
        <MapViewController userLocation={userLocation} nearestEvents={nearestEvents} mapRef={mapRef} />
        <TileLayer
          url={LIGHT_TILE_LAYER}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* If we have user location, show it on the map */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              className: 'user-location-marker',
              html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-sm">Your Location</h3>
                <p className="text-xs text-gray-600">
                  {locationPermissionStatus === "granted" 
                    ? "Based on your device location" 
                    : "Approximate location based on IP address"}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Display all events */}
        {filteredEvents.map((event) => (
          <Marker 
            key={event.slug}
            position={[event.latitude || 0, event.longitude || 0] as LatLngTuple}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-sm mb-2 leading-none">
                  {event.devfestName || `DevFest ${event.city || event.slug}`}
                </h3>
                <ul className="space-y-1.5">
                  {event.gdgChapter && (
                    <li className="text-xs flex items-center gap-1">
                      <Link className="h-3 w-3" />
                      {event.gdgUrl ? (
                        <a 
                          href={event.gdgUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline text-inherit"
                        >
                          {event.gdgChapter}
                        </a>
                      ) : (
                        <span className="text-gray-600">{event.gdgChapter}</span>
                      )}
                    </li>
                  )}
                  <li className="text-xs text-gray-500 flex items-center gap-1">
                    <Link className="h-3 w-3" />
                    <button
                      onClick={() => window.open(event.destinationUrl, '_blank')}
                      className="hover:underline cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
                    >
                      devfe.st/{event.slug}
                    </button>
                  </li>
                  <li className="text-xs text-gray-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[event.city, event.countryName].filter(Boolean).join(', ')}
                  </li>
                  {event.devfestDate && (
                    <li className="text-xs text-gray-600 font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(event.devfestDate)}
                    </li>
                  )}
                </ul>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline" 
                    className="text-xs py-0 h-7 bg-white text-black border-gray-300 hover:bg-gray-100 hover:text-black dark:border-gray-500 dark:border-[1px] dark:border-solid"
                    onClick={() => handleCopyLink(event.slug)}
                    disabled={!event.slug}
                  >
                    {copyingSlug === event.slug ? (
                      <Check className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    Copy URL
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="text-xs py-0 h-7 bg-black text-white hover:bg-black/90"
                    onClick={() => handleUpdateUrl(event)}
                  >
                    <Github className="h-3 w-3 mr-1" /> Update URL
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Country filter dropdown */}
      <div className="absolute top-4 left-4 z-[1000] w-[220px]">
        <div className="bg-white/50 dark:bg-gray-800/50 text-xs mb-1 px-2 py-1 rounded text-center">
          Showing {filteredEvents.length} DevFest event{filteredEvents.length !== 1 ? 's' : ''}
        </div>
        <Combobox
          options={countryOptions}
          value={selectedCountry || 'all'}
          onValueChange={handleCountryChange}
          placeholder="All Countries"
          searchPlaceholder="Search countries..."
          emptyText="No countries found."
        />
      </div>
      
      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
        {/* Zoom controls */}
        <div className="flex flex-col gap-1">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/90 text-black border border-gray-300 shadow-md hover:bg-white"
            onClick={() => mapRef.current?.zoomIn()}
            title="Zoom in"
          >
            <span className="text-lg font-bold">+</span>
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/90 text-black border border-gray-300 shadow-md hover:bg-white"
            onClick={() => mapRef.current?.zoomOut()}
            title="Zoom out"
          >
            <span className="text-lg font-bold">−</span>
          </Button>
        </div>
        
        {/* Reset view button */}
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 bg-white/90 text-black border border-gray-300 shadow-md hover:bg-white"
          onClick={resetMapView}
          disabled={isResettingView}
          title={userLocation ? "Return to your location" : "Reset view"}
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Loading indicator for location */}
      {locationPermissionStatus === "checking" && (
        <div className="absolute top-2 left-2 z-10 bg-white dark:bg-gray-800 py-1 px-3 rounded-full shadow-md text-xs flex items-center">
          <div className="animate-spin h-3 w-3 border-t-2 border-blue-500 rounded-full mr-2"></div>
          Detecting your location...
        </div>
      )}
    </div>
  );
} 