-- Private evidence uploads for selected grievance categories.
alter table public.complaints
  add column if not exists evidence_path text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'complaints_evidence_category_check'
      and conrelid = 'public.complaints'::regclass
  ) then
    alter table public.complaints
      add constraint complaints_evidence_category_check
      check (
        evidence_path is null
        or category in (
          'Safety & Security',
          'Food & Canteen',
          'Hostel & Accommodation',
          'Infrastructure & Facilities'
        )
      );
  end if;
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-evidence',
  'complaint-evidence',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Students can read own complaint evidence" on storage.objects;
create policy "Students can read own complaint evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'complaint-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Students can upload own complaint evidence" on storage.objects;
create policy "Students can upload own complaint evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'complaint-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Students can delete own complaint evidence" on storage.objects;
create policy "Students can delete own complaint evidence"
on storage.objects for delete to authenticated
using (
  bucket_id = 'complaint-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

notify pgrst, 'reload schema';
