alter table public.listings
add column if not exists photo_paths text[] not null default '{}';

drop view if exists public.listings_with_coords;

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
  l.photo_paths,
  l.status,
  st_y(l.geom::geometry) as latitude,
  st_x(l.geom::geometry) as longitude,
  l.created_at,
  l.updated_at
from public.listings l;

insert into storage.buckets (id, name, public)
select 'listing-photos', 'listing-photos', false
where not exists (
  select 1 from storage.buckets where id = 'listing-photos'
);

create policy "listing_photos_insert_owner"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-photos'
  and exists (
    select 1
    from public.listings l
    where l.id = split_part(name, '/', 1)::uuid
      and l.owner_id = auth.uid()
  )
);

create policy "listing_photos_select_owner"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'listing-photos'
  and exists (
    select 1
    from public.listings l
    where l.id = split_part(name, '/', 1)::uuid
      and l.owner_id = auth.uid()
  )
);

create policy "listing_photos_update_owner"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-photos'
  and exists (
    select 1
    from public.listings l
    where l.id = split_part(name, '/', 1)::uuid
      and l.owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'listing-photos'
  and exists (
    select 1
    from public.listings l
    where l.id = split_part(name, '/', 1)::uuid
      and l.owner_id = auth.uid()
  )
);

create policy "listing_photos_delete_owner"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-photos'
  and exists (
    select 1
    from public.listings l
    where l.id = split_part(name, '/', 1)::uuid
      and l.owner_id = auth.uid()
  )
);
