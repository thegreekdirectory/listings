const ACCOUNT_HASH = 'rheV007PEt08HUYXNuJLnQ';
const CANONICAL_HOST = 'https://images.thegreekdirectory.org';
const VARIANT = 'public';
const VALID_ASSET_TYPES = new Set(['logo', 'photo']);
const VALID_SOURCES = new Set(['a', 'b', 's']);
const RANDOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function buildCorsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function jsonResponse(payload, status = 200, origin = '*') {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...buildCorsHeaders(origin)
    }
  });
}

function buildCanonicalImageUrl(customImageId) {
  return `${CANONICAL_HOST}/cdn-cgi/imagedelivery/${ACCOUNT_HASH}/${customImageId}/${VARIANT}`;
}

function createRandomSuffix() {
  let value = '';
  for (let index = 0; index < 5; index += 1) {
    value += RANDOM_ALPHABET[Math.floor(Math.random() * RANDOM_ALPHABET.length)];
  }
  return value;
}

export function buildCustomImageId({ listingId, assetType, source, date = new Date(), randomSuffix = createRandomSuffix() }) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${listingId}-${assetType}-${year}-${month}-${day}-${source}-${randomSuffix}`;
}

export function validateUploadFields({ file, listingId, assetType, source }) {
  if (!(file instanceof File)) {
    return 'A file upload is required.';
  }

  if (!/^\d+$/.test(String(listingId || '').trim())) {
    return 'listingId must be a numeric value.';
  }

  if (!VALID_ASSET_TYPES.has(assetType)) {
    return 'assetType must be either logo or photo.';
  }

  if (!VALID_SOURCES.has(source)) {
    return 'source must be one of a, b, or s.';
  }

  if (file.type !== 'image/webp') {
    return 'Only WEBP images are accepted.';
  }

  return null;
}

async function uploadToCloudflareImages({ env, file, customImageId }) {
  const formData = new FormData();
  formData.append('file', file, file.name || `${customImageId}.webp`);
  formData.append('id', customImageId);
  formData.append('requireSignedURLs', 'false');
  formData.append('metadata', JSON.stringify({
    customImageId,
    uploadedAt: new Date().toISOString()
  }));

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_IMAGES_API_TOKEN}`
    },
    body: formData
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    const errorMessage = result?.errors?.[0]?.message || 'Cloudflare Images upload failed.';
    throw new Error(errorMessage);
  }

  return result;
}

async function handleUpload(request, env) {
  const origin = request.headers.get('Origin') || '*';
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return jsonResponse({ success: false, error: 'Content-Type must be multipart/form-data.' }, 415, origin);
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const listingId = String(formData.get('listingId') || '').trim();
  const assetType = String(formData.get('assetType') || '').trim();
  const source = String(formData.get('source') || '').trim();

  const validationError = validateUploadFields({ file, listingId, assetType, source });
  if (validationError) {
    return jsonResponse({ success: false, error: validationError }, 400, origin);
  }

  const customImageId = buildCustomImageId({ listingId, assetType, source });
  try {
    await uploadToCloudflareImages({ env, file, customImageId });
    return jsonResponse({
      success: true,
      customImageId,
      url: buildCanonicalImageUrl(customImageId)
    }, 200, origin);
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 502, origin);
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(origin)
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed.' }, 405, origin);
    }

    if (!env?.CLOUDFLARE_ACCOUNT_ID || !env?.CLOUDFLARE_IMAGES_API_TOKEN) {
      return jsonResponse({ success: false, error: 'Cloudflare Images environment variables are not configured.' }, 500, origin);
    }

    return handleUpload(request, env);
  }
};
