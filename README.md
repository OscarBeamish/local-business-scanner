# Local Business Scanner

A powerful web application to scan local businesses in your area and analyze their web presence. Perfect for web developers looking to identify potential clients who need website development or improvement services.

## Features

- 🔍 **Location-based Business Search** - Find businesses near any location
- 🌐 **Website Detection** - Automatically identify which businesses have websites
- 📊 **Website Analysis** - Check website age, performance scores, and mobile-friendliness
- 🎯 **Lead Prioritization** - Businesses are automatically prioritized based on their web presence:
  - **HIGH PRIORITY**: No website at all
  - **MEDIUM PRIORITY**: Outdated website (5+ years) or poor performance
  - **LOW PRIORITY**: Modern, well-performing website
- 📥 **Export to CSV** - Download all results for offline use
- 🎨 **Dark Theme** - Professional black and white interface

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Google Cloud Platform account (for Places API)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/local-business-scanner.git
cd local-business-scanner
```

2. Install dependencies:
```bash
npm install
```

3. Set up Google Places API:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Places API
     - Geocoding API
     - PageSpeed Insights API (optional, for better website analysis)
   - Create an API key under "Credentials"

4. Configure environment variables:
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Add your Google API key to `.env.local`:
     ```
     NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
     NEXT_PUBLIC_PAGESPEED_API_KEY=your_api_key_here
     ```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Enter a Location**: Type in a city, postal code, or address
2. **Specify Business Type** (optional): e.g., "restaurant", "plumber", "salon"
3. **Set Search Radius**: Adjust the slider (1-50km)
4. **Click "Scan Businesses"**: The app will find and analyze local businesses
5. **Review Results**: Businesses are displayed with priority indicators
6. **Export Data**: Click "Export CSV" to download the results

## How It Works

### Business Discovery
The app uses Google Places API to find businesses near your specified location.

### Website Detection
For each business found, the app checks if they have a website and performs analysis.

### Website Analysis

**Domain Age Check**: Uses WHOIS lookup to determine when the domain was registered.

**Quality Analysis**: Analyzes performance score, mobile-friendliness, and HTTPS status.

### Priority Scoring

- **HIGH PRIORITY**: No website detected
- **MEDIUM PRIORITY**: Website 5+ years old or poor performance
- **LOW PRIORITY**: Modern, well-performing website

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **APIs**: Google Places API, PageSpeed Insights API, WHOIS

## Troubleshooting

### "API key not configured" error
- Ensure `.env.local` exists with your API key
- Restart the development server after adding environment variables

### No businesses found
- Try a more specific location
- Increase the search radius
- Verify your Google Places API is enabled

## License

MIT License - feel free to use this for your business development needs.

---

**Built with Next.js** | Made for web developers who hustle
