'use client';

import { Globe, Phone, MapPin, AlertCircle, CheckCircle, ExternalLink, Calendar, Gauge } from 'lucide-react';

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
}

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const getOpportunityLevel = () => {
    if (!business.hasWebsite) return 'high';
    if (business.websiteAge && business.websiteAge > 5) return 'medium';
    if (business.websiteQuality && business.websiteQuality.performance < 50) return 'medium';
    return 'low';
  };

  const opportunityLevel = getOpportunityLevel();
  const opportunityColors = {
    high: 'border-white bg-white/10',
    medium: 'border-white/60 bg-white/5',
    low: 'border-white/20 bg-transparent',
  };

  return (
    <div className={`border rounded-lg p-5 transition-all hover:shadow-lg hover:shadow-white/5 ${opportunityColors[opportunityLevel]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-1">{business.name}</h3>
          <div className="flex items-center gap-1 text-sm text-white/60">
            <MapPin className="w-3 h-3" />
            <span>{business.address}</span>
          </div>
        </div>

        {/* Opportunity Badge */}
        {opportunityLevel !== 'low' && (
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            opportunityLevel === 'high' ? 'bg-white text-black' : 'bg-white/20 text-white'
          }`}>
            {opportunityLevel === 'high' ? 'HIGH PRIORITY' : 'MEDIUM PRIORITY'}
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {business.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-white/40" />
            <a href={`tel:${business.phone}`} className="hover:underline">
              {business.phone}
            </a>
          </div>
        )}

        {business.rating && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/40">★</span>
            <span>{business.rating.toFixed(1)} / 5.0</span>
          </div>
        )}
      </div>

      {/* Website Status */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        {business.hasWebsite ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-white/60" />
              <span className="text-white/80">Has Website</span>
            </div>

            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors group"
              >
                <Globe className="w-4 h-4" />
                <span className="truncate flex-1">{business.website}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}

            {/* Website Details */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-white/5 rounded p-3">
              {business.websiteAge !== undefined && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-white/40" />
                  <span className="text-white/60">
                    {business.websiteAge} {business.websiteAge === 1 ? 'year' : 'years'} old
                  </span>
                </div>
              )}

              {business.websiteQuality && (
                <>
                  <div className="flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-white/40" />
                    <span className="text-white/60">
                      Performance: {business.websiteQuality.performance}/100
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-white/40">📱</span>
                    <span className="text-white/60">
                      {business.websiteQuality.mobile ? 'Mobile-friendly' : 'Not mobile-friendly'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Improvement Opportunities */}
            {(business.websiteAge && business.websiteAge > 5) ||
             (business.websiteQuality && business.websiteQuality.performance < 50) ? (
              <div className="bg-white/5 border border-white/10 rounded p-3 text-xs">
                <div className="font-medium mb-1">💡 Improvement Opportunities:</div>
                <ul className="space-y-1 text-white/60">
                  {business.websiteAge && business.websiteAge > 5 && (
                    <li>• Website is outdated ({business.websiteAge} years old)</li>
                  )}
                  {business.websiteQuality && business.websiteQuality.performance < 50 && (
                    <li>• Poor performance score (needs optimization)</li>
                  )}
                  {business.websiteQuality && !business.websiteQuality.mobile && (
                    <li>• Not mobile-friendly (losing mobile customers)</li>
                  )}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">No Website Found</span>
            </div>
            <div className="bg-white/10 border border-white/20 rounded p-3 text-xs">
              <div className="font-medium mb-1">🎯 Perfect Opportunity!</div>
              <p className="text-white/80">
                This business has no online presence. They could benefit from a professional website.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
