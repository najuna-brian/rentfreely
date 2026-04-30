alter table public.profiles
add column if not exists username text,
add column if not exists email text,
add column if not exists app_roles text[] not null default array['tenant'];

create unique index if not exists profiles_username_key
on public.profiles (lower(username))
where username is not null and username <> '';

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_profile_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_insert_own'
  ) then
    create policy "profiles_insert_own"
    on public.profiles
    for insert
    to authenticated
    with check (auth.uid() = id);
  end if;
end
$$;

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
  profile_roles text[];
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select app_roles into profile_roles
  from public.profiles
  where id = auth.uid();

  if profile_roles is null or not ('landlord' = any(profile_roles)) then
    raise exception 'Landlord account required';
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

update public.profiles
set
  app_roles = case
    when app_roles is null or cardinality(app_roles) = 0 then array['tenant']
    else app_roles
  end,
  username = coalesce(nullif(username, ''), split_part(email, '@', 1)),
  updated_at = now();
