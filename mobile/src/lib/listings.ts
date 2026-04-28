import { supabase } from './supabase';
import { Listing } from '../types/listing';
import { ListingFilters } from '../types/filters';
import { MapBounds } from '../types/map';

type ListingRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
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
      'id,owner_id,title,description,price_ugx,bedrooms,bathrooms,property_type,furnished,district,address_line,latitude,longitude'
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
      'id,owner_id,title,description,price_ugx,bedrooms,bathrooms,property_type,furnished,district,address_line,latitude,longitude'
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

export async function createListing(payload: {
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
}) {
  const { error } = await supabase.rpc('create_listing', {
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
    p_status: 'published',
  });

  if (error) {
    throw error;
  }
}
