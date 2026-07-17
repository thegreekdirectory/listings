/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// functions/events/[[slug]].js
//
// Cloudflare Pages Function. Route: GET /events/*
//
// WHY [[slug]].js (catch-all) AND NOT [slug].js:
// Event slugs are a single path segment (e.g. /events/greek-fest-2026), so
// in principle [slug].js alone would work here. This file uses the
// catch-all form anyway, for one load-bearing reason: this same route
// tree also needs to serve the REGIONAL pages — /events/chicago and any
// future /events/<region> page (see the region-routing block below).
// [[slug]].js is what lets a single file distinguish "this is a region
// slug" from "this is an individual event slug" and branch accordingly,
// rather than fighting Cloudflare Pages' routing precedence between two
// sibling dynamic files ([slug].js vs a literal chicago.js). One file,
// one explicit branch, is easier to reason about than routing precedence
// rules between multiple dynamic function files at the same directory
// depth.
//
// WHY A SERVER FUNCTION HERE AT ALL (unlike listing/*.html, which are
// static, pre-generated, committed files):
// Events change far more often than business listings — new events get
// added constantly, existing ones get postponed/cancelled/sold-out right
// up until the day they happen, and a stale cached HTML file for "sold
// out" or "cancelled" is actively misleading in a way a stale phone
// number on a listing page is not. Generating and committing a static
// .html file per event (the listings/admin-portal pattern) would mean
// every status flip requires a full admin-portal save -> GitHub commit ->
// Pages redeploy cycle before a visitor sees it. Rendering server-side on
// every request against live Supabase data removes that entire lag, and
// the Cache-Control headers below (see CACHE HEADERS section) claw back
// the performance a static file would have given, WITHOUT the staleness
// problem: Cloudflare's edge cache serves the last-rendered HTML for
// most visitors, but the moment an admin flips a status/RSVP field, the
// s-maxage window naturally expires and the very next request rebuilds
// fresh from Supabase.
//
// REQUIRED SETUP (same secret already used by functions/print/listing/):
//   SUPABASE_SERVICE_ROLE_KEY — Pages Secret, service-role DB access.
// No CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID needed here — unlike
// the print function, this route never calls Browser Rendering; it
// returns real HTML for a real visitor's own browser to render.
//
// Why service-role instead of the anon key + RLS (which the rest of the
// public site uses straight from the browser): this function needs to
// resolve host_listing_id / venue_listing_id into the linked listing's
// name, logo, and address to render the "Hosted by" / "Venue" cards, and
// doing that as two extra round-trip REST calls per request is exactly
// the kind of join Postgres does far more cheaply in one query. Using
// service-role here (server-side only, never sent to the browser) mirrors
// exactly how functions/print/listing/[[slug]].js already does the same
// thing for the same reason.

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';

// The full Chicagoland regional page needs its own file
// (functions/events/index.js handles bare /events, and the region list
// itself lives in functions/events/_chicagoland-suburbs.js) — this file
// only needs to know WHICH region slugs to hand off to that shared
// module, so the list of valid region slugs is intentionally the only
// piece of regional knowledge duplicated here.
import { CHICAGOLAND_SUBURBS } from './_chicagoland-suburbs.js';
import { renderRegionPage } from './_render-region-page.js';

const REGION_SLUGS = {
    chicago: { label: 'Chicagoland', cities: CHICAGOLAND_SUBURBS, state: 'IL' },
};

