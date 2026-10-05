// Active Google Maps API key (from environment or generated demo key)
export const DEFAULT_MAPS_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyBKcp2GebApNEw42rtODU-A8FuahvRcwJM';

let loadPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(apiKey: string = DEFAULT_MAPS_KEY): Promise<typeof google> {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<typeof google>((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window not available'));
    }

    const existing = document.getElementById('google-maps-js-sdk');
    if (existing) {
      if (window.google?.maps) {
        return resolve(window.google);
      }
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey || DEFAULT_MAPS_KEY}&libraries=places,marker,visualization&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new Error('google.maps object not found after script load'));
      }
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });

  return loadPromise;
}

// Sophisticated Dark Map Style matching the civic GIS console
export const GOOGLE_MAPS_DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#18202f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#18202f' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#152e2a' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4ade80' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#273449' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#334968' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#93c5fd' }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#243046' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#09101d' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }]
  }
];

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (window.google?.maps?.Geocoder) {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results[0]) {
        return response.results[0].formatted_address;
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback to coordinates format
  return `Ward Sector (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

export function getStatusMarkerSymbol(
  status: 'Pending' | 'In Progress' | 'Resolved',
  isSelected = false
): google.maps.Symbol {
  let fillColor = '#ef4444'; // Pending Red
  if (status === 'In Progress') fillColor = '#f59e0b'; // Amber
  if (status === 'Resolved') fillColor = '#10b981'; // Emerald

  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: isSelected ? 12 : 9,
    fillColor: fillColor,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: isSelected ? 3 : 2
  };
}
