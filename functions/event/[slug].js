/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// functions/event/[slug].js
//
// Cloudflare Pages Function. Route: GET /event/:slug (single required
// segment — NOT a catch-all). This is a fresh, separate directory from
// functions/events/, matching /listing/<slug> vs /listings the same way
// listings already does: singular noun + one slug segment for a single
// item, plural noun for the browse/directory experience.
//
// [slug].js (single bracket) rather than [[slug]].js (optional
// catch-all) is deliberate: this route's ONLY job is one event per
// request, so its match pattern should be exactly one path segment,
// nothing more, nothing less (Cloudflare route specificity: "more
// specific routes — those with fewer wildcards — take precedence over
// less specific routes," and a required single segment has zero
// ambiguity with any sibling route the way an optional catch-all does).
// With this file's route defined as exactly one segment, it structurally
// cannot collide with functions/events/index.js (zero segments) or
// functions/events/[region].js (also exactly one segment, but under a
// completely different top-level path, /events/ vs /event/) — there is
// no overlapping match for Cloudflare to have to break a tie on, which
// removes an entire class of routing bug rather than depending on
// precedence rules resolving correctly.
//
// PRIOR VERSION NOTE: an earlier version of this system put individual
// event pages at /events/<slug> using a [[slug]].js catch-all that ALSO
// tried to handle /events itself (guarding against an empty slug) and
// regional pages. That optional-catch-all shape is exactly the kind of
// route Cloudflare route-specificity rules have to disambiguate against
// a sibling functions/events/index.js — and in practice that
// disambiguation did not resolve the way it was assumed to, causing
// bare /events to 404 through this file's own not-found branch instead
// of reaching index.js. Splitting into three mutually-exclusive,
// non-overlapping routes (this file, functions/events/index.js,
// functions/events/[region].js) removes the ambiguity structurally
// instead of relying on precedence.
//
// SERVICE ROLE: same secret as before — SUPABASE_SERVICE_ROLE_KEY, a
// Pages Secret. Needed to resolve host_listing_id / venue_listing_id
// into the organizer/venue info sections in one server-side round trip
// each, mirroring functions/print/listing/[[slug]].js's own reasoning
// for using service-role over anon+RLS.

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';

export async function onRequestGet(context) {
    const { params, env } = context;
    const slug = typeof params.slug === 'string' ? decodeURIComponent(params.slug) : '';

    if (!slug) {
        return htmlErrorResponse(renderErrorPage('Event not found.', 'This event does not exist or is not published.'), 404);
    }

    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is not configured for this Pages project.');
        return htmlErrorResponse(
            renderErrorPage(
                'Event unavailable.',
                'Missing configuration: SUPABASE_SERVICE_ROLE_KEY is not set for this Pages project (Settings \u2192 Environment variables, as a Secret).'
            ),
            500
        );
    }

    let event;
    try {
        event = await fetchEventBySlug(slug, serviceRoleKey);
    } catch (err) {
        console.error('Supabase event fetch failed:', err);
        return htmlErrorResponse(renderErrorPage('Event unavailable.', 'We could not load this event right now. Please try again later.'), 502);
    }

    if (!event || event.visible !== true) {
        return htmlErrorResponse(renderErrorPage('Event not found.', 'This event does not exist or is not published.'), 404);
    }

    let hostListing = null;
    let venueListing = null;
    let shortlinkPath = null;
    try {
        [hostListing, venueListing, shortlinkPath] = await Promise.all([
            event.host_listing_id ? fetchListingById(event.host_listing_id, serviceRoleKey) : Promise.resolve(null),
            event.venue_listing_id ? fetchListingById(event.venue_listing_id, serviceRoleKey) : Promise.resolve(null),
            fetchEventShortlinkPath(event.id, serviceRoleKey),
        ]);
    } catch (err) {
        // Organizer/venue cards and the shortened share link are all
        // rich-but-not-essential parts of the page; tolerate a failed
        // lookup the same way the print function tolerates a failed
        // owners lookup, rather than failing the whole page render over
        // it. A failed shortlink lookup just means the share modal's
        // "Use short link" toggle falls back to the full canonical URL.
        console.error('Supabase host/venue/shortlink fetch failed:', err);
    }

    const html = renderEventPage(event, hostListing, venueListing, shortlinkPath);

    return new Response(html, {
        status: 200,
        headers: buildCacheHeaders(event),
    });
}

// ---------------------------------------------------------------------------
// CACHE HEADERS — unchanged reasoning from the prior version: short cache
// for events happening within 24h or in an unstable status (cancelled /
// postponed / sold_out), longer cache otherwise, always with
// stale-while-revalidate so a cache-window lapse never makes one visitor
// eat a synchronous Supabase round trip.
// ---------------------------------------------------------------------------
function buildCacheHeaders(event) {
    const now = Date.now();
    const startMs = new Date(event.start_at).getTime();
    const msUntilStart = startMs - now;
    // Bounded on both ends: only genuinely imminent/in-progress events
    // (starting within the next 24h, and not already fully in the past)
    // get the short cache window. A PAST event is just as stable as a
    // far-future one — nothing about it changes on its own — so it
    // belongs in the long-cache bucket too, not the short one. An
    // earlier version of this check only bounded the upper end
    // (msUntilStart < 24h), which any negative number (i.e. every past
    // event, no matter how old) also satisfies, silently short-caching
    // the entire archive of past events for no real benefit.
    const isImminentOrLive = Number.isFinite(msUntilStart) && msUntilStart >= -24 * 60 * 60 * 1000 && msUntilStart < 24 * 60 * 60 * 1000;
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
            'Cache-Control': 'no-store',
        },
    });
}

