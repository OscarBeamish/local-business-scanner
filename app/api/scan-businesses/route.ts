import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { analyzeWebsite } from '@/lib/websiteAnalysis';

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, query = 'business', radius = 5000 } = body;

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key not configured. Please add NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    // Step 1: Geocode the location to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_PLACES_API_KEY}`;
    const geocodeResponse = await axios.get(geocodeUrl);

    if (geocodeResponse.data.status !== 'OK' || !geocodeResponse.data.results.length) {
      return NextResponse.json(
        { error: 'Could not find the specified location' },
        { status: 404 }
      );
    }

    const { lat, lng } = geocodeResponse.data.results[0].geometry.location;

    // Step 2: Search for nearby businesses using Places API (Nearby Search)
    // Google Places API returns max 20 results per page, use pagination to get more
    let places: any[] = [];
    let nextPageToken: string | undefined = undefined;
    const maxPages = 3; // Fetch up to 60 results (3 pages × 20 results)

    for (let page = 0; page < maxPages; page++) {
      let placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;

      if (nextPageToken) {
        placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${nextPageToken}&key=${GOOGLE_PLACES_API_KEY}`;
        // Google requires a short delay before using the next_page_token
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const placesResponse = await axios.get(placesUrl);

      if (placesResponse.data.status !== 'OK' && placesResponse.data.status !== 'ZERO_RESULTS') {
        // If it's the first page, return error; otherwise, break and use what we have
        if (page === 0) {
          return NextResponse.json(
            { error: `Places API error: ${placesResponse.data.status}` },
            { status: 500 }
          );
        }
        break;
      }

      const pageResults = placesResponse.data.results || [];
      places = [...places, ...pageResults];

      // Check if there's a next page
      nextPageToken = placesResponse.data.next_page_token;

      // If no more results, break early
      if (!nextPageToken || pageResults.length === 0) {
        break;
      }
    }

    // Step 3: Get detailed information for each place
    const businessesPromises = places.map(async (place: any) => {
      try {
        // Get place details
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating&key=${GOOGLE_PLACES_API_KEY}`;
        const detailsResponse = await axios.get(detailsUrl);

        if (detailsResponse.data.status === 'OK') {
          const details: PlaceResult = detailsResponse.data.result;

          return {
            id: place.place_id,
            name: details.name,
            address: details.formatted_address,
            phone: details.formatted_phone_number,
            website: details.website,
            rating: details.rating,
            hasWebsite: !!details.website,
            location: place.geometry?.location, // Include lat/lng from the nearby search
          };
        }
        return null;
      } catch (error) {
        console.error(`Error fetching details for ${place.name}:`, error);
        return null;
      }
    });

    const businessResults = await Promise.all(businessesPromises);
    const businesses = businessResults.filter((b) => b !== null);

    // Step 4: Analyze websites (we'll do basic analysis for now)
    const analyzedBusinesses = await Promise.all(
      businesses.map(async (business) => {
        if (!business.website) {
          return business;
        }

        try {
          // Check website age and quality (we'll add this in the next steps)
          const websiteAnalysis = await analyzeWebsite(business.website);
          return {
            ...business,
            websiteAge: websiteAnalysis.age,
            websiteQuality: websiteAnalysis.quality,
          };
        } catch (error) {
          return business;
        }
      })
    );

    return NextResponse.json({
      success: true,
      businesses: analyzedBusinesses,
      location: {
        lat,
        lng,
        address: geocodeResponse.data.results[0].formatted_address,
      },
    });
  } catch (error) {
    console.error('Error scanning businesses:', error);
    return NextResponse.json(
      { error: 'Failed to scan businesses. Please try again.' },
      { status: 500 }
    );
  }
}

