'use client';

import { useState } from 'react';
import { Search, MapPin, Loader2, Download, Info } from 'lucide-react';
import { toast } from 'sonner';
import BusinessCard from './BusinessCard';
import BusinessMap from './BusinessMap';

interface Business {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  hasWebsite: boolean;
  websiteAge?: number;
  websiteQuality?: {
    performance: number;
    mobile: boolean;
    lastUpdated?: string;
  };
  location?: {
    lat: number;
    lng: number;
  };
}

export default function BusinessScanner() {
  const [location, setLocation] = useState('Bristol, BS7 8AD');
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(5000); // meters
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [showInfo, setShowInfo] = useState(false);

  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '';

  const exportToCSV = () => {
    if (businesses.length === 0) {
      toast.error('No businesses to export');
      return;
    }

    const headers = [
      'Name',
      'Address',
      'Phone',
      'Has Website',
      'Website URL',
      'Website Age (years)',
      'Performance Score',
      'Mobile Friendly',
      'Rating',
      'Priority Level'
    ];

    const rows = businesses.map(business => {
      const priority = !business.hasWebsite ? 'HIGH' :
        (business.websiteAge && business.websiteAge > 5) ||
        (business.websiteQuality && business.websiteQuality.performance < 50) ? 'MEDIUM' : 'LOW';

      return [
        business.name,
        business.address,
        business.phone || '',
        business.hasWebsite ? 'Yes' : 'No',
        business.website || '',
        business.websiteAge?.toString() || '',
        business.websiteQuality?.performance?.toString() || '',
        business.websiteQuality?.mobile ? 'Yes' : 'No',
        business.rating?.toString() || '',
        priority
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `business-leads-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${businesses.length} businesses to CSV`);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location.trim()) {
      toast.error('Please enter a location');
      return;
    }

    setLoading(true);
    setError('');
    setBusinesses([]);

    try {
      const response = await fetch('/api/scan-businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          query: searchQuery || 'business',
          radius,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to fetch businesses');
        return;
      }

      // Sort businesses by priority: HIGH first, then MEDIUM, then LOW
      const sortedBusinesses = (data.businesses || []).sort((a: Business, b: Business) => {
        const getPriority = (business: Business) => {
          if (!business.hasWebsite) return 1; // HIGH
          if ((business.websiteAge && business.websiteAge > 5) ||
              (business.websiteQuality && business.websiteQuality.performance < 50)) return 2; // MEDIUM
          return 3; // LOW
        };
        return getPriority(a) - getPriority(b);
      });

      setBusinesses(sortedBusinesses);

      // Set map center from API response
      if (data.location) {
        setMapCenter({ lat: data.location.lat, lng: data.location.lng });
      }

      if (data.businesses && data.businesses.length > 0) {
        const withoutWebsite = data.businesses.filter((b: Business) => !b.hasWebsite).length;
        toast.success(
          `Found ${data.businesses.length} businesses${withoutWebsite > 0 ? ` (${withoutWebsite} without websites)` : ''}`
        );
      } else {
        toast.info('No businesses found in this area');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white overflow-hidden">
      {/* Top Search Bar - Fixed Height */}
      <div className="flex-shrink-0 border-b border-white/20 bg-black">
        {/* Title Bar with Info */}
        <div className="px-4 pt-3 pb-2 border-b border-white/10 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">Local Business Scanner</h1>
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
            {showInfo && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white text-black text-xs p-3 rounded-lg shadow-xl z-50 border border-white/20">
                <p className="font-semibold mb-1">How it works:</p>
                <p className="text-black/70">
                  Searches Google Places API for local businesses within your specified radius.
                  Analyzes their web presence and prioritizes leads: businesses without websites (HIGH),
                  those with outdated/poor websites (MEDIUM), and well-maintained sites (LOW).
                </p>
              </div>
            )}
          </div>
        </div>
        <form onSubmit={handleSearch} className="p-4">
          <div className="flex gap-3 items-end">
            {/* Location Input */}
            <div className="flex-1">
              <label htmlFor="location" className="block text-xs font-medium mb-1 text-white/60">
                <MapPin className="inline w-3 h-3 mr-1" />
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., London, UK or SW1A 1AA"
                className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white transition-colors"
              />
            </div>

            {/* Business Type Input */}
            <div className="flex-1">
              <label htmlFor="query" className="block text-xs font-medium mb-1 text-white/60">
                <Search className="inline w-3 h-3 mr-1" />
                Business Type
              </label>
              <input
                id="query"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., restaurant, cafe"
                className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white transition-colors"
              />
            </div>

            {/* Radius Slider */}
            <div className="flex-1">
              <label htmlFor="radius" className="block text-xs font-medium mb-1 text-white/60">
                Radius: {(radius / 1000).toFixed(1)} km
              </label>
              <input
                id="radius"
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-black font-medium px-6 py-2 rounded hover:bg-white/90 transition-colors disabled:bg-white/50 disabled:cursor-not-allowed flex items-center gap-2 text-sm whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Scan
                </>
              )}
            </button>

            {/* Export Button */}
            {businesses.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors font-medium text-sm border border-white/20 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-2 border border-red-500/50 rounded bg-red-500/10 text-white/90 text-sm">
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Main Content Area - Takes remaining height */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Business List (40% width with internal scroll) */}
        <div className="w-2/5 border-r border-white/20 flex flex-col overflow-hidden">
          {/* Stats Header - Fixed */}
          {businesses.length > 0 && (
            <div className="flex-shrink-0 p-4 border-b border-white/20 bg-black/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    {businesses.length} {businesses.length === 1 ? 'Business' : 'Businesses'}
                  </h2>
                  <div className="text-xs text-white/60 mt-0.5 flex gap-3">
                    <span className="text-red-400">
                      {businesses.filter(b => !b.hasWebsite).length} HIGH priority
                    </span>
                    <span className="text-orange-400">
                      {businesses.filter(b => b.hasWebsite && ((b.websiteAge && b.websiteAge > 5) || (b.websiteQuality && b.websiteQuality.performance < 50))).length} MEDIUM
                    </span>
                    <span className="text-green-400">
                      {businesses.filter(b => b.hasWebsite && !((b.websiteAge && b.websiteAge > 5) || (b.websiteQuality && b.websiteQuality.performance < 50))).length} LOW
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Business List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {businesses.length > 0 ? (
              businesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))
            ) : !loading ? (
              <div className="flex flex-col items-center justify-center h-full text-white/40">
                <Search className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm text-center">Enter a location to start scanning for businesses</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Panel - Map (60% width, no scroll) */}
        <div className="w-3/5 relative">
          {businesses.length > 0 ? (
            <BusinessMap
              businesses={businesses}
              center={mapCenter}
              apiKey={GOOGLE_MAPS_API_KEY}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black/50">
              <div className="text-center text-white/40">
                <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Map will appear here after scanning</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
