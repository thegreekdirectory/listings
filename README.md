# The Greek Directory

America's premier online directory of Greek-owned businesses.

The Greek Directory is a static-first business directory and installable web app for the Greek-American community. Visitors can discover businesses by category, location, hours, tier, map position, and saved favorites. Business owners can claim and manage their listings through the Business Portal. Admins manage listing data, listing requests, static listing-page generation, shortlinks, analytics, and category metadata.

This README reflects the current codebase and the live Supabase project as of 2026-05-16. The Business Portal is being actively rebuilt, so treat the Business Portal notes below as current implementation context plus active-work guidance.

## Live URLs

| Surface | URL |
| --- | --- |
| Main site | `https://thegreekdirectory.org` |
| Listings directory | `https://thegreekdirectory.org/listings` |
| Individual listing pages | `https://thegreekdirectory.org/listing/[slug]` |
| Business Portal | `https://thegreekdirectory.org/business` |
| Admin Portal | `https://thegreekdirectory.org/admin?mpesmesa=thelonampo[DD]` |
| Suggest an edit | `https://thegreekdirectory.org/suggest-edit?id=[listing_id]` |
| PWA install page | `https://app.thegreekdirectory.org` |
| Static assets | `https://static.thegreekdirectory.org` |
| Cloudflare Images CDN | `https://images.thegreekdirectory.org` |
| Cloudflare Images upload proxy | `https://tgd-images-upload.thegreekdirectory.org` |

## Technology Stack

| Layer | Current implementation |
| --- | --- |
| Frontend | Static HTML, CSS, and vanilla JavaScript |
| Styling | Plain CSS plus committed Tailwind output in `src/output.css` |
| Database | Supabase Postgres project `luetekzqrrgdxtopzvqw` |
| Auth | Supabase Auth for Business Portal users |
| Edge functions | Supabase Edge Functions for admin proxying, GitHub writes, and server time |
| Hosting | Cloudflare Pages |
| Media | Cloudflare Images through upload proxy and `images.thegreekdirectory.org` delivery |
| Maps | Leaflet, Leaflet MarkerCluster, OpenStreetMap tiles, Nominatim geocoding |
| Search/filtering | Client-side filtering over Supabase listing rows |
| PWA | Web app manifests, service workers, IndexedDB, standalone-mode UI |
| Translation | GTranslate widget plus offline translation helpers |
| Analytics | Supabase event and aggregate tables, plus Cloudflare Web Analytics where included |
| Static listing pages | Generated HTML committed to this repository and served by Cloudflare Pages |

## Architecture

```text
Browser
  |
  v
Cloudflare Pages
  |-- Static site files from this repository
  |-- Generated /listing/[slug].html pages
  |-- PWA service workers and manifests
  |
  |-- Supabase anon client
  |     |-- public listings and category data
  |     |-- Business Portal auth and owner-scoped updates
  |     |-- listing suggestions and analytics inserts
  |
  |-- Supabase Edge Functions
  |     |-- admin-proxy for admin-only service-role operations
  |     |-- listing-server-time for authoritative UTC time
  |     |-- update-github-file for GitHub Contents API writes
  |
  |-- Cloudflare Images upload proxy
  |     |-- logo, photo, and video/media uploads
  |
  `-- GitHub Contents API
        `-- generated listing pages, sitemaps, and repository files
```

The app is still static-first. Public directory pages are static assets that fetch live data from Supabase. Individual listing pages are generated static HTML files, which keeps listing pages fast, indexable, and independent of a server-rendering runtime.

## Repository Structure

```text
/
|-- index.html                         Homepage
|-- listings.html                      Full listings directory
|-- listing-template.html              Template for generated listing pages
|-- listing/                           Generated listing pages by place/slug
|-- business.html                      Business Portal shell
|-- admin.html                         Admin Portal shell
|-- submit-listing.html                Public listing submission form
|-- suggest-edit.html                  Public listing edit suggestion form
|-- map.html                           Standalone map view
|-- categories.html                    Category browser
|-- starred.html                       Saved/starred listings page
|-- settings.html                      PWA settings page
|-- app.html                           PWA install guide
|-- offline.html                       Offline fallback
|-- reserved.html                      Placeholder for reserved routes
|-- 404.html                           Error page
|-- _redirects                         Cloudflare Pages redirects
|-- manifest.json                      Main PWA manifest
|-- business-manifest.json             Business Portal PWA manifest
|-- service-worker.js                  Main site service worker
|-- business-sw.js                     Business Portal service worker
|-- css/                               Page and feature styles
|-- js/                                Frontend modules
|-- js/pwa/                            PWA storage, dock, settings, directions
|-- partials/                          Header and footer partials
|-- scripts/build-tailwind-output.js   Tailwind output builder
|-- src/input.css                      Tailwind source
|-- src/output.css                     Committed Tailwind output
|-- supabase/edge-functions/           Reference copies of Edge Functions
|-- .github/workflows/                 Legacy repository-dispatch workflows
|-- sitemap*.xml                       Sitemap files
|-- greek-directory.kml                KML export
|-- CATEGORY_IMAGES.md                 Default category image references
|-- package.json                       Tailwind build scripts and dependencies
```

