-- Complaint Portal database bootstrap
-- Run this entire file in Supabase SQL Editor.
-- New signups are always students by default. Grant admin role manually from a trusted admin session.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null default (
    'CP-' || to_char(current_timestamp, 'YYYY') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  ),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text not null check (char_length(trim(description)) between 10 and 10000),
  category text not null check (char_length(trim(category)) between 2 and 80),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'resolved', 'rejected')),
  admin_remarks text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade existing installations without changing any already-issued Reference IDs.
alter table public.complaints add column if not exists reference_id text;
update public.complaints
set reference_id = (
  'CP-' || to_char(created_at, 'YYYY') || '-' ||
  upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
)
where reference_id is null or btrim(reference_id) = '';
alter table public.complaints
  alter column reference_id set default (
    'CP-' || to_char(current_timestamp, 'YYYY') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  ),
  alter column reference_id set not null;
create unique index if not exists complaints_reference_id_uidx
  on public.complaints(reference_id);

create index if not exists complaints_user_id_idx on public.complaints(user_id);
create index if not exists complaints_status_idx on public.complaints(status);
create index if not exists complaints_created_at_idx on public.complaints(created_at desc);

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

drop trigger if exists complaints_set_updated_at on public.complaints;
create trigger complaints_set_updated_at
before update on public.complaints
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.complaints enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

-- Profile updates are intentionally disabled for normal users so a student
-- cannot promote their own account by changing the role column.
drop policy if exists "Students can read own complaints" on public.complaints;
create policy "Students can read own complaints"
on public.complaints for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "Students can create own complaints" on public.complaints;
create policy "Students can create own complaints"
on public.complaints for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Admins can update complaints" on public.complaints;
create policy "Admins can update complaints"
on public.complaints for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- To promote a trusted account after signing up, run a deliberate admin-only SQL operation:
-- update public.profiles set role = 'admin' where id = 'AUTH_USER_UUID';
-- Never let users assign their own role from a registration form.


-- Public tracking exposes only non-sensitive complaint progress fields.
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
set search_path = ''
as $$
  select c.reference_id, c.title, c.category, c.status::text,
         c.created_at, c.updated_at, c.admin_remarks
  from public.complaints as c
  where c.reference_id = upper(btrim(p_reference_id))
  limit 1;
$$;

revoke all on function public.track_complaint_by_reference(text) from public;
grant execute on function public.track_complaint_by_reference(text) to anon, authenticated;

-- Required for student dashboards to receive admin status changes in real time.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'complaints'
  ) then
    alter publication supabase_realtime add table public.complaints;
  end if;
end
$$;


-- Student profile editing and registration fields.
-- Student profile editing and registration fields.
-- Academic identity fields remain admin-managed.

alter table public.profiles
  add column if not exists phone text,
  add column if not exists crn_number text,
  add column if not exists department text,
  add column if not exists course text,
  add column if not exists semester text,
  add column if not exists academic_session text,
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists alternate_phone text,
  add column if not exists alternate_email text,
  add column if not exists current_address text,
  add column if not exists permanent_address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists pincode text,
  add column if not exists avatar_url text;

update public.profiles as p
set
  full_name = coalesce(nullif(btrim(p.full_name), ''), nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), ''),
  phone = coalesce(nullif(btrim(p.phone), ''), nullif(btrim(u.raw_user_meta_data ->> 'phone'), '')),
  crn_number = coalesce(nullif(btrim(p.crn_number), ''), nullif(btrim(u.raw_user_meta_data ->> 'crn_number'), '')),
  department = coalesce(nullif(btrim(p.department), ''), nullif(btrim(u.raw_user_meta_data ->> 'department'), '')),
  course = coalesce(nullif(btrim(p.course), ''), nullif(btrim(u.raw_user_meta_data ->> 'course'), '')),
  semester = coalesce(nullif(btrim(p.semester), ''), nullif(btrim(u.raw_user_meta_data ->> 'semester'), ''))
from auth.users as u
where u.id = p.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (
    id, full_name, role, phone, crn_number, department, course, semester
  )
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), ''),
    'student',
    nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'crn_number'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'department'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'course'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'semester'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (
  full_name, phone, date_of_birth, gender, alternate_phone, alternate_email,
  current_address, permanent_address, city, state, pincode, avatar_url
) on table public.profiles to authenticated;

drop policy if exists "Students can update own editable profile" on public.profiles;
create policy "Students can update own editable profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-avatars', 'student-avatars', false, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Students can read own avatar files" on storage.objects;
create policy "Students can read own avatar files" on storage.objects
for select to authenticated
using (bucket_id = 'student-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Students can upload own avatar files" on storage.objects;
create policy "Students can upload own avatar files" on storage.objects
for insert to authenticated
with check (bucket_id = 'student-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Students can delete own avatar files" on storage.objects;
create policy "Students can delete own avatar files" on storage.objects
for delete to authenticated
using (bucket_id = 'student-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text));

notify pgrst, 'reload schema';
