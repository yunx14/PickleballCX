import { createElement, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import { loadGoogleMapsJs } from '@/lib/load-google-maps';

export interface WebGoogleMapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
}

export function WebGoogleMap({
  center,
  zoom = 14,
  height,
  fill = false,
  interactive = true,
  markers,
  onMarkerPress,
}: {
  center: { lat: number; lng: number };
  zoom?: number;
  height?: number;
  fill?: boolean;
  interactive?: boolean;
  markers: WebGoogleMapMarker[];
  onMarkerPress?: (id: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const onMarkerPressRef = useRef(onMarkerPress);
  onMarkerPressRef.current = onMarkerPress;
  const [mapError, setMapError] = useState<string | null>(null);
  const markerKey = markers.map((marker) => `${marker.id}:${marker.lat}:${marker.lng}`).join('|');

  useEffect(() => {
    let cancelled = false;
    if (!hostRef.current) return;

    void (async () => {
      try {
        const maps = await loadGoogleMapsJs();
        if (cancelled || !hostRef.current) return;

        hostRef.current.replaceChildren();
        const map = new maps.Map(hostRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: interactive,
          gestureHandling: interactive ? 'greedy' : 'none',
        });

        for (const marker of markers) {
          const pin = new maps.Marker({
            position: { lat: marker.lat, lng: marker.lng },
            map,
            title: marker.title,
          });
          pin.addListener('click', () => onMarkerPressRef.current?.(marker.id));
        }

        window.setTimeout(() => {
          if (cancelled) return;
          maps.event.trigger(map, 'resize');
          map.setCenter(center);
        }, 150);
      } catch (error) {
        if (!cancelled) {
          setMapError(error instanceof Error ? error.message : 'Could not load Google Maps');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [center.lat, center.lng, interactive, markerKey, zoom]);

  return (
    <View style={[styles.host, fill ? styles.fill : { height }]}>
      {createElement('div', {
        ref: hostRef,
        style: { width: '100%', height: '100%' },
      })}
      {mapError ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{mapError}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    width: '100%',
    backgroundColor: brand.surfaceElevated,
    position: 'relative',
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  error: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: brand.surfaceElevated,
  },
  errorText: {
    color: brand.muted,
    fontSize: 14,
    textAlign: 'center',
  },
});
