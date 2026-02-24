-- Private analytics schema upgrade for The Greek Directory
-- Run in Supabase SQL editor.

alter table if exists public.listing_analytics
    add column if not exists event_id uuid default gen_random_uuid(),
    add column if not exists session_id text,
    add column if not exists page_url text,
    add column if not exists page_path text,
    add column if not exists referrer text,
    add column if not exists referrer_host text,
    add column if not exists utm_id text,
    add column if not exists utm_source text,
    add column if not exists utm_medium text,
    add column if not exists utm_campaign text,
    add column if not exists utm_term text,
    add column if not exists utm_content text,
    add column if not exists utm_source_platform text,
    add column if not exists utm_creative_format text,
    add column if not exists utm_marketing_tactic text,
    add column if not exists gclid text,
    add column if not exists fbclid text,
    add column if not exists msclkid text,
    add column if not exists ttclid text,
    add column if not exists wbraid text,
    add column if not exists gbraid text,
    add column if not exists campaign_id text,
    add column if not exists adgroup_id text,
    add column if not exists keyword_id text,
    add column if not exists placement_id text,
    add column if not exists device_type text,
    add column if not exists browser text,
    add column if not exists os text,
    add column if not exists language text,
    add column if not exists metadata jsonb default '{}'::jsonb;

create index if not exists idx_listing_analytics_listing_timestamp
    on public.listing_analytics (listing_id, timestamp desc);

create index if not exists idx_listing_analytics_utm_source
    on public.listing_analytics (utm_source);

create index if not exists idx_listing_analytics_utm_campaign
    on public.listing_analytics (utm_campaign);

create index if not exists idx_listing_analytics_session_id
    on public.listing_analytics (session_id);

-- Optional rollup view for admin/business dashboards.
create or replace view public.listing_analytics_rollup as
select
    listing_id,
    date_trunc('day', timestamp::timestamptz) as day,
    count(*) as events,
    count(*) filter (where action = 'view') as views,
    count(*) filter (where action = 'call') as call_clicks,
    count(*) filter (where action = 'website') as website_clicks,
    count(*) filter (where action = 'directions') as direction_clicks,
    count(*) filter (where action = 'share') as share_clicks
from public.listing_analytics
group by listing_id, date_trunc('day', timestamp::timestamptz);
