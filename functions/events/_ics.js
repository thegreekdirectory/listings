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
    const MAX_OCTETS = 75;
    if (Buffer.byteLength(line, 'utf8') <= MAX_OCTETS) return line;

    const folded = [];
    let current = '';
    let currentBytes = 0;
    for (const ch of line) {
        const chBytes = Buffer.byteLength(ch, 'utf8');
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
function buildVEvent({ event, organizerName, venueName, venueAddress, siteBaseUrl }) {
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
    if (organizerName) descriptionParts.push(`Organized by ${organizerName}`);
    if (siteBaseUrl) descriptionParts.push(`Details: ${siteBaseUrl}/event/${event.slug}`);
    if (descriptionParts.length) {
        lines.push(foldLine(`DESCRIPTION:${escapeIcsText(descriptionParts.join('\n'))}`));
    }

    const locationParts = [venueName, venueAddress || event.address, event.city, event.state].filter(Boolean);
    if (locationParts.length) {
        lines.push(foldLine(`LOCATION:${escapeIcsText(locationParts.join(', '))}`));
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
