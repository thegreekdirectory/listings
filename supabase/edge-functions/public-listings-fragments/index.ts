import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json; charset=utf-8",
};
const INDEX_MAP_CACHE =
  "public, max-age=60, s-maxage=120, stale-while-revalidate=300";
const LISTINGS_CACHE =
  "public, max-age=30, s-maxage=60, stale-while-revalidate=120";

const HOME_FIELDS =
  "id,slug,business_name,category,primary_subcategory,tagline,phone,city,state,photos,logo,tier,is_claimed,coming_soon,temporarily_closed,permanently_closed,hours,timezone";
const DIRECTORY_FIELDS =
  "id,slug,business_name,category,primary_subcategory,subcategories,tagline,phone,address,city,state,zip_code,country,photos,logo,tier,is_claimed,coming_soon,temporarily_closed,permanently_closed,hours,timezone";
const MAP_FIELDS =
  "id,slug,business_name,category,coordinates,city,state,photos,logo,temporarily_closed,permanently_closed,hours,timezone";

type Listing = Record<string, unknown>;
type HoursStatus =
  | "Unknown"
  | "Closed"
  | "Open"
  | "Opening Soon"
  | "Closing Soon";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(jsonHeaders);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value: unknown): string {
  return escapeHtml(value);
}

function toString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function firstImage(value: unknown): string {
  return toStringArray(value).find(Boolean) || "";
}

function formatPhoneDisplay(phone: unknown): string {
  const raw = toString(phone);
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+1") && digits.length === 11) {
    return `(${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7, 11)}`;
  }
  return raw;
}

function getHoursStatus(listing: Listing): HoursStatus {
  if (
    listing.temporarily_closed === true ||
    listing.permanently_closed === true
  )
    return "Closed";
  // Placeholder for Step 2: keep this helper isolated so full server-side hours logic can replace it.
  if (!listing.hours || !listing.timezone) return "Unknown";
  return "Unknown";
}

