-- Complaint reference IDs and safe public status lookup.
-- Run this migration in Supabase SQL Editor after confirming the complaints table exists.

alter table public.complaints
  add column if not exists reference_id text,
  add column if not exists updated_at timestamptz;

-- Backfill existing records with unique, non-guessable reference IDs.
update public.complaints
set reference_id = 'CP-' || to_char(coalesce(created_at, now()), 'YYYY') || '-' ||
  upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where reference_id is null or btrim(reference_id) = '';

create unique index if not exists complaints_reference_id_uidx
  on public.complaints (reference_id);

-- Public tracking reveals only basic status information for an unguessable ID.
create or replace function public.track_complaint_by_reference(p_reference_id text)
returns table (
  reference_id text,
  title text,
  category text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  admin_remarks text
)
language sql
stable
security definer
set search_path = public
as $$
  select c.reference_id, c.title, c.category, c.status::text,
         c.created_at, c.updated_at, c.admin_remarks
  from public.complaints c
  where c.reference_id = upper(btrim(p_reference_id))
  limit 1;
$$;

revoke all on function public.track_complaint_by_reference(text) from public;
grant execute on function public.track_complaint_by_reference(text) to anon, authenticated;
