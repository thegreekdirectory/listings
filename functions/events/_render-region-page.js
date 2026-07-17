/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// functions/events/_render-region-page.js
//
// Renders regional event-listing pages (currently just /events/chicago,
// the Chicagoland suburbs page — see CHICAGOLAND_SUBURBS in
// _chicagoland-suburbs.js). Underscore-prefixed for the same reason as
// that file: this exports a plain render function, not an onRequest*
// handler, so Cloudflare Pages should not treat it as its own route.
//
// DESIGN DECISION — this renders the SAME client-side app shell as
// events.html (EVENTS_APP_SHELL_HTML, imported from _app-shell.js —
// see that file's own header comment for why this is a shared import
// rather than two hand-maintained copies), same js/events.js, same
// css/events.css, rather than being a second, separately hand-built
// calendar/list/map/filter implementation. The two pages share every
// filter/sort/calendar/map interaction; the only genuine differences
// are (a) the hero copy/heading and (b) the region page pre-seeds
// js/events.js with a fixed city list and skips the nationwide location
// filter, since every event on this page is already guaranteed to be in
// Chicagoland. That pre-seed happens via the window.TGD_EVENTS_REGION
// global set below — js/events.js checks for it on init (see the
// "Regional page mode" section near the top of that file) and, when
// present, calls get_events_by_cities() instead of the homepage's
// get_upcoming_events()/filter-driven query, and hides the state/country
// filter controls that would be redundant here.
//
// This means a future third regional page is a ONE-LINE addition to the
// REGION_SLUGS map in [[slug]].js plus a new city-list file — not a new
// hand-built page.

import { EVENTS_APP_SHELL_HTML } from './_app-shell.js';

export async function renderRegionPage({ region, regionSlug, env, request }) {
    const html = `<!DOCTYPE html>
<html lang="en-US">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${escapeHtml(region.label)} Greek Events | The Greek Directory</title>
<meta name="description" content="Find upcoming Greek events, festivals, and gatherings across ${escapeHtml(region.label)} — updated daily.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://thegreekdirectory.org/events/${escapeHtml(regionSlug)}">
<link rel="icon" href="https://static.thegreekdirectory.org/img/logo/bluefavicon.png" media="(prefers-color-scheme: light)">
<link rel="icon" href="https://static.thegreekdirectory.org/img/logo/whitefavicon.png" media="(prefers-color-scheme: dark)">
<link rel="apple-touch-icon" href="https://static.thegreekdirectory.org/img/logo/blue.svg">

<meta property="og:title" content="${escapeHtml(region.label)} Greek Events | The Greek Directory">
<meta property="og:description" content="Find upcoming Greek events, festivals, and gatherings across ${escapeHtml(region.label)} — updated daily.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Greek Directory">
<meta property="og:url" content="https://thegreekdirectory.org/events/${escapeHtml(regionSlug)}">

<link rel="preconnect" href="https://images.thegreekdirectory.org">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<link rel="manifest" href="/manifest.json">
<link rel="stylesheet" href="/css/index.css">
<link rel="stylesheet" href="/css/listings.css">
<link rel="stylesheet" href="/css/events.css">
<link rel="stylesheet" href="/src/output.css">

<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "${escapeHtml(region.label)} Greek Events",
    "url": "https://thegreekdirectory.org/events/${escapeHtml(regionSlug)}",
    "isPartOf": { "@type": "WebSite", "name": "The Greek Directory", "url": "https://thegreekdirectory.org" }
}
</script>
</head>
<body class="bg-gray-50">

<div data-partial="header"></div>

<div class="event-region-hero">
    <h1>${escapeHtml(region.label)} Greek Events</h1>
    <p>Festivals, church events, fundraisers, and gatherings across the ${escapeHtml(region.label)} suburbs — updated daily.</p>
    <div class="relative mt-5 max-w-2xl mx-auto">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></span>
        <input type="text" id="eventSearchInput" placeholder="Search ${escapeHtml(region.label)} events..."
            class="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 border-0"
            style="color: #045093;">
    </div>
</div>

<main data-region-slug="${escapeHtml(regionSlug)}">
${EVENTS_APP_SHELL_HTML}
</main>

<div data-partial="footer"></div>

<script src="/js/partials-loader.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<script>
    // Regional page mode — read by js/events.js on init. See this file's
    // own header comment for why this is a global rather than a second
    // hand-built page: js/events.js's init() checks for this object and,
    // when present, calls get_events_by_cities(TGD_EVENTS_REGION.cities,
    // TGD_EVENTS_REGION.state) instead of the homepage's default
    // get_upcoming_events() query, and hides the state/country filter
    // controls (redundant — every event on this page is already
    // guaranteed to be within TGD_EVENTS_REGION.cities).
    window.TGD_EVENTS_REGION = {
        slug: ${JSON.stringify(regionSlug)},
        label: ${JSON.stringify(region.label)},
        state: ${JSON.stringify(region.state)},
        cities: ${JSON.stringify(region.cities)}
    };
</script>
<script src="/js/events.js" defer></script>
</body>
</html>`;

    return new Response(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=UTF-8',
            // Regional pages list many events at once and change less
            // urgently per-visitor than a single event's status — a
            // moderate cache window with background revalidation, longer
            // than an individual imminent event's 60s window but shorter
            // than a far-future event's hour-long window, since this page
            // is a feed whose "next thing to change" is usually just a
            // new event being added rather than an urgent status flip.
            'Cache-Control': 'public, max-age=120, s-maxage=600, stale-while-revalidate=3600',
        },
    });
}

function escapeHtml(text) {
    if (text === null || text === undefined || text === '') return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
