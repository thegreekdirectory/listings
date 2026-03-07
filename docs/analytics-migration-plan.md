# Analytics Migration Plan (Current Touchpoints)

## Current analytics touchpoints

1. **`listing-template.html` (`listing_analytics` inserts)**
   - `trackAnalytics(action, platform)` inserts event rows into Supabase table `listing_analytics` with `listing_id`, `action`, `platform`, `timestamp`, and `user_agent`.
   - Current actions emitted from the listing page include:
     - `view` on window load.
     - `call` from `tel:` links.
     - `directions` from maps links.
     - `website` from detected website-domain links.
     - `custom_cta` from `[data-cta-name]` elements.

2. **`js/admin.js` (reads `listing_analytics`, seeds `analytics`)**
   - Admin analytics modal (`viewAnalytics`) reads `listing_analytics` events per listing and aggregates counts (`views`, `call_clicks`, `website_clicks`, `direction_clicks`, `share_clicks`, `video_plays`) for display.
   - Admin flows also seed legacy summary rows in table `analytics` when generating/importing listings (insert default zeroed counters if missing).

3. **`js/business-dashboard.js` (reads `currentListing.analytics`)**
   - Dashboard analytics UI reads `currentListing.analytics` and falls back to a default zeroed object.
   - Tier-specific rendering depends on these fields:
     - `FREE`: `views` + combined engagement.
     - `VERIFIED`: `views`, `call_clicks`, `website_clicks`, `direction_clicks`, `share_clicks`.
     - `FEATURED` / `PREMIUM`: above plus `video_plays`.

4. **`js/listings.js` / `map.html` interaction points not yet tracked**
   - Listing discovery surfaces expose major user interactions (open listing detail links, `tel:` calls, directions links, filter/map controls, split-view interactions), but there is no equivalent `listing_analytics` event instrumentation in these files today.
   - These are candidates for v2 event capture so discovery/map engagement can be measured alongside listing-page events.

## Must-not-break compatibility outputs

- **Admin compatibility:** Existing admin analytics modal must continue to load and display aggregated event totals.
- **Business dashboard compatibility:** Existing business dashboard analytics tab must continue rendering the current tier-specific analytics cards.

## Migration flag

- **Flag name:** `ANALYTICS_V2_ENABLED`
- **Frontend read points (planned):**
  - `listing-template.html` analytics emitter path (`trackAnalytics` / click bindings).
  - `js/admin.js` analytics read path (`viewAnalytics` and related aggregation source selection).
  - `js/business-dashboard.js` analytics source adapter before `renderAnalytics` tier-card rendering.
  - Optional future read in `js/listings.js` and `map.html` once discovery/map tracking is added.
