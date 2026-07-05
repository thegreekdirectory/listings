/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code can result in legal action to the fullest extent permitted by law.
*/

// functions/print/[[slug]].js
//
// Cloudflare Pages Function. Route: GET /print/*
//
// IMPORTANT — why this is [[slug]].js (catch-all) and not [slug].js:
// Every real listing slug in this system is TWO path segments, not one —
// confirmed directly from all three example listing pages provided
// (canonical URLs like /listing/niles-il/kouklas-greek-eatery) and from
// admin.js's generateSlugFromName(), which builds the slug as
// "{city}-{state}/{business-name}". A single dynamic segment ([slug].js)
// would only capture the FIRST segment and 404 or mis-parse the rest.
// [[slug]].js is Cloudflare's catch-all convention: params.slug arrives as
// an ARRAY of segments (e.g. ['niles-il', 'kouklas-greek-eatery']), which
// this function rejoins with '/' before querying Supabase — because that's
// exactly the string stored in the listings.slug column.
//
// Server-side only. Fetches the listing (+ owner rows) from Supabase using the
// SERVICE ROLE key, applies the exact same owner-visibility gating that
// js/admin.js uses when generating the static listing/*.html pages, renders
// the print template, and returns the finished HTML. The browser never sees
// Supabase URLs, keys, or raw JSON — only the final markup.
//
// Required Cloudflare Pages environment variable (Settings -> Environment
// variables -> Production/Preview), set as a SECRET, not plaintext:
//   SUPABASE_SERVICE_ROLE_KEY
//
// The Supabase project URL is not secret (it's already public in every
// listing page's client-side script), so it's inlined below as a constant
// rather than requiring a second env var. If you'd rather keep it as an env
// var too, add SUPABASE_URL to context.env and swap the constant below.

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function onRequestGet(context) {
    const { params, env } = context;

    // With [[slug]].js, params.slug is an ARRAY of path segments for a
    // catch-all route (e.g. ['niles-il', 'kouklas-greek-eatery']), not a
    // single string. Rejoin with '/' to match the exact value stored in
    // Supabase's listings.slug column.
    const slugSegments = Array.isArray(params.slug) ? params.slug : params.slug ? [params.slug] : [];
    const slug = slugSegments.map((segment) => decodeURIComponent(segment)).join('/');

    if (!slug || typeof slug !== 'string') {
        return htmlResponse(renderErrorPage('Missing listing.', 'No listing slug was provided.'), 400);
    }

    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        // Fail loudly in a way that's obvious to the site operator (missing
        // secret) without leaking anything to the visitor.
        console.error('SUPABASE_SERVICE_ROLE_KEY is not configured for this Pages project.');
        return htmlResponse(
            renderErrorPage('Print view unavailable.', 'This page is temporarily unavailable. Please try again later.'),
            500
        );
    }

    let listing;
    try {
        listing = await fetchListingBySlug(slug, serviceRoleKey);
    } catch (err) {
        console.error('Supabase listing fetch failed:', err);
        return htmlResponse(
            renderErrorPage('Print view unavailable.', 'We could not load this listing right now. Please try again later.'),
            502
        );
    }

    if (!listing) {
        return htmlResponse(renderErrorPage('Listing not found.', 'This listing does not exist or is not published.'), 404);
    }

    // Listings that are not publicly visible should not be printable, even
    // though the service-role key COULD read them. Admins/owners previewing
    // an unpublished listing should use the admin/business portal, not this
    // public print path.
    if (listing.visible !== true) {
        return htmlResponse(renderErrorPage('Listing not found.', 'This listing is not currently published.'), 404);
    }

    let owners = [];
    try {
        owners = await fetchOwnersByListingId(listing.id, serviceRoleKey);
    } catch (err) {
        // Owner info is a nice-to-have on the printed profile, not a
        // required field. Log it, but still render the rest of the page.
        console.error('Supabase owner fetch failed:', err);
        owners = [];
    }

    const html = renderPrintPage(listing, owners);
    return htmlResponse(html, 200, {
        // This page's entire purpose is "load, then print" — no reason for
        // an intermediary cache to hold stale business data.
        'Cache-Control': 'no-store',
    });
}

