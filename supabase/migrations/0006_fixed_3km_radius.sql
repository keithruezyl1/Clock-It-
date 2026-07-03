-- The clock-in radius is now fixed at 3 km for everyone (down from 10 km).
-- Update the column default and bring every existing workplace to 3 km,
-- since the clock-in check verifies against work_locations.radius_meters.
alter table public.work_locations
  alter column radius_meters set default 3000;

update public.work_locations
  set radius_meters = 3000
  where radius_meters <> 3000;
