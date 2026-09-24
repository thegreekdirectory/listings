/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// functions/events/_ics.js
//
// Shared RFC 5545 (iCalendar) generation. Used by:
//   - functions/events/feed.ics.js (the public, multi-event subscribe feed)
//   - functions/event/[[slug]].js (the single-event Apple/Generic "Add to
//     Calendar" download option — Google/Outlook/Yahoo use plain web
//     links instead, since those services don't accept file uploads for
//     this purpose, but Apple Calendar genuinely has no URL-based
//     event-creation format at all; a real .ics file is the only option
//     there, confirmed while researching this feature)
//
// One module, not two independent copies, because RFC 5545 has several
// easy-to-get-wrong details that silently break real consumers rather
// than throwing a visible error:
//   - CRLF line endings, not bare LF. Apple Calendar has been reported
//     to load an LF-only feed and silently drop every event; Outlook
//     has been reported to reject the whole file outright. Neither
//     failure mode is visible from this codebase's own testing — it
//     only shows up in the actual consuming calendar app.
//   - Lines folded at 75 octets (a continuation line starts with a
//     single space) — most real feeds stay under this per-property, but
//     a long DESCRIPTION genuinely can exceed it.
//   - TEXT-value escaping: backslash, comma, and semicolon need a
//     backslash escape; a real newline inside a value needs to become
//     the two literal characters \n (backslash-n), not an actual CR/LF,
//     since the field itself would otherwise be split into an invalid
//     multi-line property.
//   - Every VEVENT needs UID (globally unique, stable across re-fetches
//     of the feed — this uses the event's real database UUID, so a
//     subscriber's calendar app correctly recognizes "this is the same
//     event as before" across refreshes rather than creating a
//     duplicate) and DTSTAMP (when this ICS record was generated — NOT
//     the event's start time, a distinct and easy-to-conflate field).

function foldLine(line) {
    // RFC 5545 §3.1: lines SHOULD NOT exceed 75 octets, excluding the
    // line break itself. Continuation lines are folded with a leading
    // single space, which consuming parsers strip back out.
    //
    // Uses TextEncoder for UTF-8 byte length, not Buffer.byteLength —
    // Buffer is a Node.js API and is NOT a global in Cloudflare Workers
    // by default (confirmed: this caused a real production "Worker
    // threw exception" / ReferenceError, since nothing in this project
    // enables nodejs_compat or imports Buffer explicitly). TextEncoder
    // is a standard Web API, available in Workers, Node, and browsers
    // alike with no compatibility flag needed — verified byte-identical
    // output to Buffer.byteLength across ASCII, multi-byte Greek text,
    // and emoji before making this swap.
    const byteLength = (str) => new TextEncoder().encode(str).length;
    const MAX_OCTETS = 75;
    if (byteLength(line) <= MAX_OCTETS) return line;

    const folded = [];
    let current = '';
    let currentBytes = 0;
    for (const ch of line) {
        const chBytes = byteLength(ch);
        if (currentBytes + chBytes > MAX_OCTETS) {
            folded.push(current);
            current = ' ' + ch; // continuation line prefix
            currentBytes = 1 + chBytes;
        } else {
            current += ch;
            currentBytes += chBytes;
        }
    }
    if (current) folded.push(current);
    return folded.join('\r\n');
}

function escapeIcsText(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r\n|\r|\n/g, '\\n');
}