function htmlResponse(html, status, extraHeaders) {
    return new Response(html, {
        status,
        headers: Object.assign(
            {
                'Content-Type': 'text/html; charset=UTF-8',
                'X-Robots-Tag': 'noindex, nofollow',
            },
            extraHeaders || {}
        ),
    });
}

// ---------------------------------------------------------------------------
// Supabase REST access (service role) — plain fetch, no SDK needed in a Worker
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

async function fetchListingBySlug(slug, serviceRoleKey) {
    const encodedSlug = encodeURIComponent(slug);
    const rows = await supabaseRestGet(`listings?slug=eq.${encodedSlug}&limit=1`, serviceRoleKey);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function fetchOwnersByListingId(listingId, serviceRoleKey) {
    const encodedId = encodeURIComponent(listingId);
    const rows = await supabaseRestGet(`business_owners?listing_id=eq.${encodedId}`, serviceRoleKey);
    return Array.isArray(rows) ? rows : [];
}

// ---------------------------------------------------------------------------
// HTML escaping / text helpers
// Worker-safe equivalents of admin.js's browser-only escapeHtml (which used
// document.createElement) and decodeEscapedText. Same behavior, no DOM.
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

// Mirrors admin.js's decodeEscapedText: some stored fields contain literal
// backslash-escape sequences (e.g. from CSV import) that need unescaping
// before display. Same implementation, ported 1:1.
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
        return str
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\\\/g, '\\')
            .replace(/\\n/g, '\n');
    }
}

// admin.js's sanitizeListingDescription depends on window.RichTextEditor,
// a browser-only global, so it cannot be ported. Descriptions are stored as
// a mix of plain text and a small set of rich-text tags (<br>, <div>, <p>,
// <ul>/<ol>/<li>, <strong>/<em>/<b>/<i>) based on what's visible in real
// listing data. This allow-list sanitizer keeps those tags and escapes
// everything else, so a description can't inject arbitrary markup into a
// server-rendered page.
const DESCRIPTION_ALLOWED_TAGS = new Set(['br', 'div', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'span']);

function sanitizeListingDescription(value) {
    const raw = decodeEscapedText(value || '');
    if (!raw) return '';

    // Walk the string, escaping everything except opening/closing tags that
    // are on the allow-list. Any tag not on the list (script, img, a, style,
    // event handlers, etc.) is escaped as literal text instead of parsed.
    let result = '';
    let i = 0;
    while (i < raw.length) {
        const char = raw[i];
        if (char === '<') {
            const tagMatch = raw.slice(i).match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)\s*[^>]*>/);
            if (tagMatch) {
                const tagName = tagMatch[1].toLowerCase();
                if (DESCRIPTION_ALLOWED_TAGS.has(tagName)) {
                    // Strip any attributes entirely (no href/src/onclick/style
                    // survives) — keep only the bare tag shape.
                    const isClosing = tagMatch[0].startsWith('</');
                    result += isClosing ? `</${tagName}>` : `<${tagName}>`;
                    i += tagMatch[0].length;
                    continue;
                }
                // Matched a real tag (e.g. <script ...>, <img ...>) that is
                // NOT on the allow-list: escape the ENTIRE matched span
                // (angle brackets, tag name, attributes, everything) rather
                // than just the leading '<'. Escaping only the first
                // character and letting the rest of the tag's characters
                // fall through untouched would leave raw attribute text
                // (e.g. onerror=...) sitting in the output.
                result += escapeHtml(tagMatch[0]);
                i += tagMatch[0].length;
                continue;
            }
            // A bare '<' that isn't the start of a recognizable tag at all
            // (e.g. "3 < 5" or a stray character) — escape just the character.
            result += '&lt;';
            i += 1;
            continue;
        }
        if (char === '&') {
            result += '&amp;';
            i += 1;
            continue;
        }
        result += char;
        i += 1;
    }
    return result;
}

function formatPhoneNumber(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
        return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    }
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    return String(phone);
}

