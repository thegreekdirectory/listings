// js/index.js
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

const CATEGORIES = [
    { name: 'Automotive & Transportation',       icon: '🚗' },
    { name: 'Beauty & Health',                   icon: '💅' },
    { name: 'Church & Religious Organization',   icon: '⛪' },
    { name: 'Cultural/Fraternal Organization',   icon: '🎭' },
    { name: 'Education & Community',             icon: '📚' },
    { name: 'Entertainment, Arts & Recreation',  icon: '🎨' },
    { name: 'Food & Hospitality',                icon: '🍽️' },
    { name: 'Grocery & Imports',                 icon: '🛒' },
    { name: 'Home & Construction',               icon: '🏠' },
    { name: 'Industrial & Manufacturing',        icon: '🏭' },
    { name: 'Pets & Veterinary',                 icon: '🐾' },
    { name: 'Professional & Business Services',  icon: '💼' },
    { name: 'Real Estate & Development',         icon: '🏢' },
    { name: 'Retail & Shopping',                 icon: '🛍️' }
];

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

const VERIFIED_CHECKMARK_SVG = `<svg style="width:18px;height:18px;flex-shrink:0;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#045193"/><path d="M7 12.5l3.5 3.5L17 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const LOCATION_ICON_SVG = `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="#045093" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;
const PHONE_ICON_SVG = `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="#045093" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>`;

let indexSupabase = null;
let allListings = [];

// Predictive search state
let searchDebounceTimer = null;
let activeResultIndex = -1;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

function formatPhoneDisplay(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (phone.startsWith('+1') && digits.length === 11) {
        return `(${digits.substr(1, 3)}) ${digits.substr(4, 3)}-${digits.substr(7, 4)}`;
    }
    return phone;
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing homepage…');

    indexSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    setupSearch();
    await loadListings();
    renderFeaturedListings();
    renderRecentListings();
});

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

/* ============================================
   SEARCH — MAIN ENTRY + PREDICTIVE
   ============================================ */

function setupSearch() {
    const input = document.getElementById('mainSearch');
    if (!input) return;

    // Enter key triggers full search
    input.addEventListener('keydown', (e) => {
        const dropdown = document.getElementById('searchDropdown');
        const items = dropdown ? dropdown.querySelectorAll('.search-result-item') : [];

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeResultIndex = Math.min(activeResultIndex + 1, items.length - 1);
            updateFocusedResult(items);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeResultIndex = Math.max(activeResultIndex - 1, -1);
            updateFocusedResult(items);
            return;
        }
        if (e.key === 'Enter') {
            if (activeResultIndex >= 0 && items[activeResultIndex]) {
                items[activeResultIndex].click();
            } else {
                hideDropdown();
                performSearch();
            }
            return;
        }
        if (e.key === 'Escape') {
            hideDropdown();
        }
    });

    // Predictive search on input
    input.addEventListener('input', () => {
        activeResultIndex = -1;
        clearTimeout(searchDebounceTimer);
        const query = input.value.trim();

        if (query.length < 2) {
            hideDropdown();
            return;
        }

        searchDebounceTimer = setTimeout(() => showPredictions(query), 180);
    });

    // Hide dropdown on outside click
    document.addEventListener('click', (e) => {
        const wrapper = document.querySelector('.search-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
            hideDropdown();
        }
    });
}