function toIcsUtcDate(dateInput) {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return '';
    // toISOString gives e.g. "2026-09-01T18:00:00.000Z" — strip the
    // punctuation and milliseconds to get RFC 5545's basic UTC form.
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Builds one VEVENT block (without BEGIN:VCALENDAR/END:VCALENDAR — the
// caller wraps one or more of these in that envelope). `event` is a row
// from the events table (or the subset of fields the caller has
// available); `organizerName`/`venueName`/`venueAddress` are pre-resolved
// by the caller, since resolving the FK to a listing is caller-specific
// (the feed resolves many at once via a join-like batch fetch; the
// single-event page already has organizerListing/venueListing in scope).
// `venueZip`/`venueCountry` follow the exact same caller-resolves-the-FK
// convention as `venueAddress` — same reasoning, so the venue's own zip/
// country (when the event has a linked venue listing) take precedence
// over the event row's own address fields, exactly like venueAddress
// already does for the street address.
//
// event.country is the { name: "United States", code: "US" } jsonb shape
// events.country stores (see functions/events/_countries.js); venueCountry
// (from a linked venue listing's own listings.country column) is instead
// a plain legacy text string like "USA" — buildVEvent's own
// toCountryName() helper normalizes either shape to plain display text,
// since only the human-readable name is needed for LOCATION/X-ADDRESS,
// never a machine code.


function stripHtml(html) {
    if (!html) return '';

    // Remove HTML tags
    let text = html.replace(/<\/?[^>]+(>|$)/g, "");

    // Map of common HTML entities to decode
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'"
    };

    // Replace the entities found in the text
    return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, match => entities[match]);
}



