-- Admin dashboard: student directory and complaint assignment workflow.
alter table public.complaints
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists assigned_by uuid references public.profiles(id) on delete set null,
  add column if not exists assigned_at timestamptz;

create index if not exists complaints_assigned_to_idx
  on public.complaints(assigned_to);
create index if not exists complaints_assigned_by_idx
  on public.complaints(assigned_by);

notify pgrst, 'reload schema';
