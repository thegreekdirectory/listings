// generate-events-sitemap.js
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// This script generates sitemap-events.xml.
// Run with: node generate-events-sitemap.js
// Requires Node 18+ (uses the built-in global fetch — no new dependency
// added to package.json, since generate-sitemap.js has none either).
//
// WHY A SEPARATE SCRIPT FROM generate-sitemap.js, RATHER THAN EXTENDING
// IT: generate-sitemap.js reads listings-database.json — a local JSON
// mirror of the listings table that is presumably written by some other
// part of the deploy/export pipeline (not present in this pass, and not
// something this change should guess at reproducing for events). Events
// has no equivalent local mirror; it lives in Supabase only. Rather than
// inventing a parallel events-database.json export step that doesn't
// exist for events yet, this script queries the events table directly
// via Supabase's REST API using the public anon key — the same key
// already shipped client-side in every public page on this site, so
// using it in a build script carries no new exposure. If an
// events-database.json export step is added later to match the listings
// pipeline, swapping this script's data source is a small, contained
// change (only fetchAllEvents() below would need to change).
//
// sitemap-events.xml already exists in the repo as an empty placeholder
// (<urlset ...></urlset>) and is already referenced from
// sitemap_index.xml — this script is what actually populates it. It
// does NOT touch sitemap.xml or sitemap-listings.xml.

const fs = require('fs');

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

const baseUrl = 'https://thegreekdirectory.org';
const now = new Date().toISOString().split('T')[0];

async function fetchAllEvents() {
    // Only visible, non-cancelled events belong in a sitemap — a
    // cancelled event is exactly the kind of low-value/thin page search
    // engines penalize a sitemap for including. select= is trimmed to
    // just the fields this script actually needs (slug, updated_at,
    // start_at, status) rather than pulling every column.
    const url = `${SUPABASE_URL}/rest/v1/events?select=slug,updated_at,start_at,status&visible=eq.true&status=neq.cancelled&order=start_at.asc`;
    const res = await fetch(url, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
    });
    if (!res.ok) {
        throw new Error(`Supabase REST ${res.status}: ${await res.text()}`);
    }
    return res.json();
}

// Region pages (currently just /events/chicago) — kept as a short
// hand-maintained list here rather than importing
// functions/events/_chicagoland-suburbs.js's REGION_SLUGS map, since
// that file lives in the Functions bundle (ES module) and this script is
// a plain CommonJS Node script; duplicating just the slug (not the full
// city list, which this script never needs) is a small, low-risk amount
// of duplication versus adding a build step to bridge module systems for
// one array. If more region pages are added later, add their slugs here
// too — see the matching REGION_SLUGS entry required in
// functions/events/[[slug]].js.
const REGION_PAGE_SLUGS = ['chicago'];

async function main() {
    const events = await fetchAllEvents();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Events homepage
    xml += `  <url>\n    <loc>${baseUrl}/events</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

    // Regional pages
    REGION_PAGE_SLUGS.forEach((slug) => {
        xml += `  <url>\n    <loc>${baseUrl}/events/${slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    // Individual events. changefreq is 'daily' rather than listings'
    // 'monthly' — event pages (RSVP counts, sold-out status) genuinely
    // do change day to day in a way a business listing rarely does.
    events.forEach((event) => {
        if (!event.slug) return;
        const lastMod = event.updated_at ? event.updated_at.split('T')[0] : now;
        xml += `  <url>\n    <loc>${baseUrl}/events/${event.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;

    fs.writeFileSync('sitemap-events.xml', xml);
    console.log('\u2705 sitemap-events.xml generated successfully!');
    console.log(`   - Events homepage: 1`);
    console.log(`   - Regional pages: ${REGION_PAGE_SLUGS.length}`);
    console.log(`   - Events: ${events.length}`);
    console.log(`   - Total URLs: ${1 + REGION_PAGE_SLUGS.length + events.length}`);
}

main().catch((err) => {
    console.error('\u274c Failed to generate sitemap-events.xml:', err.message);
    process.exitCode = 1;
});