// ---------------------------------------------------------------------------
// Supabase REST access (service role)
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

// Expanded select vs. the prior version: hours + tier + category are new,
// needed to render a real organizer/venue INFO CARD (badges, not just a
// name chip) matching the "related listing card" pattern used elsewhere
// on the site.
async function fetchListingById(id, serviceRoleKey) {
    const encodedId = encodeURIComponent(id);
    const rows = await supabaseRestGet(
        `listings?id=eq.${encodedId}&select=id,slug,business_name,logo,address,city,state,phone,website,hours,tier,category&limit=1`,
        serviceRoleKey
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

// System shortlink for this event (created at admin save-time — see
// js/admin-events.js's saveEvent()), looked up here at REQUEST time
// rather than baked into stored content at save time. This is a direct
// consequence of this page being live-rendered rather than
// static-generated-and-committed the way listing pages are: listing
// pages bake '{{SHORTLINK_URL}}' into the committed HTML once, at save
// time, because that HTML is written once and reused for every visitor
// until the next save. This page has no such fixed artifact to bake a
// value into — it runs fresh per request — so resolving the shortlink
// here, alongside the host/venue listing lookups, is the correct
// architectural fit for a live-rendered page, not a workaround.
async function fetchEventShortlinkPath(eventId, serviceRoleKey) {
    const encodedId = encodeURIComponent(eventId);
    const rows = await supabaseRestGet(
        `shortlinks?event_refer_id=eq.${encodedId}&select=path&limit=1`,
        serviceRoleKey
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0].path : null;
}

// ---------------------------------------------------------------------------
// HTML escaping / decoding / description sanitizing — identical to the
// prior version and to functions/print/listing/[[slug]].js's own
// helpers of the same name, duplicated here for the same
// self-containment reason (each Pages Function bundles independently).
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
            if (closeIdx === -1) { i += 1; continue; }
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
// Date/time formatting + live status
// ---------------------------------------------------------------------------

function formatEventDateTime(startAt, endAt, timezone, allDay) {
    if (!startAt) return { dateLabel: '', timeLabel: '', isoStart: '', isoEnd: '' };
    const start = new Date(startAt);
    const end = endAt ? new Date(endAt) : null;
    const tz = timezone || 'America/Chicago';

    const dateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: tz });
    const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: tz });

    const sameDay = end
        ? new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' }).format(start)
            === new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' }).format(end)
        : true;

    let dateLabel = dateFormatter.format(start);
    if (end && !sameDay) dateLabel += ` \u2013 ${dateFormatter.format(end)}`;

    let timeLabel = '';
    if (!allDay) {
        timeLabel = end && sameDay
            ? `${timeFormatter.format(start).replace(/\s[A-Z]{2,4}$/, '')} \u2013 ${timeFormatter.format(end)}`
            : timeFormatter.format(start);
    } else {
        timeLabel = 'All day';
    }

    return { dateLabel, timeLabel, isoStart: start.toISOString(), isoEnd: end ? end.toISOString() : '' };
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

// Reuses the EXACT SAME badge classes as listing pages wherever the
// semantics genuinely match: badge-open (green) for "happening now" is
// the same visual language as a listing being open right now;
// badge-closed (red) for "cancelled" mirrors a listing being closed.
// Only postponed/sold_out/past get new classes, since those have no
// listing equivalent at all.
const TIMING_BADGE_HTML = {
    happening_now: '<span class="badge badge-open">HAPPENING NOW</span>',
    cancelled: '<span class="badge badge-closed">CANCELLED</span>',
    postponed: '<span class="badge badge-postponed">POSTPONED</span>',
    sold_out: '<span class="badge badge-soldout">SOLD OUT</span>',
    past: '<span class="badge badge-past">PAST EVENT</span>',
    upcoming: '',
};

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
        phrase = interval > 1 ? `Every ${interval} weeks${days ? ` on ${days}` : ''}` : `Weekly${days ? ` on ${days}` : ''}`;
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

function formatPhoneNumber(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    return phone;
}

// ---------------------------------------------------------------------------
// Sidebar info rows — address/phone/email/website. SVG icons copied
// EXACTLY from js/admin.js's generateTemplateReplacements() (the same
// function that builds these rows for listing pages): same paths, same
// w-5 h-5 sizing, same stroke="#045093" brand-blue treatment. Not
// reinvented — copied verbatim so the event sidebar is visually
// identical to the listing sidebar, not just similar.
// ---------------------------------------------------------------------------

function buildAddressSection(event) {
    const hasStreetAddress = typeof event.address === 'string' && event.address.trim().length > 0;
    if (!hasStreetAddress && !(event.city && event.state)) return '';

    const addressParts = [];
    if (hasStreetAddress) addressParts.push(escapeHtml(event.address));
    if (event.city && event.state) addressParts.push(`${escapeHtml(event.city)}, ${escapeHtml(event.state)}${event.zip_code ? ' ' + escapeHtml(event.zip_code) : ''}`);
    if (!addressParts.length) return '';

    let linkOpen = '';
    let linkClose = '';
    if (event.address) {
        const dest = encodeURIComponent([event.address, event.city, event.state, event.zip_code].filter(Boolean).join(', '));
        linkOpen = `<a href="https://www.google.com/maps/dir/?api=1&destination=${dest}" target="_blank" rel="noopener noreferrer">`;
        linkClose = '</a>';
    }

    return `
        <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-gray-600 mt-0.5" fill="none" stroke="#045093" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            ${linkOpen}${addressParts.join(', ')}${linkClose}
        </div>`;
}

