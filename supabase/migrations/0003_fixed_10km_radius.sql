-- The clock-in radius is now fixed at 10 km for everyone (no longer user-
-- configurable). Bump the column default and bring existing rows up to 10 km
-- so nobody is stuck on a smaller radius.
alter table public.work_locations
  alter column radius_meters set default 10000;

update public.work_locations
  set radius_meters = 10000
  where radius_meters < 10000;
