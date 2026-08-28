import type { Court } from '@/hooks/useCourts';

export interface CourtsMapProps {
  courts: Court[];
  userLat?: number | null;
  userLng?: number | null;
  onSelectCourt: (courtId: string) => void;
  /** Fired when the map background is tapped, so callers can clear a selection. */
  onDeselectCourt?: () => void;
}
