import axios from 'axios';

const PAGESPEED_API_KEY = process.env.NEXT_PUBLIC_PAGESPEED_API_KEY;

export interface WebsiteAnalysis {
  age?: number;
  quality?: {
    performance: number;
    mobile: boolean;
    lastUpdated?: string;
  };
}

/**
 * Get domain age using WHOIS lookup
 * Note: WHOIS lookup temporarily disabled due to dependency issues
 */
export async function getDomainAge(websiteUrl: string): Promise<number | undefined> {
  // TODO: Re-implement with a more reliable WHOIS solution
  return undefined;
}

/**
 * Analyze website quality using PageSpeed Insights API
 */
export async function analyzeWebsiteQuality(websiteUrl: string) {
  try {
    if (!PAGESPEED_API_KEY) {
      console.warn('PageSpeed API key not configured, using fallback analysis');
      return await fallbackQualityAnalysis(websiteUrl);
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(websiteUrl)}&key=${PAGESPEED_API_KEY}&category=performance&category=mobile`;

    const response = await axios.get(apiUrl, { timeout: 10000 });

    if (response.data && response.data.lighthouseResult) {
      const { lighthouseResult } = response.data;
      const performanceScore = Math.round((lighthouseResult.categories.performance?.score || 0) * 100);
      const isMobileFriendly = lighthouseResult.categories.mobile?.score > 0.8;

      return {
        performance: performanceScore,
        mobile: isMobileFriendly,
        lastUpdated: new Date().toISOString(),
      };
    }

    return await fallbackQualityAnalysis(websiteUrl);
  } catch (error) {
    console.error('PageSpeed analysis failed:', error);
    return await fallbackQualityAnalysis(websiteUrl);
  }
}

/**
 * Fallback quality analysis when PageSpeed API is not available
 * Performs basic checks like response time and SSL
 */
async function fallbackQualityAnalysis(websiteUrl: string) {
  try {
    const startTime = Date.now();
    const response = await axios.get(websiteUrl, {
      timeout: 5000,
      maxRedirects: 5,
      validateStatus: () => true, // Accept any status code
    });
    const loadTime = Date.now() - startTime;

    // Basic scoring based on load time and status
    let performance = 100;
    if (loadTime > 3000) performance -= 30;
    else if (loadTime > 2000) performance -= 20;
    else if (loadTime > 1000) performance -= 10;

    if (response.status >= 400) performance -= 40;

    // Check if HTTPS
    const isHttps = websiteUrl.startsWith('https://');
    if (!isHttps) performance -= 20;

    // Check basic mobile viewport meta tag
    const html = response.data || '';
    const hasMobileViewport = typeof html === 'string' && html.includes('viewport');

    return {
      performance: Math.max(0, Math.min(100, performance)),
      mobile: hasMobileViewport,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    // If we can't even load the site, give it a poor score
    return {
      performance: 20,
      mobile: false,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Complete website analysis combining age and quality checks
 */
export async function analyzeWebsite(websiteUrl: string): Promise<WebsiteAnalysis> {
  try {
    const [age, quality] = await Promise.all([
      getDomainAge(websiteUrl),
      analyzeWebsiteQuality(websiteUrl),
    ]);

    return {
      age,
      quality,
    };
  } catch (error) {
    console.error('Website analysis failed:', error);
    return {
      age: undefined,
      quality: undefined,
    };
  }
}
