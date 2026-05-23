/*
 * tgd-images-upload — Cloudflare Worker
 * https://tgd-images-upload.thegreekdirectory.org
 *
 * Two modes:
 *
 *   POST /?action=request-upload-url   (Business Portal — Direct Creator Upload)
 *     Body: JSON { assetType: 'logo'|'photo'|'video', listingId: string }
 *     1. Calls CF Images v2 direct_upload → returns a one-time upload URL.
 *     2. Returns { success, uploadURL, imageId, imageUrl } to the client.
 *     The browser then POSTs the file directly to uploadURL (no auth required).
 *
 *   POST /                             (Admin Portal — server-side direct upload)
 *     Body: multipart/form-data with `file` field.
 *     Returns { success, url, imageUrl, result } — shape the Admin Portal expects.
 *
 * Required Worker secrets (Cloudflare Dashboard → Workers → Settings → Variables):
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_IMAGES_API_TOKEN
 */

const ACCOUNT_HASH      = 'rheV007PEt08HUYXNuJLnQ';
const CANONICAL_HOST    = 'https://images.thegreekdirectory.org';
const VARIANT           = 'public';
const VALID_ASSET_TYPES = new Set(['logo', 'photo', 'video']);

// ─── CORS ─────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = new Set([
    'https://thegreekdirectory.org',
    'https://www.thegreekdirectory.org',
    'https://app.thegreekdirectory.org',
    'https://static.thegreekdirectory.org',
]);

function getAllowedOrigin(request) {
    const origin = request.headers.get('Origin') || '';
    if (ALLOWED_ORIGINS.has(origin)) return origin;
    if (/^https:\/\/[^.]+\.thegreekdirectory\.pages\.dev$/.test(origin)) return origin;
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return origin;
    return 'https://thegreekdirectory.org';
}

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin':  origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age':       '86400',
        'Vary':                         'Origin',
    };
}

function jsonResponse(payload, status, origin) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...corsHeaders(origin),
        },
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCanonicalUrl(imageId) {
    return `${CANONICAL_HOST}/cdn-cgi/imagedelivery/${ACCOUNT_HASH}/${imageId}/${VARIANT}`;
}

const RANDOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
function randomSuffix(len = 6) {
    let s = '';
    for (let i = 0; i < len; i++) {
        s += RANDOM_ALPHABET[Math.floor(Math.random() * RANDOM_ALPHABET.length)];
    }
    return s;
}

function buildCustomImageId(listingId, assetType) {
    const d    = new Date();
    const ymd  = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    const safe = String(listingId || 'unknown').replace(/[^a-z0-9-]/gi, '-').slice(0, 36);
    return `${safe}-${assetType}-${ymd}-${randomSuffix()}`;
}

/*
 * Safe JSON parse of a CF API response.
 * CF occasionally returns HTML error pages on gateway errors,
 * so we never assume the body is JSON.
 */
async function parseCfResponse(res) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch (_) {
        return {
            success: false,
            errors: [{ message: `CF API returned non-JSON (HTTP ${res.status}): ${text.slice(0, 300)}` }],
        };
    }
}

// ─── Route: request-upload-url ────────────────────────────────────────────────
// Business Portal: browser asks worker for a one-time CF upload URL,
// then uploads the file directly to CF without any auth on the client side.

async function handleRequestUploadUrl(request, env, origin) {
    let body;
    try {
        body = await request.json();
    } catch (_) {
        return jsonResponse({ success: false, error: 'Request body must be valid JSON.' }, 400, origin);
    }

    const assetType = String(body.assetType || 'photo').trim().toLowerCase();
    const listingId = String(body.listingId || '').trim();

    if (!VALID_ASSET_TYPES.has(assetType)) {
        return jsonResponse({ success: false, error: 'assetType must be logo, photo, or video.' }, 400, origin);
    }

    // Do NOT send a custom ID — let CF assign one.
    // Custom IDs in v2/direct_upload have stricter format requirements and
    // are not compatible with requireSignedURLs. We read the assigned ID
    // back from the response instead.
    const cfForm = new FormData();
    cfForm.append('requireSignedURLs', 'false');
    cfForm.append('metadata', JSON.stringify({
        listingId,
        assetType,
        listing:         listingId,
        'listing-image': assetType === 'logo' ? 'logo' : 'image',
        uploadedAt:      new Date().toISOString(),
    }));

    let cfRes;
    try {
        cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
            {
                method:  'POST',
                headers: { Authorization: `Bearer ${env.CLOUDFLARE_IMAGES_API_TOKEN}` },
                body:    cfForm,
            }
        );
    } catch (fetchErr) {
        return jsonResponse({ success: false, error: `Network error calling CF API: ${fetchErr.message}` }, 502, origin);
    }

    const cfData = await parseCfResponse(cfRes);

    if (!cfRes.ok || !cfData.success) {
        const msg = cfData?.errors?.[0]?.message || `CF API error (HTTP ${cfRes.status})`;
        console.error('CF Images v2/direct_upload failed:', JSON.stringify(cfData));
        return jsonResponse({ success: false, error: msg }, 502, origin);
    }

    // CF returns the image ID in result.id — use it to build the canonical URL
    const imageId = cfData.result.id;

    return jsonResponse({
        success:   true,
        uploadURL: cfData.result.uploadURL,
        imageId,
        imageUrl:  buildCanonicalUrl(imageId),
    }, 200, origin);
}

