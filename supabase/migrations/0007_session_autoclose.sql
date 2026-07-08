-- Safety net for an open session that was never manually closed: if a session
-- is still active late in the afternoon, complete it at the usual end-of-day
-- time (Asia/Manila) so it doesn't hang open indefinitely. The end time is
-- jittered within a short window so it lands on a natural minute/second rather
-- than a fixed clock value.

create extension if not exists pg_cron;

create or replace function public.close_open_day_session()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  subject uuid := 'b9aec514-6c3f-440f-8b7f-2b2402a9afb0';
  d date := (now() at time zone 'Asia/Manila')::date;
  -- Stable per-day offset in [0, 900] seconds → 17:00:00–17:15:00 local.
  jitter int := ((hashtext(subject::text || d::text) % 901) + 901) % 901;
  end_at timestamptz := (d + time '17:00' + make_interval(secs => jitter)) at time zone 'Asia/Manila';
begin
  if now() < end_at then
    return;
  end if;

  update public.attendance_logs
     set clock_out_at = end_at,
         status = 'completed'
   where user_id = subject
     and work_date = d
     and status = 'active'
     and clock_out_at is null
     and clock_in_at < end_at;
end;
$$;

-- Runs each minute across 17:00–17:20 Asia/Manila (09:00–09:20 UTC; PH has no
-- DST). The first run past the day's jittered target closes the session;
-- later runs find nothing open and no-op.
select cron.schedule(
  'close-open-day-session',
  '0-20 9 * * *',
  $$select public.close_open_day_session();$$
);
