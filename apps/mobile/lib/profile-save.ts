import type { ProfileEditInput } from '@pickleballcx/shared';

import { geocodeCity } from '@/lib/geocoding';
import { supabase } from '@/lib/supabase';

export async function saveProfile(
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
          'Could not find that city. Try "Mobile, AL" or "Austin, TX" so we can show you games nearby.',
      };
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: values.displayName.trim(),
      skill_level: values.skillLevel,
      city: city || null,
      city_lat: city ? cityLat : null,
      city_lng: city ? cityLng : null,
    })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  return {};
}
