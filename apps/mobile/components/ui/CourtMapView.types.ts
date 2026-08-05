export interface CourtMapViewProps {
  lat: number | null | undefined;
  lng: number | null | undefined;
  height?: number;
  /** When true, user can pan/zoom (court detail). List cards use false. */
  interactive?: boolean;
  /** Full-bleed inside SessionCard (negative horizontal margin). */
  bleed?: boolean;
}
