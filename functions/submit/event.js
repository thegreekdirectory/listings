/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// functions/submit/event.js
//
// Cloudflare Pages Function. Route: GET/POST /submit/event
//
// Server-side by explicit instruction, unlike submit-listing.html (a
// static page writing straight to Supabase from the browser via the
// anon key + a public RLS insert policy). This Function is the ONLY
// write path to public.event_requests — that table has no public
// INSERT policy at all. GET renders the form; POST validates and
// inserts using the service-role key, then renders a confirmation page.
// A native <form method="POST"> means the core submit flow works even
// with JavaScript disabled; JS only adds phone-number formatting as a
// progressive enhancement, mirroring suggest-edit.html's own
// attachPhoneMask()/formatUSPhoneNoCode() exactly.
//
// Same visual system as submit-listing.html/css/submit.css — same
// .submit-wrap/.submit-form/section/h2 structure, colors, and copy
// voice — scoped to what an event needs rather than the full
// business-listing field set. "Your Information" mirrors
// suggest-edit.html's suggester_name/email/phone/message fields
// exactly, since a person submitting a new event isn't necessarily its
// organizer the way a listing submitter is typically its owner.

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';

export async function onRequestGet(context) {
    return htmlResponse(renderForm({}));
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return htmlResponse(renderError('This form is temporarily unavailable. Please try again shortly.'), 500);
    }

    let form;
    try {
        form = await request.formData();
    } catch (_) {
        return htmlResponse(renderForm({}, 'There was a problem reading your submission. Please try again.'));
    }

    const fields = extractFields(form);
    const validationError = validateSubmission(fields);
    if (validationError) {
        return htmlResponse(renderForm(fields, validationError));
    }

    try {
        await insertEventRequest(fields, serviceRoleKey);
    } catch (err) {
        console.error('event_requests insert failed:', err);
        return htmlResponse(renderForm(fields, 'Something went wrong submitting your event. Please try again.'));
    }

    return htmlResponse(renderSuccess());
}

function extractFields(form) {
    const get = (name) => (form.get(name) || '').toString().trim();
    return {
        title: get('title'),
        tagline: get('tagline'),
        description: get('description'),
        category: get('category'),
        organizer_name: get('organizer_name'),
        venue_name: get('venue_name'),
        address: get('address'),
        city: get('city'),
        state: get('state').toUpperCase(),
        zip_code: get('zip_code'),
        start_at: get('start_at'),
        end_at: get('end_at'),
        all_day: form.get('all_day') === 'on',
        is_free: form.get('is_free') !== 'off',
        price_range: get('price_range'),
        ticket_url: get('ticket_url'),
        rsvp_url: get('rsvp_url'),
        contact_phone: get('contact_phone'),
        contact_email: get('contact_email'),
        website: get('website'),
        poster_image: get('poster_image'),
        submitter_name: get('submitter_name'),
        submitter_email: get('submitter_email'),
        submitter_phone: get('submitter_phone'),
        submitter_message: get('submitter_message'),
    };
}

function isValidDateInput(v) {
    return !Number.isNaN(new Date(v).getTime());
}

function validateSubmission(f) {
    if (!f.title) return 'Please enter the event name.';
    if (!f.start_at) return 'Please enter when the event starts.';
    // Validated here, before insertEventRequest, so a malformed date
    // gets a clear, specific message instead of insertEventRequest's
    // `new Date(f.start_at).toISOString()` throwing partway through
    // building the payload (see functions/edit/event.js's matching fix
    // for the same underlying pattern, which is XSS-relevant there;
    // this file's rendering is already escaped, so this half is a pure
    // UX/robustness improvement rather than a security fix).
    if (!isValidDateInput(f.start_at)) return 'Please enter a valid start date/time.';
    if (f.end_at && !isValidDateInput(f.end_at)) return 'Please enter a valid end date/time.';
    if (!f.submitter_name) return 'Please enter your name.';
    if (!f.submitter_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.submitter_email)) return 'Please enter a valid email address.';
    return null;
}