// ─── Route: server-side direct upload (Admin Portal) ─────────────────────────

async function handleDirectUpload(request, env, origin) {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
        return jsonResponse({ success: false, error: 'Content-Type must be multipart/form-data.' }, 415, origin);
    }

    let formData;
    try {
        formData = await request.formData();
    } catch (e) {
        return jsonResponse({ success: false, error: `Could not parse form data: ${e.message}` }, 400, origin);
    }

    const file      = formData.get('file');
    const listingId = String(formData.get('listingId') || '').trim();
    const assetType = String(formData.get('assetType') || 'photo').trim().toLowerCase();

    if (!(file instanceof File)) {
        return jsonResponse({ success: false, error: 'A file upload is required.' }, 400, origin);
    }

    const customId = buildCustomImageId(listingId, assetType);

    const cfForm = new FormData();
    cfForm.append('file', file, file.name || customId);
    cfForm.append('id', customId);
    cfForm.append('requireSignedURLs', 'false');
    cfForm.append('metadata', JSON.stringify({
        listingId,
        assetType,
        listing:         listingId,
        'listing-image': assetType === 'logo' ? 'logo' : 'image',
        uploadedAt:      new Date().toISOString(),
    }));

    let cfRes;
    try {
        cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
            {
                method:  'POST',
                headers: { Authorization: `Bearer ${env.CLOUDFLARE_IMAGES_API_TOKEN}` },
                body:    cfForm,
            }
        );
    } catch (fetchErr) {
        return jsonResponse({ success: false, error: `Network error calling CF API: ${fetchErr.message}` }, 502, origin);
    }

    const cfData = await parseCfResponse(cfRes);

    if (!cfRes.ok || !cfData.success) {
        const msg = cfData?.errors?.[0]?.message || `CF API error (HTTP ${cfRes.status})`;
        console.error('CF Images v1 upload failed:', JSON.stringify(cfData));
        return jsonResponse({ success: false, error: msg }, 502, origin);
    }

    const imageUrl = buildCanonicalUrl(customId);
    return jsonResponse({
        success:  true,
        url:      imageUrl,
        imageUrl: imageUrl,
        imageId:  customId,
        // Legacy shape the Admin Portal expects
        result: { variants: [imageUrl] },
    }, 200, origin);
}

// ─── Main fetch handler ───────────────────────────────────────────────────────

export default {
    async fetch(request, env) {
        const origin = getAllowedOrigin(request);

        // CORS preflight — must respond before any other check
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(origin) });
        }

        if (request.method !== 'POST') {
            return jsonResponse({ success: false, error: 'Method not allowed.' }, 405, origin);
        }

        if (!env?.CLOUDFLARE_ACCOUNT_ID || !env?.CLOUDFLARE_IMAGES_API_TOKEN) {
            return jsonResponse({
                success: false,
                error: 'Server misconfiguration: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_IMAGES_API_TOKEN must be set as Worker environment variables in the Cloudflare Dashboard.',
            }, 500, origin);
        }

        // Top-level catch so no uncaught exception can escape without CORS headers
        try {
            const url    = new URL(request.url);
            const action = url.searchParams.get('action');

            if (action === 'request-upload-url') {
                return handleRequestUploadUrl(request, env, origin);
            }

            return handleDirectUpload(request, env, origin);

        } catch (err) {
            console.error('Unhandled worker error:', err);
            return jsonResponse({
                success: false,
                error: `Internal worker error: ${err.message}`,
            }, 500, origin);
        }
    },
};
