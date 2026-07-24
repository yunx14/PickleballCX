export function getDirectionsUrl(options: {
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
}): string | null {
  const { address, lat, lng } = options;

  if (lat != null && lng != null && lat !== 0 && lng !== 0) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  const trimmedAddress = address?.trim();
  if (trimmedAddress) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trimmedAddress)}`;
  }

  return null;
}
