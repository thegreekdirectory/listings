alter table public.listings
  add column if not exists additional_info jsonb default '[]'::jsonb,
  add column if not exists cta_buttons jsonb default '[]'::jsonb;
