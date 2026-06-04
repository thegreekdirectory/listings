// js/app-home.js
// Copyright (C) The Greek Directory, 2025-present. All rights reserved.
// PWA App Homepage — data loading, search, starred carousel, category filter

'use strict';

/* =============================================
   CONFIG
   ============================================= */
const SUPABASE_URL      = 'https://luetekzqrrgdxtopzvqw.supabase.co';
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
    { name: 'Retail & Shopping',                 icon: '🛍️' },
];

// SVG injected inline inside card names for claimed/verified businesses
const CHECKMARK_SVG = `<svg class="card-check" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Claimed"><circle cx="12" cy="12" r="12" fill="#045193"/><path d="M7 12.5l3.5 3.5L17 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* =============================================
   STATE
   ============================================= */
let db                = null;   // Supabase client
let allListings       = [];     // full dataset from Supabase
let filteredListings  = [];     // subset after category filter
let activeCategory    = null;   // null = All
let searchDebounce    = null;   // clearTimeout handle
let dropdownIndex     = -1;     // keyboard-nav position in dropdown

/* =============================================
   BOOTSTRAP
   ============================================= */
document.addEventListener('DOMContentLoaded', async () => {
    setGreeting();
    setupSearch();

    // Wait for Supabase CDN library (loaded via defer)
    if (!window.supabase) {
        await waitForSupabase();
    }

    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Load data in parallel, non-blocking
    await loadListings();
    renderListings();               // first paint with real data
    await loadStarredSection();     // personalisation layer
});

function waitForSupabase(attempts = 0) {
    return new Promise((resolve, reject) => {
        if (window.supabase) { resolve(); return; }
        if (attempts > 40) { reject(new Error('Supabase timeout')); return; }
        setTimeout(() => waitForSupabase(attempts + 1).then(resolve).catch(reject), 150);
    });
}

/* =============================================
   GREETING — time-aware
   ============================================= */
function setGreeting() {
    const el = document.getElementById('greetingText');
    if (!el) return;
    const h = new Date().getHours();
    el.textContent = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/* =============================================
   DATA — load visible listings from Supabase
   ============================================= */
async function loadListings() {
    try {
        const { data, error } = await db
            .from('listings')
            .select(
                'id, business_name, tagline, category, city, state, slug, ' +
                'logo, photos, tier, verified, is_claimed, coming_soon, permanently_closed'
            )
            .eq('visible', true)
            .eq('permanently_closed', false)
            .order('created_at', { ascending: false })
            .limit(150);

        if (error) throw error;

        allListings      = data || [];
        filteredListings = [...allListings];
    } catch (err) {
        console.error('[app-home] loadListings:', err);
        // Render empty state gracefully — don't crash
        allListings      = [];
        filteredListings = [];
    }
}

/* =============================================
   STARRED CAROUSEL
   Pulls from IndexedDB (PWAStorage) — purely local,
   no extra network request needed.
   ============================================= */
async function loadStarredSection() {
    try {
        if (!window.PWAStorage) return;
        await window.PWAStorage.init();
        const starred = await window.PWAStorage.getAllStarred();
        if (!starred || starred.length === 0) return;

        const section  = document.getElementById('starredSection');
        const carousel = document.getElementById('starredCarousel');
        if (!section || !carousel) return;

        carousel.innerHTML = starred.slice(0, 12).map(buildCarouselCard).join('');
        section.style.display = '';
    } catch (err) {
        console.warn('[app-home] loadStarredSection:', err);
    }
}

function buildCarouselCard(listing) {
    const img  = listing.photos?.[0] || listing.logo || '';
    const loc  = listing.city && listing.state
                 ? `${esc(listing.city)}, ${esc(listing.state)}`
                 : esc(listing.category || '');

    return `
        <a href="/listing/${esc(listing.slug)}" class="carousel-card">
            <div class="carousel-img-wrap">
                ${img
                    ? `<img src="${esc(img)}" alt="${esc(listing.business_name)}"
                            class="carousel-img" loading="lazy"
                            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                    : ''}
                <div class="carousel-img-ph" style="${img ? 'display:none' : ''}">🏛️</div>
            </div>
            <div class="carousel-body">
                <div class="carousel-name">${esc(listing.business_name)}</div>
                <div class="carousel-sub">${loc}</div>
            </div>
        </a>
    `;
}

