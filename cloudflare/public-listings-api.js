/*
 * public-listings-api — Cloudflare Worker façade
 * Expected route: /api/public-listings
 *
 * Request flow:
 *   Browser → Cloudflare Worker → Supabase Edge Function
 *   public-listings-fragments → Supabase Postgres
 *
 * Required Worker environment variables:
 *   PUBLIC_LISTINGS_FUNCTION_URL   Full Supabase Edge Function URL.
 *
 * Optional Worker environment variables:
 *   PUBLIC_LISTINGS_FUNCTION_TOKEN Shared upstream token, forwarded as
 *                                 x-public-listings-token.
 */

const ALLOWED_ORIGINS = new Set([
  "https://thegreekdirectory.org",
  "https://www.thegreekdirectory.org",
  "https://app.thegreekdirectory.org",
  "https://static.thegreekdirectory.org",
]);

const ALLOWED_PARAMS = [
  "mode",
  "limit",
  "offset",
  "q",
  "category",
  "subcategory",
  "country",
  "state",
  "city",
  "zip",
  "radius",
  "lat",
  "lng",
  "openNow",
  "closedNow",
  "openingSoon",
  "closingSoon",
  "hoursUnknown",
  "onlineOnly",
  "pricing",
  "comingSoon",
  "sort",
];

const ALLOWED_PARAM_SET = new Set(ALLOWED_PARAMS);
const ALLOWED_MODES = new Set(["index", "listings", "map"]);
const DEFAULT_MODE = "index";
const INDEX_MAP_CACHE =
  "public, max-age=60, s-maxage=120, stale-while-revalidate=300";
const LISTINGS_CACHE = "no-store";
const ERROR_CACHE = "no-store";

function getAllowedOrigin(request) {
  const origin = request.headers.get("Origin") || "";
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  if (/^https:\/\/[^.]+\.thegreekdirectory\.pages\.dev$/.test(origin))
    return origin;
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return origin;
  return "https://thegreekdirectory.org";
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Accept, Authorization, apikey, x-client-info",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(payload, status, origin, cacheControl = ERROR_CACHE) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
      ...corsHeaders(origin),
    },
  });
}

function cacheControlForMode(mode) {
  if (mode === "index" || mode === "map") return INDEX_MAP_CACHE;
  return LISTINGS_CACHE;
}

function trimValue(value) {
  return String(value || "").trim();
}

function normalizeMode(rawMode) {
  const mode = trimValue(rawMode || DEFAULT_MODE).toLowerCase();
  return ALLOWED_MODES.has(mode) ? mode : null;
}

function normalizeQueryParams(sourceParams) {
  const normalized = new URLSearchParams();
  const mode = normalizeMode(sourceParams.get("mode"));
  if (!mode) return { error: "Unsupported mode." };

  normalized.set("mode", mode);

  for (const key of ALLOWED_PARAMS) {
    if (key === "mode" || !sourceParams.has(key)) continue;
    const value = trimValue(sourceParams.get(key));
    if (!value) continue;
    normalized.set(key, value);
  }

  return { mode, params: normalized };
}

function buildUpstreamUrl(functionUrl, normalizedParams) {
  const upstreamUrl = new URL(functionUrl);
  upstreamUrl.search = "";
  for (const [key, value] of normalizedParams.entries()) {
    if (ALLOWED_PARAM_SET.has(key)) upstreamUrl.searchParams.set(key, value);
  }
  return upstreamUrl;
}

function buildCacheKey(request, normalizedParams) {
  const requestUrl = new URL(request.url);
  const cacheUrl = new URL(requestUrl.origin + requestUrl.pathname);
  for (const [key, value] of normalizedParams.entries()) {
    cacheUrl.searchParams.set(key, value);
  }
  return new Request(cacheUrl.toString(), { method: "GET" });
}

function responseWithHeaders(response, origin, cacheControl) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", cacheControl);
  Object.entries(corsHeaders(origin)).forEach(([key, value]) =>
    headers.set(key, value),
  );
  headers.delete("Set-Cookie");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function fetchUpstream(upstreamUrl, env) {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (env.PUBLIC_LISTINGS_FUNCTION_TOKEN) {
    headers.set("x-public-listings-token", env.PUBLIC_LISTINGS_FUNCTION_TOKEN);
  }

  return fetch(upstreamUrl.toString(), {
    method: "GET",
    headers,
    cf: { cacheTtl: 0 },
  });
}

export default {
  async fetch(request, env, ctx) {
    const origin = getAllowedOrigin(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "GET") {
      return jsonResponse(
        { success: false, error: "Method not allowed." },
        405,
        origin,
      );
    }

    if (!env?.PUBLIC_LISTINGS_FUNCTION_URL) {
      return jsonResponse(
        { success: false, error: "Server configuration error." },
        500,
        origin,
      );
    }

    try {
      const requestUrl = new URL(request.url);
      const normalized = normalizeQueryParams(requestUrl.searchParams);
      if (normalized.error) {
        return jsonResponse(
          { success: false, error: normalized.error },
          400,
          origin,
        );
      }

      const { mode, params } = normalized;
      const cacheControl = cacheControlForMode(mode);
      const shouldUseCache = mode === "index" || mode === "map";
      const cacheKey = buildCacheKey(request, params);

      if (shouldUseCache) {
        const cached = await caches.default.match(cacheKey);
        if (cached) return responseWithHeaders(cached, origin, cacheControl);
      }

      const upstreamUrl = buildUpstreamUrl(
        env.PUBLIC_LISTINGS_FUNCTION_URL,
        params,
      );
      const upstreamResponse = await fetchUpstream(upstreamUrl, env);

      if (!upstreamResponse.ok) {
        return jsonResponse(
          { success: false, error: "Unable to load public listings." },
          upstreamResponse.status >= 400 && upstreamResponse.status < 600
            ? upstreamResponse.status
            : 502,
          origin,
        );
      }

      const response = responseWithHeaders(
        upstreamResponse,
        origin,
        cacheControl,
      );

      if (shouldUseCache && response.ok) {
        ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
      }

      return response;
    } catch (error) {
      console.error("public-listings-api worker error:", error);
      return jsonResponse(
        { success: false, error: "Unable to load public listings." },
        502,
        origin,
      );
    }
  },
};