export async function onRequestGet(context) {
    const { params, env, request } = context;

    const slugSegments = Array.isArray(params.slug) ? params.slug : params.slug ? [params.slug] : [];
    const rawSlug = slugSegments.map((segment) => decodeURIComponent(segment)).join('/');

    if (!rawSlug) {
        // Bare /events with no trailing segment is the homepage, and that
        // is intentionally NOT this file's job — /events.html (a normal
        // static page, same as every other top-level page on the site;
        // see events.html itself) owns that route. If this ever fires for
        // a bare /events it means a routing/redirect change upstream; fail
        // safe with a 404 rather than guessing.
        return htmlErrorResponse(renderErrorPage('Not found.', 'This page does not exist.'), 404);
    }

    // ── Region-page branch ──────────────────────────────────────────────
    // Single-segment slug that matches a known region (e.g. "chicago")
    // renders the regional listing page instead of a single event.
    if (slugSegments.length === 1 && REGION_SLUGS[rawSlug.toLowerCase()]) {
        return renderRegionPage({
            region: REGION_SLUGS[rawSlug.toLowerCase()],
            regionSlug: rawSlug.toLowerCase(),
            env,
            request,
        });
    }

    // ── Individual event branch ─────────────────────────────────────────
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is not configured for this Pages project.');
        return htmlErrorResponse(
            renderErrorPage(
                'Events unavailable.',
                'Missing configuration: SUPABASE_SERVICE_ROLE_KEY is not set for this Pages project (Settings \u2192 Environment variables, as a Secret).'
            ),
            500
        );
    }

    let event;
    try {
        event = await fetchEventBySlug(rawSlug, serviceRoleKey);
    } catch (err) {
        console.error('Supabase event fetch failed:', err);
        return htmlErrorResponse(renderErrorPage('Events unavailable.', 'We could not load this event right now. Please try again later.'), 502);
    }

    if (!event) {
        return htmlErrorResponse(renderErrorPage('Event not found.', 'This event does not exist or is not published.'), 404);
    }

    if (event.visible !== true) {
        return htmlErrorResponse(renderErrorPage('Event not found.', 'This event is not currently published.'), 404);
    }

    let hostListing = null;
    let venueListing = null;
    try {
        [hostListing, venueListing] = await Promise.all([
            event.host_listing_id ? fetchListingById(event.host_listing_id, serviceRoleKey) : Promise.resolve(null),
            event.venue_listing_id ? fetchListingById(event.venue_listing_id, serviceRoleKey) : Promise.resolve(null),
        ]);
    } catch (err) {
        // Host/venue detail is a nice-to-have card on the page, not
        // required for the page to render — same tolerance pattern the
        // print function uses for owners.
        console.error('Supabase host/venue listing fetch failed:', err);
    }

    const html = renderEventPage(event, hostListing, venueListing);

    return new Response(html, {
        status: 200,
        headers: buildCacheHeaders(event),
    });
}

// ---------------------------------------------------------------------------
// CACHE HEADERS
//
// "Heavily cached" per the brief, but tuned per event status so a
// cancellation/postponement/sold-out flip is never stuck behind a long
// cache window:
//   - status: scheduled, event still >24h away  -> long edge cache
//     (10 min browser, 1 hour at Cloudflare's edge, allowed to serve
//     stale for up to a day while silently revalidating in the background)
//   - event happening within the next 24h, OR status is cancelled /
//     postponed / sold_out -> short edge cache (60s) so a same-day
//     capacity/status change reaches visitors fast, without going all
//     the way to no-store (this route still gets hit hard right around
//     event time, and 60s of edge caching meaningfully reduces load
//     without noticeable staleness to a visitor).
// stale-while-revalidate is doing real work in both cases: it lets
// Cloudflare serve the last-known-good response instantly while it
// refetches in the background, rather than making one unlucky visitor
// eat a full Supabase round-trip the moment the cache window lapses.
// ---------------------------------------------------------------------------
function buildCacheHeaders(event) {
    const now = Date.now();
    const startMs = new Date(event.start_at).getTime();
    const isImminentOrLive = Number.isFinite(startMs) && startMs - now < 24 * 60 * 60 * 1000;
    const isUnstableStatus = event.status === 'cancelled' || event.status === 'postponed' || event.status === 'sold_out';

    const cacheControl = isImminentOrLive || isUnstableStatus
        ? 'public, max-age=30, s-maxage=60, stale-while-revalidate=120'
        : 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

    return {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': cacheControl,
    };
}

function htmlErrorResponse(html, status) {
    return new Response(html, {
        status,
        headers: {
            'Content-Type': 'text/html; charset=UTF-8',
            'X-Robots-Tag': 'noindex, nofollow',
            // Error responses are deliberately never cached — a listing
            // that starts 404ing because of a transient Supabase error
            // must not get frozen into the edge cache.
            'Cache-Control': 'no-store',
        },
    });
}

