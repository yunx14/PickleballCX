import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

const AVATAR_BUCKET = 'avatars';
const MAX_BYTES = 2 * 1024 * 1024;

function extensionForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/heic' || mime === 'image/heif') return 'heic';
  return 'jpg';
}

function objectPathFromPublicUrl(url: string, userId: string): string | null {
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index < 0) return null;
  const path = url.slice(index + marker.length).split('?')[0];
  if (!path.startsWith(`${userId}/`)) return null;
  return path;
}

export async function uploadProfileAvatar(userId: string): Promise<{ url?: string; error?: string }> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { error: 'Photo library access is needed to upload a profile picture.' };
  }

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (picked.canceled || !picked.assets[0]) {
    return {};
  }

  const asset = picked.assets[0];
  if (asset.fileSize != null && asset.fileSize > MAX_BYTES) {
    return { error: 'Choose a photo smaller than 2 MB.' };
  }

  const mime = asset.mimeType?.trim() || 'image/jpeg';
  if (!mime.startsWith('image/')) {
    return { error: 'Please choose a photo.' };
  }

  let body: ArrayBuffer;
  try {
    const response = await fetch(asset.uri);
    body = await response.arrayBuffer();
  } catch {
    return { error: 'Could not read that photo. Try another image.' };
  }

  if (body.byteLength > MAX_BYTES) {
    return { error: 'Choose a photo smaller than 2 MB.' };
  }

  const path = `${userId}/avatar-${Date.now()}.${extensionForMime(mime)}`;
  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, body, {
    contentType: mime,
    upsert: true,
  });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { data: current } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (updateError) {
    return { error: updateError.message };
  }

  const previousPath = current?.avatar_url
    ? objectPathFromPublicUrl(current.avatar_url, userId)
    : null;
  if (previousPath && previousPath !== path) {
    void supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
  }

  return { url: publicUrl };
}

export async function removeProfileAvatar(userId: string): Promise<{ error?: string }> {
  const { data: current } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId);

  if (updateError) {
    return { error: updateError.message };
  }

  const previousPath = current?.avatar_url
    ? objectPathFromPublicUrl(current.avatar_url, userId)
    : null;
  if (previousPath) {
    void supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
  }

  return {};
}