## Main Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `index.html` | Homepage with discovery entry points |
| `/listings` | `listings.html` | Searchable, filterable listings directory |
| `/listing/[slug]` | `listing/[...].html` | Generated static listing page |
| `/business` | `business.html` | Business Portal |
| `/admin` | `admin.html` | Admin Portal with daily URL gate and GitHub token login |
| `/submit-listing` | `submit-listing.html` | Public new-listing request form |
| `/suggest-edit?id=[listing_id]` | `suggest-edit.html` | Public edit suggestion workflow |
| `/map` | `map.html` | Map-first directory view |
| `/categories` | `categories.html` | Category and subcategory browsing |
| `/starred` | `starred.html` | Saved listings |
| `/settings` | `settings.html` | PWA settings |
| `/offline` | `offline.html` | Offline fallback |

Cloudflare Pages redirects are maintained in `_redirects`. They strip common file extensions, map `/search` to `/listings`, expose hash-route aliases for listings, and reserve future route families such as `/claim`, `/places`, `/events`, `/news`, `/blog`, `/posts`, and `/resources`.

## Supabase Project

| Item | Value |
| --- | --- |
| Project ID/ref | `luetekzqrrgdxtopzvqw` |
| Project name | `thegreekdirectory's Project` |
| Region | `us-west-2` |
| Postgres | 17.x |
| Public URL | `https://luetekzqrrgdxtopzvqw.supabase.co` |

The public frontend uses the Supabase anon key. RLS is enabled on the application tables and policies decide what anonymous users, authenticated business owners, and admin/service-role paths may read or write.

## Current Public Schema

The live public schema currently includes these application tables and views:

| Object | Kind | Purpose | Current use |
| --- | --- | --- | --- |
| `listings` | table | Canonical business listing records | Main site, generated pages, Admin Portal, Business Portal |
| `business_owners` | table | Owner records linked to listings | Business Portal claim/auth/profile logic |
| `category_subcategories` | table | Dynamic subcategory lists and Schema.org maps | Admin, Business Portal, suggestion form, filters |
| `listing_requests` | table | Public new-listing submissions | Submit form and admin review |
| `listing_suggestions` | table | Public edit suggestions for existing listings | `/suggest-edit` |
| `listing_analytics` | table | Legacy/current listing event rows and counters | Listing pages and Business Portal analytics |
| `shortlinks` | table | Shortlink definitions and redirects | Admin Portal shortlink management |
| `shortlink_events` | table | Shortlink click/event log | Shortlink analytics |
| `shortlink_event_summary` | view | Shortlink event summary | Analytics/reporting |

Current row estimates from the live project include about 52 listings, 52 business owner rows, 14 category rows, 4,500+ `listing_analytics` rows, 429 shortlinks, and 100+ shortlink events.

## Key Table Notes

### `listings`

`listings` is the canonical record for each business. Important fields include:

- Identity and routing: `id`, `slug`, `business_name`
- Classification: `category`, `subcategories`, `primary_subcategory`, `tier`, `verified`, `visible`
- Chain and status metadata: `is_chain`, `chain_name`, `chain_id`, `coming_soon`, `temporarily_closed`, `permanently_closed`
- Location: `address`, `city`, `state`, `zip_code`, `country`, `coordinates`, `places_url_ending`, `timezone`
- Contact and media: `phone`, `email`, `website`, `logo`, `photos`, `video`
- Business details: `tagline`, `description`, `meta_description`, `pricing`, `hours`, `hours_label_custom`, `hours_disclaimer_custom`
- Structured metadata: `social_media`, `reviews`, `additional_info`, `custom_ctas`, `custom_schema_properties`
- Claiming and timestamps: `is_claimed`, `created_at`, `updated_at`

### `business_owners`

`business_owners` links Supabase Auth users to listings. Important fields include:

- `listing_id` foreign key to `listings.id`
- `owner_email`, `owner_phone`, `full_name`, `title`, `from_greece`
- `owner_user_id`, which is used by current RLS and owner matching
- `confirmation_key`, which is used during claim/signup and cleared after claim
- Visibility flags: `name_title_visible`, `email_visible`, `phone_visible`, plus older `owner_email_visible`
- Claim protection fields: `claim_attempts`, `claim_locked_until`

### `listing_requests` and `listing_suggestions`

`listing_requests` stores new business submissions from `/submit-listing`.

`listing_suggestions` stores proposed edits from `/suggest-edit?id=[listing_id]`. Suggestions include the suggester contact fields, listing metadata, owner visibility fields, media URLs, hours, social links, review links, and a `status` value that defaults to `pending`.

### Analytics Tables

The analytics model in the database is:

- `listing_analytics` for insert-only raw event logs.
- `listing_analytics_summary` for pre-aggregated listing metrics by time bucket.

The Business Portal currently reads `listing_analytics` directly for owner-facing analytics cards and recent activity.

### Shortlinks

`shortlinks` stores paths, target URLs, and optional `listing_refer_id` links back to listings. Admin code supports generated system shortlinks under `/l/[code]` and custom shortlinks. `shortlink_events` records click/event metadata, and `shortlink_event_summary` rolls events up by path.

## RLS and Access Model

The live project uses RLS policies rather than hiding the anon key.

Current behavior at a high level:

- Public users can read visible listings.
- Public users can read dynamic category/subcategory metadata.
- Public users can insert listing requests and edit suggestions, with validation checks on required fields.
- Public listing pages can insert allowed analytics events.
- Business owners can read and update their own listing and owner data through policies tied to `owner_user_id` and/or owner email.
- Admin operations are routed through the `admin-proxy` Edge Function, which uses the service role key server-side after validating a GitHub token.
- Analytics rows have a mix of public, owner-scoped, admin-scoped, and approved-path policies depending on the table.

Important implementation detail: several policies rely on helper functions such as `analytics_is_admin()`, `analytics_is_approved_path()`, and `analytics_is_listing_owner(listing_id)`.

## Active Supabase Edge Functions

The live Supabase project currently has these active Edge Functions:

| Function | JWT required | Purpose |
| --- | --- | --- |
| `admin-proxy` | No | Validates a GitHub PAT from `x-github-token`, then performs admin/service-role operations against Supabase. |
| `listing-server-time` | Yes | Returns authoritative UTC time for listing-hours calculations. |
| `update-github-file` | Yes | Updates a GitHub file through the GitHub Contents API using a server-side token. |

### `admin-proxy`

The Admin Portal calls `admin-proxy` for operations such as:

- Listing CRUD: `listings:list`, `listings:insert`, `listings:update`, `listings:delete`
- Owner management: `owners:list`, `owners:upsert`, `owners:delete`
- Listing requests: `requests:list`, `requests:update`, `requests:delete`
- Analytics access: `analytics:get`, `analytics:list` (both sourced from `listing_analytics_summary`).
- Dynamic subcategories: `subcategories:list`, `subcategories:insert`, `subcategories:update`, `subcategories:delete`
- Read-only admin SQL through `sql:select`
- Shortlinks: `shortlinks:get`, `shortlinks:check`, `shortlinks:insert`, `shortlinks:delete`

The function is intentionally not protected by Supabase JWT verification because it does its own GitHub token validation. It should only expose admin actions after validating that token.

### `listing-server-time`

`js/listings.js` calls this function to get `nowUtc` and evaluate open/closed/opening-soon/closing-soon filters against listing time zones. The function disables caching and includes CORS headers.

### `update-github-file`

This function updates files in GitHub using a `GITHUB_TOKEN` environment variable. It fetches the current file SHA and writes replacement content through the GitHub Contents API.

## Admin Portal

Files:

- `admin.html`
- `js/admin.js`
- `css/admin.css`
- `js/rich-text-editor.js`

The Admin Portal is protected by a URL day-key check and then by a GitHub Personal Access Token entered by the admin. The token is stored in `localStorage.tgd_admin_token` and sent to `admin-proxy` as `x-github-token` for validation.

Current responsibilities include:

- Listing CRUD
- Owner record management
- New listing request review
- Dynamic subcategory management
- Category-to-Schema.org metadata management
- Shortlink creation and conflict checking
- CSV upload/import
- Geocoding with Nominatim
- Static listing-page generation from `listing-template.html`
- Sitemap updates
- Cloudflare Images uploads through the upload proxy
- Analytics review