// ---------------------------------------------------------------------------
// Supabase REST access (service role) — identical helper to the one in
// functions/print/listing/[[slug]].js; duplicated rather than imported
// from that file because Pages Functions in different route subtrees are
// bundled independently and this keeps each function's dependencies
// self-contained and independently deployable.
// ---------------------------------------------------------------------------

async function supabaseRestGet(path, serviceRoleKey) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Supabase REST ${response.status}: ${body.slice(0, 300)}`);
    }

    return response.json();
}

async function fetchEventBySlug(slug, serviceRoleKey) {
    const encodedSlug = encodeURIComponent(slug);
    const rows = await supabaseRestGet(`events?slug=eq.${encodedSlug}&limit=1`, serviceRoleKey);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function fetchListingById(id, serviceRoleKey) {
    const encodedId = encodeURIComponent(id);
    const rows = await supabaseRestGet(
        `listings?id=eq.${encodedId}&select=id,slug,business_name,logo,address,city,state,phone,website&limit=1`,
        serviceRoleKey
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

// ---------------------------------------------------------------------------
// HTML escaping — identical to functions/print/listing/[[slug]].js's
// escapeHtml, duplicated here for the same self-containment reason noted
// above.
// ---------------------------------------------------------------------------

function escapeHtml(text) {
    if (text === null || text === undefined || text === '') return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function decodeEscapedText(value) {
    if (value === undefined || value === null) return '';
    const str = String(value);
    if (!/\\[\\'"nrtbf]/.test(str)) return str;
    try {
        return JSON.parse(
            `"${str
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\r/g, '\\r')
                .replace(/\n/g, '\\n')
                .replace(/\t/g, '\\t')}"`
        );
    } catch (_) {
        return str.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
    }
}

// Same strip-tags-except-<br> sanitizer as the print function and
// admin.js's sanitizeListingDescription — same stored-content shape
// (rich-text editor output), same rule: no tag survives as visible
// markup or visible literal text, except <br> which becomes a real line
// break.
const DESCRIPTION_CONTENT_STRIP_TAGS = new Set(['script', 'style']);

function sanitizeEventDescription(value) {
    const raw = decodeEscapedText(value || '');
    if (!raw) return '';

    let result = '';
    let i = 0;
    while (i < raw.length) {
        const char = raw[i];
        if (char === '<') {
            const brMatch = /^<br\s*\/?>/i.exec(raw.slice(i));
            if (brMatch) {
                result += '<br>';
                i += brMatch[0].length;
                continue;
            }
            const closeIdx = raw.indexOf('>', i);
            if (closeIdx === -1) {
                i += 1;
                continue;
            }
            const tagContent = raw.slice(i + 1, closeIdx);
            const tagNameMatch = /^\/?\s*([a-zA-Z0-9]+)/.exec(tagContent);
            const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';
            if (DESCRIPTION_CONTENT_STRIP_TAGS.has(tagName) && !tagContent.trim().startsWith('/')) {
                const closingTag = `</${tagName}>`;
                const closingIdx = raw.toLowerCase().indexOf(closingTag, closeIdx);
                i = closingIdx === -1 ? raw.length : closingIdx + closingTag.length;
                continue;
            }
            i = closeIdx + 1;
            continue;
        }
        result += escapeHtml(char);
        i += 1;
    }
    return result;
}

// ---------------------------------------------------------------------------
// Date/time formatting helpers
// ---------------------------------------------------------------------------

function formatEventDateTime(startAt, endAt, timezone, allDay) {
    if (!startAt) return { dateLabel: '', timeLabel: '', isoStart: '', isoEnd: '' };
    const start = new Date(startAt);
    const end = endAt ? new Date(endAt) : null;
    const tz = timezone || 'America/Chicago';

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: tz,
    });
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
        timeZone: tz,
    });

    const sameDay = end
        ? new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' }).format(start)
            === new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' }).format(end)
        : true;

    let dateLabel = dateFormatter.format(start);
    if (end && !sameDay) {
        dateLabel += ` \u2013 ${dateFormatter.format(end)}`;
    }

    let timeLabel = '';
    if (!allDay) {
        timeLabel = end && sameDay
            ? `${timeFormatter.format(start).replace(/\s[A-Z]{2,4}$/, '')} \u2013 ${timeFormatter.format(end)}`
            : timeFormatter.format(start);
    } else {
        timeLabel = 'All day';
    }

    return {
        dateLabel,
        timeLabel,
        isoStart: start.toISOString(),
        isoEnd: end ? end.toISOString() : '',
    };
}

