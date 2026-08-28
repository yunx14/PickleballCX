import { getGoogleMapsApiKey } from './google-maps';

type GoogleMapsWindow = Window & {
  google?: {
    maps: {
      Map: new (
        el: HTMLElement,
        opts: {
          center: { lat: number; lng: number };
          zoom: number;
          mapTypeControl?: boolean;
          streetViewControl?: boolean;
          fullscreenControl?: boolean;
          zoomControl?: boolean;
          gestureHandling?: 'auto' | 'none' | 'cooperative' | 'greedy';
        },
      ) => {
        setCenter: (center: { lat: number; lng: number }) => void;
        setZoom: (zoom: number) => void;
        addListener: (event: string, handler: () => void) => void;
      };
      Marker: new (opts: {
        position: { lat: number; lng: number };
        map: unknown;
        title?: string;
      }) => { addListener: (event: string, handler: () => void) => void };
      event: {
        trigger: (instance: unknown, eventName: string) => void;
      };
    };
  };
};

let mapsPromise: Promise<NonNullable<GoogleMapsWindow['google']>['maps']> | null = null;

export function loadGoogleMapsJs() {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error('Missing Google Maps API key'));
  }

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps is only available in the browser'));
  }

  const mapsWindow = window as GoogleMapsWindow;
  if (mapsWindow.google?.maps) {
    return Promise.resolve(mapsWindow.google.maps);
  }

  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-pickleballcx-maps]');
    const onReady = () => {
      if (mapsWindow.google?.maps) {
        resolve(mapsWindow.google.maps);
        return;
      }
      reject(new Error('Google Maps failed to initialize'));
    };

    if (existing) {
      existing.addEventListener('load', onReady);
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.pickleballcxMaps = 'true';
    script.onload = onReady;
    script.onerror = () => {
      mapsPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });

  return mapsPromise;
}
