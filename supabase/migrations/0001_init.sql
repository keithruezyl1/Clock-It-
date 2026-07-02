-- Clock It! — initial schema
-- Tables: profiles, work_locations, attendance_logs
-- Storage: attendance-photos bucket
-- All rows are scoped to the signed-in user via row-level security.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  phone       text,
  onboarded   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- work_locations
-- ---------------------------------------------------------------------------
create table if not exists public.work_locations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  label         text not null default 'Workplace',
  place_name    text,
  address       text,
  city          text,
  region        text,
  country       text,
  latitude      double precision not null,
  longitude     double precision not null,
  radius_meters integer not null default 3000,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists work_locations_user_active_idx
  on public.work_locations (user_id, is_active, created_at desc);

alter table public.work_locations enable row level security;

drop policy if exists "work_locations_all_own" on public.work_locations;
create policy "work_locations_all_own" on public.work_locations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- attendance_logs
-- ---------------------------------------------------------------------------
create table if not exists public.attendance_logs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  work_location_id    uuid references public.work_locations (id) on delete set null,
  work_date           date not null default (now() at time zone 'utc')::date,
  clock_in_at         timestamptz,
  clock_in_lat        double precision,
  clock_in_lng        double precision,
  clock_in_distance_m double precision,
  title               text,
  clock_in_notes      text,
  clock_in_photo_url  text,
  clock_out_at        timestamptz,
  clock_out_notes     text,
  clock_out_photo_url text,
  status              text not null default 'active' check (status in ('active', 'completed')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists attendance_logs_user_status_idx
  on public.attendance_logs (user_id, status, clock_in_at desc);

alter table public.attendance_logs enable row level security;

drop policy if exists "attendance_logs_all_own" on public.attendance_logs;
create policy "attendance_logs_all_own" on public.attendance_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
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
  for each row execute function public.set_updated_at();

drop trigger if exists attendance_logs_set_updated_at on public.attendance_logs;
create trigger attendance_logs_set_updated_at
  before update on public.attendance_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up.
-- The app only ever UPDATEs profiles, so the row must exist beforehand.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The trigger runs as the function owner regardless of grants; no API role
-- should be able to invoke it directly via the REST RPC endpoint.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for clock-in / clock-out photos.
-- Public read (photos are served via getPublicUrl); writes scoped to the
-- signed-in user's own top-level folder ("<uid>/...").
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('attendance-photos', 'attendance-photos', true)
on conflict (id) do nothing;

drop policy if exists "attendance_photos_read" on storage.objects;
create policy "attendance_photos_read" on storage.objects
  for select using (bucket_id = 'attendance-photos');

drop policy if exists "attendance_photos_insert_own" on storage.objects;
create policy "attendance_photos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'attendance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "attendance_photos_update_own" on storage.objects;
create policy "attendance_photos_update_own" on storage.objects
  for update using (
    bucket_id = 'attendance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "attendance_photos_delete_own" on storage.objects;
create policy "attendance_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'attendance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
