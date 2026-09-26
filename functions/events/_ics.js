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

// Formats a UTC instant (events.start_at/end_at, stored as timestamptz —
// an absolute instant, timezone-agnostic in storage) as RFC 5545's
// LOCAL-time form for a given IANA zone (events.timezone — a genuinely
// separate column recording which zone this event's wall-clock time
// should be read in). Returns the bare "YYYYMMDDTHHMMSS" local time —
// the caller is responsible for prefixing the DTSTART/DTEND property
// with `;TZID=<zone>:` (see buildVEvent below); this function only
// computes the local digits.
//
// RFC 5545 §3.3.5 defines exactly three DATE-TIME forms: floating (no
// Z, no TZID — "local to nothing in particular," genuinely ambiguous),
// UTC (trailing Z — what toIcsUtcDate above produces, REQUIRED for
// DTSTAMP/CREATED/LAST-MODIFIED, which the RFC does not allow to carry
// a TZID at all), and this one — TZID-qualified local time, correct for
// DTSTART/DTEND when an event has a real, known timezone (which every
// row here does — events.timezone is NOT NULL with an
// 'America/Chicago' default). A bare local-time string with no zone
// information at all (the "floating" form) would be genuinely wrong
// here, not just less precise — a floating time means "this same clock
// time, whatever zone the viewer happens to be in," which is NOT what
// this data represents (a Chicago event has one specific real start
// moment, correctly anchored by TZID to the zone it's actually in).
//
// Uses Intl.DateTimeFormat with the timeZone option — the only
// correct, DST-aware way to do this conversion; a fixed UTC offset
// would silently break twice a year at DST transitions. Standard Web
// API, available in Cloudflare Workers with no compatibility flag,
// consistent with foldLine's own TextEncoder choice above for the same
// "avoid Node-specific globals" reason.
function toIcsZonedLocalDate(dateInput, timeZone) {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return '';
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const get = (type) => parts.find((p) => p.type === type)?.value || '';
    // Defensive normalization: hour12: false's midnight representation
    // ("00" vs "24") has genuinely varied across JS engines/ICU
    // versions historically. Verified "00" on this codebase's own
    // tested runtime, but since this ships to Cloudflare Workers (a
    // different engine than whatever tested it), coercing a stray "24"
    // to "00" costs nothing and removes the risk entirely rather than
    // trusting one runtime's observed behavior to hold everywhere.
    const hour = get('hour') === '24' ? '00' : get('hour');
    return `${get('year')}${get('month')}${get('day')}T${hour}${get('minute')}${get('second')}`;
}

