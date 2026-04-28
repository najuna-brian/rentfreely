create or replace view public.listings_with_coords
with (security_invoker = true) as
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
  l.address_line,
  l.city,
  l.district,
  l.status,
  st_y(l.geom::geometry) as latitude,
  st_x(l.geom::geometry) as longitude,
  l.created_at,
  l.updated_at
from public.listings l;

grant select on public.listings_with_coords to anon, authenticated;

create or replace function public.create_listing(
  p_title text,
  p_description text,
  p_price_ugx bigint,
  p_bedrooms int,
  p_bathrooms int,
  p_property_type text,
  p_furnished boolean,
  p_address_line text,
  p_city text,
  p_district text,
  p_latitude double precision,
  p_longitude double precision,
  p_status text default 'published'
)
returns public.listings
language plpgsql
security invoker
set search_path = public
as $$
declare
  inserted_row public.listings;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.listings (
    owner_id,
    title,
    description,
    price_ugx,
    bedrooms,
    bathrooms,
    property_type,
    furnished,
    address_line,
    city,
    district,
    geom,
    status
  )
  values (
    auth.uid(),
    p_title,
    p_description,
    p_price_ugx,
    p_bedrooms,
    p_bathrooms,
    p_property_type,
    coalesce(p_furnished, false),
    p_address_line,
    p_city,
    p_district,
    st_setsrid(st_makepoint(p_longitude, p_latitude), 4326)::geography,
    coalesce(p_status, 'published')
  )
  returning * into inserted_row;

  return inserted_row;
end;
$$;

grant execute on function public.create_listing(
  text, text, bigint, int, int, text, boolean, text, text, text, double precision, double precision, text
) to authenticated;
