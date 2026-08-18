/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// functions/edit/event.js
//
// Cloudflare Pages Function. Route: GET/POST /edit/event?id=<event uuid>
//
// Mirrors suggest-edit.html's real shape: a pre-filled copy of the
// event's current fields (fetched server-side by id, service role) that
// a visitor edits to describe what should change, plus "Your
// Information" (suggester_name/email/phone/message). Server-side by
// explicit instruction — the only write path to public.event_suggestions,
// which (like event_requests) has no public INSERT policy.
//
// GET with no id, an invalid id, or an id that doesn't match any event
// renders a clear error instead of a blank/broken form. POST re-renders
// the same pre-filled form with an error message on validation failure,
// so a mistake doesn't lose everything already typed.

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const eventId = (url.searchParams.get('id') || '').trim();
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!eventId) {
        return htmlResponse(renderError('This link is missing an event to edit. Please use the "Suggest an Edit" link on the event page you want to correct.'), 400);
    }
    if (!serviceRoleKey) {
        return htmlResponse(renderError('This form is temporarily unavailable. Please try again shortly.'), 500);
    }

    let event;
    try {
        event = await fetchEventById(eventId, serviceRoleKey);
    } catch (err) {
        console.error('Event fetch failed:', err);
        return htmlResponse(renderError('We could not load this event right now. Please try again shortly.'), 502);
    }
    if (!event) {
        return htmlResponse(renderError('We could not find that event. It may have been removed.'), 404);
    }

    return htmlResponse(renderForm(event, eventId, {}));
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const eventId = (url.searchParams.get('id') || '').trim();
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!eventId) {
        return htmlResponse(renderError('This link is missing an event to edit.'), 400);
    }
    if (!serviceRoleKey) {
        return htmlResponse(renderError('This form is temporarily unavailable. Please try again shortly.'), 500);
    }

    let event;
    try {
        event = await fetchEventById(eventId, serviceRoleKey);
    } catch (err) {
        return htmlResponse(renderError('We could not load this event right now. Please try again shortly.'), 502);
    }
    if (!event) {
        return htmlResponse(renderError('We could not find that event. It may have been removed.'), 404);
    }

    let form;
    try {
        form = await request.formData();
    } catch (_) {
        return htmlResponse(renderForm(event, eventId, {}, 'There was a problem reading your submission. Please try again.'));
    }

    const fields = extractFields(form);
    const validationError = validateSuggestion(fields);
    if (validationError) {
        return htmlResponse(renderForm(event, eventId, fields, validationError));
    }

    try {
        await insertEventSuggestion(eventId, event.title, fields, serviceRoleKey);
    } catch (err) {
        console.error('event_suggestions insert failed:', err);
        return htmlResponse(renderForm(event, eventId, fields, 'Something went wrong submitting your suggestion. Please try again.'));
    }

    return htmlResponse(renderSuccess());
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function fetchEventById(id, serviceRoleKey) {
    const encodedId = encodeURIComponent(id);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${encodedId}&limit=1`, {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, Accept: 'application/json' },
    });
    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Supabase REST ${response.status}: ${body.slice(0, 300)}`);
    }
    const rows = await response.json();
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

function extractFields(form) {
    const get = (name) => (form.get(name) || '').toString().trim();
    return {
        title: get('title'),
        tagline: get('tagline'),
        description: get('description'),
        category: get('category'),
        venue_name: get('venue_name'),
        address: get('address'),
        city: get('city'),
        state: get('state').toUpperCase(),
        zip_code: get('zip_code'),
        start_at: get('start_at'),
        end_at: get('end_at'),
        price_range: get('price_range'),
        ticket_url: get('ticket_url'),
        rsvp_url: get('rsvp_url'),
        contact_phone: get('contact_phone'),
        contact_email: get('contact_email'),
        website: get('website'),
        poster_image: get('poster_image'),
        suggester_name: get('suggester_name'),
        suggester_email: get('suggester_email'),
        suggester_phone: get('suggester_phone'),
        suggester_message: get('suggester_message'),
    };
}

function validateSuggestion(f) {
    if (!f.suggester_name) return 'Please enter your name.';
    if (!f.suggester_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.suggester_email)) return 'Please enter a valid email address.';
    return null;
}