async function insertEventRequest(f, serviceRoleKey) {
    const payload = {
        title: f.title,
        tagline: f.tagline || null,
        description: f.description || null,
        category: f.category || null,
        custom_venue_name: f.venue_name || null,
        address: f.address || null,
        city: f.city || null,
        state: f.state || null,
        zip_code: f.zip_code || null,
        start_at: f.start_at ? new Date(f.start_at).toISOString() : null,
        end_at: f.end_at ? new Date(f.end_at).toISOString() : null,
        all_day: f.all_day,
        is_free: f.is_free,
        price_range: f.price_range || null,
        ticket_url: f.ticket_url || null,
        rsvp_url: f.rsvp_url || null,
        contact_phone: f.contact_phone || null,
        contact_email: f.contact_email || null,
        website: f.website || null,
        poster_image: f.poster_image || null,
        submitter_name: f.submitter_name,
        submitter_email: f.submitter_email,
        submitter_phone: f.submitter_phone || null,
        // organizer_name is free text on this public form (submitters
        // don't know internal listing UUIDs) — folded into
        // submitter_message with a clear label rather than added as its
        // own column, since event_requests.organizer_listing_id is a
        // real FK to listings.id and a plain name string doesn't belong
        // there; an admin resolves the real listing (if any) on approval.
        submitter_message: f.submitter_message
            ? f.submitter_message + (f.organizer_name ? `\n\n[Suggested organizer/host: ${f.organizer_name}]` : '')
            : (f.organizer_name ? `[Suggested organizer/host: ${f.organizer_name}]` : null),
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests`, {
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

function pageShell(title, bodyHtml) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} | The Greek Directory</title>
<meta name="robots" content="noindex, follow">
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
    return pageShell('Submit an Event', `
        <div class="submit-form">
            <h1>Submit an Event</h1>
            <p class="form-note" style="color:#dc2626;">${escapeHtml(message)}</p>
        </div>`);
}

function renderSuccess() {
    return pageShell('Event Submitted', `
        <div class="submit-form" style="text-align:center;">
            <h1>Thank you!</h1>
            <p class="form-note">Your event has been submitted and will be reviewed by our team. If it's approved, it'll appear on <a href="/events">the Events page</a> soon.</p>
            <a href="/events" style="display:inline-block;margin-top:16px;background:#045093;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Browse Events</a>
        </div>`);
}

function renderForm(f, errorMessage) {
    const v = (name) => escapeHtml(f?.[name] || '');
    return pageShell('Submit an Event', `
        <form class="submit-form" method="POST" action="/submit/event">
            <h1>Submit an Event</h1>
            <p class="form-note">Know about a Greek event that should be listed here? Tell us about it below — our team reviews every submission before it goes live.</p>
            ${errorMessage ? `<p class="form-note" style="color:#dc2626;">${escapeHtml(errorMessage)}</p>` : ''}

            <section>
                <h2>Event Details</h2>
                <label>Event Name *
                    <input type="text" name="title" required value="${v('title')}" placeholder="e.g. Greek Fest 2026">
                </label>
                <label>Tagline
                    <input type="text" name="tagline" value="${v('tagline')}" placeholder="A short one-line description">
                </label>
                <label>Description
                    <textarea name="description" rows="4" placeholder="What's happening, who's it for, anything people should know…">${v('description')}</textarea>
                </label>
                <label>Category
                    <input type="text" name="category" value="${v('category')}" placeholder="e.g. Festival, Church Event, Fundraiser">
                </label>
            </section>

            <section>
                <h2>When &amp; Where</h2>
                <div class="form-row">
                    <label>Starts *
                        <input type="datetime-local" name="start_at" required value="${v('start_at')}">
                    </label>
                    <label>Ends
                        <input type="datetime-local" name="end_at" value="${v('end_at')}">
                    </label>
                </div>
                <label class="checkbox-row">
                    <input type="checkbox" name="all_day" ${f?.all_day ? 'checked' : ''}>
                    <span>All-day event</span>
                </label>
                <label>Organizer / Host
                    <input type="text" name="organizer_name" value="${v('organizer_name')}" placeholder="Business, church, or organization name">
                </label>
                <label>Venue Name
                    <input type="text" name="venue_name" value="${v('venue_name')}" placeholder="Where is it happening?">
                </label>
                <label>Street Address
                    <input type="text" name="address" value="${v('address')}" placeholder="123 Main St">
                </label>
                <div class="form-row">
                    <label>City
                        <input type="text" name="city" value="${v('city')}">
                    </label>
                    <label>State
                        <input type="text" name="state" maxlength="2" value="${v('state') || 'IL'}" style="text-transform:uppercase;">
                    </label>
                    <label>Zip
                        <input type="text" name="zip_code" value="${v('zip_code')}">
                    </label>
                </div>
            </section>

            <section>
                <h2>Tickets &amp; Cost</h2>
                <label class="checkbox-row">
                    <input type="checkbox" name="is_free" ${f?.is_free !== false ? 'checked' : ''}>
                    <span>This event is free</span>
                </label>
                <label>Price Range
                    <input type="text" name="price_range" value="${v('price_range')}" placeholder="$15–$25">
                </label>
                <label>Ticket URL
                    <input type="url" name="ticket_url" value="${v('ticket_url')}" placeholder="https://…">
                </label>
                <label>RSVP URL
                    <input type="url" name="rsvp_url" value="${v('rsvp_url')}" placeholder="https://…">
                </label>
            </section>

            <section>
                <h2>Contact &amp; Media</h2>
                <label>Contact Phone
                    <input type="tel" name="contact_phone" id="contact_phone" inputmode="numeric" maxlength="14" value="${v('contact_phone')}" placeholder="(___) ___-____">
                </label>
                <label>Contact Email
                    <input type="email" name="contact_email" value="${v('contact_email')}">
                </label>
                <label>Website
                    <input type="url" name="website" value="${v('website')}" placeholder="https://…">
                </label>
                <label>Poster Image URL
                    <input type="url" name="poster_image" value="${v('poster_image')}" placeholder="https://…">
                </label>
            </section>

            <section>
                <h2>Your Information</h2>
                <label>Full Name *
                    <input type="text" name="submitter_name" required autocomplete="name" value="${v('submitter_name')}" placeholder="Full name">
                </label>
                <label>Email *
                    <input type="email" name="submitter_email" required autocomplete="email" value="${v('submitter_email')}" placeholder="you@example.com">
                </label>
                <label>Phone
                    <input type="tel" name="submitter_phone" id="submitter_phone" inputmode="numeric" maxlength="14" value="${v('submitter_phone')}" placeholder="(___) ___-____">
                </label>
                <label>Anything else we should know?
                    <textarea name="submitter_message" rows="3" placeholder="Optional">${v('submitter_message')}</textarea>
                </label>
            </section>

            <button type="submit" class="submit-btn">Submit Event</button>
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
                ['contact_phone', 'submitter_phone'].forEach(function (id) {
                    var el = document.getElementById(id);
                    if (!el) return;
                    el.addEventListener('input', function () { el.value = formatUSPhoneNoCode(el.value); });
                });
            })();
        </script>`);
}