function buildPhoneSection(event) {
    if (!event.contact_phone) return '';
    return `
        <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="#045093" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
            <a href="tel:${escapeHtml(event.contact_phone)}">${escapeHtml(formatPhoneNumber(event.contact_phone))}</a>
        </div>`;
}

function buildEmailSection(event) {
    if (!event.contact_email) return '';
    return `
        <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="#045093" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <a href="mailto:${escapeHtml(event.contact_email)}" target="_blank">${escapeHtml(event.contact_email)}</a>
        </div>`;
}

function buildWebsiteSection(event) {
    if (!event.website) return '';
    const displayUrl = decodeEscapedText(event.website).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    return `
        <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="#045093" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
            </svg>
            <a href="${escapeHtml(event.website)}" target="_blank">${escapeHtml(displayUrl)}</a>
        </div>`;
}

// Date/time row — event-specific, no listing equivalent, but styled to
// match (same icon-plus-text row shape as the address/phone/email rows
// above). Placed first in the sidebar since when something happens is
// usually the single most important fact about an event.
function buildDateTimeSidebarBlock(event) {
    const { dateLabel, timeLabel } = formatEventDateTime(event.start_at, event.end_at, event.timezone, event.all_day);
    const recurrenceLabel = describeRecurrence(event.recurrence);
    return `
        <div class="event-datetime-block">
            <svg class="event-datetime-icon w-5 h-5" fill="none" stroke="#045093" viewBox="0 0 24 24" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path stroke-linecap="round" d="M16 2v4M8 2v4M3 10h18"/></svg>
            <div>
                <div class="event-date-label">${escapeHtml(dateLabel)}</div>
                ${timeLabel ? `<div class="event-time-label">${escapeHtml(timeLabel)}</div>` : ''}
                ${recurrenceLabel ? `<div class="event-recurrence-label">${escapeHtml(recurrenceLabel)}</div>` : ''}
            </div>
        </div>`;
}

// ---------------------------------------------------------------------------
// CTA buttons — same visual language, colors, and icon set as listing
// pages' Call/Email/Website/Directions buttons (green/gray/blue/dark,
// hover-bounce, rounded-lg). Get Tickets / RSVP are the two genuinely
// new event-specific CTAs, styled to match that same family rather than
// inventing a different visual language for them.
// ---------------------------------------------------------------------------

function buildTicketRsvpButtons(event, mobile) {
    const buttons = [];
    const btnClass = mobile
        ? 'mobile-cta-button hover-bounce'
        : 'flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg font-medium hover-bounce';
    const iconClass = mobile ? 'w-4 h-4' : 'w-5 h-5';
    const ticketIcon = `<svg class="${iconClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
    const rsvpIcon = `<svg class="${iconClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

    if (event.ticket_url && event.status !== 'sold_out') {
        const style = mobile ? ' style="background:#16a34a;"' : ' class="' + btnClass + ' bg-green-600 hover:bg-green-700"';
        buttons.push(`<a href="${escapeHtml(event.ticket_url)}" target="_blank" rel="noopener noreferrer" ${mobile ? `class="${btnClass}"${style}` : style}>${ticketIcon}<span>Get Tickets</span></a>`);
    }
    if (event.rsvp_url) {
        const style = mobile ? ' style="background:#2563eb;"' : ' class="' + btnClass + ' bg-blue-600 hover:bg-blue-700"';
        buttons.push(`<a href="${escapeHtml(event.rsvp_url)}" target="_blank" rel="noopener noreferrer" ${mobile ? `class="${btnClass}"${style}` : style}>${rsvpIcon}<span>RSVP</span></a>`);
    }
    return buttons.join('\n');
}

function buildDirectionsButton(event, mobile) {
    const hasStreetAddress = typeof event.address === 'string' && event.address.trim().length > 0;
    if (!hasStreetAddress && !event.city) return '';
    const dest = encodeURIComponent([event.address, event.city, event.state, event.zip_code].filter(Boolean).join(', '));
    const href = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    const iconClass = mobile ? 'w-4 h-4' : 'w-5 h-5';
    const icon = `<svg class="${iconClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>`;
    if (mobile) {
        return `<a href="${href}" class="mobile-cta-button hover-bounce" style="background:#111827;" onclick="openDirections(event);">${icon}<span>Directions</span></a>`;
    }
    return `<a href="${href}" class="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium hover-bounce" onclick="openDirections(event);">${icon}Directions</a>`;
}