function updateFocusedResult(items) {
    items.forEach((item, i) => {
        item.classList.toggle('focused', i === activeResultIndex);
    });
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

function showPredictions(rawQuery) {
    const dropdown = document.getElementById('searchDropdown');
    if (!dropdown) return;

    const query = rawQuery.toLowerCase();
    let html = '';

    // ── 1. Businesses ──
    const businesses = allListings.filter(l =>
        l.business_name?.toLowerCase().includes(query) ||
        l.tagline?.toLowerCase().includes(query)
    ).slice(0, 5);

    if (businesses.length > 0) {
        html += `<div class="search-group-label">Businesses</div>`;
        html += businesses.map(l => {
            const thumb = l.logo || (l.photos && l.photos[0]);
            const location = l.city && l.state ? `${l.city}, ${l.state}` : (l.state || '');
            const thumbHtml = thumb
                ? `<img src="${thumb}" alt="" class="search-result-thumb" loading="lazy" onerror="this.replaceWith(this.nextElementSibling)">`
                : '';
            const placeholderHtml = `<div class="search-result-thumb-placeholder">🏢</div>`;

            return `
                <a href="/listing/${l.slug}" class="search-result-item" role="option">
                    ${thumbHtml}${placeholderHtml}
                    <div class="search-result-info">
                        <div class="search-result-name">${escapeHtml(l.business_name)}</div>
                        <div class="search-result-meta">${escapeHtml(l.category)}${location ? ` · ${escapeHtml(location)}` : ''}</div>
                    </div>
                    <span class="search-result-arrow">›</span>
                </a>`;
        }).join('');
    }

    // ── 2. Categories ──
    const cats = CATEGORIES.filter(c => c.name.toLowerCase().includes(query)).slice(0, 4);

    if (cats.length > 0) {
        html += `<div class="search-group-label">Categories</div>`;
        html += cats.map(c => `
            <a href="/listings?category=${encodeURIComponent(c.name)}" class="search-result-item" role="option">
                <div class="search-result-icon">${c.icon}</div>
                <div class="search-result-info">
                    <div class="search-result-name">${escapeHtml(c.name)}</div>
                    <div class="search-result-meta">Browse all businesses</div>
                </div>
                <span class="search-result-arrow">›</span>
            </a>`).join('');
    }

    // ── 3. Locations (city/state from listings) ──
    const seen = new Set();
    const locations = [];
    allListings.forEach(l => {
        if (l.city && l.city.toLowerCase().includes(query)) {
            const key = `${l.city}-${l.state}`;
            if (!seen.has(key)) {
                locations.push({ city: l.city, state: l.state });
                seen.add(key);
            }
        }
    });
    const topLocations = locations.slice(0, 3);

    if (topLocations.length > 0) {
        html += `<div class="search-group-label">Locations</div>`;
        html += topLocations.map(loc => `
            <a href="/listings?state=${encodeURIComponent(loc.state)}" class="search-result-item" role="option">
                <div class="search-result-icon location">📍</div>
                <div class="search-result-info">
                    <div class="search-result-name">${escapeHtml(loc.city)}, ${escapeHtml(loc.state)}</div>
                    <div class="search-result-meta">Browse businesses in this area</div>
                </div>
                <span class="search-result-arrow">›</span>
            </a>`).join('');
    }

    // No results at all
    if (!html) {
        dropdown.innerHTML = `<div class="search-no-results">No results for "<strong>${escapeHtml(rawQuery)}</strong>"</div>`;
        dropdown.classList.remove('hidden');
        return;
    }

    // Footer — "Search all for …"
    html += `
        <div class="search-footer-item" onclick="hideDropdown();performSearch();" role="option">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <circle cx="11" cy="11" r="7"/>
                <path d="M21 21l-4.35-4.35" stroke-linecap="round"/>
            </svg>
            <span>Search all listings for "<strong>${escapeHtml(rawQuery)}</strong>"</span>
        </div>`;

    dropdown.innerHTML = html;
    dropdown.classList.remove('hidden');
}

function hideDropdown() {
    const dropdown = document.getElementById('searchDropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
    }
    activeResultIndex = -1;
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

/* ============================================
   NAVIGATION HELPERS
   ============================================ */

function performSearch() {
    const input = document.getElementById('mainSearch');
    const query = input?.value.trim();
    if (query) {
        window.location.href = `/listings?q=${encodeURIComponent(query)}`;
    }
}

function searchByCategory(categoryName) {
    window.location.href = `/listings?category=${encodeURIComponent(categoryName)}`;
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

/* ============================================
   DATA LOADING
   ============================================ */

async function loadListings() {
    try {
        console.log('📥 Loading listings…');

        const { data, error } = await indexSupabase
            .from('listings')
            .select('id, business_name, tagline, description, category, city, state, slug, logo, photos, tier, verified, is_claimed, phone')
            .eq('visible', true)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        allListings = data || [];
        console.log(`✅ Loaded ${allListings.length} listings`);
    } catch (err) {
        console.error('❌ Error loading listings:', err);
    }
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

/* ============================================
   RENDER FUNCTIONS
   ============================================ */

function renderFeaturedListings() {
    const container = document.getElementById('featuredListings');
    const section   = document.getElementById('featuredSection');
    if (!container || !section) return;

    const featured = allListings
        .filter(l => l.tier === 'FEATURED' || l.tier === 'PREMIUM')
        .slice(0, 6);

    if (featured.length === 0) {
        // Hide the entire section — don't show an empty or placeholder block
        section.style.display = 'none';
        return;
    }

    section.style.display = '';
    container.innerHTML = featured.map(l => renderListingCard(l)).join('');
}

function renderRecentListings() {
    const container = document.getElementById('recentListings');
    if (!container) return;

    const recent = allListings.slice(0, 6);

    if (recent.length === 0) {
        container.innerHTML = '<p class="loading">No businesses yet.</p>';
        return;
    }

    container.innerHTML = recent.map(l => renderListingCard(l)).join('');
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

function renderListingCard(listing) {
    const url = `/listing/${listing.slug}`;

    const photos   = listing.photos || [];
    const mainImage = photos.length > 0 ? photos[0] : listing.logo;

    // Badges
    const badges = [];
    if (listing.tier === 'PREMIUM') {
        badges.push('<span class="badge badge-premium">Premium</span>');
    } else if (listing.tier === 'FEATURED') {
        badges.push('<span class="badge badge-featured">Featured</span>');
    }

    const phoneDisplay = listing.phone ? formatPhoneDisplay(listing.phone) : '';
    const showCheckmark =
        listing.tier === 'FEATURED' ||
        listing.tier === 'PREMIUM' ||
        listing.is_claimed;

    return `
        <a href="${url}" class="listing-card">
            ${mainImage ? `<img src="${mainImage}" alt="${escapeHtml(listing.business_name)}" class="listing-image" loading="lazy" onerror="this.style.display='none'">` : ''}
            <div class="listing-content">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        ${badges.length > 0 ? `<div class="listing-badges mb-2">${badges.join('')}</div>` : ''}
                        <h3 class="listing-name" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                            ${escapeHtml(listing.business_name)}${showCheckmark ? VERIFIED_CHECKMARK_SVG : ''}
                        </h3>
                        ${listing.tagline ? `<p class="listing-tagline">"${escapeHtml(listing.tagline)}"</p>` : ''}
                    </div>
                    ${listing.logo && mainImage !== listing.logo
                        ? `<img src="${listing.logo}" alt="${escapeHtml(listing.business_name)} logo" class="w-12 h-12 rounded-lg object-cover ml-2 flex-shrink-0" loading="lazy">`
                        : ''}
                </div>
                <span class="listing-category">${escapeHtml(listing.category)}</span>
                ${listing.city && listing.state
                    ? `<p class="listing-location" style="margin-top:0.5rem;">${LOCATION_ICON_SVG}<span>${escapeHtml(listing.city)}, ${escapeHtml(listing.state)}</span></p>`
                    : ''}
                ${listing.phone
                    ? `<p class="listing-location" style="margin-top:0.35rem;">${PHONE_ICON_SVG}<span>${escapeHtml(phoneDisplay)}</span></p>`
                    : ''}
            </div>
        </a>`;
}

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

// Expose globals used by inline event attributes
window.performSearch  = performSearch;
window.searchByCategory = searchByCategory;
window.hideDropdown   = hideDropdown;

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.
