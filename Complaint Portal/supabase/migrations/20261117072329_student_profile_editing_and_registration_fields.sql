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