// Only fields that actually differ from the current event value are
// sent through — matches listing_suggestions' own "all nullable, only
// changed fields filled in" shape, and avoids silently overwriting an
// unrelated field with a blank at admin-review time just because the
// visitor left it in its pre-filled state without touching it.
async function insertEventSuggestion(eventId, eventTitle, f, serviceRoleKey) {
    const payload = { event_id: eventId, event_title: eventTitle || null };
    const dateOrNull = (v) => (v ? new Date(v).toISOString() : null);

    const stringFields = ['title', 'tagline', 'description', 'category', 'address', 'city', 'state', 'zip_code', 'price_range', 'ticket_url', 'rsvp_url', 'contact_phone', 'contact_email', 'website', 'poster_image'];
    stringFields.forEach((key) => { if (f[key]) payload[key] = f[key]; });

    if (f.venue_name) payload.custom_venue_name = f.venue_name;
    if (f.start_at) payload.start_at = dateOrNull(f.start_at);
    if (f.end_at) payload.end_at = dateOrNull(f.end_at);

    payload.suggester_name = f.suggester_name;
    payload.suggester_email = f.suggester_email;
    payload.suggester_phone = f.suggester_phone || null;
    payload.suggester_message = f.suggester_message || null;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/event_suggestions`, {
        method: 'POST',
        headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Supabase REST ${response.status}: ${body.slice(0, 300)}`);
    }
}

