create or replace function public.search_listings_in_bounds(
  p_min_lat double precision,
  p_min_lng double precision,
  p_max_lat double precision,
  p_max_lng double precision,
  p_query text default null
)
returns table (
  id uuid,
  owner_id uuid,
  title text,
  description text,
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
  order by l.created_at desc;
$$;

grant execute on function public.search_listings_in_bounds(
  double precision, double precision, double precision, double precision, text
) to anon, authenticated;