// Exact same forward-arrow icon as listing pages' {{SHARE_TRIGGER_BUTTON}}
// (copied verbatim from js/admin.js's generateTemplateReplacementsPart2).
function buildShareTriggerButton() {
    return `<a class="flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg font-medium hover-bounce" onclick="openShareModal()" style="background-color:#045093; cursor: pointer;" type="button"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="display:block;flex-shrink:0;"><path fill-rule="evenodd" clip-rule="evenodd" d="M19.6495 0.799565C18.4834 -0.72981 16.0093 0.081426 16.0093 1.99313V3.91272C12.2371 3.86807 9.65665 5.16473 7.9378 6.97554C6.10034 8.9113 5.34458 11.3314 5.02788 12.9862C4.86954 13.8135 5.41223 14.4138 5.98257 14.6211C6.52743 14.8191 7.25549 14.7343 7.74136 14.1789C9.12036 12.6027 11.7995 10.4028 16.0093 10.5464V13.0069C16.0093 14.9186 18.4834 15.7298 19.6495 14.2004L23.3933 9.29034C24.2022 8.2294 24.2022 6.7706 23.3933 5.70966L19.6495 0.799565ZM7.48201 11.6095C9.28721 10.0341 11.8785 8.55568 16.0093 8.55568H17.0207C17.5792 8.55568 18.0319 9.00103 18.0319 9.55037L18.0317 13.0069L21.7754 8.09678C22.0451 7.74313 22.0451 7.25687 21.7754 6.90322L18.0317 1.99313V4.90738C18.0317 5.4567 17.579 5.90201 17.0205 5.90201H16.0093C11.4593 5.90201 9.41596 8.33314 9.41596 8.33314C8.47524 9.32418 7.86984 10.502 7.48201 11.6095Z" fill="#FFFFFF"/><path d="M7 1.00391H4C2.34315 1.00391 1 2.34705 1 4.00391V20.0039C1 21.6608 2.34315 23.0039 4 23.0039H20C21.6569 23.0039 23 21.6608 23 20.0039V17.0039C23 16.4516 22.5523 16.0039 22 16.0039C21.4477 16.0039 21 16.4516 21 17.0039V20.0039C21 20.5562 20.5523 21.0039 20 21.0039H4C3.44772 21.0039 3 20.5562 3 20.0039V4.00391C3 3.45162 3.44772 3.00391 4 3.00391H7C7.55228 3.00391 8 2.55619 8 2.00391C8 1.45162 7.55228 1.00391 7 1.00391Z" fill="#FFFFFF"/></svg><span>Share</span></a>`;
}

// Hidden source section for the share modal (openShareModal() in
// event-page.js copies this div's inner .flex content into
// #shareModalButtons — the exact same technique listing pages use, see
// js/listing-page.js's openShareModal()). Icons copied verbatim from
// listing-template.html's own hidden share-buttons-section.
function buildShareButtonsHiddenSection(event, eventUrl) {
    const encodedTitle = encodeURIComponent(decodeEscapedText(event.title || ''));
    const encodedUrl = encodeURIComponent(eventUrl);
    return `
        <div class="share-section hidden" id="shareButtonsSection">
            <div class="flex flex-wrap gap-2">
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="share-button social-facebook" title="Share on Facebook">
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="share-button social-twitter" title="Share on X">
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="share-button social-linkedin" title="Share on LinkedIn">
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="sms:?&body=${encodedTitle}%20-%20${encodedUrl}" class="share-button share-sms" title="Share via SMS">
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                </a>
                <a href="mailto:?subject=${encodedTitle}&body=${encodedUrl}" class="share-button share-email" title="Share via Email">
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                </a>
                <button onclick="shareNative()" class="share-button social-other" title="Share">
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
                </button>
            </div>
        </div>`;
}

// ---------------------------------------------------------------------------
// Organizer / Venue sections — full info cards (logo, badges, name,
// location, phone), not small link chips. Mirrors the "related listing
// card" pattern already used elsewhere on the site (see
// js/admin.js's parent-listing-section renderer) so an event's
// organizer/venue reads as a real, substantial part of the page.
// ---------------------------------------------------------------------------

function getListingHoursBadge(listing) {
    if (!listing || !listing.hours || typeof listing.hours !== 'object') return '';
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const day = dayKeys[new Date().getDay()];
    const todayHours = String(listing.hours[day] || '').toLowerCase();
    if (!todayHours) return '';
    return todayHours.includes('closed') ? '<span class="badge badge-closed">CLOSED</span>' : '<span class="badge badge-open">OPEN</span>';
}

function getListingTierBadge(listing) {
    if (!listing) return '';
    if (listing.tier === 'PREMIUM') return '<span class="badge badge-premium">Premium</span>';
    if (listing.tier === 'FEATURED') return '<span class="badge badge-featured">Featured</span>';
    return '';
}

