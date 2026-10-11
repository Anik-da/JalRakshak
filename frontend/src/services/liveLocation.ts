export interface LiveLocationResult {
  coordinates: [number, number];
  localityName: string;
  source: 'GPS_HARDWARE' | 'IP_NETWORK' | 'DEFAULT';
}

/**
 * Universal live location detection:
 * 1. Tries high-accuracy browser GPS first.
 * 2. If browser blocks it (e.g. insecure HTTP context or permission dismissed),
 *    instantly falls back to fast CORS IP geolocation (ipwho.is).
 * 3. Falls back safely to Central Chennai basin.
 */
export async function detectLiveLocation(): Promise<LiveLocationResult> {
  // 1. Try Browser Geolocation API
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 3500,
          maximumAge: 30000,
          enableHighAccuracy: true,
        });
      });
      return {
        coordinates: [pos.coords.latitude, pos.coords.longitude],
        localityName: 'My GPS Location',
        source: 'GPS_HARDWARE',
      };
    } catch {
      // Browser blocked (insecure HTTP) or permission dismissed
    }
  }

  // 2. High-accuracy IP network geolocation fallback (Works on HTTP & HTTPS with 0 permissions required)
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const place = data.city || data.region || 'Live Position';
        return {
          coordinates: [data.latitude, data.longitude],
          localityName: `${place}, ${data.region_code || data.country_code || 'IN'}`,
          source: 'IP_NETWORK',
        };
      }
    }
  } catch (err) {
    console.warn('Network IP location fallback failed:', err);
  }

  // 3. Baseline Default
  return {
    coordinates: [13.045, 80.210],
    localityName: 'Chennai Metropolitan Basin',
    source: 'DEFAULT',
  };
}
