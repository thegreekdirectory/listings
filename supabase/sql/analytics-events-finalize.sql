-- Run this AFTER the observation/validation window completes.
-- Task 5: archive/remove legacy code paths and finalize schema.

begin;

create table if not exists listing_analytics_archive as
select * from listing_analytics where false;

insert into listing_analytics_archive
select la.*
from listing_analytics la
where not exists (
  select 1
  from listing_analytics_archive a
  where a.id = la.id
);

-- Keep a compatibility view for read-only historical queries.
drop view if exists listing_analytics_legacy_view;
create view listing_analytics_legacy_view as
select
    legacy_event_id as id,
    listing_id,
    action,
    platform,
    "timestamp",
    user_agent
from analytics_events
where legacy_event_id is not null;

-- Legacy table removed once archive and compatibility view are present.
drop table if exists listing_analytics;

commit;
