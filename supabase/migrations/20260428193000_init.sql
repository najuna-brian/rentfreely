create extension if not exists postgis;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  price_ugx bigint not null check (price_ugx > 0),
  bedrooms int not null default 1 check (bedrooms >= 0),
  bathrooms int not null default 1 check (bathrooms >= 0),
  property_type text not null check (property_type in ('House', 'Apartment', 'Room')),
  furnished boolean not null default false,
  address_line text not null,
  city text,
  district text,
  geom geography(Point, 4326) not null,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_geom_gix on public.listings using gist(geom);
create index if not exists listings_owner_id_idx on public.listings(owner_id);
create index if not exists listings_status_idx on public.listings(status);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "listings_read_published"
on public.listings
for select
to public
using (status = 'published' or auth.uid() = owner_id);

create policy "listings_insert_own"
on public.listings
for insert
to authenticated
with check (auth.uid() = owner_id);

create policy "listings_update_own"
on public.listings
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "listings_delete_own"
on public.listings
for delete
to authenticated
using (auth.uid() = owner_id);

create policy "favorites_all_own"
on public.favorites
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
