-- Theme preference follows the user across devices.
alter table public.profiles
  add column if not exists theme text,
  add column if not exists theme_mode text;
