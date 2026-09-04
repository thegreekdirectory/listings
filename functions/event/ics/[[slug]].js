/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// functions/event/ics/[[slug]].js
//
// Serves /event/ics/<slug> — a single-event .ics file download, used by
// the individual event page's Add to Calendar dropdown for the Apple
// Calendar and Other/Generic iCal options (functions/event/[[slug]].js's
// buildAddToCalendarButton). Apple Calendar has no URL-based
// event-creation format at all (confirmed via research while building
// this feature), so a real downloaded file is the only option there;
// "Other/Generic" wants the same universally-compatible format anyway,
// so both share this one endpoint rather than needing two.
//
// [[slug]] (double brackets, matching functions/event/[[slug]].js's own
// convention) because event slugs are multi-segment
// (city-state/event-name or online/event-name — see
// generateSlugFromName in js/admin.js).
//
// Uses the public anon key, same privilege level as every other public
// read in the Events system (this is public event data, already visible
// on the event's own page — no reason to use the service-role key
// here).

import { buildVEvent, buildVCalendar } from '../../events/_ics.js';

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

export async function onRequestGet({ params }) {
    const slugSegments = Array.isArray(params.slug) ? params.slug : [params.slug];
    const slug = slugSegments.join('/');

    const events = await supabaseRestGet(
        `events?slug=eq.${encodeURIComponent(slug)}&visible=eq.true&limit=1` +
        `&select=id,slug,title,tagline,start_at,end_at,status,organizer_listing_id,venue_listing_id,custom_venue_name,address,city,state`
    );
    const event = events[0];

    if (!event) {
        return new Response('Event not found.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    const [organizer, venue] = await Promise.all([
        event.organizer_listing_id
            ? supabaseRestGet(`listings?id=eq.${encodeURIComponent(event.organizer_listing_id)}&select=business_name`).then((r) => r[0])
            : null,
        event.venue_listing_id
            ? supabaseRestGet(`listings?id=eq.${encodeURIComponent(event.venue_listing_id)}&select=business_name,address`).then((r) => r[0])
            : null,
    ]);

    const vevent = buildVEvent({
        event,
        organizerName: organizer?.business_name,
        venueName: venue?.business_name || event.custom_venue_name,
        venueAddress: venue?.address,
        siteBaseUrl: 'https://thegreekdirectory.org',
    });
    const ics = buildVCalendar([vevent], event.title);

    // A filesystem-safe filename derived from the slug (slashes replaced
    // — a raw multi-segment slug like "chicago-il/greek-fest" isn't a
    // valid filename component on any OS this would be saved to).
    const safeFilename = `${slug.replace(/[^a-z0-9]+/gi, '-')}.ics`;

    return new Response(ics, {
        status: 200,
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            // attachment (not inline, unlike the multi-event feed) — this
            // is a one-time "save this one event" action, not something
            // meant to open inline in a browser tab.
            'Content-Disposition': `attachment; filename="${safeFilename}"`,
            // Event details can change (time, venue, cancellation) —
            // this should not be cached at all, unlike the feed (which
            // accepts some staleness in exchange for not hammering
            // Supabase on every subscriber's every poll). A single
            // on-demand download has no equivalent poll-frequency
            // concern to trade off against.
            'Cache-Control': 'no-store',
        },
    });
}