function htmlResponse(html, status) {
    return new Response(html, {
        status: status || 200,
        headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-store' },
    });
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Cloudflare Pages Functions bundle each route file independently, so
// this duplicates functions/submit/event.js's own pageShell/renderError/
// renderSuccess rather than importing them — same self-containment
// reasoning already used throughout this codebase (see e.g.
// functions/event/[[slug]].js's own escapeHtml duplication note).
function pageShell(title, bodyHtml) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} | The Greek Directory</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="https://static.thegreekdirectory.org/img/logo/bluefavicon.png" media="(prefers-color-scheme: light)">
<link rel="icon" href="https://static.thegreekdirectory.org/img/logo/whitefavicon.png" media="(prefers-color-scheme: dark)">
<link rel="stylesheet" href="/css/index.css">
<link rel="stylesheet" href="/css/submit.css">
<link rel="stylesheet" href="/src/output.css">
</head>
<body class="bg-gray-50">
<div data-partial="header"></div>
<main class="submit-wrap">
${bodyHtml}
</main>
<div data-partial="footer"></div>
<script src="/js/partials-loader.js"></script>
</body>
</html>`;
}

function renderError(message) {
    return pageShell('Suggest an Edit', `
        <div class="submit-form">
            <h1>Suggest an Edit</h1>
            <p class="form-note" style="color:#dc2626;">${escapeHtml(message)}</p>
            <a href="/events" style="display:inline-block;margin-top:16px;background:#045093;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Browse Events</a>
        </div>`);
}

function renderSuccess() {
    return pageShell('Suggestion Submitted', `
        <div class="submit-form" style="text-align:center;">
            <h1>Thank you!</h1>
            <p class="form-note">Your suggestion has been submitted and will be reviewed by our team.</p>
            <a href="/events" style="display:inline-block;margin-top:16px;background:#045093;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Browse Events</a>
        </div>`);
}

function toDatetimeLocalValue(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderForm(event, eventId, f, errorMessage) {
    // Pre-fill order: whatever the visitor already typed (f, present on
    // a validation-error re-render) wins over the event's current stored
    // value, which wins over blank — so a rejected submission never
    // loses what was already entered.
    const val = (name, eventKey) => escapeHtml(f?.[name] || event?.[eventKey ?? name] || '');
    return pageShell('Suggest an Edit', `
        <form class="submit-form" method="POST" action="/edit/event?id=${escapeHtml(eventId)}">
            <h1>Suggest an Edit</h1>
            <p class="form-note">Editing: <strong>${escapeHtml(event.title || '')}</strong>. Change whatever needs correcting below and leave the rest as-is — our team reviews every suggestion before it's applied.</p>
            ${errorMessage ? `<p class="form-note" style="color:#dc2626;">${escapeHtml(errorMessage)}</p>` : ''}

            <section>
                <h2>Event Details</h2>
                <label>Event Name
                    <input type="text" name="title" value="${val('title')}">
                </label>
                <label>Tagline
                    <input type="text" name="tagline" value="${val('tagline')}">
                </label>
                <label>Description
                    <textarea name="description" rows="4">${val('description')}</textarea>
                </label>
                <label>Category
                    <input type="text" name="category" value="${val('category')}">
                </label>
            </section>

            <section>
                <h2>When &amp; Where</h2>
                <div class="form-row">
                    <label>Starts
                        <input type="datetime-local" name="start_at" value="${f?.start_at || toDatetimeLocalValue(event.start_at)}">
                    </label>
                    <label>Ends
                        <input type="datetime-local" name="end_at" value="${f?.end_at || toDatetimeLocalValue(event.end_at)}">
                    </label>
                </div>
                <label>Venue Name
                    <input type="text" name="venue_name" value="${val('venue_name', 'custom_venue_name')}">
                </label>
                <label>Street Address
                    <input type="text" name="address" value="${val('address')}">
                </label>
                <div class="form-row">
                    <label>City
                        <input type="text" name="city" value="${val('city')}">
                    </label>
                    <label>State
                        <input type="text" name="state" maxlength="2" value="${val('state')}" style="text-transform:uppercase;">
                    </label>
                    <label>Zip
                        <input type="text" name="zip_code" value="${val('zip_code')}">
                    </label>
                </div>
            </section>

            <section>
                <h2>Tickets &amp; Cost</h2>
                <label>Price Range
                    <input type="text" name="price_range" value="${val('price_range')}">
                </label>
                <label>Ticket URL
                    <input type="url" name="ticket_url" value="${val('ticket_url')}">
                </label>
                <label>RSVP URL
                    <input type="url" name="rsvp_url" value="${val('rsvp_url')}">
                </label>
            </section>

            <section>
                <h2>Contact &amp; Media</h2>
                <label>Contact Phone
                    <input type="tel" name="contact_phone" id="contact_phone" inputmode="numeric" maxlength="14" value="${val('contact_phone')}">
                </label>
                <label>Contact Email
                    <input type="email" name="contact_email" value="${val('contact_email')}">
                </label>
                <label>Website
                    <input type="url" name="website" value="${val('website')}">
                </label>
                <label>Poster Image URL
                    <input type="url" name="poster_image" value="${val('poster_image')}">
                </label>
            </section>

            <section>
                <h2>Your Information</h2>
                <label>Full Name *
                    <input type="text" name="suggester_name" required autocomplete="name" value="${escapeHtml(f?.suggester_name || '')}" placeholder="Full name">
                </label>
                <label>Email *
                    <input type="email" name="suggester_email" required autocomplete="email" value="${escapeHtml(f?.suggester_email || '')}" placeholder="you@example.com">
                </label>
                <label>Phone
                    <input type="tel" name="suggester_phone" id="suggester_phone" inputmode="numeric" maxlength="14" value="${escapeHtml(f?.suggester_phone || '')}" placeholder="(___) ___-____">
                </label>
                <label>Describe what you're changing and why
                    <textarea name="suggester_message" rows="3" placeholder="Optional">${escapeHtml(f?.suggester_message || '')}</textarea>
                </label>
            </section>

            <button type="submit" class="submit-btn">Submit Suggestion</button>
        </form>

        <script>
            (function () {
                function onlyDigits(v) { return (v || '').replace(/\\D/g, ''); }
                function formatUSPhoneNoCode(v) {
                    var d = onlyDigits(v).slice(0, 10);
                    if (!d) return '';
                    if (d.length < 4) return '(' + d;
                    if (d.length < 7) return '(' + d.slice(0, 3) + ') ' + d.slice(3);
                    return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
                }
                ['contact_phone', 'suggester_phone'].forEach(function (id) {
                    var el = document.getElementById(id);
                    if (!el) return;
                    el.addEventListener('input', function () { el.value = formatUSPhoneNoCode(el.value); });
                });
            })();
        </script>`);
}
