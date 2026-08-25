/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// functions/events/feed.ics.js
//
// Serves /events/feed.ics — a public, subscribable ICS calendar feed.
// File-based routing note: a filename containing a literal dot before
// the required .js extension (feed.ics.js) compiles to the exact route
// /events/feed.ics, per Cloudflare's documented file-based routing
// (strips only the trailing .js). This is a ZERO-wildcard route, and
// Cloudflare's own routing docs state explicitly that "more specific
// routes (those with fewer wildcards) take precedence over less
// specific routes" — so this correctly wins over
// functions/events/[region].js's single-wildcard pattern regardless of
// file/declaration order, the same category of routing precision this
// codebase has needed to get right before (see the deleted
// functions/events/[[slug]].js, which used to swallow the /events
// route itself before being removed).
//
// Design notes on what counts as "upcoming" for a subscription feed,
// as opposed to a one-time page load:
//   - Filters on end_at (or start_at when end_at is null, matching the
//     event-page badge's own reasoning — see getEventTimingState in
//     functions/event/[[slug]].js) rather than start_at alone. A
//     currently-in-progress event (started yesterday, ends next week)
//     should still appear to someone checking their calendar feed right
//     now — filtering on start_at alone would silently omit it the
//     moment it started, which is wrong for a feed a subscriber expects
//     to reflect "what's still relevant," not just "what hasn't started
//     yet."
//   - Cancelled events are INCLUDED, not excluded (unlike the ItemList
//     schema on the collection pages, which deliberately excludes them
//     since that's a one-time SEO snapshot of what to browse right now).
//     A feed subscriber who already has an event on their calendar
//     needs to see it flip to STATUS:CANCELLED on their next sync, not
//     have it silently vanish — a disappearing event looks like a sync
//     glitch, not a deliberate cancellation.

import { buildVEvent, buildVCalendar } from './_ics.js';

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

async function supabaseRestGet(path) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
}

export async function onRequestGet() {
    const nowIso = new Date().toISOString();

    // Fetching a bounded window (200) rather than every event this
    // directory will ever have is a deliberate, reasonable cap for a
    // feed a calendar app re-polls periodically — a genuinely unbounded
    // feed would keep growing forever and cost more on every single
    // subscriber's re-sync for no real benefit, since a feed's whole
    // purpose is "what's coming up," not a permanent historical archive
    // (which the site's own /events pages and individual event pages
    // already serve, indefinitely, for anyone who wants that).
    //
    // Cannot filter "not yet ended" directly in a single PostgREST
    // query, since that requires comparing against TWO different
    // columns depending on whether end_at is null (a
    // COALESCE(end_at, start_at) >= now expression) — PostgREST's query
    // string filter syntax doesn't support that kind of per-row
    // conditional column choice. Fetching a slightly wider window
    // (start_at >= 30 days ago, a safe upper bound on how long any real
    // event in this directory is likely to run) and filtering the
    // has-it-really-ended check in application code is simpler and more
    // correct than fighting PostgREST's filter syntax for this specific
    // conditional case.
    const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const rawEvents = await supabaseRestGet(
        `events?visible=eq.true&start_at=gte.${encodeURIComponent(windowStart)}&order=start_at.asc&limit=200` +
        `&select=id,slug,title,tagline,start_at,end_at,status,organizer_listing_id,venue_listing_id,custom_venue_name,address,city,state`
    );

    const nowMs = Date.now();
    const events = rawEvents.filter((event) => {
        const effectiveEnd = event.end_at ? new Date(event.end_at).getTime() : new Date(event.start_at).getTime();
        return effectiveEnd >= nowMs;
    });

    // Batch-resolve organizer/venue listing names in two follow-up
    // queries (not one query per event) — same technique already used
    // for the region-scoped city filter in
    // functions/events/_render-region-page.js, and matching this
    // codebase's own established pattern (functions/event/[[slug]].js's
    // fetchListingById) of resolving these FKs as separate REST calls
    // rather than a PostgREST embedded-resource join.
    const organizerIds = [...new Set(events.map((e) => e.organizer_listing_id).filter(Boolean))];
    const venueIds = [...new Set(events.map((e) => e.venue_listing_id).filter(Boolean))];
    const allListingIds = [...new Set([...organizerIds, ...venueIds])];

    let listingsById = {};
    if (allListingIds.length) {
        const idsFilter = allListingIds.join(',');
        const listings = await supabaseRestGet(`listings?id=in.(${idsFilter})&select=id,business_name,address,city,state`);
        listingsById = Object.fromEntries(listings.map((l) => [l.id, l]));
    }

    const vevents = events.map((event) => {
        const organizer = event.organizer_listing_id ? listingsById[event.organizer_listing_id] : null;
        const venue = event.venue_listing_id ? listingsById[event.venue_listing_id] : null;
        return buildVEvent({
            event,
            organizerName: organizer?.business_name,
            venueName: venue?.business_name || event.custom_venue_name,
            venueAddress: venue?.address,
            siteBaseUrl: 'https://thegreekdirectory.org',
        });
    });

    const ics = buildVCalendar(vevents, 'The Greek Directory — Events');

    return new Response(ics, {
        status: 200,
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            // A real filename here matters: some calendar apps use it as
            // a default display/file name when a subscriber first adds
            // the feed, before X-WR-CALNAME is read.
            'Content-Disposition': 'inline; filename="greek-directory-events.ics"',
            // Calendar apps typically re-poll a subscribed feed on their
            // own schedule (commonly every few hours, sometimes as
            // infrequently as once a day) regardless of what this header
            // says — but setting a reasonable cache window still avoids
            // serving a fully fresh, uncached response on every single
            // subscriber's every single poll, which would add up across
            // however many people end up subscribing.
            'Cache-Control': 'public, max-age=1800, s-maxage=3600',
        },
    });
}