function statusClass(status: HoursStatus): string {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function claimedCheckmarkSvg(size = 18): string {
  return `<svg class="claimed-checkmark" style="width:${size}px;height:${size}px;flex-shrink:0;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#045093"></circle><path d="M7 12.5l3.5 3.5L17 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
}

function buildBadges(listing: Listing): string[] {
  const badges: string[] = [];
  if (listing.tier === "PREMIUM")
    badges.push('<span class="badge badge-premium">Premium</span>');
  else if (listing.tier === "FEATURED")
    badges.push('<span class="badge badge-featured">Featured</span>');
  if (listing.coming_soon === true)
    badges.push('<span class="badge badge-coming-soon">Coming Soon</span>');
  const hoursStatus = getHoursStatus(listing);
  if (hoursStatus !== "Unknown")
    badges.push(
      `<span class="badge badge-hours badge-${statusClass(hoursStatus)}">${hoursStatus}</span>`,
    );
  return badges;
}

function showClaimedCheckmark(listing: Listing): boolean {
  return (
    listing.tier === "FEATURED" ||
    listing.tier === "PREMIUM" ||
    listing.is_claimed === true
  );
}

function listingUrl(listing: Listing): string {
  return `/listing/${encodeURIComponent(toString(listing.slug))}`;
}

function renderHomeCard(listing: Listing): string {
  const mainImage = firstImage(listing.photos) || toString(listing.logo);
  const logo = toString(listing.logo);
  const name = toString(listing.business_name);
  const phoneDisplay = formatPhoneDisplay(listing.phone);
  const badges = buildBadges(listing);
  const location = [toString(listing.city), toString(listing.state)]
    .filter(Boolean)
    .join(", ");
  return `<a href="${escapeAttr(listingUrl(listing))}" class="listing-card">
    ${mainImage ? `<img src="${escapeAttr(mainImage)}" alt="${escapeAttr(name)}" class="listing-image" loading="lazy">` : ""}
    <div class="listing-content">
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          ${badges.length ? `<div class="listing-badges mb-2">${badges.join("")}</div>` : ""}
          <h3 class="listing-name" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">${escapeHtml(name)}${showClaimedCheckmark(listing) ? claimedCheckmarkSvg() : ""}</h3>
          ${listing.tagline ? `<p class="listing-tagline">&quot;${escapeHtml(listing.tagline)}&quot;</p>` : ""}
        </div>
        ${logo && mainImage !== logo ? `<img src="${escapeAttr(logo)}" alt="${escapeAttr(name)} logo" class="w-12 h-12 rounded-lg object-cover ml-2 flex-shrink-0" loading="lazy">` : ""}
      </div>
      <span class="listing-category">${escapeHtml(listing.primary_subcategory || listing.category)}</span>
      ${location ? `<p class="listing-location" style="margin-top:0.5rem;"><span>${escapeHtml(location)}</span></p>` : ""}
      ${phoneDisplay ? `<p class="listing-location" style="margin-top:0.35rem;"><span>${escapeHtml(phoneDisplay)}</span></p>` : ""}
    </div>
  </a>`;
}

function fullAddress(listing: Listing): string {
  return [
    listing.address,
    listing.city,
    listing.state,
    listing.zip_code,
    listing.country,
  ]
    .map(toString)
    .filter(Boolean)
    .join(", ");
}

function renderDirectoryPlacard(listing: Listing): string {
  const name = toString(listing.business_name);
  const image = firstImage(listing.photos) || toString(listing.logo);
  const logo = toString(listing.logo);
  const subcategories = toStringArray(listing.subcategories);
  const label =
    subcategories[0] ||
    toString(listing.primary_subcategory) ||
    toString(listing.category);
  const badges = buildBadges(listing);
  const checkmark = showClaimedCheckmark(listing)
    ? claimedCheckmarkSvg(20)
    : "";
  const phoneDisplay = formatPhoneDisplay(listing.phone);
  const description = toString(listing.tagline);
  return `<div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden block relative hover-bounce listing-card-hover public-listing-placard" data-listing-id="${escapeAttr(listing.id)}">
    <a href="${escapeAttr(listingUrl(listing))}" class="block">
      <div class="h-48 bg-gray-200 relative">
        ${image ? `<img src="${escapeAttr(image)}" alt="${escapeAttr(name)}" class="w-full h-full object-cover" loading="lazy">` : '<div class="w-full h-full flex items-center justify-center text-gray-400">No image</div>'}
        <div class="listing-image-gradient"></div>
        ${badges.length ? `<div class="absolute top-2 left-2 flex gap-2 flex-wrap">${badges.join("")}</div>` : ""}
      </div>
      <div class="p-4">
        <div class="flex gap-3 mb-3">
          ${logo ? `<img src="${escapeAttr(logo)}" alt="${escapeAttr(name)} logo" class="w-16 h-16 rounded object-cover flex-shrink-0" loading="lazy">` : '<div class="w-16 h-16 rounded bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">No logo</div>'}
          <div class="flex-1 min-w-0">
            ${label ? `<span class="text-xs font-semibold px-2 py-1 rounded-full text-white block w-fit mb-2" style="background-color:#045093;">${escapeHtml(label)}</span>` : ""}
            <h3 class="text-lg font-bold text-gray-900 mb-1 flex items-center gap-1.5">${escapeHtml(name)}${checkmark}</h3>
          </div>
        </div>
        ${description ? `<p class="text-sm text-gray-600 mb-3 line-clamp-2">${escapeHtml(description)}</p>` : ""}
        <div class="text-sm text-gray-600 space-y-1">
          ${fullAddress(listing) ? `<div class="flex items-center gap-2"><span class="truncate">${escapeHtml(fullAddress(listing))}</span></div>` : ""}
          ${phoneDisplay ? `<div class="flex items-center gap-2"><span class="truncate">${escapeHtml(phoneDisplay)}</span></div>` : ""}
        </div>
      </div>
    </a>
  </div>`;
}

function coordinates(value: unknown): { lat: number; lng: number } | null {
  if (typeof value === "string") {
    try {
      return coordinates(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const lat = Number(record.lat ?? record.latitude);
  const lng = Number(record.lng ?? record.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function mapStatus(listing: Listing): string {
  if (listing.permanently_closed === true) return "permanently_closed";
  if (listing.temporarily_closed === true) return "temporarily_closed";
  return statusClass(getHoursStatus(listing));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET")
    return jsonResponse(
      { success: false, error: "Method not allowed" },
      { status: 405 },
    );

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey)
      return jsonResponse(
        { success: false, error: "Server configuration error" },
        { status: 500 },
      );

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "index";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (mode === "index") {
      const { data, error, count } = await supabase
        .from("listings")
        .select(HOME_FIELDS, { count: "exact" })
        .eq("visible", true)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const listings = data || [];
      const featured = listings
        .filter(
          (listing: Listing) =>
            listing.tier === "FEATURED" || listing.tier === "PREMIUM",
        )
        .slice(0, 6);
      const recent = listings.slice(0, 6);
      return jsonResponse(
        {
          featuredHtml: featured.map(renderHomeCard).join(""),
          recentHtml: recent.map(renderHomeCard).join(""),
          total: count ?? listings.length,
        },
        { headers: { "Cache-Control": INDEX_MAP_CACHE } },
      );
    }

    if (mode === "listings") {
      const limit = Math.min(
        Math.max(Number(url.searchParams.get("limit")) || 24, 1),
        48,
      );
      const offset = Math.max(
        Number(url.searchParams.get("offset")) ||
          Number(url.searchParams.get("cursor")) ||
          0,
        0,
      );
      const { data, error, count } = await supabase
        .from("listings")
        .select(DIRECTORY_FIELDS, { count: "exact" })
        .eq("visible", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      const listings = data || [];
      const nextOffset = listings.length === limit ? offset + limit : null;
      return jsonResponse(
        {
          html: listings.map(renderDirectoryPlacard).join(""),
          total: count ?? listings.length,
          nextCursor: nextOffset === null ? null : String(nextOffset),
        },
        { headers: { "Cache-Control": LISTINGS_CACHE } },
      );
    }

    if (mode === "map") {
      const { data, error } = await supabase
        .from("listings")
        .select(MAP_FIELDS)
        .eq("visible", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const pins = (data || [])
        .map((listing: Listing) => {
          const point = coordinates(listing.coordinates);
          if (!point) return null;
          return {
            id: listing.id,
            slug: listing.slug,
            name: listing.business_name,
            lat: point.lat,
            lng: point.lng,
            category: listing.category,
            status: mapStatus(listing),
            logoUrl: toString(listing.logo) || null,
            primaryImageUrl: firstImage(listing.photos) || null,
            city: listing.city || null,
            state: listing.state || null,
          };
        })
        .filter(Boolean);
      return jsonResponse(
        { pins },
        { headers: { "Cache-Control": INDEX_MAP_CACHE } },
      );
    }

    return jsonResponse(
      { success: false, error: "Unsupported mode" },
      { status: 400 },
    );
  } catch (error) {
    console.error("public-listings-fragments error", error);
    return jsonResponse(
      { success: false, error: "Unable to load listing fragments" },
      { status: 500 },
    );
  }
});
