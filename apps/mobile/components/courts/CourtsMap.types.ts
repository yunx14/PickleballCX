import type { Court } from '@/hooks/useCourts';

export interface CourtsMapProps {
  courts: Court[];
  userLat?: number | null;
  userLng?: number | null;
  onSelectCourt: (courtId: string) => void;
}
