-- RentFreely mobile expects these columns on public.profiles.
-- Safe if 20260501001000_profile_roles_and_onboarding_auth.sql already ran.

alter table public.profiles
  add column if not exists username text,
  add column if not exists email text,
  add column if not exists app_roles text[] not null default array['tenant']::text[];

update public.profiles
set
  app_roles = array['tenant']::text[]
where app_roles is null or cardinality(app_roles) = 0;

create unique index if not exists profiles_username_key
on public.profiles (lower(username))
where username is not null and username <> '';

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

notify pgrst, 'reload schema';