// Ported from admin.js toDisplayHourLabel — converts a stored "HH:MM-HH:MM"
// hours value into a display string like "9:00 AM - 5:00 PM".
function toDisplayHourLabel(hoursValue) {
    const raw = String(hoursValue || '').trim();
    if (!raw || /^closed$/i.test(raw) || /24/.test(raw.toLowerCase())) return raw || 'Closed';
    if (raw === '00:00-23:59' || raw === '00:00 - 23:59') return 'Open All Day';
    const match = raw.match(/^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})$/);
    if (!match) return raw;

    const toTwelveHour = (hourPart, minutePart) => {
        const hourNum = parseInt(hourPart, 10);
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const twelveHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
        return `${twelveHour}:${minutePart} ${period}`;
    };

    return `${toTwelveHour(match[1], match[2])} - ${toTwelveHour(match[3], match[4])}`;
}

function pricingToSymbols(value) {
    if (value === null || value === undefined || value === '') return '';
    const symbolMap = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };
    const numeric = parseInt(value, 10);
    if (!Number.isNaN(numeric) && symbolMap[numeric]) return symbolMap[numeric];
    return '';
}

// ---------------------------------------------------------------------------
// Owner info — ported from admin.js generateTemplateReplacementsPart2, with
// the exact same visibility gating (name_title_visible / email_visible /
// phone_visible) so this print path can never surface more than the public
// listing page already would.
// ---------------------------------------------------------------------------

function buildOwnerCardsHtml(owners) {
    const cards = (Array.isArray(owners) ? owners : [])
        .map((owner) => {
            let details = '';

            if (owner.name_title_visible !== false && owner.full_name) {
                const safeFullName = decodeEscapedText(owner.full_name);
                const safeTitle = decodeEscapedText(owner.title || '');
                details += safeTitle
                    ? `<p><strong>${escapeHtml(safeTitle)}:</strong> ${escapeHtml(safeFullName)}</p>`
                    : `<p><strong>Owner:</strong> ${escapeHtml(safeFullName)}</p>`;
            }

            if (owner.from_greece) {
                const fromGreeceLower = String(owner.from_greece).toLowerCase();
                const alreadyMentionsRegion =
                    fromGreeceLower.includes('cyprus') ||
                    fromGreeceLower.includes('pontus') ||
                    fromGreeceLower.includes('greece');
                const decodedFromGreece = decodeEscapedText(owner.from_greece);
                details += alreadyMentionsRegion
                    ? `<p><strong>From:</strong> ${escapeHtml(decodedFromGreece)}</p>`
                    : `<p><strong>From:</strong> ${escapeHtml(decodedFromGreece)}, Greece</p>`;
            }

            if (owner.email_visible && owner.owner_email) {
                details += `<p><strong>Email:</strong> ${escapeHtml(owner.owner_email)}</p>`;
            }
            if (owner.phone_visible && owner.owner_phone) {
                details += `<p><strong>Phone:</strong> ${escapeHtml(formatPhoneNumber(owner.owner_phone))}</p>`;
            }

            return details ? `<div class="owner-card">${details}</div>` : '';
        })
        .filter(Boolean)
        .join('');

    if (!cards) return '';

    return `
        <section class="print-section owner-info-section">
            <h3>Leadership</h3>
            ${cards}
        </section>
    `;
}

// ---------------------------------------------------------------------------
// Address / contact / hours / additional info — mirrors the markup and
// gating rules from admin.js generateTemplateReplacements, adapted for a
// static, non-interactive print document (no tel:/mailto: styling needed,
// no map, no CTA buttons — this is a profile sheet, not a live page).
// ---------------------------------------------------------------------------

function buildAddressLine(listing) {
    const decodedAddress = decodeEscapedText(listing.address || '');
    const decodedCity = decodeEscapedText(listing.city || '');
    const decodedState = decodeEscapedText(listing.state || '');
    const hasStreetAddress = typeof listing.address === 'string' && listing.address.trim().length > 0;

    if (!hasStreetAddress && !(listing.city && listing.state)) return '';

    const parts = [];
    if (hasStreetAddress) parts.push(escapeHtml(decodedAddress));
    if (listing.city && listing.state) {
        parts.push(`${escapeHtml(decodedCity)}, ${escapeHtml(decodedState)}${listing.zip_code ? ' ' + escapeHtml(listing.zip_code) : ''}`);
    }
    if (!parts.length) return '';

    return `
        <div class="contact-row">
            <span class="contact-label">Address</span>
            <span class="contact-value">${parts.join(', ')}</span>
        </div>
    `;
}

