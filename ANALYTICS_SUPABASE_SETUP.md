# Private Analytics (Supabase) Setup

This repo now uses a private analytics engine (no Google Analytics dependency) that writes first-party events into `listing_analytics`.

## 1) Run SQL in Supabase

Run:

- `supabase/sql/analytics-overhaul.sql`

This keeps your existing `listing_analytics` table and extends it with:

- Full UTM support (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, and extended UTM fields)
- Ad click IDs (`gclid`, `fbclid`, `msclkid`, `ttclid`, `wbraid`, `gbraid`)
- Session, page, referrer, and device metadata
- `metadata` JSONB for future custom dimensions
- Helpful indexes and a `listing_analytics_rollup` view

## 2) What is tracked

On listing pages, analytics captures:

- `view`
- `call`
- `website`
- `directions`
- `share`
- `custom_cta`
- plus existing event types already emitted by the site

Attribution recorded on every event:

- All URL params with `utm_*` prefix (stored in `metadata.utm_full`)
- Standard UTM columns
- Referrer and referrer host
- Device type, browser, OS, language

## 3) Where analytics is shown

- **Admin Portal** (`admin.html` / `js/admin.js`): full cross-source and UTM breakdown + event log.
- **Business Portal** (`business.html` / `js/business-dashboard.js`): tier-aware analytics views.

## 4) Notes

- Existing inline `trackClick(...)` calls still work and now route through the new engine.
- New listing pages generated from `listing-template.html` use the new tracker.