The Admin Portal reads analytics from Supabase summary rows (`listing_analytics_summary`) and raw events from `listing_analytics` only when needed.

## Business Portal

Files:

- `business.html`
- `js/business-auth.js`
- `js/business-dashboard.js`
- `js/supabase-config.js`
- `css/business.css`
- `business-manifest.json`
- `business-sw.js`

The Business Portal is far along in a rebuild. The current version is a Supabase Auth-backed owner dashboard with four main tabs:

| Tab | Purpose |
| --- | --- |
| Overview | Preview the listing, show tier features, quick actions, and quick analytics. |
| Edit Listing | Let an owner update allowed listing details, media, hours, links, and CTAs. |
| Analytics | Show tier-gated analytics cards and, for paid tiers, recent activity. |
| Settings | Manage owner contact details, visibility, and password changes. |

### Business Portal Auth Flow

1. A visitor searches for their business during signup.
2. The portal loads visible listings and owner records from Supabase.
3. If the listing is claimable, the owner enters the confirmation key.
4. `signUpBusinessOwner()` creates a Supabase Auth account with metadata including `listing_id`, `role: business_owner`, and `owner_user_id`.
5. The matching `business_owners` row is updated with `owner_user_id`, owner contact data, and a cleared `confirmation_key`.
6. On sign-in, `getBusinessOwnerData()` loads owner rows by email and the dashboard loads the linked listing.

### Business Portal Editing

The current owner edit surface includes:

- Tagline and rich-text description
- Subcategories and primary subcategory
- Pricing and coming-soon status
- Address, city, state, ZIP, and phone/email/website
- Hours with closed and 24-hour support
- Social links and review links
- Additional information rows
- Tier-limited custom CTA buttons
- Logo, photos, and video uploads through Cloudflare Images
- Owner contact fields and visibility flags

After saving, the portal updates Supabase and attempts to call a Supabase Edge Function path to regenerate the live static page. If that function is unavailable, the code treats regeneration as non-fatal and expects the page to be regenerated by a later admin save.

### Business Portal Tier Rules

The Business Portal currently treats listing tiers as:

| Tier | Label | Portal behavior |
| --- | --- | --- |
| `FREE` | Standard Profile | Basic listing, one photo, contact info, hours, social/review links, basic analytics. |
| `FEATURED` | Featured Profile | More photos, featured placement, custom CTA, enhanced analytics. |
| `PREMIUM` | Premium Profile | Largest media allowance, video, two CTAs, and more complete analytics. |

The public tier details live in `tiers.html`.

## Public Listing Suggestions

`suggest-edit.html` and `js/suggest-edit.js` implement the public edit suggestion flow. A generated listing page links to `/suggest-edit?id={listing.id}`. The form fetches the current listing, pre-fills editable fields, validates required values, and inserts a pending row into `listing_suggestions`.

This path is separate from the Business Portal. It allows community corrections without owner authentication.

## Listings Directory

Files:

- `listings.html`
- `js/listings.js`
- `css/listings.css`

The listings page loads `listings` rows from Supabase and filters client-side. Current behavior includes:

- Category and dynamic subcategory filters
- Any/all subcategory filter mode
- Country, state, city, ZIP, location, and radius filters
- Open now, closed now, opening soon, closing soon, hours unknown, online only, coming soon, and pricing filters
- Tier-aware/default sorting, A-Z sorting, closest-to-me sorting, and random sorting
- Leaflet map and split-map modes
- Marker clustering
- User location and estimated-location support via browser geolocation and `ipapi.co`
- Saved/starred listings through cookies and PWA IndexedDB sync
- Authoritative server time from `listing-server-time`

## Static Listing Pages

`listing-template.html` is the template used by admin-side generation. Generated pages are committed under `listing/` and served by Cloudflare Pages.

Generated pages include:

- SEO metadata and canonical listing URL
- Schema.org JSON-LD with category/subcategory-derived types
- Logo, photos, carousel, video, contact buttons, custom CTAs, owner sections, and reviews/social links
- Open/closed status using stored hours and timezone
- Embedded map when coordinates are available
- Analytics tracking calls
- A suggest-edit link that points to `/suggest-edit?id={listing.id}`

## PWA

The main site and Business Portal both have PWA support.

Main PWA pieces:

- `manifest.json`
- `service-worker.js`
- `js/pwa/app.js`
- `js/pwa/dock.js`
- `js/pwa/settings.js`
- `js/pwa/storage.js`
- `js/pwa/starred.js`
- `js/pwa/directions.js`
- `js/pwa/offline-translation.js`
- `css/pwa.css`

Business Portal PWA pieces:

- `business-manifest.json`
- `business-sw.js`

The main PWA supports standalone-mode navigation, saved listings, offline fallback behavior, app settings, language/theme preferences, map-app preferences, and image caching for saved listings.

## Media and Cloudflare Images

The admin and Business Portal upload flows use Cloudflare Images. Uploads go through:

```text
https://tgd-images-upload.thegreekdirectory.org
```

Returned image delivery URLs are normalized to:

```text
https://images.thegreekdirectory.org
```

The Business Portal stores local Cloudflare/upload configuration in `localStorage.tgdCloudflareImagesConfig`. Admin and owner media writes ultimately store URLs in `listings.logo`, `listings.photos`, and `listings.video`.

## Maps and Geocoding

The app uses Leaflet and OpenStreetMap tiles. Geocoding uses the Nominatim search API.

Map-related behavior appears in:

- `listings.html` and `js/listings.js` for directory maps and split view
- `map.html` for standalone map mode
- `suggest-edit.html` and `js/suggest-edit.js` for address suggestion and pin placement
- Generated listing pages for listing detail maps
- `js/pwa/directions.js` for Apple Maps, Google Maps, and Waze directions URLs

Coordinates are stored in `listings.coordinates` as JSON.

## Search and Discovery

Search is implemented client-side across listing data. The directory supports search by business name, tagline, description, and location fields. Homepage search and directory search are separate frontend surfaces but use the same Supabase-backed listing source.

Discovery data is organized around 14 main categories:

- Automotive & Transportation
- Beauty & Health
- Church & Religious Organization
- Cultural/Fraternal Organization
- Education & Community
- Entertainment, Arts & Recreation
- Food & Hospitality
- Grocery & Imports
- Home & Construction
- Industrial & Manufacturing
- Pets & Veterinary
- Professional & Business Services
- Real Estate & Development
- Retail & Shopping

Subcategories can be loaded dynamically from `category_subcategories` and override hardcoded fallback maps in the frontend.

## Environment and Configuration

Public frontend configuration is hardcoded in JavaScript because the Supabase anon key is intended to be public:

```js
const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = '[public anon JWT]';
```

Private credentials must remain server-side or local-only:

- Supabase service role key: only in Supabase Edge Function environment variables.
- GitHub token for admin operations: entered by admin and stored in browser `localStorage`.
- GitHub token for `update-github-file`: Supabase Edge Function environment variable.
- Cloudflare Images API credentials: upload proxy/server-side where possible, or local browser config for admin/owner upload flows.

## Build and Local Development

The repository is static. There is no app server or bundler required for production deployment.

Install dependencies only if you need to rebuild Tailwind output:

```bash
npm install
npm run tailwind:build
```

Available scripts:

```bash
npm run tailwind:build
npm run tailwind:watch
```

`src/output.css` is committed, so Cloudflare Pages does not need a build step for normal deploys.

## Deployment

The site is deployed through Cloudflare Pages from this repository.

Deployment characteristics:

- Static files are served directly.
- Generated listing pages live in this repo under `listing/`.
- No runtime build command is required for normal production deploys.
- Sitemaps and KML files are committed artifacts.
- Cloudflare Pages `_redirects` controls route aliases and reserved paths.

## Legacy and Compatibility Notes

The repository still contains or references older systems that should be treated carefully:

- Supabase is the live data source for listings and analytics.
- Some README history referenced Edge Functions that are not active in Supabase today. The active functions are `admin-proxy`, `listing-server-time`, and `update-github-file`.
- Analytics is standardized on `listing_analytics` (raw events) and `listing_analytics_summary` (aggregates).
- The Business Portal rebuild is ongoing. Keep README updates tied to the current code and live schema instead of desired future behavior.

## Contributor Notes

When updating this project:

- Prefer Supabase as the source of truth for listings, owners, requests, suggestions, categories, shortlinks, and analytics.
- Keep generated listing pages and sitemaps in sync after admin listing changes.
- Do not expose Supabase service-role keys, GitHub tokens, or Cloudflare API secrets in public frontend code.
- Preserve RLS assumptions when adding tables or policies.
- Update `category_subcategories` when changing dynamic categories or Schema.org type mappings.
- If changing Business Portal save behavior, verify both Supabase updates and static-page regeneration behavior.
- If changing analytics, document which analytics generation is authoritative.

## License and Ownership

Copyright (C) The Greek Directory, 2025-present. All rights reserved.

This repository contains proprietary source code owned by The Greek Directory. Unauthorized use, copying, modification, or distribution is prohibited without written permission.