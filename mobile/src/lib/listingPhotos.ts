import { supabase } from './supabase';

/** Public URL for a path in the `listing-photos` bucket (bucket must be public). */
export function getListingPhotoPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from('listing-photos').getPublicUrl(storagePath);
  return data.publicUrl;
}
