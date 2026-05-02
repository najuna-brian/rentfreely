import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';
import { Listing } from '../types/listing';
import { ListingFilters } from '../types/filters';
import { MapBounds } from '../types/map';

type ListingRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  /** Present on view/RPC rows; may be absent on older RPC shapes until migrations apply. */
  photo_paths?: string[] | null;
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

export async function fetchListings(
  query?: string,
  bounds?: MapBounds,
  filters?: ListingFilters
): Promise<Listing[]> {
  if (bounds) {
    const { data, error } = await supabase.rpc('search_listings_in_bounds', {
      p_min_lat: bounds.minLat,
      p_min_lng: bounds.minLng,
      p_max_lat: bounds.maxLat,
      p_max_lng: bounds.maxLng,
      p_query: query?.trim() ? query.trim() : null,
      p_min_price: filters?.minPrice ?? null,
      p_max_price: filters?.maxPrice ?? null,
      p_min_bedrooms: filters?.minBedrooms ?? null,
      p_property_type: filters?.propertyType ?? null,
      p_furnished: typeof filters?.furnished === 'boolean' ? filters.furnished : null,
    });

    if (error) {
      throw error;
    }
    return (data ?? []).map((item: ListingRow) => mapRow(item));
  }

  let statement = supabase
    .from('listings_with_coords')
    .select(
      'id,owner_id,title,description,photo_paths,price_ugx,bedrooms,bathrooms,property_type,furnished,district,address_line,latitude,longitude'
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (query?.trim()) {
    statement = statement.or(
      `title.ilike.%${query.trim()}%,district.ilike.%${query.trim()}%,address_line.ilike.%${query.trim()}%`
    );
  }

  const { data, error } = await statement;
  if (error) {
    throw error;
  }
  return (data ?? []).map((item) => mapRow(item as ListingRow));
}

export async function fetchListingById(listingId: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listings_with_coords')
    .select(
      'id,owner_id,title,description,photo_paths,price_ugx,bedrooms,bathrooms,property_type,furnished,district,address_line,latitude,longitude'
    )
    .eq('id', listingId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return mapRow(data as ListingRow);
}

export type CreateListingPayload = {
  title: string;
  description: string;
  priceUgx: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: 'House' | 'Apartment' | 'Room';
  furnished: boolean;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
};

type CreateListingRpcResponse = {
  id: string;
};

function extractInsertedId(data: CreateListingRpcResponse | CreateListingRpcResponse[] | null): string {
  if (!data) {
    throw new Error('Listing draft was created but no id was returned.');
  }
  if (Array.isArray(data)) {
    if (!data[0]?.id) {
      throw new Error('Unable to resolve listing id from RPC response.');
    }
    return data[0].id;
  }
  if (!data.id) {
    throw new Error('Unable to resolve listing id from RPC response.');
  }
  return data.id;
}

export async function createListingDraft(payload: CreateListingPayload): Promise<string> {
  const { data, error } = await supabase.rpc('create_listing', {
    p_title: payload.title,
    p_description: payload.description,
    p_price_ugx: payload.priceUgx,
    p_bedrooms: payload.bedrooms,
    p_bathrooms: payload.bathrooms,
    p_property_type: payload.propertyType,
    p_furnished: payload.furnished,
    p_address_line: payload.address,
    p_city: payload.city,
    p_district: payload.district,
    p_latitude: payload.latitude,
    p_longitude: payload.longitude,
    p_status: 'draft',
  });

  if (error) {
    throw error;
  }
  return extractInsertedId((data ?? null) as CreateListingRpcResponse | CreateListingRpcResponse[] | null);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = globalThis.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Reads local / content URIs for upload. Avoids `fetch(uri)` on Android `content://` which throws "Network request failed". */
async function readImageBytes(uri: string): Promise<ArrayBuffer> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  return base64ToArrayBuffer(base64);
}

export async function uploadListingPhotos(listingId: string, photoUris: string[]): Promise<string[]> {
  if (!photoUris.length) {
    return [];
  }

  const uploadedPaths: string[] = [];

  for (let index = 0; index < photoUris.length; index += 1) {
    const uri = photoUris[index];
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${listingId}/${Date.now()}-${index}.${ext}`;
    const body = await readImageBytes(uri);
    const { error } = await supabase.storage.from('listing-photos').upload(path, body, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: false,
    });
    if (error) {
      throw error;
    }
    uploadedPaths.push(path);
  }

  const { error: updateError } = await supabase
    .from('listings')
    .update({ photo_paths: uploadedPaths })
    .eq('id', listingId);

  if (updateError) {
    throw updateError;
  }

  return uploadedPaths;
}

export async function publishListing(listingId: string) {
  const { error } = await supabase.from('listings').update({ status: 'published' }).eq('id', listingId);

  if (error) {
    throw error;
  }
}

export async function createListing(payload: CreateListingPayload) {
  const listingId = await createListingDraft(payload);
  await publishListing(listingId);
}
