Use the Supabase connector for project `luetekzqrrgdxtopzvqw` and apply a full remediation migration for security, RLS performance, and schema consistency. Do this in one transaction-safe migration set where possible, and validate each change after applying.

Scope:
1) Function hardening
- Recreate these functions with `SET search_path = public` (and keep existing behavior):
  - set_listing_requests_updated_at
  - analytics_is_admin
  - analytics_is_approved_path
  - track_analytics (both overloads)
  - generate_slug
  - track_analytics_event
  - update_analytics_summary
  - get_listing_analytics
  - search_listings
  - get_listings_by_category
  - get_listings_by_location
  - get_featured_listings
  - get_recent_listings
  - get_chain_locations
  - get_category_counts
  - get_location_counts
  - update_updated_at_column
- Ensure all table references in security-definer functions are schema-qualified (`public.`).

2) RLS performance fixes
- Update policies so any `auth.jwt()`, `auth.uid()`, `auth.role()` usage is wrapped in `SELECT`, e.g. `(SELECT auth.jwt())`, `(SELECT auth.uid())`.
- Apply this to all affected tables called out by advisor: listings, business_owners, analytics_events, analytics_summary, analytics, listing_analytics, listing_requests, category_subcategories, listing_metrics_events.

3) Remove overlapping permissive policy conflicts
- listing_analytics: keep a single public SELECT policy, a single public INSERT policy, and one admin ALL policy. Remove duplicates.
- analytics_events: remove the unrestricted insert policy (`Anyone can insert analytics events`), keep only the approved-path insert policy.
- analytics, listings, business_owners, category_subcategories: consolidate duplicate/overlapping policies so each action/role has one intended rule.

4) Fix always-true write policies
- analytics: replace `tgd_analytics_anon_increment` with a constrained update policy that only allows expected counter increments via approved RPC/function path (not arbitrary row updates).
- listing_analytics: keep public INSERT but constrain with approved path check (or equivalent guard) instead of unconditional true.
- listing_metrics_events: replace unrestricted insert with approved-path guard.
- listing_requests: keep public submit capability but constrain `WITH CHECK` so required fields are present and non-empty (`business_name`, `tagline`, `description`, `category`).
- shortlink_events: if anonymous insert must remain open, constrain fields to sane minimum validation (non-empty path and redirect_url, valid URL format if feasible).

5) Index and FK performance issues
- Add covering indexes for unindexed FKs:
  - analytics_sessions(listing_id)
  - analytics_listing_daily(listing_id)

6) Duplicate index cleanup
- On `listings`, drop one of the duplicate unique slug indexes (`listings_slug_key` vs `listings_slug_unique`) and keep exactly one unique slug constraint/index.

7) Data type consistency remediation plan and safe rollout
- analytics.listing_id int4 -> bigint
- listing_analytics.listing_id int4 -> bigint
- listing_metrics_events.listing_id text (no FK) -> align strategy

Implement with zero data loss:
- Add temporary bigint columns where needed.
- Backfill from existing values.
- Rebuild foreign keys and indexes.
- Swap columns.
- For listing_metrics_events, decide and implement one of:
  a) migrate to bigint + FK to listings(id), or
  b) keep text but add strict validation and a generated bigint shadow column with FK.
- Update dependent views/functions (including `listing_kpi_daily` and KPI RPCs) to remove cast-heavy joins when possible.

8) Extension schema hardening
- Move `pg_trgm` out of `public` into a dedicated extension schema (for example `extensions`) following Supabase-safe approach.
- Rebuild dependent objects if needed and verify `search_listings` still works.

9) Cleanup obviously unused indexes only when safe
- For every “unused index” reported, re-check actual usage stats first.
- Drop only indexes that are confirmed unnecessary for current query patterns.
- Keep a rollback statement list for each dropped index.

10) Auth setting
- Enable leaked password protection (HaveIBeenPwned integration) in project auth settings.

Validation required (return results):
- List all modified policies by table with final definitions.
- List all functions recreated with search_path set.
- Show final indexes for: listings, analytics_sessions, analytics_listing_daily, analytics_events, listing_analytics, listing_metrics_events.
- Confirm no duplicate slug unique index remains.
- Confirm no policy with unconditional `USING true`/`WITH CHECK true` remains for UPDATE/INSERT except explicitly approved public ingest cases that include validation guards.
- Confirm KPI RPCs and `search_listings` execute successfully after migration.
- Provide a short rollback plan per migration step.