function buildPhoneLine(listing) {
    if (!listing.phone) return '';
    return `
        <div class="contact-row">
            <span class="contact-label">Phone</span>
            <span class="contact-value">${escapeHtml(formatPhoneNumber(listing.phone))}</span>
        </div>
    `;
}

function buildEmailLine(listing) {
    if (!listing.email) return '';
    return `
        <div class="contact-row">
            <span class="contact-label">Email</span>
            <span class="contact-value">${escapeHtml(listing.email)}</span>
        </div>
    `;
}

function buildWebsiteLine(listing) {
    if (!listing.website) return '';
    const decoded = decodeEscapedText(listing.website);
    const displayUrl = decoded.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    return `
        <div class="contact-row">
            <span class="contact-label">Website</span>
            <span class="contact-value">${escapeHtml(displayUrl)}</span>
        </div>
    `;
}

function buildHoursSection(listing) {
    const hasHours = listing.hours && Object.keys(listing.hours).some((day) => listing.hours[day]);
    if (!hasHours) return '';

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const rows = dayKeys
        .map((key, index) => {
            const value = listing.hours[key] || 'Closed';
            return `<div class="hours-row"><span class="hours-day">${days[index]}</span><span class="hours-value">${escapeHtml(toDisplayHourLabel(value))}</span></div>`;
        })
        .join('');

    const label = listing.hours_label_custom || 'Hours';
    const disclaimer = listing.hours_disclaimer_custom || 'Hours may vary — call to confirm.';

    return `
        <section class="print-section hours-section">
            <h3>${escapeHtml(label)}</h3>
            <div class="hours-grid">${rows}</div>
            <p class="hours-disclaimer">${escapeHtml(disclaimer)}</p>
        </section>
    `;
}

function buildAdditionalInfoSection(listing) {
    if (!Array.isArray(listing.additional_info) || listing.additional_info.length === 0) return '';

    const rows = listing.additional_info
        .filter((info) => info && info.label && info.value)
        .map(
            (info) => `
                <div class="additional-info-row">
                    <span class="additional-info-label">${escapeHtml(decodeEscapedText(info.label))}</span>
                    <span class="additional-info-value">${escapeHtml(decodeEscapedText(info.value))}</span>
                </div>
            `
        )
        .join('');

    if (!rows) return '';

    return `
        <section class="print-section additional-info-section">
            <h3>Additional Information</h3>
            <div class="additional-info-table">${rows}</div>
        </section>
    `;
}

function buildSubcategoryTags(listing) {
    if (!Array.isArray(listing.subcategories) || listing.subcategories.length === 0) return '';
    const uniqueSubs = [...new Set(listing.subcategories.filter(Boolean))];
    const primary = listing.primary_subcategory && uniqueSubs.includes(listing.primary_subcategory) ? listing.primary_subcategory : null;
    const ordered = [...(primary ? [primary] : []), ...uniqueSubs.filter((s) => s !== primary).sort((a, b) => a.localeCompare(b))];
    return ordered.map((sub) => `<span class="subcategory-tag">${escapeHtml(sub)}</span>`).join('');
}

// ---------------------------------------------------------------------------
// Social media + reviews — same jsonb shape and same platform set as
// admin.js generateSocialMediaSection / generateReviewSection, rendered as
// plain printed link lines (no onclick analytics — this document isn't
// interactive, and analytics tracking wouldn't fire from a printed page or
// PDF anyway).
// ---------------------------------------------------------------------------

const SOCIAL_URL_BUILDERS = {
    facebook: (handle) => `facebook.com/${handle}`,
    instagram: (handle) => `instagram.com/${handle}`,
    twitter: (handle) => `twitter.com/${handle}`,
    youtube: (handle) => `youtube.com/@${handle}`,
    tiktok: (handle) => `tiktok.com/@${handle}`,
};

const SOCIAL_LABELS = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'Twitter / X',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    linkedin: 'LinkedIn',
};

