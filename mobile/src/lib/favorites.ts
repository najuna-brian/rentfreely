import { supabase } from './supabase';
import { Listing } from '../types/listing';

type ListingRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  photo_paths: string[] | null;
  price_ugx: number;
  bedrooms: number;
  bathrooms: number;
  property_type: 'House' | 'Apartment' | 'Room';
  furnished: boolean;
  district: string | null;
  address_line: string;
  latitude: number;
  longitude: number;
};

function mapRow(row: ListingRow): Listing {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description ?? undefined,
    photoPaths: row.photo_paths ?? undefined,
    priceUgx: row.price_ugx,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    propertyType: row.property_type,
    furnished: row.furnished,
    district: row.district ?? 'Uganda',
    address: row.address_line,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export async function fetchFavorites() {
  const { data: favorites, error: favoriteError } = await supabase
    .from('favorites')
    .select('listing_id')
    .order('created_at', { ascending: false });

  if (favoriteError) {
    throw favoriteError;
  }

  const ids = (favorites ?? []).map((item) => item.listing_id);
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('listings_with_coords')
    .select(
      'id,owner_id,title,description,photo_paths,price_ugx,bedrooms,bathrooms,property_type,furnished,district,address_line,latitude,longitude'
    )
    .in('id', ids);

  if (error) {
    throw error;
  }

  return (data as ListingRow[]).map((item) => mapRow(item));
}

export async function toggleFavorite(listingId: string, isFavorite: boolean) {
  if (isFavorite) {
    const { error } = await supabase.from('favorites').delete().eq('listing_id', listingId);
    if (error) {
      throw error;
    }
    return;
  }

  const { error } = await supabase.from('favorites').insert({ listing_id: listingId });
  if (error) {
    throw error;
  }
}