function getEventTimingState(event) {
    const now = Date.now();
    const start = new Date(event.start_at).getTime();
    const end = event.end_at ? new Date(event.end_at).getTime() : start;

    if (event.status === 'cancelled') return 'cancelled';
    if (event.status === 'postponed') return 'postponed';
    if (event.status === 'sold_out') return 'sold_out';
    if (now >= start && now <= end) return 'happening_now';
    if (now > end) return 'past';
    return 'upcoming';
}

const TIMING_BADGE_HTML = {
    happening_now: '<span class="event-badge event-badge-live">Happening Now</span>',
    cancelled: '<span class="event-badge event-badge-cancelled">Cancelled</span>',
    postponed: '<span class="event-badge event-badge-postponed">Postponed</span>',
    sold_out: '<span class="event-badge event-badge-soldout">Sold Out</span>',
    past: '<span class="event-badge event-badge-past">Past Event</span>',
    upcoming: '',
};

// ---------------------------------------------------------------------------
// Recurrence display — turns the structured recurrence jsonb into a
// human sentence. Kept intentionally simple (weekly/monthly/daily plus an
// optional "until" date) since this is display-only; the admin portal is
// the source of truth for the structured value itself.
// ---------------------------------------------------------------------------

const WEEKDAY_LABELS = { MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday', FR: 'Friday', SA: 'Saturday', SU: 'Sunday' };

function describeRecurrence(recurrence) {
    if (!recurrence || typeof recurrence !== 'object' || !recurrence.freq) return '';
    const interval = recurrence.interval && recurrence.interval > 1 ? recurrence.interval : 1;
    let phrase = '';
    if (recurrence.freq === 'daily') {
        phrase = interval > 1 ? `Every ${interval} days` : 'Daily';
    } else if (recurrence.freq === 'weekly') {
        const days = Array.isArray(recurrence.by_day) && recurrence.by_day.length
            ? recurrence.by_day.map((d) => WEEKDAY_LABELS[d] || d).join(', ')
            : '';
        phrase = interval > 1
            ? `Every ${interval} weeks${days ? ` on ${days}` : ''}`
            : `Weekly${days ? ` on ${days}` : ''}`;
    } else if (recurrence.freq === 'monthly') {
        phrase = interval > 1 ? `Every ${interval} months` : 'Monthly';
    } else {
        return '';
    }
    if (recurrence.until) {
        const untilDate = new Date(recurrence.until);
        if (!Number.isNaN(untilDate.getTime())) {
            phrase += ` until ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(untilDate)}`;
        }
    }
    return phrase;
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildHostVenueCards(event, hostListing, venueListing) {
    const cards = [];

    if (hostListing) {
        cards.push(`
            <a class="event-related-card" href="/listing/${escapeHtml(hostListing.slug || '')}">
                ${hostListing.logo ? `<img class="event-related-card-logo" src="${escapeHtml(hostListing.logo)}" alt="${escapeHtml(hostListing.business_name || '')}">` : ''}
                <div class="event-related-card-text">
                    <span class="event-related-card-label">Hosted by</span>
                    <span class="event-related-card-name">${escapeHtml(hostListing.business_name || '')}</span>
                </div>
            </a>`);
    }

    if (venueListing && venueListing.id !== hostListing?.id) {
        cards.push(`
            <a class="event-related-card" href="/listing/${escapeHtml(venueListing.slug || '')}">
                ${venueListing.logo ? `<img class="event-related-card-logo" src="${escapeHtml(venueListing.logo)}" alt="${escapeHtml(venueListing.business_name || '')}">` : ''}
                <div class="event-related-card-text">
                    <span class="event-related-card-label">Venue</span>
                    <span class="event-related-card-name">${escapeHtml(venueListing.business_name || '')}</span>
                </div>
            </a>`);
    } else if (!venueListing && (event.custom_venue_name || event.custom_venue_address)) {
        cards.push(`
            <div class="event-related-card event-related-card-static">
                <div class="event-related-card-text">
                    <span class="event-related-card-label">Venue</span>
                    <span class="event-related-card-name">${escapeHtml(event.custom_venue_name || '')}</span>
                    ${event.custom_venue_address ? `<span class="event-related-card-sub">${escapeHtml(event.custom_venue_address)}</span>` : ''}
                </div>
            </div>`);
    }

    return cards.length ? `<div class="event-related-cards">${cards.join('')}</div>` : '';
}

function buildTicketSection(event) {
    const rows = [];
    if (event.is_free) {
        rows.push('<span class="event-price-chip event-price-free">Free</span>');
    } else if (event.price_range) {
        rows.push(`<span class="event-price-chip">${escapeHtml(event.price_range)}</span>`);
    }
    if (event.rsvp_required) {
        rows.push('<span class="event-price-chip event-price-rsvp">RSVP Required</span>');
    }

    const buttons = [];
    if (event.ticket_url && event.status !== 'sold_out') {
        buttons.push(`<a href="${escapeHtml(event.ticket_url)}" target="_blank" rel="noopener noreferrer" class="event-cta-button event-cta-primary">Get Tickets</a>`);
    }
    if (event.rsvp_url) {
        buttons.push(`<a href="${escapeHtml(event.rsvp_url)}" target="_blank" rel="noopener noreferrer" class="event-cta-button event-cta-secondary">RSVP</a>`);
    }
    if (event.capacity && event.registered_count != null) {
        const remaining = Math.max(event.capacity - event.registered_count, 0);
        buttons.push(`<span class="event-capacity-note">${remaining} of ${event.capacity} spots remaining</span>`);
    }

    if (!rows.length && !buttons.length) return '';
    return `
        <div class="event-ticket-section">
            <div class="event-price-row">${rows.join('')}</div>
            <div class="event-cta-row">${buttons.join('')}</div>
        </div>`;
}

function buildContactSection(event) {
    const lines = [];
    if (event.contact_phone) {
        lines.push(`<a class="event-contact-line" href="tel:${escapeHtml(event.contact_phone)}">${escapeHtml(event.contact_phone)}</a>`);
    }
    if (event.contact_email) {
        lines.push(`<a class="event-contact-line" href="mailto:${escapeHtml(event.contact_email)}">${escapeHtml(event.contact_email)}</a>`);
    }
    if (event.website) {
        lines.push(`<a class="event-contact-line" href="${escapeHtml(event.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(event.website)}</a>`);
    }
    if (!lines.length) return '';
    return `<div class="event-section"><h3>Contact</h3>${lines.join('')}</div>`;
}

function buildAdditionalInfoSection(event) {
    const info = Array.isArray(event.additional_info) ? event.additional_info : [];
    if (!info.length) return '';
    const rows = info
        .filter((item) => item && item.label && item.value)
        .map((item) => `<div class="event-info-row"><span class="event-info-label">${escapeHtml(item.label)}</span><span class="event-info-value">${escapeHtml(item.value)}</span></div>`)
        .join('');
    if (!rows) return '';
    return `<div class="event-section"><h3>Details</h3>${rows}</div>`;
}

function buildMapSection(event) {
    const coords = event.coordinates && typeof event.coordinates === 'object' ? event.coordinates : null;
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return '';
    const address = event.custom_venue_address || `${event.city || ''}, ${event.state || ''}`;
    return `
        <div class="event-section event-map-section">
            <h3>Location</h3>
            <div id="eventMap" class="event-map" data-lat="${coords.lat}" data-lng="${coords.lng}"></div>
            <a class="event-directions-link" href="https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}" target="_blank" rel="noopener noreferrer">Get Directions</a>
            ${address ? `<p class="event-address-line">${escapeHtml(address)}</p>` : ''}
        </div>`;
}

// ---------------------------------------------------------------------------
// Full page render
// ---------------------------------------------------------------------------

function renderEventPage(event, hostListing, venueListing) {
    const decodedTitle = decodeEscapedText(event.title || '');
    const decodedTagline = decodeEscapedText(event.tagline || '');
    const description = sanitizeEventDescription(event.description || '');
    const { dateLabel, timeLabel, isoStart, isoEnd } = formatEventDateTime(event.start_at, event.end_at, event.timezone, event.all_day);
    const timingState = getEventTimingState(event);
    const timingBadge = TIMING_BADGE_HTML[timingState] || '';
    const recurrenceLabel = describeRecurrence(event.recurrence);
    const eventUrl = `https://thegreekdirectory.org/events/${escapeHtml(event.slug || '')}`;
    const posterImage = event.poster_image || hostListing?.logo || '';
    const locationLabel = [event.city, event.state].filter(Boolean).join(', ');

    const badges = [];
    if (event.tier === 'PREMIUM') badges.push('<span class="event-badge event-badge-premium">Premium</span>');
    else if (event.tier === 'FEATURED') badges.push('<span class="event-badge event-badge-featured">Featured</span>');
    if (timingBadge) badges.push(timingBadge);

    const hostVenueCards = buildHostVenueCards(event, hostListing, venueListing);
    const ticketSection = buildTicketSection(event);
    const contactSection = buildContactSection(event);
    const additionalInfoSection = buildAdditionalInfoSection(event);
    const mapSection = buildMapSection(event);

    // JSON-LD: schema.org Event — the events-page equivalent of the
    // LocalBusiness graph in listing-template.html. eventStatus /
    // eventAttendanceMode use schema.org's own controlled vocab values.
    const schemaStatusMap = {
        scheduled: 'https://schema.org/EventScheduled',
        cancelled: 'https://schema.org/EventCancelled',
        postponed: 'https://schema.org/EventPostponed',
        sold_out: 'https://schema.org/EventScheduled',
    };
    const offersSchema = event.is_free
        ? '{"@type":"Offer","price":"0","priceCurrency":"USD","availability":"https://schema.org/InStock"}'
        : event.ticket_url
            ? `{"@type":"Offer","url":"${escapeHtml(event.ticket_url)}","availability":"${event.status === 'sold_out' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock'}"}`
            : 'null';

    const locationSchema = venueListing
        ? `{"@type":"Place","name":"${escapeHtml(venueListing.business_name || '')}","address":{"@type":"PostalAddress","streetAddress":"${escapeHtml(venueListing.address || '')}","addressLocality":"${escapeHtml(venueListing.city || '')}","addressRegion":"${escapeHtml(venueListing.state || '')}","addressCountry":"US"}}`
        : `{"@type":"Place","name":"${escapeHtml(event.custom_venue_name || locationLabel)}","address":{"@type":"PostalAddress","streetAddress":"${escapeHtml(event.custom_venue_address || '')}","addressLocality":"${escapeHtml(event.city || '')}","addressRegion":"${escapeHtml(event.state || '')}","addressCountry":"US"}}`;

    return `<!DOCTYPE html>
<html lang="en-US">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${escapeHtml(decodedTitle)} | Events | The Greek Directory</title>
<meta name="description" content="${escapeHtml(event.meta_description || decodedTagline || decodedTitle)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${eventUrl}">
<link rel="icon" href="https://static.thegreekdirectory.org/img/logo/bluefavicon.png" media="(prefers-color-scheme: light)">
<link rel="icon" href="https://static.thegreekdirectory.org/img/logo/whitefavicon.png" media="(prefers-color-scheme: dark)">
<link rel="apple-touch-icon" href="https://static.thegreekdirectory.org/img/logo/blue.svg">

<meta property="og:title" content="${escapeHtml(decodedTitle)} | The Greek Directory">
<meta property="og:description" content="${escapeHtml(event.meta_description || decodedTagline || decodedTitle)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Greek Directory">
<meta property="og:url" content="${eventUrl}">
${posterImage ? `<meta property="og:image" content="${escapeHtml(posterImage)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(decodedTitle)} | The Greek Directory">
<meta name="twitter:description" content="${escapeHtml(event.meta_description || decodedTagline || decodedTitle)}">
${posterImage ? `<meta name="twitter:image" content="${escapeHtml(posterImage)}">` : ''}

<link rel="preconnect" href="https://images.thegreekdirectory.org">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<link rel="manifest" href="/manifest.json">
<link rel="stylesheet" href="/css/index.css">
<link rel="stylesheet" href="/css/listing-page.css">
<link rel="stylesheet" href="/css/events.css">
<link rel="stylesheet" href="/src/output.css">

<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "${escapeHtml(decodedTitle)}",
    "description": "${escapeHtml(event.meta_description || decodedTagline || decodedTitle)}",
    "startDate": "${isoStart}",
    ${isoEnd ? `"endDate": "${isoEnd}",` : ''}
    "eventStatus": "${schemaStatusMap[event.status] || schemaStatusMap.scheduled}",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": ${locationSchema},
    ${posterImage ? `"image": ["${escapeHtml(posterImage)}"],` : ''}
    "offers": ${offersSchema},
    "organizer": ${hostListing ? `{"@type":"Organization","name":"${escapeHtml(hostListing.business_name || '')}","url":"https://thegreekdirectory.org/listing/${escapeHtml(hostListing.slug || '')}"}` : 'null'},
    "url": "${eventUrl}"
}
</script>
</head>
<body class="bg-gray-50">

<div data-partial="header"></div>

<main class="event-page-main">
    <div class="event-hero-wrap">
        ${posterImage
            ? `<div class="event-poster-frame"><img class="event-poster-image" src="${escapeHtml(posterImage)}" alt="${escapeHtml(decodedTitle)}"></div>`
            : '<div class="event-poster-frame event-poster-placeholder"><span>No poster uploaded</span></div>'}
    </div>

    <div class="bg-white rounded-lg p-6 mb-6 card-shadow event-content-card">
        <div class="event-badges-row">
            ${event.category ? `<span class="text-sm font-semibold px-3 py-1 rounded-full text-white category-pill" style="background-color:#045093;">${escapeHtml(event.category)}</span>` : ''}
            ${badges.join('')}
        </div>

        <h1 class="text-3xl font-bold text-gray-900 mb-2">${escapeHtml(decodedTitle)}</h1>
        ${decodedTagline ? `<p class="text-lg text-gray-600 mb-4">${escapeHtml(decodedTagline)}</p>` : ''}

        <div class="event-datetime-block">
            <svg class="event-datetime-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#045093" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <div>
                <div class="event-date-label">${escapeHtml(dateLabel)}</div>
                ${timeLabel ? `<div class="event-time-label">${escapeHtml(timeLabel)}</div>` : ''}
                ${recurrenceLabel ? `<div class="event-recurrence-label">${escapeHtml(recurrenceLabel)}</div>` : ''}
            </div>
        </div>

        ${locationLabel ? `<div class="event-location-line"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg><span>${escapeHtml(event.custom_venue_name || locationLabel)}</span></div>` : ''}

        ${hostVenueCards}
        ${ticketSection}

        ${description ? `<div class="event-section"><h3>About This Event</h3><div class="event-description-body">${description}</div></div>` : ''}

        ${mapSection}
        ${additionalInfoSection}
        ${contactSection}

        <div class="event-share-row">
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}" target="_blank" rel="noopener noreferrer" class="share-button social-facebook" title="Share on Facebook">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="mailto:?subject=${encodeURIComponent(decodedTitle)}&body=${encodeURIComponent(eventUrl)}" class="share-button share-email" title="Share via Email">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            </a>
        </div>
    </div>
</main>

<div data-partial="footer"></div>

<script src="/js/partials-loader.js"></script>
${mapSection ? `
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function() {
    var mapEl = document.getElementById('eventMap');
    if (!mapEl || !window.L) return;
    var lat = parseFloat(mapEl.dataset.lat);
    var lng = parseFloat(mapEl.dataset.lng);
    var map = L.map('eventMap', { scrollWheelZoom: false }).setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    L.marker([lat, lng]).addTo(map);
})();
</script>` : ''}
</body>
</html>`;
}

function renderErrorPage(title, message) {
    return `<!DOCTYPE html>
<html lang="en-US">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} | The Greek Directory</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="https://static.thegreekdirectory.org/img/logo/bluefavicon.png">
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 24px; }
    .wrap { max-width: 480px; }
    h1 { color: #111827; font-size: 24px; margin-bottom: 8px; }
    p { color: #6b7280; margin-bottom: 24px; }
    a { display: inline-block; background: #045093; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
    <div class="wrap">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>
        <a href="/events">Browse all events</a>
    </div>
</body>
</html>`;
}