/* =============================================
   RENDER — featured + recent grids
   ============================================= */
function renderListings() {
    const featured = filteredListings.filter(
        l => l.tier === 'FEATURED' || l.tier === 'PREMIUM'
    );
    const recent   = filteredListings; // most-recent first (Supabase order)

    // --- Featured ---
    const featuredSection = document.getElementById('featuredSection');
    const featuredGrid    = document.getElementById('featuredGrid');

    if (featuredSection && featuredGrid) {
        if (featured.length > 0 && !activeCategory) {
            featuredGrid.innerHTML = featured.slice(0, 4).map(buildListingCard).join('');
            featuredSection.style.display = '';
            applyStarStates(featuredGrid);
        } else {
            featuredSection.style.display = 'none';
        }
    }

    // --- Recent / filtered ---
    const recentSection = document.getElementById('recentSection');
    const recentGrid    = document.getElementById('recentGrid');
    const emptyState    = document.getElementById('emptyState');
    const recentTitle   = document.getElementById('recentTitle');
    const recentSeeAll  = document.getElementById('recentSeeAll');

    if (!recentGrid) return;

    if (recent.length === 0) {
        recentGrid.innerHTML = '';
        if (recentSection) recentSection.style.display = 'none';
        if (emptyState)    emptyState.style.display    = '';
    } else {
        if (emptyState)    emptyState.style.display    = 'none';
        if (recentSection) recentSection.style.display = '';

        recentGrid.innerHTML = recent.slice(0, 6).map(buildListingCard).join('');
        applyStarStates(recentGrid);
    }

    // Update dynamic section title and "See all" link
    if (activeCategory) {
        const catMeta = CATEGORIES.find(c => c.name === activeCategory);
        const label   = activeCategory.split('&')[0].trim();
        if (recentTitle) recentTitle.textContent = catMeta ? `${catMeta.icon} ${label}` : label;
        if (recentSeeAll) recentSeeAll.href = `/listings?category=${encodeURIComponent(activeCategory)}`;
    } else {
        if (recentTitle) recentTitle.textContent = 'Recently Added';
        if (recentSeeAll) recentSeeAll.href = '/listings';
    }
}

/* =============================================
   BUILD LISTING CARD HTML
   ============================================= */
