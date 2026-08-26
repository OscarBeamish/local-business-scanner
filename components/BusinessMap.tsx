'use client';

import { useEffect, useRef } from 'react';

interface Business {
  id: string;
  name: string;
  address: string;
  hasWebsite: boolean;
  websiteAge?: number;
  websiteQuality?: {
    performance: number;
    mobile: boolean;
  };
  location?: {
    lat: number;
    lng: number;
  };
}

interface BusinessMapProps {
  businesses: Business[];
  center?: { lat: number; lng: number };
  apiKey: string;
}

export default function BusinessMap({ businesses, center, apiKey }: BusinessMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initMap();
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => initMap());
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      // Calculate center from businesses or use provided center
      const mapCenter = center || (businesses.length > 0 && businesses[0].location
        ? businesses[0].location
        : { lat: 51.4545, lng: -2.5879 }); // Default to Bristol

      // Create map
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 13,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#242f3e' }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#242f3e' }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#746855' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#17263c' }]
          }
        ]
      });

      updateMarkers();
    };

    loadGoogleMaps();

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [apiKey, center]);

  useEffect(() => {
    if (googleMapRef.current) {
      updateMarkers();
    }
  }, [businesses]);

  const updateMarkers = () => {
    if (!googleMapRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    businesses.forEach(business => {
      if (!business.location) return;

      const getPriority = (b: Business) => {
        if (!b.hasWebsite) return 'HIGH';
        if ((b.websiteAge && b.websiteAge > 5) ||
            (b.websiteQuality && b.websiteQuality.performance < 50)) return 'MEDIUM';
        return 'LOW';
      };

      const priority = getPriority(business);
      const pinColor = priority === 'HIGH' ? '#ef4444' :  // red
                       priority === 'MEDIUM' ? '#f59e0b' :  // orange
                       '#10b981'; // green

      const marker = new window.google.maps.Marker({
        position: business.location,
        map: googleMapRef.current,
        title: business.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: pinColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="color: black; padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">${business.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px;">${business.address}</p>
            <div style="margin-top: 8px; padding: 4px 8px; background: ${pinColor}; color: white; display: inline-block; border-radius: 4px; font-size: 11px; font-weight: bold;">
              ${priority} PRIORITY
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (businesses.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      businesses.forEach(business => {
        if (business.location) {
          bounds.extend(business.location);
        }
      });
      googleMapRef.current?.fitBounds(bounds);
    }
  };

  return (
    <div ref={mapRef} className="w-full h-full min-h-[400px] rounded-lg" />
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google: typeof google;
  }
}
