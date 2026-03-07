-- Pre-aggregated analytics + owner-safe RPC endpoints for listing KPI reporting.

create extension if not exists pgcrypto;

create table if not exists public.listing_metrics_events (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null,
  event_name text not null,
  event_ts timestamptz not null default now(),
  session_id text,
  user_id text,
  tier text,
  attribution_source text,
  attribution_medium text,
  attribution_campaign text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists listing_metrics_events_listing_ts_idx
  on public.listing_metrics_events (listing_id, event_ts desc);

create index if not exists listing_metrics_events_event_name_idx
  on public.listing_metrics_events (event_name);

create index if not exists listing_metrics_events_attribution_idx
  on public.listing_metrics_events (attribution_source, attribution_medium, attribution_campaign);

alter table public.listing_metrics_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'listing_metrics_events' and policyname = 'Allow public event writes'
  ) then
    create policy "Allow public event writes"
      on public.listing_metrics_events
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'listing_metrics_events' and policyname = 'Business owners read own listing events'
  ) then
    create policy "Business owners read own listing events"
      on public.listing_metrics_events
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.business_owners bo
          where bo.listing_id::text = listing_metrics_events.listing_id
            and (
              bo.owner_user_id = auth.uid()::text
              or lower(coalesce(bo.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
            )
        )
      );
  end if;
end
$$;