function buildListingCard(listing) {
    const photo      = listing.photos?.[0] || listing.logo || '';
    const showCheck  = listing.tier === 'FEATURED' || listing.tier === 'PREMIUM' || listing.is_claimed;
    const lid        = esc(String(listing.id));

    let badge = '';
    if (listing.tier === 'PREMIUM')  badge = `<span class="card-badge card-badge-premium">Premium</span>`;
    else if (listing.tier === 'FEATURED') badge = `<span class="card-badge card-badge-featured">Featured</span>`;

    const locationHtml = listing.city && listing.state
        ? `<div class="card-loc">
               <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                   <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                   <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
               </svg>
               <span>${esc(listing.city)}, ${esc(listing.state)}</span>
           </div>`
        : '';

    return `
        <a href="/listing/${esc(listing.slug)}" class="listing-card">
            <div class="card-img-wrap">
                ${photo
                    ? `<img src="${esc(photo)}" alt="${esc(listing.business_name)}"
                            class="card-img" loading="lazy"
                            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                    : ''}
                <div class="card-img-ph" style="${photo ? 'display:none' : ''}">🏛️</div>
                ${badge}
                <button class="card-star-btn"
                        data-listing-id="${lid}"
                        onclick="handleCardStar('${lid}', event)"
                        aria-label="Star ${esc(listing.business_name)}">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </button>
            </div>
            <div class="card-body">
                <span class="card-cat">${esc(listing.category)}</span>
                <div class="card-name">
                    ${esc(listing.business_name)}${showCheck ? CHECKMARK_SVG : ''}
                </div>
                ${locationHtml}
            </div>
        </a>
    `;
}

/* =============================================
   STAR STATE — restore from IndexedDB on render
   ============================================= */
async function applyStarStates(container) {
    if (!window.PWAStorage) return;
    try {
        await window.PWAStorage.init();
        const buttons = container.querySelectorAll('.card-star-btn');
        // batch-check without serial awaits
        await Promise.all(Array.from(buttons).map(async btn => {
            const id = btn.dataset.listingId;
            if (!id) return;
            const starred = await window.PWAStorage.isStarred(id);
            if (starred) btn.classList.add('starred');
        }));
    } catch (err) {
        console.warn('[app-home] applyStarStates:', err);
    }
}

async function handleCardStar(listingId, event) {
    event.preventDefault();
    event.stopPropagation();

    if (!window.StarredManager) return;

    // Find listing data in memory; fall back to minimal stub
    const data = allListings.find(l => String(l.id) === String(listingId)) || { id: listingId };
    await window.StarredManager.toggleStar(listingId, data);

    // Refresh the carousel after starring
    await loadStarredSection();
}

// Expose so inline onclick handlers resolve correctly
window.handleCardStar = handleCardStar;

/* =============================================
   CATEGORY FILTER
   ============================================= */
function filterByCategory(category) {
    activeCategory   = category;
    filteredListings = category
        ? allListings.filter(l => l.category === category)
        : [...allListings];

    // Update pill highlight states
    document.querySelectorAll('.cat-pill').forEach(p => {
        const isTarget = category === null
            ? p.dataset.cat === 'all'
            : p.dataset.cat === category;
        p.classList.toggle('active', isTarget);
    });

    renderListings();

    // Smooth-scroll so the user sees the updated results
    const recentSection = document.getElementById('recentSection');
    if (recentSection) {
        recentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Expose for inline onclick on category pills
window.filterByCategory = filterByCategory;

/* =============================================
   SEARCH — predictive dropdown
   ============================================= */
function setupSearch() {
    const input    = document.getElementById('mainSearch');
    const clearBtn = document.getElementById('searchClear');
    if (!input) return;

    input.addEventListener('input', () => {
        const q = input.value.trim();
        // Show/hide clear button
        if (clearBtn) {
            clearBtn.style.display = q ? 'flex' : 'none';
            clearBtn.classList.toggle('visible', !!q);
        }

        dropdownIndex = -1;
        clearTimeout(searchDebounce);

        if (q.length < 2) { hideDropdown(); return; }
        searchDebounce = setTimeout(() => showPredictions(q), 180);
    });

    input.addEventListener('keydown', (e) => {
        const dd    = document.getElementById('searchDropdown');
        const items = dd ? Array.from(dd.querySelectorAll('.sdrop-item')) : [];

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                dropdownIndex = Math.min(dropdownIndex + 1, items.length - 1);
                highlightItem(items);
                break;
            case 'ArrowUp':
                e.preventDefault();
                dropdownIndex = Math.max(dropdownIndex - 1, -1);
                highlightItem(items);
                break;
            case 'Enter':
                if (dropdownIndex >= 0 && items[dropdownIndex]) {
                    items[dropdownIndex].click();
                } else {
                    performSearch();
                }
                break;
            case 'Escape':
                hideDropdown();
                input.blur();
                break;
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            clearBtn.classList.remove('visible');
            hideDropdown();
            input.focus();
        });
    }

    // Dismiss when tapping outside
    document.addEventListener('click', (e) => {
        const wrapper = document.querySelector('.search-wrapper');
        if (wrapper && !wrapper.contains(e.target)) hideDropdown();
    });
}

function highlightItem(items) {
    items.forEach((el, i) => el.classList.toggle('focused', i === dropdownIndex));
}

function showPredictions(rawQ) {
    const dd = document.getElementById('searchDropdown');
    if (!dd) return;

    const q   = rawQ.toLowerCase();
    let   html = '';

    // ── Businesses ──────────────────────────────────
    const bizzes = allListings
        .filter(l =>
            l.business_name?.toLowerCase().includes(q) ||
            l.tagline?.toLowerCase().includes(q)
        )
        .slice(0, 5);

    if (bizzes.length) {
        html += `<div class="sdrop-group">Businesses</div>`;
        html += bizzes.map(l => {
            const thumb = l.logo || l.photos?.[0] || '';
            const loc   = l.city && l.state ? `${l.city}, ${l.state}` : '';
            return `
                <a href="/listing/${esc(l.slug)}" class="sdrop-item" role="option">
                    ${thumb
                        ? `<img src="${esc(thumb)}" class="sdrop-thumb" loading="lazy" alt=""
                                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                           <div class="sdrop-thumb-ph" style="display:none">🏢</div>`
                        : `<div class="sdrop-thumb-ph">🏢</div>`}
                    <div class="sdrop-info">
                        <div class="sdrop-name">${esc(l.business_name)}</div>
                        <div class="sdrop-meta">${esc(l.category)}${loc ? ` · ${esc(loc)}` : ''}</div>
                    </div>
                    <span class="sdrop-arrow" aria-hidden="true">›</span>
                </a>`;
        }).join('');
    }

    // ── Categories ──────────────────────────────────
    const cats = CATEGORIES.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3);

    if (cats.length) {
        html += `<div class="sdrop-group">Categories</div>`;
        html += cats.map(c => `
            <a href="/listings?category=${encodeURIComponent(c.name)}" class="sdrop-item" role="option">
                <div class="sdrop-thumb-ph">${c.icon}</div>
                <div class="sdrop-info">
                    <div class="sdrop-name">${esc(c.name)}</div>
                    <div class="sdrop-meta">Browse all</div>
                </div>
                <span class="sdrop-arrow" aria-hidden="true">›</span>
            </a>`).join('');
    }

    // ── Locations ───────────────────────────────────
    const seen  = new Set();
    const locs  = [];
    allListings.forEach(l => {
        if (l.city?.toLowerCase().includes(q)) {
            const k = `${l.city}|${l.state}`;
            if (!seen.has(k)) { locs.push(l); seen.add(k); }
        }
    });

    if (locs.length) {
        html += `<div class="sdrop-group">Locations</div>`;
        html += locs.slice(0, 2).map(l => `
            <a href="/listings?state=${encodeURIComponent(l.state)}" class="sdrop-item" role="option">
                <div class="sdrop-thumb-ph">📍</div>
                <div class="sdrop-info">
                    <div class="sdrop-name">${esc(l.city)}, ${esc(l.state)}</div>
                    <div class="sdrop-meta">Browse businesses in this area</div>
                </div>
                <span class="sdrop-arrow" aria-hidden="true">›</span>
            </a>`).join('');
    }

    // No results
    if (!html) {
        dd.innerHTML = `<div class="sdrop-no-results">No results for "<strong>${esc(rawQ)}</strong>"</div>`;
        dd.classList.remove('hidden');
        return;
    }

    // Footer — full search link
    html += `
        <div class="sdrop-footer" onclick="hideDropdown(); performSearch();" role="option">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <circle cx="11" cy="11" r="7"/>
                <path d="M21 21l-4.35-4.35" stroke-linecap="round"/>
            </svg>
            <span>Search all for "<strong>${esc(rawQ)}</strong>"</span>
        </div>`;

    dd.innerHTML = html;
    dd.classList.remove('hidden');
}

function hideDropdown() {
    const dd = document.getElementById('searchDropdown');
    if (dd) { dd.classList.add('hidden'); dd.innerHTML = ''; }
    dropdownIndex = -1;
}

function performSearch() {
    const input = document.getElementById('mainSearch');
    const q     = input?.value.trim();
    if (q) window.location.href = `/listings?q=${encodeURIComponent(q)}`;
}

// Expose globals used by inline onclick attributes
window.hideDropdown   = hideDropdown;
window.performSearch  = performSearch;

/* =============================================
   UTILITIES
   ============================================= */

/**
 * Minimal HTML-escape — prevents XSS from Supabase data
 * used anywhere we inject .innerHTML
 */
function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}