-- Store each user's On-the-Job Training target (total required hours).
-- Set during onboarding; used to show remaining hours and a completion
-- celebration once the accumulated logged time passes it.
alter table public.profiles
  add column if not exists ojt_target_hours integer;
