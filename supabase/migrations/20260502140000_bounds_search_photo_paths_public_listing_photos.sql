-- Include listing photos in map-bounds search (Explore).
drop function if exists public.search_listings_in_bounds(
  double precision,
  double precision,
  double precision,
  double precision,
  text,
  bigint,
  bigint,
  int,
  text,
  boolean
);

create or replace function public.search_listings_in_bounds(
  p_min_lat double precision,
  p_min_lng double precision,
  p_max_lat double precision,
  p_max_lng double precision,
  p_query text default null,
  p_min_price bigint default null,
  p_max_price bigint default null,
  p_min_bedrooms int default null,
  p_property_type text default null,
  p_furnished boolean default null
)
returns table (
  id uuid,
  owner_id uuid,
  title text,
  description text,
  photo_paths text[],
  price_ugx bigint,
  bedrooms int,
  bathrooms int,
  property_type text,
  furnished boolean,
  district text,
  address_line text,
  status text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security invoker
set search_path = public
as $$
  select
    l.id,
    l.owner_id,
    l.title,
    l.description,
    l.photo_paths,
    l.price_ugx,
    l.bedrooms,
    l.bathrooms,
    l.property_type,
    l.furnished,
    l.district,
    l.address_line,
    l.status,
    st_y(l.geom::geometry) as latitude,
    st_x(l.geom::geometry) as longitude,
    l.created_at,
    l.updated_at
  from public.listings l
  where
    (l.status = 'published' or auth.uid() = l.owner_id)
    and st_intersects(
      l.geom::geometry,
      st_makeenvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
    )
    and (
      p_query is null
      or p_query = ''
      or l.title ilike '%' || p_query || '%'
      or coalesce(l.district, '') ilike '%' || p_query || '%'
      or l.address_line ilike '%' || p_query || '%'
    )
    and (p_min_price is null or l.price_ugx >= p_min_price)
    and (p_max_price is null or l.price_ugx <= p_max_price)
    and (p_min_bedrooms is null or l.bedrooms >= p_min_bedrooms)
    and (p_property_type is null or p_property_type = '' or l.property_type = p_property_type)
    and (p_furnished is null or l.furnished = p_furnished)
  order by l.created_at desc;
$$;

grant execute on function public.search_listings_in_bounds(
  double precision, double precision, double precision, double precision, text, bigint, bigint, int, text, boolean
) to anon, authenticated;

-- Published listing images use UUID-scoped paths; public URLs simplify the mobile app.
update storage.buckets
set public = true
where id = 'listing-photos';