function buildVEvent({ event, organizerName, venueName, venueAddress, venueZip, venueCountry, siteBaseUrl }) {
    const now = new Date();
    const lines = [];
    lines.push('BEGIN:VEVENT');
    lines.push(foldLine(`UID:${event.id}@thegreekdirectory.org`));
    lines.push(foldLine(`DTSTAMP:${toIcsUtcDate(now)}`));
    lines.push(foldLine(`DTSTART:${toIcsUtcDate(event.start_at)}`));

    // No default-duration assumption here (unlike getEventTimingState's
    // 3-hour default for the "happening now" badge) — a calendar entry
    // with no real end time is legitimately better left open-ended
    // (DTEND omitted) than silently given an invented end time the
    // event owner never specified. The 3-hour badge default solves a
    // different problem (a live/past status needs SOME boundary to be
    // meaningful at all); a calendar entry doesn't have that same
    // requirement — plenty of real calendar events have no end time.
    if (event.end_at) {
        lines.push(foldLine(`DTEND:${toIcsUtcDate(event.end_at)}`));
    }

    lines.push(foldLine(`SUMMARY:${escapeIcsText(event.title)}`));

    const descriptionParts = [];
    if (event.tagline) descriptionParts.push(event.tagline);
    if (event.description) descriptionParts.push(stripHtml(event.description));
    if (organizerName) descriptionParts.push(`Organized by ${organizerName}`);
    if (siteBaseUrl) descriptionParts.push(`Details: ${siteBaseUrl}/event/${event.slug}`);
    if (descriptionParts.length) {
        lines.push(foldLine(`DESCRIPTION:${escapeIcsText(descriptionParts.join('\n'))}`));
    }

    // Venue's own zip/country (when this event has a linked venue
    // listing) take precedence over the event row's own zip_code/country
    // — same fallback direction venueAddress already uses above, and for
    // the same reason: a venue listing's address fields are the more
    // authoritative source once one is linked, and the event's own
    // address fields exist specifically for events with no venue listing
    // (a custom/free-text venue) or ones overriding the venue's address.
    const zipCode = venueZip || event.zip_code;
    // Country can arrive in two different shapes depending on where it's
    // from: events.country is the { name, code } jsonb object described
    // above, but a linked venue's country comes from listings.country,
    // which is a plain legacy text column (e.g. "USA" — see
    // supabase/edge-functions README's referenced schema audit), not the
    // { name, code } shape. toCountryName() below normalizes either
    // shape to a plain display string so callers can pass either kind of
    // value through without needing to know which one applies. Genuinely
    // ambiguous which one wins when a linked venue's plain-text country
    // conflicts with the event's own recorded country — venue precedence
    // is kept consistent with how zipCode/venueAddress/venueZip already
    // resolve that same conflict above.
    const toCountryName = (value) => {
        if (!value) return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && value.name) return value.name;
        return null;
    };
    const countryName = toCountryName(venueCountry) || toCountryName(event.country);

    const locationParts = [venueName, venueAddress || event.address, event.city, event.state, zipCode, countryName].filter(Boolean);
    const locationText = locationParts.length ? locationParts.join(', ') : '';
    if (locationText) {
        lines.push(foldLine(`LOCATION:${escapeIcsText(locationText)}`));
    }

    // Apple Calendar's own structured-location extension — gives Apple's
    // apps a real pin (with an approximate radius) on top of the plain
    // LOCATION text property above, rather than relying on Apple's own
    // best-effort geocoding of the LOCATION string. Only emitted when
    // real coordinates exist (nothing else here can produce a valid
    // geo: URI) and only when there's a LOCATION to describe in the
    // first place — an X-ADDRESS with no corresponding LOCATION would be
    // a structured location for an address this file never actually
    // states, which is more likely to confuse a calendar app than help
    // it.
    //
    // RFC 5545 doesn't define this property at all (it's an Apple/Cyrus
    // extension, X- prefixed as the RFC requires for non-standard
    // properties) — the format below is deliberately NOT what an initial
    // reading of a couple of one-off examples might suggest (some
    // examples circulating show X-ADDRESS/X-TITLE wrapped in DQUOTEs).
    // Checked directly against Apple Calendar's own real macOS-generated
    // output (captured verbatim in a long-running Apple bug-tracker
    // thread on this exact property) and a maintained third-party
    // generator library's own tests, both confirm: X-ADDRESS and X-TITLE
    // are plain (unquoted) parameter values with the SAME backslash
    // escaping as a property's own TEXT value (comma/semicolon/newline),
    // not DQUOTE-wrapped strings. This also matches RFC 5545 §3.2's own
    // param-value grammar (verified against the RFC text directly): a
    // quoted-string parameter value cannot legally contain a DQUOTE
    // character at all (not even escaped), which a venue or organization
    // name genuinely could someday contain — an unquoted, backslash-
    // escaped value has no such restriction and is what this codebase's
    // own escapeIcsText already produces correctly for LOCATION. Kept
    // this way rather than DQUOTE-wrapped for real Apple Calendar
    // fidelity, not just RFC-technical correctness. X-APPLE-RADIUS of 50
    // (meters) mirrors a commonly-seen single-building venue pin size —
    // deliberately not configurable per-event, since this codebase has
    // no per-event radius concept and one exists nowhere else in this
    // system either.
    if (locationText && event.coordinates && typeof event.coordinates.lat === 'number' && typeof event.coordinates.lng === 'number') {
        const structuredTitle = venueName || event.custom_venue_name || event.title;
        lines.push(foldLine(
            `X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-ADDRESS=${escapeIcsText(locationText)};X-APPLE-RADIUS=50;X-TITLE=${escapeIcsText(structuredTitle)}:geo:${event.coordinates.lat},${event.coordinates.lng}`
        ));
    }

    if (siteBaseUrl) {
        lines.push(foldLine(`URL:${siteBaseUrl}/event/${event.slug}`));
    }

    const statusMap = { cancelled: 'CANCELLED', scheduled: 'CONFIRMED', postponed: 'TENTATIVE', sold_out: 'CONFIRMED' };
    lines.push(`STATUS:${statusMap[event.status] || 'CONFIRMED'}`);

    lines.push('END:VEVENT');
    return lines.join('\r\n');
}

// Wraps one or more VEVENT blocks in a full VCALENDAR. calendarName is
// the X-WR-CALNAME subscribers see in their calendar app's sidebar.
function buildVCalendar(vevents, calendarName) {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//The Greek Directory//Events//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        foldLine(`X-WR-CALNAME:${escapeIcsText(calendarName)}`),
        ...vevents,
        'END:VCALENDAR',
    ];
    // Every line CRLF-terminated, including the final one — several
    // real-world parser reports (found while researching this feature)
    // specifically call out a bare-LF or missing-final-CRLF file as a
    // silent-failure trigger in Apple Calendar and an outright rejection
    // in Outlook.
    return lines.join('\r\n') + '\r\n';
}

export { escapeIcsText, toIcsUtcDate, buildVEvent, buildVCalendar, foldLine };
