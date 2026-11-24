-- Harden public complaint tracking.
-- Existing Reference IDs remain unchanged; only future IDs use 128-bit UUID entropy.
alter table public.complaints
  alter column reference_id set default (
    'CP-' || to_char(current_timestamp, 'YYYY') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 32))
  );

-- The SECURITY DEFINER RPC is now called only by the trusted Express API,
-- which applies IP-based rate limiting before invoking it with service_role.
revoke all on function public.track_complaint_by_reference(text)
  from public, anon, authenticated;
grant execute on function public.track_complaint_by_reference(text)
  to service_role;