function buildEntityInfoCard(listing, label) {
    if (!listing) return '';
    const location = [listing.city, listing.state].filter(Boolean).join(', ');
    const badges = `${getListingHoursBadge(listing)}${getListingTierBadge(listing)}`;
    return `
        <a class="entity-info-card hover-bounce" href="/listing/${escapeHtml(listing.slug || '')}">
            ${listing.logo
                ? `<img class="entity-info-card-logo" src="${escapeHtml(listing.logo)}" alt="${escapeHtml(listing.business_name || '')}">`
                : `<div class="entity-info-card-logo" style="display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#045093,#0a6bc2);color:white;font-weight:700;font-size:20px;">${escapeHtml((listing.business_name || '?').charAt(0))}</div>`}
            <div class="entity-info-card-body">
                ${badges ? `<div class="entity-info-card-badges">${badges}</div>` : ''}
                <div class="entity-info-card-name">${escapeHtml(listing.business_name || '')}</div>
                ${listing.category ? `<div class="entity-info-card-line">${escapeHtml(listing.category)}</div>` : ''}
                ${location ? `<div class="entity-info-card-line"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#045093" stroke-width="2"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg><span>${escapeHtml(location)}</span></div>` : ''}
                ${listing.phone ? `<div class="entity-info-card-line"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#045093" stroke-width="2"><path d="M3 5a2 2 0 012-2h3.3a1 1 0 01.95.68l1.5 4.49a1 1 0 01-.5 1.21L8 10.5a11 11 0 005.5 5.5l1.1-2.25a1 1 0 011.2-.5l4.5 1.5a1 1 0 01.7.95V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z"/></svg><span>${escapeHtml(formatPhoneNumber(listing.phone))}</span></div>` : ''}
            </div>
        </a>`;
}

// Custom-venue variant: no linked listing at all, so a plain
// non-clickable block using the same card shell instead of a live link.
function buildCustomVenueCard(event) {
    if (!event.custom_venue_name && !event.address) return '';
    return `
        <div class="entity-info-card entity-info-card-static">
            <div class="entity-info-card-logo" style="display:flex;align-items:center;justify-content:center;background:#e5e7eb;color:#6b7280;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7"/></svg>
            </div>
            <div class="entity-info-card-body">
                <div class="entity-info-card-name">${escapeHtml(event.custom_venue_name || 'Venue')}</div>
                ${event.address ? `<div class="entity-info-card-line"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#045093" stroke-width="2"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg><span>${escapeHtml(event.address)}${event.city ? ', ' + escapeHtml(event.city) : ''}${event.state ? ', ' + escapeHtml(event.state) : ''}</span></div>` : ''}
            </div>
        </div>`;
}

function buildOrganizerVenueSection(event, hostListing, venueListing) {
    const organizerCard = buildEntityInfoCard(hostListing, 'Organized by');
    const venueCard = venueListing ? buildEntityInfoCard(venueListing, 'Venue') : buildCustomVenueCard(event);
    // Same listing shown as both host and venue (e.g. a restaurant
    // hosting its own event) -> only show the card once, labeled
    // "Hosted at", rather than the same card twice under two headers.
    const sameEntity = hostListing && venueListing && hostListing.id === venueListing.id;

    if (!organizerCard && !venueCard) return '';

    if (sameEntity) {
        return `
            <div class="entity-info-section" id="organizerVenueSection">
                <h3>Hosted At</h3>
                ${organizerCard}
            </div>`;
    }

    const parts = [];
    if (organizerCard) parts.push(`<div class="entity-info-section"><h3>Organized By</h3>${organizerCard}</div>`);
    if (venueCard) parts.push(`<div class="entity-info-section"><h3>Venue</h3>${venueCard}</div>`);
    return `<div id="organizerVenueSection">${parts.join('')}</div>`;
}

// ---------------------------------------------------------------------------
// Additional info + map sections
// ---------------------------------------------------------------------------

function buildAdditionalInfoSection(event) {
    const info = Array.isArray(event.additional_info) ? event.additional_info : [];
    const rows = info
        .filter((item) => item && item.label && item.value)
        .map((item) => `<div class="additional-info-row"><span class="font-medium text-gray-900">${escapeHtml(decodeEscapedText(item.label))}</span><span class="text-gray-700">${escapeHtml(decodeEscapedText(item.value))}</span></div>`)
        .join('');
    if (!rows) return '';
    return `<div class="mb-6" id="additionalInfoSectionWrap"><h3 class="font-semibold text-gray-900 mb-2">Additional Information</h3><div class="additional-info-table">${rows}</div></div>`;
}

// Map container only — actual Leaflet init (exact same teardrop pin SVG
// and click-to-scroll-zoom behavior as listing pages) happens client
// side in js/event-page.js, reading window.currentEventData, exactly
// mirroring how listing pages' #listingMap is populated by
// initializeMap() in js/listing-page.js rather than server-rendered.
function buildMapSection(event) {
    const hasStreetAddress = typeof event.address === 'string' && event.address.trim().length > 0;
    if (!hasStreetAddress && !(event.city && event.state)) return '';
    return `
        <div id="locationSection" class="location-section mt-6">
            <h2 class="text-xl font-bold text-gray-900 mb-3">Location</h2>
            <div id="eventMap"></div>
            <div id="mapFallback" class="map-fallback" role="status" aria-live="polite"></div>
        </div>`;
}

// ---------------------------------------------------------------------------
// Full page render
// ---------------------------------------------------------------------------

function renderEventPage(event, hostListing, venueListing, shortlinkPath) {
    const decodedTitle = decodeEscapedText(event.title || '');
    const decodedTagline = decodeEscapedText(event.tagline || '');
    const description = sanitizeEventDescription(event.description || '');
    const { isoStart, isoEnd } = formatEventDateTime(event.start_at, event.end_at, event.timezone, event.all_day);
    const timingState = getEventTimingState(event);
    const timingBadge = TIMING_BADGE_HTML[timingState] || '';
    const eventUrl = `https://thegreekdirectory.org/event/${escapeHtml(event.slug || '')}`;
    const posterImage = event.poster_image || '';
    const locationLabel = [event.city, event.state].filter(Boolean).join(', ');
    const hasStreetAddress = typeof event.address === 'string' && event.address.trim().length > 0;

    const tierBadge = event.tier === 'PREMIUM'
        ? '<span class="badge badge-premium">Premium</span>'
        : event.tier === 'FEATURED'
            ? '<span class="badge badge-featured">Featured</span>'
            : '';

    const priceRow = [];
    if (event.is_free) priceRow.push('<span class="event-price-chip event-price-free">Free</span>');
    else if (event.price_range) priceRow.push(`<span class="event-price-chip">${escapeHtml(event.price_range)}</span>`);
    if (event.rsvp_required) priceRow.push('<span class="event-price-chip event-price-rsvp">RSVP Required</span>');

    let capacityNote = '';
    if (event.capacity && event.registered_count != null) {
        const remaining = Math.max(event.capacity - event.registered_count, 0);
        capacityNote = `<div class="event-capacity-note">${remaining} of ${event.capacity} spots remaining</div>`;
    }

    const addressSection = buildAddressSection(event);
    const phoneSection = buildPhoneSection(event);
    const emailSection = buildEmailSection(event);
    const websiteSection = buildWebsiteSection(event);
    const dateTimeBlock = buildDateTimeSidebarBlock(event);
    const organizerVenueSection = buildOrganizerVenueSection(event, hostListing, venueListing);
    const additionalInfoSection = buildAdditionalInfoSection(event);
    const mapSection = buildMapSection(event);
    const shareTriggerButton = buildShareTriggerButton();
    const shareButtonsHidden = buildShareButtonsHiddenSection(event, eventUrl);
    const ticketRsvpDesktop = buildTicketRsvpButtons(event, false);
    const ticketRsvpMobile = buildTicketRsvpButtons(event, true);
    const directionsDesktop = buildDirectionsButton(event, false);
    const directionsMobile = buildDirectionsButton(event, true);

    const hasSidebarContact = Boolean(addressSection || phoneSection || emailSection || websiteSection);

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
    const locationSchema = hasStreetAddress || event.city
        ? `{"@type":"Place","name":"${escapeHtml(event.custom_venue_name || venueListing?.business_name || locationLabel)}","address":{"@type":"PostalAddress","streetAddress":"${escapeHtml(event.address || '')}","addressLocality":"${escapeHtml(event.city || '')}","addressRegion":"${escapeHtml(event.state || '')}","addressCountry":"US"}}`
        : 'null';

    // window.currentEventData — mirrors window.currentListingData exactly
    // in spirit: one global the client-side script (js/event-page.js)
    // reads for the map, share modal, directions, and shorten-url toggle,
    // instead of re-parsing the DOM for this data.
    const currentEventDataScript = `
        window.currentEventData = {
            id: ${JSON.stringify(event.id)},
            slug: ${JSON.stringify(event.slug)},
            title: ${JSON.stringify(decodedTitle)},
            address: ${JSON.stringify(event.address || '')},
            city: ${JSON.stringify(event.city || '')},
            state: ${JSON.stringify(event.state || '')},
            zip_code: ${JSON.stringify(event.zip_code || '')},
            full_address: ${JSON.stringify([event.address, event.city, event.state, event.zip_code].filter(Boolean).join(', '))},
            coordinates: ${JSON.stringify(event.coordinates && event.coordinates.lat ? `${event.coordinates.lat},${event.coordinates.lng}` : '')},
            shortlink: ${JSON.stringify(shortlinkPath ? `https://thegreekdirectory.org${shortlinkPath}` : `https://thegreekdirectory.org/event/${event.slug}`)},
            startAtMs: ${JSON.stringify(new Date(event.start_at).getTime())},
            endAtMs: ${JSON.stringify(event.end_at ? new Date(event.end_at).getTime() : new Date(event.start_at).getTime())}
        };
    `;

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

<link rel="stylesheet" href="/css/pwa.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<link rel="manifest" href="/manifest.json">
<link rel="stylesheet" href="/css/index.css">
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

<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.card-shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
.category-pill { cursor: default; position: relative; }
.badge { font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: 600; display: inline-block; }
.badge-open { background: #10b981; color: white; }
.badge-closed { background: #ef4444; color: white; }
.badge-opening-soon { background: #fbbf24; color: #78350f; }
.badge-featured { background: #fbbf24; color: #78350f; }
.badge-premium { background: #6b21a8; color: #ede9fe; }
.badge-postponed { background: #f97316; color: white; }
.badge-soldout { background: #6b7280; color: white; }
.badge-past { background: #e5e7eb; color: #4b5563; }
.hover-bounce:hover { transform: scale(1.04); }
.action-cta-btn.hover-bounce:hover { transform: scale(1.04); }
a.hover-bounce:hover, button.hover-bounce:hover { transform: scale(1.03); }

/* Poster hero — a portrait flyer/poster, not a landscape banner carousel,
   since events (unlike businesses) are represented by a poster image.
   Framed the same card-shadow/rounded way the listing carousel section
   is framed, just sized for a portrait image instead of a 16:9 banner. */
.event-poster-frame { max-width: 380px; margin: 0 auto; border-radius: 8px; overflow: hidden; }
.event-poster-image { width: 100%; height: auto; display: block; }
.event-poster-placeholder { aspect-ratio: 3/4; background: linear-gradient(135deg, #045093 0%, #0a6bc2 100%); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.85); font-weight: 600; font-size: 14px; }

.subcategories-display { display: none; margin-top: 8px; }
.subcategories-display.active { display: block; }
.subcategory-tag { display: inline-block; background: #e5e7eb; color: #374151; padding: 4px 10px; border-radius: 12px; font-size: 12px; margin: 4px 4px 4px 0; }

.listing-description ul, .listing-description ol { margin-left: 1.5rem; padding-left: 1rem; }
.listing-description ul { list-style-type: disc; }
.listing-description ol { list-style-type: decimal; }
.listing-description li { margin: 0.25rem 0; }
.listing-description-wrap { margin: 0 0 1.5rem; }
.listing-description { margin: 0; padding: 1.25rem; border: 1px solid #d1d5db; border-bottom: 0; border-radius: 10px 10px 0 0; background: #fff; line-height: 1.8; color: #1f2937; }
.listing-description p { margin-bottom: 1rem; }
.listing-description.collapsed { max-height: 280px; overflow: hidden; position: relative; }
.listing-description.collapsed::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 80px; background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1)); }
.description-divider { display: flex; align-items: center; border: 1px solid #d1d5db; border-top: 0; border-radius: 0 0 10px 10px; padding: 10px; background: #ffffff; }
.description-divider-line { flex: 1; border-top: 1px solid #d1d5db; min-width: 0; }
.read-more-btn { margin: 0 12px; border: 1px solid #d1d5db; background: #f9fafb; color: #1f2937; border-radius: 8px; padding: 8px 14px; font-size: 14px; font-weight: 600; cursor: pointer; }

/* Organizer / Venue sections — full info cards, not small link chips.
   Mirrors the "related listing card" pattern used elsewhere on the site
   (logo, badges, name, location, phone), since an organizer or venue IS
   a directory listing (or, for a custom venue, a plain equivalent block). */
.entity-info-section { margin-top: 24px; }
.entity-info-section h3 { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 10px; }
.entity-info-card { display: flex; gap: 14px; align-items: flex-start; border: 2px solid #045093; border-radius: 10px; padding: 14px; text-decoration: none; color: inherit; transition: box-shadow 0.15s ease; }
.entity-info-card:hover { box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
.entity-info-card-logo { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: #f3f4f6; }
.entity-info-card-body { min-width: 0; flex: 1; }
.entity-info-card-badges { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 4px; }
.entity-info-card-name { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 2px; }
.entity-info-card-line { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #4b5563; margin-top: 2px; }
.entity-info-card-static { border-color: #e5e7eb; cursor: default; }
.entity-info-card-static:hover { box-shadow: none; }

.additional-info-table { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.additional-info-row { display: grid; grid-template-columns: minmax(120px, 1fr) minmax(0, 2fr); gap: 16px; padding: 10px 14px; border-bottom: 1px solid #f3f4f6; }
.additional-info-row:last-child { border-bottom: none; }
.additional-info-row:nth-child(even) { background: #f9fafb; }

.map-fallback { display: none; margin-top: 12px; padding: 12px; border-radius: 8px; background: #f9fafb; border: 1px solid #e5e7eb; color: #4b5563; font-size: 14px; }
.map-fallback.visible { display: block; }
.location-section.map-unavailable #eventMap { display: none; }
#eventMap { width: 100%; height: 400px; border-radius: 8px; pointer-events: none; }
#eventMap.active { pointer-events: auto; }
#eventMap, #eventMap .leaflet-pane, #eventMap .leaflet-top, #eventMap .leaflet-bottom, #eventMap .leaflet-control { z-index: 1 !important; }

/* Ticket / RSVP + date-time block — event-specific, no listing
   equivalent, styled to match the same visual language (rounded pill
   chips, brand blue accents) as everything else on the page. */
.event-datetime-block { display: flex; align-items: flex-start; gap: 10px; background: #f9fafb; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; }
.event-datetime-icon { flex-shrink: 0; margin-top: 2px; }
.event-date-label { font-weight: 700; color: #111827; font-size: 15px; }
.event-time-label { color: #4b5563; font-size: 14px; margin-top: 2px; }
.event-recurrence-label { color: #6b7280; font-size: 13px; margin-top: 4px; font-style: italic; }
.event-price-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.event-price-chip { font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; background: white; color: #045093; border: 1px solid #bfdbfe; }
.event-price-free { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
.event-price-rsvp { background: #fef3c7; color: #92400e; border-color: #fde68a; }
.event-capacity-note { font-size: 13px; color: #6b7280; margin-top: 6px; }

.mobile-cta-bar { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0 0 24px; }
.mobile-cta-button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 12px; border-radius: 8px; color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; }

.desktop-listing-layout { display: block; }
.desktop-main-column, .desktop-side-column { min-width: 0; }
.desktop-contact-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; }
.action-cta-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.action-cta-slot { flex: 1 1 0; display: flex; min-width: 140px; }
.action-cta-slot > * { width: 100%; min-height: 44px; }

.share-button { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; transition: all 0.3s; text-decoration: none; cursor: pointer; border: none; outline: none; box-shadow: none; }
.share-button:hover { transform: scale(1.1); }
.social-facebook { background: #1877F2; color: white; }
.social-twitter { background: #000000; color: white; }
.social-linkedin { background: #0077B5; color: white; }
.social-other { background: #045093; color: white; }
.share-sms { background: #10b981; color: white; }
.share-email { background: #ea580c; color: white; }

.claim-listing-section { margin-top: 1.5rem; }
#shareModal { opacity: 0; transition: opacity 0.2s ease; }
#shareModal .share-modal-panel { transform: scale(0.96); transition: transform 0.2s ease; border-radius: 1rem; overflow: hidden; }
#shareModal.active { opacity: 1; }
#shareModal.active .share-modal-panel { transform: scale(1); }
#shareModalButtons { margin-top: -4px; }

.star-icon-unused { display: none; }

@media (min-width: 1024px) {
    .desktop-listing-layout { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(320px, 1fr); gap: 24px; align-items: start; }
    .desktop-side-column { position: sticky; top: 72px; margin-top: 0; }
}
@media (max-width: 1023px) { .desktop-side-column { margin-top: 24px; } }
@media (max-width: 767px) {
    .desktop-listing-layout { display: flex; flex-direction: column; }
    .desktop-main-column { display: flex; flex-direction: column; }
    .desktop-main-column > * { width: 100%; }
    .listing-main-header { order: 1; }
    .mobile-cta-wrap { order: 2; display: block; }
    .listing-description-wrap { order: 3; }
    #locationSection { order: 4; }
    .desktop-side-column { position: static; order: 5; margin-top: 0; }
    #additionalInfoSectionWrap { order: 6; }
    #organizerVenueSection { order: 7; }
    .claim-listing-section { order: 8; }
}

@media (prefers-color-scheme: dark) {
    body { background: #1a1a1a; color: #e5e7eb; }
    header { background: #2a2a2a !important; border-color: #3a3a3a; }
    .bg-white { background: #2a2a2a !important; }
    .bg-gray-50 { background: #1a1a1a !important; }
    .text-gray-900 { color: #e5e7eb !important; }
    .text-gray-700 { color: #b0b0b0 !important; }
    .text-gray-600 { color: #999 !important; }
    .border-gray-300 { border-color: #404040 !important; }
    .shadow-sm, .shadow, .shadow-lg, .card-shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.5) !important; }
    img { pointer-events: none; user-select: none; -webkit-user-drag: none; }
    .leaflet-container { background: #1a1a1a; }
    .leaflet-popup-content-wrapper { background: #2a2a2a !important; color: #e5e5e5 !important; }
    .leaflet-popup-tip { background: #2a2a2a !important; }
    .listing-description { background: #2a2a2a; border-color: #404040; }
    .listing-description.collapsed::after { background: linear-gradient(to bottom, rgba(42,42,42,0), rgba(42,42,42,1)); }
    .description-divider-line, .additional-info-table, .additional-info-row { border-color: #404040; }
    .description-divider { background: #2a2a2a !important; border-color: #404040 !important; }
    .additional-info-row:nth-child(even), .map-fallback, .read-more-btn, .desktop-contact-card, .event-datetime-block { background: #1f1f1f; color: #e5e7eb; border-color: #404040; }
    .entity-info-card-static { border-color: #404040; }
}

</style>
</head>
<body class="bg-gray-50">

<div data-partial="header"></div>

<main class="max-w-5xl mx-auto px-4 pt-20 pb-10">
    <div class="event-poster-frame card-shadow mb-6">
        ${posterImage
            ? `<img class="event-poster-image" src="${escapeHtml(posterImage)}" alt="${escapeHtml(decodedTitle)}">`
            : '<div class="event-poster-placeholder"><span>No poster uploaded</span></div>'}
    </div>

    <div class="bg-white rounded-lg p-6 card-shadow">
        <div class="desktop-listing-layout">
            <div class="desktop-main-column">
                <div class="listing-main-header">
                    <div class="flex items-center gap-2 mb-3 flex-wrap">
                        ${event.category ? `<span class="text-sm font-semibold px-3 py-1 rounded-full text-white category-pill" style="background-color:#045093;">${escapeHtml(event.category)}</span>` : ''}
                        ${tierBadge}
                        ${timingBadge}
                    </div>
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">${escapeHtml(decodedTitle)}</h1>
                    ${decodedTagline ? `<h2 class="text-gray-600 italic text-xl font-semibold mb-2">${escapeHtml(decodedTagline)}</h2>` : ''}
                </div>

                <div class="mobile-cta-wrap md:hidden">
                    <div class="mobile-cta-bar">
                        ${ticketRsvpMobile}
                        ${directionsMobile}
                    </div>
                </div>

                ${description ? `
                <div class="listing-description-wrap">
                    <div class="listing-description" id="eventDescription">${description}</div>
                    <div class="description-divider">
                        <span class="description-divider-line"></span>
                        <button type="button" id="eventReadMoreBtn" class="read-more-btn hidden">Read more</button>
                        <span class="description-divider-line"></span>
                    </div>
                </div>` : ''}

                ${organizerVenueSection}
                ${mapSection}
                ${additionalInfoSection}
                ${shareButtonsHidden}
            </div>

            <div class="desktop-side-column hidden md:block">
                <div class="desktop-contact-card">
                    ${dateTimeBlock}
                    ${priceRow.length ? `<div class="event-price-row">${priceRow.join('')}</div>${capacityNote}` : capacityNote}

                    ${hasSidebarContact ? `<div class="space-y-3 mb-4 mt-4">${addressSection}${phoneSection}${emailSection}${websiteSection}</div>` : ''}

                    <div class="action-cta-row mt-4">
                        ${[ticketRsvpDesktop, directionsDesktop, shareTriggerButton].filter(Boolean).map((btn) => `<div class="action-cta-slot">${btn}</div>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<!-- Share Modal — identical structure/behavior to listing pages' #shareModal (see js/listing-page.js's openShareModal/closeShareModal/shareNative/copyShareLink) -->
<div id="shareModal" class="hidden fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50 p-4" onclick="if(event.target===this) closeShareModal()">
    <div class="share-modal-panel bg-white max-w-md w-full p-6">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900">Share this event</h3>
            <button onclick="closeShareModal()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div id="shareModalButtons" class="flex flex-wrap gap-2 mb-4"></div>
        <div class="flex items-center gap-2 mb-2">
            <input type="text" id="shareLinkInput" readonly value="${eventUrl}" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
            <button onclick="copyShareLink()" class="px-4 py-2 text-white rounded-lg text-sm font-medium hover-bounce" style="background-color:#045093;">Copy</button>
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" id="shortenUrlToggle" class="w-4 h-4">
            <span>Use short link</span>
        </label>
        <p id="shareCopyLabel" class="text-sm text-green-600 mt-2 h-4"></p>
    </div>
</div>

<div data-partial="footer"></div>

<script>${currentEventDataScript}</script>
<script src="/js/partials-loader.js"></script>
<script src="/js/pwa/directions.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="/js/event-page.js"></script>
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