function buildSocialSection(listing) {
    const socialMedia = listing.social_media || {};
    const lines = [];

    ['facebook', 'instagram', 'twitter', 'youtube', 'tiktok'].forEach((key) => {
        if (socialMedia[key]) {
            lines.push(
                `<div class="link-row"><span class="link-label">${SOCIAL_LABELS[key]}</span><span class="link-value">${escapeHtml(SOCIAL_URL_BUILDERS[key](socialMedia[key]))}</span></div>`
            );
        }
    });

    if (socialMedia.linkedin) {
        const decoded = decodeEscapedText(socialMedia.linkedin).replace(/^https?:\/\/(www\.)?/, '');
        lines.push(`<div class="link-row"><span class="link-label">LinkedIn</span><span class="link-value">${escapeHtml(decoded)}</span></div>`);
    }

    [1, 2, 3].forEach((n) => {
        const url = socialMedia[`other${n}`];
        const name = socialMedia[`other${n}_name`];
        if (url && name) {
            const decoded = decodeEscapedText(url).replace(/^https?:\/\/(www\.)?/, '');
            lines.push(`<div class="link-row"><span class="link-label">${escapeHtml(name)}</span><span class="link-value">${escapeHtml(decoded)}</span></div>`);
        }
    });

    if (!lines.length) return '';

    return `
        <section class="print-section social-section">
            <h3>Social Media</h3>
            <div class="link-list">${lines.join('')}</div>
        </section>
    `;
}

function buildReviewsSection(listing) {
    const reviews = listing.reviews || {};
    const lines = [];

    if (reviews.google) lines.push(`<div class="link-row"><span class="link-label">Google Reviews</span><span class="link-value">${escapeHtml(decodeEscapedText(reviews.google).replace(/^https?:\/\/(www\.)?/, ''))}</span></div>`);
    if (reviews.yelp) lines.push(`<div class="link-row"><span class="link-label">Yelp</span><span class="link-value">${escapeHtml(decodeEscapedText(reviews.yelp).replace(/^https?:\/\/(www\.)?/, ''))}</span></div>`);
    if (reviews.tripadvisor) lines.push(`<div class="link-row"><span class="link-label">TripAdvisor</span><span class="link-value">${escapeHtml(decodeEscapedText(reviews.tripadvisor).replace(/^https?:\/\/(www\.)?/, ''))}</span></div>`);

    [1, 2, 3].forEach((n) => {
        const url = reviews[`other${n}`];
        const name = reviews[`other${n}_name`];
        if (url && name) {
            const decoded = decodeEscapedText(url).replace(/^https?:\/\/(www\.)?/, '');
            lines.push(`<div class="link-row"><span class="link-label">${escapeHtml(name)}</span><span class="link-value">${escapeHtml(decoded)}</span></div>`);
        }
    });

    if (!lines.length) return '';

    return `
        <section class="print-section reviews-section">
            <h3>Reviews</h3>
            <div class="link-list">${lines.join('')}</div>
        </section>
    `;
}

// ---------------------------------------------------------------------------
// Gallery pages — first photo goes on the hero page; every additional photo
// gets its own dedicated page. Because gallery images can be any aspect
// ratio (unlike the logo, which is always square), each gallery page sizes
// an <img> naturally (max-width/max-height within the page's print area)
// instead of forcing object-fit: cover like the on-screen carousel does.
// ---------------------------------------------------------------------------

function buildAdditionalGalleryPages(photoList, businessName, city, state) {
    // photoList[0] is used as the hero image on page 1; anything after that
    // gets its own page.
    const remainingPhotos = photoList.slice(1);
    if (!remainingPhotos.length) return '';

    const altBase = `${escapeHtml(businessName)}${city ? ` in ${escapeHtml(city)}${state ? ', ' + escapeHtml(state) : ''}` : ''}`;

    return remainingPhotos
        .map(
            (photoUrl, index) => `
        <section class="print-page gallery-page">
            <div class="gallery-page-frame">
                <img src="${escapeHtml(photoUrl)}" alt="${altBase} — photo ${index + 2}" class="gallery-page-image" />
            </div>
            <div class="gallery-page-footer">${escapeHtml(businessName)} — Photo ${index + 2} of ${photoList.length}</div>
        </section>
    `
        )
        .join('');
}

// ---------------------------------------------------------------------------
// Top-level page assembly
// ---------------------------------------------------------------------------

