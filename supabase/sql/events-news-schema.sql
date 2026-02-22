-- Events + News schema, moderation workflow, and RLS for Supabase
-- Run as a privileged role in Supabase SQL editor.

create extension if not exists pgcrypto;

create type if not exists public.content_status as enum ('draft', 'published', 'flagged');

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  slug text not null unique,
  title text not null,
  description text,
  start_datetime timestamptz not null,
  end_datetime timestamptz,
  image_url text,
  listing_id uuid references public.listings(id) on delete set null,
  is_community_exempt boolean not null default false,
  status public.content_status not null default 'draft',
  venue_name text,
  venue_address text,
  venue_phone text,
  venue_email text,
  venue_website text,
  organizer_name text,
  organizer_phone text,
  organizer_email text,
  organizer_website text,
  source_calendar_url text,
  constraint events_end_after_start check (end_datetime is null or end_datetime >= start_datetime),
  constraint events_slug_format check (slug = lower(slug) and slug !~ '\\s')
);

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  slug text not null unique,
  title text not null,
  content text not null,
  excerpt text not null,
  image_url text,
  listing_id uuid references public.listings(id) on delete set null,
  is_community_exempt boolean not null default false,
  status public.content_status not null default 'draft',
  constraint news_slug_format check (slug = lower(slug) and slug !~ '\\s')
);

-- Future-proof many-to-many relation for events associated with many listings.
create table if not exists public.event_listings (
  event_id uuid not null references public.events(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, listing_id)
);

create table if not exists public.moderation_appeals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  content_type text not null check (content_type in ('event','news')),
  content_id uuid not null,
  listing_id uuid references public.listings(id) on delete set null,
  appeal_reason text,
  submitted_by uuid default auth.uid(),
  status text not null default 'open' check (status in ('open','reviewed','approved','rejected'))
);

create index if not exists idx_events_listing_id on public.events(listing_id);
create index if not exists idx_events_status_start on public.events(status, start_datetime);
create index if not exists idx_events_search on public.events using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(venue_name,'') || ' ' || coalesce(venue_address,'') || ' ' || coalesce(organizer_name,'')));

create index if not exists idx_news_listing_id on public.news_articles(listing_id);
create index if not exists idx_news_status_created on public.news_articles(status, created_at desc);
create index if not exists idx_news_search on public.news_articles using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')));

create table if not exists public.profanity_blacklist (
  word text primary key
);

insert into public.profanity_blacklist(word)
values ('badword1'), ('badword2')
on conflict do nothing;

create or replace function public.normalize_slug(input_text text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(trim(coalesce(input_text, ''))), '[^a-z0-9]+', '-', 'g')::text;
$$;

create or replace function public.generate_excerpt_from_html(html text)
returns text
language sql
immutable
as $$
  select left(trim(regexp_replace(coalesce(html,''), '<[^>]*>', '', 'g')), 150);
$$;

create or replace function public.contains_profanity(input_text text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profanity_blacklist b
    where (' ' || lower(coalesce(input_text,'')) || ' ') like ('% ' || lower(b.word) || ' %')
  );
$$;

create or replace function public.listing_can_publish(target_listing_id uuid, exempt_override boolean default false)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_tier text;
  listing_category text;
begin
  if exempt_override then
    return true;
  end if;

  if target_listing_id is null then
    return false;
  end if;

  select lower(coalesce(l.tier, l.plan_tier, '')), lower(coalesce(l.category, ''))
  into listing_tier, listing_category
  from public.listings l
  where l.id = target_listing_id;

  if listing_tier in ('premium', 'featured') then
    return true;
  end if;

  if listing_category in (
    'churches & parishes',
    'cultural & fraternal organizations',
    'city / community entities',
    'schools & education'
  ) then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.set_content_defaults()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'events' then
    if new.slug is null or new.slug = '' then
      new.slug := public.normalize_slug(new.title);
    end if;

    if public.contains_profanity(coalesce(new.title,'') || ' ' || coalesce(new.description,'')) then
      new.status := 'flagged';
    elsif new.status = 'published' and not public.listing_can_publish(new.listing_id, new.is_community_exempt) then
      raise exception 'Listing tier/category does not allow event publishing';
    end if;

  elsif tg_table_name = 'news_articles' then
    if new.slug is null or new.slug = '' then
      new.slug := public.normalize_slug(new.title);
    end if;

    new.excerpt := public.generate_excerpt_from_html(new.content);

    if public.contains_profanity(coalesce(new.title,'') || ' ' || coalesce(new.content,'')) then
      new.status := 'flagged';
    elsif new.status = 'published' and not public.listing_can_publish(new.listing_id, new.is_community_exempt) then
      raise exception 'Listing tier/category does not allow news publishing';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_events_defaults on public.events;
create trigger trg_events_defaults
before insert or update on public.events
for each row execute function public.set_content_defaults();

drop trigger if exists trg_news_defaults on public.news_articles;
create trigger trg_news_defaults
before insert or update on public.news_articles
for each row execute function public.set_content_defaults();

create or replace function public.can_manage_listing(target_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_owners bo
    where bo.listing_id = target_listing_id
      and (
        bo.owner_user_id = auth.uid()::text
        or bo.owner_email = coalesce(auth.jwt() ->> 'email', '')
      )
  );
$$;

alter table public.events enable row level security;
alter table public.news_articles enable row level security;
alter table public.event_listings enable row level security;
alter table public.moderation_appeals enable row level security;

-- Published content is publicly readable.
drop policy if exists "Public can read published events" on public.events;
create policy "Public can read published events"
on public.events for select
using (status = 'published' or auth.role() = 'service_role');

drop policy if exists "Owners can manage own events" on public.events;
create policy "Owners can manage own events"
on public.events for all
using (auth.role() = 'service_role' or public.can_manage_listing(listing_id))
with check (auth.role() = 'service_role' or public.can_manage_listing(listing_id));

drop policy if exists "Public can read published news" on public.news_articles;
create policy "Public can read published news"
on public.news_articles for select
using (status = 'published' or auth.role() = 'service_role');

drop policy if exists "Owners can manage own news" on public.news_articles;
create policy "Owners can manage own news"
on public.news_articles for all
using (auth.role() = 'service_role' or public.can_manage_listing(listing_id))
with check (auth.role() = 'service_role' or public.can_manage_listing(listing_id));

drop policy if exists "Owners can link event listings" on public.event_listings;
create policy "Owners can link event listings"
on public.event_listings for all
using (auth.role() = 'service_role' or public.can_manage_listing(listing_id))
with check (auth.role() = 'service_role' or public.can_manage_listing(listing_id));

drop policy if exists "Owners can submit moderation appeals" on public.moderation_appeals;
create policy "Owners can submit moderation appeals"
on public.moderation_appeals for insert
with check (auth.role() = 'service_role' or public.can_manage_listing(listing_id));

drop policy if exists "Owners can read moderation appeals" on public.moderation_appeals;
create policy "Owners can read moderation appeals"
on public.moderation_appeals for select
using (auth.role() = 'service_role' or public.can_manage_listing(listing_id));
