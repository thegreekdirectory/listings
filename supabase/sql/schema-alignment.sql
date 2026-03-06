-- Align database schema with current listing template, submit form, and admin portal usage.

-- 1) Listings: custom fields + owner metadata are used in admin and template generation.
alter table if exists public.listings
  add column if not exists additional_info jsonb default '[]'::jsonb,
  add column if not exists cta_buttons jsonb default '[]'::jsonb,
  add column if not exists custom_ctas jsonb default '[]'::jsonb,
  add column if not exists owner_name text,
  add column if not exists owner_title text,
  add column if not exists from_greece text,
  add column if not exists owner_email text,
  add column if not exists owner_phone text,
  add column if not exists owner_name_title_visible boolean not null default true,
  add column if not exists owner_email_visible boolean not null default false,
  add column if not exists owner_phone_visible boolean not null default false,
  add column if not exists owner_contacts jsonb default '[]'::jsonb;

update public.listings
set additional_info = coalesce(additional_info, '[]'::jsonb),
    cta_buttons = coalesce(cta_buttons, '[]'::jsonb),
    custom_ctas = coalesce(custom_ctas, '[]'::jsonb),
    owner_contacts = coalesce(owner_contacts, '[]'::jsonb)
where additional_info is null
   or cta_buttons is null
   or custom_ctas is null
   or owner_contacts is null;

-- 2) Listing requests: ensure parity with submit form payload.
alter table if exists public.listing_requests
  add column if not exists slug text,
  add column if not exists is_chain boolean not null default false,
  add column if not exists chain_name text,
  add column if not exists chain_id text,
  add column if not exists additional_info jsonb default '[]'::jsonb,
  add column if not exists custom_ctas jsonb default '[]'::jsonb,
  add column if not exists owner_name text,
  add column if not exists owner_title text,
  add column if not exists from_greece text,
  add column if not exists owner_email text,
  add column if not exists owner_phone text,
  add column if not exists owner_name_title_visible boolean not null default true,
  add column if not exists owner_email_visible boolean not null default false,
  add column if not exists owner_phone_visible boolean not null default false,
  add column if not exists owner_contacts jsonb default '[]'::jsonb;

-- 3) Business owners: code supports multiple owners per listing.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'business_owners_listing_id_unique'
      and conrelid = 'public.business_owners'::regclass
  ) then
    alter table public.business_owners drop constraint business_owners_listing_id_unique;
  end if;
end $$;

alter table if exists public.business_owners
  add column if not exists name_title_visible boolean not null default true,
  add column if not exists email_visible boolean not null default true,
  add column if not exists phone_visible boolean not null default false,
  add column if not exists from_greece text;

create index if not exists idx_business_owners_listing_id on public.business_owners(listing_id);

-- 4) Analytics events: broaden action check to include newer UI actions.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'analytics_events_action_check'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events drop constraint analytics_events_action_check;
  end if;
end $$;

alter table if exists public.analytics_events
  add constraint analytics_events_action_check
  check (action = any (array[
    'view'::text,
    'call'::text,
    'website'::text,
    'directions'::text,
    'share'::text,
    'video_play'::text,
    'custom_cta'::text
  ]));

-- 5) Legacy analytics table is still used by current listing pages/admin.
create table if not exists public.listing_analytics (
  id bigserial primary key,
  listing_id integer not null references public.listings(id) on delete cascade,
  action text not null,
  platform text,
  "timestamp" timestamptz default now(),
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_listing_analytics_listing_id on public.listing_analytics(listing_id);
create index if not exists idx_listing_analytics_action on public.listing_analytics(action);
create index if not exists idx_listing_analytics_timestamp on public.listing_analytics("timestamp" desc);
