import type { ProfileEditInput } from '@pickleballcx/shared';

import { geocodeCity } from '@/lib/geocoding';
import { supabase } from '@/lib/supabase';

const AVAILABLE_DURATION_MS = 8 * 60 * 60 * 1000;

export async function saveProfileDiscoveryFields(
  userId: string,
  values: ProfileEditInput,
): Promise<{ error?: string }> {
  const city = values.city?.trim() ?? '';
  let cityLat: number | null = null;
  let cityLng: number | null = null;

  if (city) {
    try {
      const coords = await geocodeCity(city);
      cityLat = coords.lat;
      cityLng = coords.lng;
    } catch {
      return {
        error:
          'Could not find that city. Try "Mobile, AL" or "Austin, TX" so other players can see your distance.',
      };
    }
  }

  const availableUntil = values.availableNow
    ? new Date(Date.now() + AVAILABLE_DURATION_MS).toISOString()
    : null;

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: values.displayName.trim(),
      skill_level: values.skillLevel,
      city: city || null,
      city_lat: city ? cityLat : null,
      city_lng: city ? cityLng : null,
      play_format: values.playFormat,
      ranked_preference: values.rankedPreference,
      discovery_enabled: values.discoveryEnabled,
      available_now: values.availableNow,
      available_until: availableUntil,
    })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  return {};
}
