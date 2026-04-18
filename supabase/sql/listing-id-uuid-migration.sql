-- Migrate listing identifiers from integer/text IDs to UUIDs.
-- Safe to run once in Supabase SQL editor.

begin;

create extension if not exists pgcrypto;

-- 1) Add temporary UUID columns
alter table public.listings
  add column if not exists id_uuid uuid default gen_random_uuid();

alter table public.business_owners
  add column if not exists listing_id_uuid uuid;

alter table public.listing_analytics
  add column if not exists listing_id_uuid uuid;

alter table if exists public.listing_suggestions
  add column if not exists listing_id_uuid uuid;

-- 2) Build UUID mapping from old listing IDs
update public.listings
set id_uuid = coalesce(id_uuid, gen_random_uuid());

update public.business_owners bo
set listing_id_uuid = l.id_uuid
from public.listings l
where bo.listing_id_uuid is null
  and bo.listing_id::text = l.id::text;

update public.listing_analytics la
set listing_id_uuid = l.id_uuid
from public.listings l
where la.listing_id_uuid is null
  and la.listing_id::text = l.id::text;

do $$
begin
  if to_regclass('public.listing_suggestions') is not null then
    update public.listing_suggestions ls
    set listing_id_uuid = l.id_uuid
    from public.listings l
    where ls.listing_id_uuid is null
      and ls.listing_id::text = l.id::text;
  end if;
end$$;

-- 3) Replace PK/FK columns
alter table public.business_owners drop constraint if exists business_owners_listing_id_fkey;
alter table public.listing_analytics drop constraint if exists listing_analytics_listing_id_fkey;
do $$
begin
  if to_regclass('public.listing_suggestions') is not null then
    alter table public.listing_suggestions drop constraint if exists listing_suggestions_listing_id_fkey;
  end if;
end$$;

alter table public.listings drop constraint if exists listings_pkey;

alter table public.listings
  drop column if exists id,
  rename column id_uuid to id;

alter table public.listings
  alter column id set default gen_random_uuid(),
  alter column id set not null;

alter table public.listings add primary key (id);

alter table public.business_owners
  drop column if exists listing_id,
  rename column listing_id_uuid to listing_id;

alter table public.business_owners
  alter column listing_id set not null,
  add constraint business_owners_listing_id_fkey
    foreign key (listing_id) references public.listings(id)
    on delete cascade;

alter table public.listing_analytics
  drop column if exists listing_id,
  rename column listing_id_uuid to listing_id;

alter table public.listing_analytics
  alter column listing_id set not null,
  add constraint listing_analytics_listing_id_fkey
    foreign key (listing_id) references public.listings(id)
    on delete cascade;

do $$
begin
  if to_regclass('public.listing_suggestions') is not null then
    alter table public.listing_suggestions
      drop column if exists listing_id,
      rename column listing_id_uuid to listing_id;

    alter table public.listing_suggestions
      alter column listing_id set not null,
      add constraint listing_suggestions_listing_id_fkey
        foreign key (listing_id) references public.listings(id)
        on delete cascade;
  end if;
end$$;

-- 4) Helpful indexes
create index if not exists idx_business_owners_listing_id on public.business_owners(listing_id);
create index if not exists idx_listing_analytics_listing_id on public.listing_analytics(listing_id);
do $$
begin
  if to_regclass('public.listing_suggestions') is not null then
    create index if not exists idx_listing_suggestions_listing_id on public.listing_suggestions(listing_id);
  end if;
end$$;

commit;