function renderPrintPage(listing, owners) {
    const decodedBusinessName = decodeEscapedText(listing.business_name || '');
    const decodedTagline = decodeEscapedText(listing.tagline || '');
    const decodedCity = decodeEscapedText(listing.city || '');
    const decodedState = decodeEscapedText(listing.state || '');

    const photos = Array.isArray(listing.photos) ? listing.photos.filter(Boolean) : [];
    const logo = listing.logo || '';
    // Same fallback order as admin.js: use the photos array if present,
    // otherwise fall back to the logo as the only "photo".
    const photoList = photos.length > 0 ? photos : logo ? [logo] : [];
    const heroImage = photoList[0] || logo || '';

    const pricingSymbols = pricingToSymbols(listing.pricing);
    const subcategoryTags = buildSubcategoryTags(listing);

    const badges = [];
    if (listing.tier === 'PREMIUM') badges.push('<span class="print-badge badge-premium">Premium</span>');
    else if (listing.tier === 'FEATURED') badges.push('<span class="print-badge badge-featured">Featured</span>');
    if (listing.coming_soon === true) badges.push('<span class="print-badge badge-coming-soon">Coming Soon</span>');
    if (listing.temporarily_closed === true) badges.push('<span class="print-badge badge-closed">Temporarily Closed</span>');
    if (listing.permanently_closed === true) badges.push('<span class="print-badge badge-closed">Permanently Closed</span>');

    const isClaimed = Boolean(listing.is_claimed) || owners.some((o) => o.owner_user_id);
    const claimedBadge = isClaimed
        ? '<span class="claimed-check" title="Verified: this listing has been claimed by its owner(s)">&#10003;</span>'
        : '';

    const contactLines = [buildAddressLine(listing), buildPhoneLine(listing), buildEmailLine(listing), buildWebsiteLine(listing)]
        .filter(Boolean)
        .join('');

    const description = sanitizeListingDescription(listing.description || '');
    const hoursSection = buildHoursSection(listing);
    const additionalInfoSection = buildAdditionalInfoSection(listing);
    const ownerSection = buildOwnerCardsHtml(owners);
    const socialSection = buildSocialSection(listing);
    const reviewsSection = buildReviewsSection(listing);
    const galleryPages = buildAdditionalGalleryPages(photoList, decodedBusinessName, decodedCity, decodedState);

    const listingUrl = `https://thegreekdirectory.org/listing/${escapeHtml(listing.slug || '')}`;
    const generatedAt = new Date().toISOString().slice(0, 10);

    return `<!DOCTYPE html>
<html lang="en-US">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(decodedBusinessName)} — Printable Profile | The Greek Directory</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="https://static.thegreekdirectory.org/img/logo/bluefavicon.png">
${PRINT_STYLES}
</head>
<body>

    <main class="print-page hero-page">
        <header class="hero-header">
            <div class="hero-header-top">
                <img class="brand-mark" src="https://static.thegreekdirectory.org/img/logo/blue.svg" alt="The Greek Directory">
                <span class="hero-header-label">Business Profile</span>
            </div>
            ${heroImage ? `<div class="hero-photo-frame"><img class="hero-photo" src="${escapeHtml(heroImage)}" alt="${escapeHtml(decodedBusinessName)}"></div>` : ''}
        </header>

        <section class="identity-block">
            <div class="identity-text">
                <div class="identity-tags">
                    <span class="category-pill">${escapeHtml(listing.category || '')}</span>
                    ${subcategoryTags}
                    ${badges.join('')}
                </div>
                <h1 class="business-name">${escapeHtml(decodedBusinessName)}${claimedBadge}</h1>
                ${decodedTagline ? `<p class="tagline">${escapeHtml(decodedTagline)}</p>` : ''}
                ${pricingSymbols ? `<span class="pricing-chip">${pricingSymbols}</span>` : ''}
            </div>
            ${logo ? `<img class="logo-mark" src="${escapeHtml(logo)}" alt="${escapeHtml(decodedBusinessName)} logo">` : ''}
        </section>

        <div class="content-columns">
            <div class="content-main">
                ${description ? `<section class="print-section description-section"><h3>About</h3><div class="description-body">${description}</div></section>` : ''}
                ${additionalInfoSection}
                ${ownerSection}
                ${socialSection}
                ${reviewsSection}
            </div>
            <aside class="content-side">
                <section class="print-section contact-card">
                    <h3>Contact</h3>
                    ${contactLines}
                </section>
                ${hoursSection}
            </aside>
        </div>

        <footer class="hero-footer">
            <span>${listingUrl}</span>
            <span>Printed ${generatedAt} — The Greek Directory</span>
        </footer>
    </main>

    ${galleryPages}

    <script>
        // Autoprint: open straight into the browser's print dialog once the
        // page (including images) has finished loading, so this route can be
        // opened directly from a "Print" button on the listing page.
        window.addEventListener('load', function () {
            setTimeout(function () { window.print(); }, 150);
        });
    </script>
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
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; color: #1a1a1a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; }
    .box { max-width: 420px; text-align: center; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px 32px; }
    h1 { font-size: 20px; color: #045093; margin: 0 0 8px; }
    p { color: #4b5563; margin: 0; line-height: 1.5; }
</style>
</head>
<body>
    <div class="box">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>
    </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Print stylesheet
//
// Deliberately extends the existing brand system (--primary-blue: #045093,
// --secondary-gold: #D4AF37, same font stack) from listings.css / index.css
// rather than introducing a new visual language — this should read as the
// same business listing, just laid out for paper. @page + print-color-adjust
// rules keep colors and page breaks correct across Chrome/Edge/Firefox/Safari
// print-to-PDF, which is what "Save as PDF" actually uses under the hood.
// ---------------------------------------------------------------------------

const PRINT_STYLES = `<style>
    :root {
        --primary-blue: #045093;
        --secondary-gold: #D4AF37;
        --text-dark: #1a1a1a;
        --text-light: #6b7280;
        --border-color: #e5e7eb;
        --bg-light: #f9fafb;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: var(--text-dark);
        background: #fff;
        line-height: 1.5;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    img { max-width: 100%; display: block; }

    /* ---------------- Page shell ---------------- */

    .print-page {
        width: 8.5in;
        min-height: 11in;
        margin: 0 auto;
        padding: 0.55in 0.6in;
        page-break-after: always;
        position: relative;
    }

    .print-page:last-of-type { page-break-after: auto; }

    @page {
        size: letter;
        margin: 0;
    }

    @media screen {
        body { background: #e5e7eb; padding: 24px 0; }
        .print-page { box-shadow: 0 4px 16px rgba(0,0,0,0.15); margin-bottom: 24px; background: #fff; }
    }

    /* ---------------- Hero page header ---------------- */

    .hero-header-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
    }

    .brand-mark { height: 28px; width: auto; }

    .hero-header-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-light);
    }

    .hero-photo-frame {
        width: 100%;
        height: 2.4in;
        border-radius: 10px;
        overflow: hidden;
        background: var(--bg-light);
        border: 1px solid var(--border-color);
        margin-bottom: 20px;
    }

    .hero-photo {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    /* ---------------- Identity block ---------------- */

    .identity-block {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        padding-bottom: 16px;
        border-bottom: 2px solid var(--primary-blue);
        margin-bottom: 20px;
    }

    .identity-tags {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 10px;
    }

    .category-pill {
        display: inline-block;
        background: var(--primary-blue);
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 999px;
    }

    .subcategory-tag {
        display: inline-block;
        background: #e5e7eb;
        color: #374151;
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 999px;
    }

    .print-badge {
        display: inline-block;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        padding: 4px 10px;
        border-radius: 4px;
    }

    .badge-featured { background: #fbbf24; color: #78350f; }
    .badge-premium { background: #6b21a8; color: #ede9fe; }
    .badge-coming-soon { background: #f97316; color: #fff; }
    .badge-closed { background: #ef4444; color: #fff; }

    .business-name {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-dark);
        margin-bottom: 4px;
    }

    .claimed-check {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        background: #10b981;
        color: #fff;
        border-radius: 50%;
        font-size: 11px;
        margin-left: 8px;
        vertical-align: middle;
    }

    .tagline {
        font-size: 15px;
        font-style: italic;
        color: var(--text-light);
        font-weight: 600;
        margin-bottom: 6px;
    }

    .pricing-chip {
        display: inline-flex;
        align-items: center;
        padding: 2px 10px;
        border-radius: 999px;
        background: #eff6ff;
        color: var(--primary-blue);
        font-weight: 700;
        font-size: 12px;
    }

    .logo-mark {
        width: 72px;
        height: 72px;
        object-fit: cover;
        border-radius: 10px;
        border: 1px solid var(--border-color);
        flex-shrink: 0;
    }

    /* ---------------- Two-column content ---------------- */

    .content-columns {
        display: flex;
        gap: 24px;
    }

    .content-main {
        flex: 1 1 auto;
        min-width: 0;
    }

    .content-side {
        flex: 0 0 2.4in;
        min-width: 0;
    }

    .print-section { margin-bottom: 18px; }

    .print-section h3 {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: var(--primary-blue);
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--border-color);
    }

    .description-body {
        font-size: 12.5px;
        color: #374151;
        line-height: 1.6;
    }

    .description-body p { margin-bottom: 8px; }
    .description-body ul, .description-body ol { margin-left: 1.2em; margin-bottom: 8px; }

    /* Additional info table */

    .additional-info-table { border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; }

    .additional-info-row {
        display: grid;
        grid-template-columns: minmax(90px, 1fr) minmax(0, 2fr);
        gap: 12px;
        padding: 6px 10px;
        font-size: 11.5px;
        border-bottom: 1px solid #f3f4f6;
    }

    .additional-info-row:last-child { border-bottom: none; }
    .additional-info-row:nth-child(even) { background: var(--bg-light); }
    .additional-info-label { font-weight: 600; color: var(--text-dark); }
    .additional-info-value { color: #374151; }

    /* Owner / leadership */

    .owner-card {
        background: var(--bg-light);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 10px 12px;
        margin-bottom: 8px;
        font-size: 12px;
    }

    .owner-card p { margin-bottom: 3px; }
    .owner-card p:last-child { margin-bottom: 0; }

    /* Social / reviews link lists */

    .link-list { font-size: 11.5px; }

    .link-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 4px 0;
        border-bottom: 1px solid #f3f4f6;
    }

    .link-row:last-child { border-bottom: none; }
    .link-label { font-weight: 600; color: var(--text-dark); flex-shrink: 0; }
    .link-value { color: var(--text-light); text-align: right; word-break: break-word; }

    /* Contact card (sidebar) */

    .contact-card {
        background: var(--bg-light);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 14px;
    }

    .contact-row { margin-bottom: 8px; font-size: 11.5px; }
    .contact-row:last-child { margin-bottom: 0; }
    .contact-label { display: block; font-weight: 600; color: var(--text-light); font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 1px; }
    .contact-value { display: block; color: var(--text-dark); word-break: break-word; }

    /* Hours */

    .hours-section {
        background: var(--bg-light);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 14px;
        margin-top: 16px;
    }

    .hours-grid { font-size: 11.5px; }

    .hours-row {
        display: flex;
        justify-content: space-between;
        padding: 2px 0;
    }

    .hours-day { font-weight: 600; }
    .hours-value { color: #374151; }

    .hours-disclaimer {
        margin-top: 8px;
        padding: 6px 8px;
        background: #fef3c7;
        border: 1px solid #fbbf24;
        color: #78350f;
        border-radius: 6px;
        font-size: 10.5px;
    }

    /* Hero footer */

    .hero-footer {
        display: flex;
        justify-content: space-between;
        font-size: 9.5px;
        color: var(--text-light);
        border-top: 1px solid var(--border-color);
        margin-top: 28px;
        padding-top: 8px;
    }

    /* ---------------- Additional gallery pages ---------------- */
    /* Gallery photos may be any aspect ratio, so they're sized to fit within
       the page rather than cropped — unlike the hero photo and on-screen
       carousel, which use object-fit: cover deliberately. */

    .gallery-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .gallery-page-frame {
        width: 100%;
        max-height: 9.4in;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .gallery-page-image {
        max-width: 100%;
        max-height: 9.4in;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 8px;
        border: 1px solid var(--border-color);
    }

    .gallery-page-footer {
        margin-top: 16px;
        font-size: 10px;
        color: var(--text-light);
        text-align: center;
    }

    /* ---------------- Responsive columns for narrow print/preview ---------------- */

    @media (max-width: 700px) {
        .content-columns { flex-direction: column; }
        .content-side { flex: 1 1 auto; }
    }
</style>`;