// Builds one VEVENT block (without BEGIN:VCALENDAR/END:VCALENDAR — the
// caller wraps one or more of these in that envelope). `event` is a row
// from the events table (or the subset of fields the caller has
// available); `organizerName`/`venueName`/`venueAddress` are pre-resolved
// by the caller, since resolving the FK to a listing is caller-specific
// (the feed resolves many at once via a join-like batch fetch; the
// single-event page already has organizerListing/venueListing in scope).
// `venueZip` follows the exact same caller-resolves-the-FK convention as
// `venueAddress` — same reasoning, so the venue's own zip (when the
// event has a linked venue listing) takes precedence over the event
// row's own zip_code, exactly like venueAddress already does for the
// street address. `venueCountry` is accepted for the same reason but is
// NOT given that same venue-wins precedence — see the country-resolution
// comment inside this function for why country specifically resolves in
// the opposite direction (event's own value wins).
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
    // CREATED/DTSTAMP/LAST-MODIFIED stay UTC (Z) always — RFC 5545 does
    // not permit a TZID on these three properties, unlike DTSTART/DTEND
    // below. DTSTAMP is "when this ICS record was generated" (now, every
    // time this function runs — NOT the event's own timestamps);
    // CREATED/LAST-MODIFIED instead reflect the underlying event row's
    // own created_at/updated_at, when the caller has them (a caller
    // fetching a narrower column set — e.g. feed.ics.js's own select —
    // may not; both are omitted rather than guessed when absent, same
    // "don't invent what wasn't provided" posture as DTEND's own
    // no-default-duration comment below).
    if (event.created_at) lines.push(foldLine(`CREATED:${toIcsUtcDate(event.created_at)}`));
    lines.push(foldLine(`DTSTAMP:${toIcsUtcDate(now)}`));

    // events.timezone is NOT NULL with an 'America/Chicago' default, so
    // this fallback is purely defensive (a caller passing a partial
    // event object, not a real gap in the schema) — kept equal to the
    // column's own DB default so behavior is identical either way.
    const eventTimeZone = event.timezone || 'America/Chicago';
    lines.push(foldLine(`DTSTART;TZID=${eventTimeZone}:${toIcsZonedLocalDate(event.start_at, eventTimeZone)}`));

    // No default-duration assumption here (unlike getEventTimingState's
    // 3-hour default for the "happening now" badge) — a calendar entry
    // with no real end time is legitimately better left open-ended
    // (DTEND omitted) than silently given an invented end time the
    // event owner never specified. The 3-hour badge default solves a
    // different problem (a live/past status needs SOME boundary to be
    // meaningful at all); a calendar entry doesn't have that same
    // requirement — plenty of real calendar events have no end time.
    if (event.end_at) {
        lines.push(foldLine(`DTEND;TZID=${eventTimeZone}:${toIcsZonedLocalDate(event.end_at, eventTimeZone)}`));
    }

    if (event.updated_at) lines.push(foldLine(`LAST-MODIFIED:${toIcsUtcDate(event.updated_at)}`));
    // 0 (never revised), matching Apple's own value in the reference
    // export — this codebase has no real per-event revision counter to
    // report a more meaningful number from, so 0 is the honest default
    // rather than a fabricated one.
    lines.push('SEQUENCE:0');

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
    // above (curated through this system's own admin/submit/edit country
    // dropdown — see functions/events/_countries.js), but a linked
    // venue's country comes from listings.country, a much older, plain
    // legacy text column with no fixed format at all — confirmed against
    // real data to contain values like the bare abbreviation "USA"
    // rather than a full name or a real ISO code. Unlike zipCode/
    // venueAddress above (where the VENUE's own address fields are the
    // more authoritative source, since they describe a specific physical
    // place more precisely than an event row might), country is
    // deliberately NOT resolved the same way: the event's own governed,
    // dropdown-selected value takes precedence over a venue's
    // inconsistent legacy text, falling back to the venue's value only
    // when the event itself has none recorded. Confirmed necessary
    // against this directory's own real "Example Event"/"Eagle
    // Restaurant" data: the venue listing's country is the bare string
    // "USA", but the correct calendar output is the full name "United
    // States" — which only exists on the event's own country field, not
    // the venue's.
    const toCountryName = (value) => {
        if (!value) return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && value.name) return value.name;
        return null;
    };
    const countryName = toCountryName(event.country) || toCountryName(venueCountry);

    // Address text (street/city/state+zip/country) WITHOUT the venue
    // name — used both as LOCATION's own address portion (joined to the
    // venue name with \n below) and as X-ADDRESS's entire value (Apple's
    // own X-APPLE-STRUCTURED-LOCATION never repeats the venue name inside
    // X-ADDRESS; that's what X-TITLE is for — confirmed directly against
    // a real Apple Calendar export of a directory venue, not assumed).
    //
    // State and zip are joined by a bare double space with NO comma
    // between them ("IL  60515", not "IL, 60515") — this looks unusual
    // but is exactly what that same real export does for both LOCATION
    // and X-ADDRESS; every OTHER segment boundary uses ", ". Kept
    // exactly as observed rather than "corrected" to a single space or
    // a comma, since matching Apple's own real formatting was the
    // explicit goal here, not fixing what might look like a typo in it.
    const stateZip = [event.state, zipCode].filter(Boolean).join('  ');
    const addressOnlyParts = [venueAddress || event.address, event.city, stateZip, countryName].filter(Boolean);
    const addressOnlyText = addressOnlyParts.join(', ');

    // LOCATION = venue name + address, joined by a real newline (encoded
    // as the two literal characters \n via escapeIcsText below) — NOT a
    // comma the way an earlier version of this file joined every segment
    // uniformly. Confirmed against the same real export: LOCATION reads
    // "Eagle Restaurant" then a line break then the full address, not
    // "Eagle Restaurant, 406 Maple Ave, ...".
    const locationParts = [venueName, addressOnlyText].filter(Boolean);
    const locationText = locationParts.length ? locationParts.join('\n') : '';
    if (locationText) {
        lines.push(foldLine(`LOCATION:${escapeIcsText(locationText)}`));
    }

    // Apple Calendar's own structured-location extension — gives Apple's
    // apps a real pin (with an approximate radius) on top of the plain
    // LOCATION text property above, rather than relying on Apple's own
    // best-effort geocoding of the LOCATION string. Only emitted when
    // real coordinates exist (nothing else here can produce a valid
    // geo: URI) and only when there's an address to describe in the
    // first place — an X-ADDRESS with nothing behind it would be a
    // structured location for an address this file never actually
    // states, which is more likely to confuse a calendar app than help
    // it.
    //
    // RFC 5545 doesn't define this property at all (it's an Apple/Cyrus
    // extension, X- prefixed as the RFC requires for non-standard
    // properties). An EARLIER version of this comment claimed, based on
    // several third-party examples and a bug-tracker thread, that real
    // Apple output leaves X-ADDRESS/X-TITLE UNQUOTED. A genuine Apple
    // Calendar export of one of this directory's own venues (Eagle
    // Restaurant, Downers Grove — supplied directly by the site owner,
    // not sourced from a third party) shows the OPPOSITE for X-ADDRESS:
    // DQUOTE-wrapped, with its commas left BARE (no backslash escaping)
    // inside the quotes — consistent with RFC 5545 §3.2's own
    // quoted-string param-value grammar, where comma/semicolon/colon are
    // ordinary QSAFE-CHARs that need no escaping once quoted (escaping
    // them would be someone else's convention bleeding in, not this
    // one). X-TITLE in that SAME real export is left UNQUOTED, because
    // "Eagle Restaurant" contains nothing that needs quoting — DQUOTEs
    // appear to be added only when the value actually contains a comma,
    // semicolon, or colon (a plain identifier doesn't need them). This
    // file now follows the real example rather than the earlier
    // (evidently wrong, or at least not universally true) research:
    // X-ADDRESS is always quoted (it's built from LOCATION-style address
    // segments, which routinely contain commas); X-TITLE is quoted ONLY
    // when it actually needs it. A quoted-string value can never itself
    // contain a literal DQUOTE character (RFC 5545 grammar, verified
    // directly against the RFC text) — a venue/organizer name containing
    // one is escaped to a single-quote here rather than left able to
    // prematurely terminate the quoted parameter, which would silently
    // corrupt the rest of the property line.
    //
    // X-APPLE-MAPKIT-HANDLE (present in the real export) is deliberately
    // NOT reproduced here — it's an opaque, Apple-internal serialized
    // reference into Apple's own MapKit place database, generated only
    // when Apple's OWN app resolves a location through a live MapKit
    // lookup. There's no public spec for its contents, and no way to
    // construct a genuine one from directory data alone; a fabricated
    // value that merely looks similar risks being actively misleading
    // (or rejected) rather than simply absent, so it's omitted rather
    // than guessed at. X-APPLE-RADIUS's value in that same export
    // (141.17...meters) is similarly MapKit's own computed footprint for
    // that one specific real building — not a number this codebase has
    // any way to derive — so a fixed, disclosed default (50m, roughly a
    // single-building pin) is used instead of attempting to fake
    // precision this system doesn't have. X-APPLE-REFERENCEFRAME=1 is
    // reproduced as-is: a static value with no per-event meaning to
    // derive, present in the real export.
    if (locationText && event.coordinates && typeof event.coordinates.lat === 'number' && typeof event.coordinates.lng === 'number') {
        const structuredTitle = venueName || event.custom_venue_name || event.title;
        // A DQUOTE can never appear inside a quoted-string parameter
        // value at all (RFC 5545 grammar excludes it, even escaped) — a
        // literal " in a venue/organizer name is mapped to a single
        // quote rather than dropped or left to corrupt the line.
        const quotedParamSafe = (value) => String(value).replace(/"/g, "'");
        const needsQuoting = (value) => /[,;:]/.test(String(value));
        const titleParam = needsQuoting(structuredTitle)
            ? `"${quotedParamSafe(structuredTitle)}"`
            : quotedParamSafe(structuredTitle);
        lines.push(foldLine(
            `X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-ADDRESS="${quotedParamSafe(addressOnlyText)}";X-APPLE-RADIUS=50;X-APPLE-REFERENCEFRAME=1;X-TITLE=${titleParam}:geo:${event.coordinates.lat},${event.coordinates.lng}`
        ));
    }

    if (siteBaseUrl) {
        // VALUE=URI is REQUIRED here to match the real example exactly
        // (URL;VALUE=URI:https://...) — RFC 5545's own default VALUE
        // type for URL is already URI, so this parameter is technically
        // redundant, but Apple's own generator includes it explicitly
        // and "just like the example" means matching that, not relying
        // on an implicit default it doesn't rely on itself.
        lines.push(foldLine(`URL;VALUE=URI:${siteBaseUrl}/event/${event.slug}`));
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