create or replace function public.current_owner_listing_ids()
returns table (listing_id text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct bo.listing_id::text as listing_id
  from public.business_owners bo
  where (
    bo.owner_user_id = auth.uid()::text
    or lower(coalesce(bo.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.current_owner_listing_ids() from public;
grant execute on function public.current_owner_listing_ids() to authenticated;

create or replace view public.listing_kpi_daily
with (security_invoker = true)
as
with normalized as (
  select
    e.listing_id,
    date_trunc('day', e.event_ts)::date as event_date,
    coalesce(nullif(e.tier, ''), l.tier, 'FREE') as tier,
    coalesce(nullif(e.attribution_source, ''), '(direct)') as attribution_source,
    coalesce(nullif(e.attribution_medium, ''), '(none)') as attribution_medium,
    coalesce(nullif(e.attribution_campaign, ''), '(none)') as attribution_campaign,
    e.event_name,
    e.session_id,
    e.user_id,
    coalesce(nullif(e.properties ->> 'button_name', ''), '(unspecified)') as button_name
  from public.listing_metrics_events e
  left join public.listings l on l.id::text = e.listing_id
)
select
  n.listing_id,
  n.event_date,
  n.tier,
  n.attribution_source,
  n.attribution_medium,
  n.attribution_campaign,
  count(*) as total_events,
  count(*) filter (where n.event_name = 'map_opened') as map_opened,
  count(distinct n.session_id) filter (where n.event_name = 'map_opened' and n.session_id is not null) as map_opened_sessions,
  count(distinct n.user_id) filter (where n.event_name = 'map_opened' and n.user_id is not null) as map_opened_users,
  count(*) filter (where n.event_name in ('side_map_opened', 'side_map_open')) as side_map_opened,
  count(*) filter (where n.event_name in ('listing_pin_opened', 'listing_pin_open')) as listing_pin_opened,
  count(*) filter (where n.event_name in ('listing_pin_clickthrough', 'listing_pin_click')) as listing_pin_clickthrough,
  count(*) filter (where n.event_name = 'listing_starred') as stars_added,
  count(*) filter (where n.event_name = 'listing_unstarred') as stars_removed,
  count(*) filter (where n.event_name like 'button_click:%') as listing_button_clicks,
  jsonb_object_agg(n.button_name, n.button_clicks) filter (where n.button_clicks > 0) as button_click_breakdown
from (
  select
    normalized.*,
    count(*) filter (where normalized.event_name like 'button_click:%') over (
      partition by normalized.listing_id, normalized.event_date, normalized.tier,
      normalized.attribution_source, normalized.attribution_medium, normalized.attribution_campaign,
      normalized.button_name
    ) as button_clicks
  from normalized
) n
group by
  n.listing_id,
  n.event_date,
  n.tier,
  n.attribution_source,
  n.attribution_medium,
  n.attribution_campaign;

create or replace function public.rpc_listing_kpi_rollup(
  p_listing_id text default null,
  p_start_date date default null,
  p_end_date date default null,
  p_tier text default null,
  p_source text default null,
  p_medium text default null,
  p_campaign text default null
)
returns table (
  listing_id text,
  start_date date,
  end_date date,
  tier text,
  attribution_source text,
  attribution_medium text,
  attribution_campaign text,
  map_opened bigint,
  map_opened_sessions bigint,
  map_opened_users bigint,
  side_map_opened bigint,
  listing_pin_opened bigint,
  listing_pin_clickthrough bigint,
  listing_button_clicks bigint,
  stars_added bigint,
  stars_removed bigint,
  star_net bigint,
  button_click_breakdown jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with owner_listings as (
    select listing_id from public.current_owner_listing_ids()
  ), filtered as (
    select d.*
    from public.listing_kpi_daily d
    join owner_listings o using (listing_id)
    where (p_listing_id is null or d.listing_id = p_listing_id)
      and (p_start_date is null or d.event_date >= p_start_date)
      and (p_end_date is null or d.event_date <= p_end_date)
      and (p_tier is null or d.tier = p_tier)
      and (p_source is null or d.attribution_source = p_source)
      and (p_medium is null or d.attribution_medium = p_medium)
      and (p_campaign is null or d.attribution_campaign = p_campaign)
  )
  select
    f.listing_id,
    min(f.event_date) as start_date,
    max(f.event_date) as end_date,
    f.tier,
    f.attribution_source,
    f.attribution_medium,
    f.attribution_campaign,
    sum(f.map_opened)::bigint as map_opened,
    sum(f.map_opened_sessions)::bigint as map_opened_sessions,
    sum(f.map_opened_users)::bigint as map_opened_users,
    sum(f.side_map_opened)::bigint as side_map_opened,
    sum(f.listing_pin_opened)::bigint as listing_pin_opened,
    sum(f.listing_pin_clickthrough)::bigint as listing_pin_clickthrough,
    sum(f.listing_button_clicks)::bigint as listing_button_clicks,
    sum(f.stars_added)::bigint as stars_added,
    sum(f.stars_removed)::bigint as stars_removed,
    (sum(f.stars_added) - sum(f.stars_removed))::bigint as star_net,
    coalesce(
      (
        select jsonb_object_agg(button_key, button_total)
        from (
          select
            kv.key as button_key,
            sum((kv.value)::bigint) as button_total
          from filtered f2,
          lateral jsonb_each(coalesce(f2.button_click_breakdown, '{}'::jsonb)) kv
          where f2.listing_id = f.listing_id
            and f2.tier = f.tier
            and f2.attribution_source = f.attribution_source
            and f2.attribution_medium = f.attribution_medium
            and f2.attribution_campaign = f.attribution_campaign
          group by kv.key
        ) button_rollup
      ),
      '{}'::jsonb
    ) as button_click_breakdown
  from filtered f
  group by f.listing_id, f.tier, f.attribution_source, f.attribution_medium, f.attribution_campaign
  order by f.listing_id, f.tier, f.attribution_source, f.attribution_medium, f.attribution_campaign;
$$;

revoke all on function public.rpc_listing_kpi_rollup(text, date, date, text, text, text, text) from public;
grant execute on function public.rpc_listing_kpi_rollup(text, date, date, text, text, text, text) to authenticated;

create or replace function public.rpc_listing_attribution_campaigns(
  p_listing_id text default null,
  p_start_date date default null,
  p_end_date date default null,
  p_source text default null,
  p_medium text default null,
  p_other_threshold bigint default 10
)
returns table (
  listing_id text,
  attribution_source text,
  attribution_medium text,
  campaign_bucket text,
  attribution_campaign text,
  events bigint,
  is_other boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with owner_listings as (
    select listing_id from public.current_owner_listing_ids()
  ), filtered as (
    select d.*
    from public.listing_kpi_daily d
    join owner_listings o using (listing_id)
    where (p_listing_id is null or d.listing_id = p_listing_id)
      and (p_start_date is null or d.event_date >= p_start_date)
      and (p_end_date is null or d.event_date <= p_end_date)
      and (p_source is null or d.attribution_source = p_source)
      and (p_medium is null or d.attribution_medium = p_medium)
  ), campaign_totals as (
    select
      listing_id,
      attribution_source,
      attribution_medium,
      attribution_campaign,
      sum(total_events)::bigint as events
    from filtered
    group by listing_id, attribution_source, attribution_medium, attribution_campaign
  )
  select
    c.listing_id,
    c.attribution_source,
    c.attribution_medium,
    case when c.events < p_other_threshold then 'other' else c.attribution_campaign end as campaign_bucket,
    c.attribution_campaign,
    c.events,
    (c.events < p_other_threshold) as is_other
  from campaign_totals c
  order by c.listing_id, c.attribution_source, c.attribution_medium, c.events desc;
$$;

revoke all on function public.rpc_listing_attribution_campaigns(text, date, date, text, text, bigint) from public;
grant execute on function public.rpc_listing_attribution_campaigns(text, date, date, text, text, bigint) to authenticated;

create or replace function public.rpc_listing_attribution_other_drilldown(
  p_listing_id text,
  p_start_date date default null,
  p_end_date date default null,
  p_source text default null,
  p_medium text default null,
  p_other_threshold bigint default 10
)
returns table (
  listing_id text,
  attribution_source text,
  attribution_medium text,
  attribution_campaign text,
  events bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with owner_listings as (
    select listing_id from public.current_owner_listing_ids()
  ), filtered as (
    select d.*
    from public.listing_kpi_daily d
    join owner_listings o using (listing_id)
    where d.listing_id = p_listing_id
      and (p_start_date is null or d.event_date >= p_start_date)
      and (p_end_date is null or d.event_date <= p_end_date)
      and (p_source is null or d.attribution_source = p_source)
      and (p_medium is null or d.attribution_medium = p_medium)
  ), campaign_totals as (
    select
      listing_id,
      attribution_source,
      attribution_medium,
      attribution_campaign,
      sum(total_events)::bigint as events
    from filtered
    group by listing_id, attribution_source, attribution_medium, attribution_campaign
  )
  select
    c.listing_id,
    c.attribution_source,
    c.attribution_medium,
    c.attribution_campaign,
    c.events
  from campaign_totals c
  where c.events < p_other_threshold
  order by c.events desc;
$$;

revoke all on function public.rpc_listing_attribution_other_drilldown(text, date, date, text, text, bigint) from public;
grant execute on function public.rpc_listing_attribution_other_drilldown(text, date, date, text, text, bigint) to authenticated;
