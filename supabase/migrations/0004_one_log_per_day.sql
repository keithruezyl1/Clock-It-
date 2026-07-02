-- Enforce a single attendance log per user per calendar day at the DB level.
-- work_date is set by the client to the user's *local* date, so "one per day"
-- follows the user's timezone rather than UTC.
create unique index if not exists attendance_logs_user_work_date_uniq
  on public.attendance_logs (user_id, work_date);
